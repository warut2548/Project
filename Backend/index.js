require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

let conn = null;

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });
};

// ==========================================
// 1. API สำหรับดึงข้อมูลคิวทั้งหมด (ให้แอดมินดู)
// ==========================================
app.get('/appointments', async (req, res) => {
    try {
        let sql = `
            SELECT a.id, c.customer_name, c.phone_number, s.service_name, 
                   a.appointment_date, a.appointment_time, a.status 
            FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            JOIN services s ON a.service_id = s.id
            ORDER BY a.appointment_date, a.appointment_time
        `;
        const [results] = await conn.query(sql);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. API สำหรับจองคิวใหม่ (รับข้อมูลจากหน้าเว็บ)
// ==========================================
app.post('/appointments', async (req, res) => {
    try {
        let c_name = req.body.customer_name;
        let c_phone = req.body.phone_number;
        let s_id = req.body.service_id;
        let a_date = req.body.appointment_date;
        let a_time = req.body.appointment_time;

        // บันทึกชื่อและเบอร์ลูกค้าก่อน
        const [customerResult] = await conn.query(
            'INSERT INTO customers (customer_name, phone_number) VALUES (?, ?)',
            [c_name, c_phone]
        );
        let newCustomerId = customerResult.insertId; // เอา ID ลูกค้าที่เพิ่งได้มาใช้ต่อ

        // บันทึกการจองคิว
        await conn.query(
            'INSERT INTO appointments (customer_id, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
            [newCustomerId, s_id, a_date, a_time]
        );

        res.json({ message: 'จองคิวสำเร็จ!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. API สำหรับค้นหาคิวด้วยเบอร์โทร (ให้ลูกค้าเช็คสถานะ)
// ==========================================
app.get('/appointments/search/:phone', async (req, res) => {
    try {
        let phoneSearch = req.params.phone; // รับเบอร์โทรจาก URL
        let sql = `
            SELECT a.id, c.customer_name, s.service_name, 
                   a.appointment_date, a.appointment_time, a.status 
            FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            JOIN services s ON a.service_id = s.id
            WHERE c.phone_number = ?
            ORDER BY a.appointment_date DESC
        `;
        const [results] = await conn.query(sql, [phoneSearch]);
        res.json(results); // ส่งผลลัพธ์กลับไปให้หน้าเว็บ
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. API สำหรับเปลี่ยนสถานะ (ให้แอดมินกดเปลี่ยน)
// ==========================================
app.put('/appointments/:id/status', async (req, res) => {
    try {
        let id = req.params.id;
        let newStatus = req.body.status;
        
        await conn.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [newStatus, id]
        );
        res.json({ message: 'อัปเดตสถานะสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// เปิดเซิร์ฟเวอร์
app.listen(port, async () => {
    await initMySQL();
    console.log(`Server is running on port ${port}`);
});
