require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webdb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// --- [แอดมิน] ดึงรายการจองทั้งหมด (เพิ่ม u.phone) ---
app.get('/admin/appointments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.id, 
                COALESCE(u.full_name, 'ลูกค้าทั่วไป') AS full_name, 
                u.phone, 
                s.service_name, 
                a.appointment_date, 
                a.appointment_time, 
                a.status
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' }); 
    }
});

// --- [แอดมิน] อัปเดตสถานะคิว ---
app.put('/admin/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'อัปเดตสถานะไม่สำเร็จ' });
    }
});

// --- [แอดมิน] อัปเดตชื่อและเบอร์โทรลูกค้า (Inline Edit) ---
app.put('/admin/update-user/:id', async (req, res) => {
    const { id } = req.params; // appointment id
    const { full_name, phone } = req.body;
    try {
        const [appRow] = await pool.query('SELECT user_id FROM appointments WHERE id = ?', [id]);
        if (appRow.length > 0 && appRow[0].user_id) {
            await pool.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', 
            [full_name, phone, appRow[0].user_id]);
            res.json({ message: 'อัปเดตข้อมูลลูกค้าสำเร็จ' });
        } else {
            res.status(400).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'บันทึกไม่สำเร็จ' });
    }
});

// --- โค้ดสำหรับ Login / Register ---
app.post('/register', async (req, res) => {
    const { email, password, full_name, phone } = req.body;
    try {
        await pool.query('INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)', [email, password, full_name, phone]);
        res.status(201).json({ message: 'สำเร็จ' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'ล้มเหลว' }); 
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT id, full_name FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) res.json({ user: users[0] });
        else res.status(401).json({ error: 'ผิดพลาด' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'ขัดข้อง' }); 
    }
});

// --- [ลูกค้า] สร้างการจองคิว ---
app.post('/appointments', async (req, res) => {
    const { user_id, service_id, appointment_date, appointment_time } = req.body;
    try {
        await pool.query('INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?)', [user_id, service_id, appointment_date, appointment_time]);
        res.status(201).json({ message: 'จองสำเร็จ' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'ล้มเหลว' }); 
    }
});

// --- ✨ [เพิ่มใหม่] [ลูกค้า] ดึงรายการจองของตัวเอง (ใช้ในหน้า check.html) ✨ ---
app.get('/appointments/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.id, 
                s.service_name, 
                a.appointment_date, 
                a.appointment_time, 
                a.status
            FROM appointments a
            LEFT JOIN services s ON a.service_id = s.id
            WHERE a.user_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [user_id]);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ดึงข้อมูลการจองไม่สำเร็จ' });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));