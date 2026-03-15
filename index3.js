const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 5000; // รันเซิร์ฟเวอร์ที่พอร์ต 5000

app.use(bodyParser.json());
app.use(cors());

let conn = null;

const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'webdb',
        port: 3307 // เชื่อมต่อ Database ที่พอร์ต 3307
    });
};

// ดูข้อมูลนัดหมายทั้งหมด
app.get('/appointments', async (req, res) => {
    try {
        const [results] = await conn.query('SELECT * FROM appointments');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// จองคิวใหม่
app.post('/appointments', async (req, res) => {
    try {
        let appointment = req.body;

        const [result] = await conn.query(
            'INSERT INTO appointments SET ?',
            appointment
        );

        res.json({
            message: 'Appointment created successfully',
            appointment: {
                id: result.insertId,
                ...appointment
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error creating appointment',
            error: error.message
        });
    }
});

// ดูข้อมูลนัดหมายตาม ID
app.get('/appointments/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const [results] = await conn.query(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json(results[0]);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// แก้ไขข้อมูลนัดหมาย
app.put('/appointments/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let updatedAppointment = req.body;

        const [result] = await conn.query(
            'UPDATE appointments SET ? WHERE id = ?',
            [updatedAppointment, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({
            message: 'Appointment updated successfully',
            appointment: { id, ...updatedAppointment }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ยกเลิกนัดหมาย
app.delete('/appointments/:id', async (req, res) => {
    try {
        let id = req.params.id;

        const [result] = await conn.query(
            'DELETE FROM appointments WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({ message: 'Appointment deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, async () => {
    await initMySQL();
    console.log(`Server running at http://localhost:${port}`);
});