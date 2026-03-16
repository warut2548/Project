require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

// GET: ดึงข้อมูลคิว (แอดมิน)
app.get('/appointments', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT a.id, c.customer_name, c.phone_number, s.service_name, 
                   a.appointment_date, a.appointment_time, a.status 
            FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_date, a.appointment_time`);
        res.json(results);
    } catch (error) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }); }
});

// GET: ค้นหาด้วยเบอร์โทร (สำหรับหน้า check.html)
app.get('/appointments/search/:phone', async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT a.id, c.customer_name, c.phone_number, s.service_name, 
                   a.appointment_date, a.appointment_time, a.status 
            FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            JOIN services s ON a.service_id = s.id
            WHERE c.phone_number = ?`, [req.params.phone]);
        res.json(results);
    } catch (error) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' }); }
});

// POST: บันทึกการจองคิว (เพิ่มระบบกันคิวชนแล้ว!)
app.post('/appointments', async (req, res) => {
    const { customer_name, phone_number, service_id, appointment_date, appointment_time } = req.body;
    try {
        // 1. เช็คคิวชน: ดูว่ามีคิววัน/เวลานี้ที่ยังไม่ได้ยกเลิกไหม
        const [existing] = await pool.query(`
            SELECT id FROM appointments 
            WHERE appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
        `, [appointment_date, appointment_time]);

        if (existing.length > 0) {
            // คิวชน! เปลี่ยนข้อความเป็น "มีคนจองคิวแล้ว" ตามที่ต้องการ
            return res.status(400).json({ error: 'เวลานี้มีคนจองคิวแล้วครับ รบกวนเลือกเวลาอื่นแทนนะครับ 😅' });
        }

        // 2. คิวว่าง! บันทึกข้อมูลลูกค้า
        const [cResult] = await pool.query(
            'INSERT INTO customers (customer_name, phone_number) VALUES (?, ?)', 
            [customer_name, phone_number]
        );
        
        // 3. บันทึกข้อมูลคิว (ตั้งค่าสถานะเริ่มต้นเป็น Pending)
        await pool.query(
            'INSERT INTO appointments (customer_id, service_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)', 
            [cResult.insertId, service_id, appointment_date, appointment_time, 'Pending']
        );
        
        res.status(201).json({ message: 'จองคิวสำเร็จ! รอการยืนยันจากร้านนะครับ 🎉' });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่ครับ' }); 
    }
});

// PUT: อัปเดตข้อมูลลูกค้า (ชื่อ/เบอร์)
app.put('/appointments/:id', async (req, res) => {
    const { customer_name, phone_number } = req.body;
    try {
        await pool.query(`
            UPDATE customers c 
            JOIN appointments a ON c.id = a.customer_id 
            SET c.customer_name = ?, c.phone_number = ? 
            WHERE a.id = ?`, [customer_name, phone_number, req.params.id]);
        res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
    } catch (error) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' }); }
});

// PUT: อัปเดตสถานะ (สำหรับเปลี่ยนสถานะในแอดมิน)
app.put('/appointments/:id/status', async (req, res) => {
    try {
        await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' }); }
});

app.listen(port, () => console.log(`Server running on port ${port}`));