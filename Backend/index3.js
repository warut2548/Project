require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webdb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// [แอดมิน] ดึงรายการจองทั้งหมด 
app.get('/admin/appointments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id, COALESCE(u.full_name, 'ลูกค้าทั่วไป') AS full_name, 
            u.phone, s.service_name, a.appointment_date, a.appointment_time, a.status
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        res.json(rows);
    } catch (err) { 
        console.error("❌ Get Admin Appointments Error:", err);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' }); 
    }
});

// [แอดมิน] อัปเดตสถานะ
app.put('/admin/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'สำเร็จ' });
    } catch (err) { 
        console.error("❌ Update Status Error:", err);
        res.status(500).json({ error: 'ล้มเหลว' }); 
    }
});

// [User] ดึงรายการจองเฉพาะของตัวเอง
app.get('/appointments/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT a.*, s.service_name 
            FROM appointments a
            LEFT JOIN services s ON a.service_id = s.id
            WHERE a.user_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `, [user_id]);
        res.json(rows);
    } catch (err) { 
        console.error("❌ Get User Appointments Error:", err);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' }); 
    }
});

// [User] สร้างการจองคิวใหม่ (Booking)
app.post('/appointments', async (req, res) => {
    const { user_id, service_id, appointment_date, appointment_time } = req.body;
    try {
        // กำหนดสถานะเริ่มต้นเป็น 'Pending' (รอยืนยัน)
        await pool.query(
            'INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)', 
            [user_id, service_id, appointment_date, appointment_time, 'Pending']
        );
        res.status(201).json({ message: 'จองคิวสำเร็จเรียบร้อย!' });
    } catch (err) { 
        console.error("❌ Booking Error:", err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการจองคิวที่ฐานข้อมูล' }); 
    }
});

// [User] ยกเลิกคิวของตัวเอง
app.put('/appointments/:id/cancel', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", [id]);
        res.json({ message: 'ยกเลิกคิวสำเร็จ' });
    } catch (err) { 
        console.error("❌ Cancel Error:", err);
        res.status(500).json({ error: 'ล้มเหลวในการยกเลิกคิว' }); 
    }
});

// [User] เลื่อนคิว (แก้ไขวันและเวลา)
app.put('/appointments/:id/reschedule', async (req, res) => {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;
    try {
        await pool.query(
            "UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ?", 
            [appointment_date, appointment_time, id]
        );
        res.json({ message: 'เลื่อนคิวสำเร็จ' });
    } catch (err) { 
        console.error("❌ Reschedule Error:", err);
        res.status(500).json({ error: 'ล้มเหลวในการเลื่อนคิว' }); 
    }
});

// [User] อัปเดตชื่อโปรไฟล์
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { full_name } = req.body;
    try {
        await pool.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, id]);
        res.json({ message: 'สำเร็จ' });
    } catch (err) { 
        console.error("❌ Update Profile Error:", err);
        res.status(500).json({ error: 'ล้มเหลว' }); 
    }
});

// Login / Register
app.post('/register', async (req, res) => {
    const { email, password, full_name, phone } = req.body;
    try {
        await pool.query('INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)', [email, password, full_name, phone]);
        res.status(201).json({ message: 'สำเร็จ' });
    } catch (err) { 
        console.error("❌ Register Error:", err);
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
        console.error("❌ Login Error:", err);
        res.status(500).json({ error: 'ขัดข้อง' }); 
    }
});

// เริ่มการทำงานของ Server
const port = 5000;
app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));