// กำหนด URL ของ Backend (ตรงกับพอร์ตของ index3.js)
const BASE_URL = 'http://localhost:5000';

// ฟังก์ชันสำหรับส่งข้อมูลการจอง
const submitBooking = async () => {
    // 1. ดึงข้อมูลจากฟอร์ม HTML (แก้ ID ให้ตรงกับในไฟล์ HTML ของคุณนะครับ)
    let nameDOM = document.getElementById('nameInput');
    let phoneDOM = document.getElementById('phoneInput');
    let serviceDOM = document.getElementById('serviceInput'); // ค่า ID ของบริการ (เช่น 1, 2, 3)
    let dateDOM = document.getElementById('dateInput');
    let timeDOM = document.getElementById('timeInput');
    let messageDOM = document.getElementById('message'); // เอาไว้แสดงข้อความแจ้งเตือนในหน้าเว็บ (ถ้ามี)

    // ตรวจสอบว่ากรอกข้อมูลครบไหมเบื้องต้น
    if (!nameDOM.value || !phoneDOM.value || !dateDOM.value || !timeDOM.value) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วนครับ');
        return;
    }

    // จัดเตรียมข้อมูลเพื่อส่งไป Backend
    let bookingData = {
        customer_name: nameDOM.value,
        phone_number: phoneDOM.value,
        service_id: serviceDOM.value || 1, // สมมติถ้าไม่ได้เลือก ให้ค่าเริ่มต้นเป็น 1
        appointment_date: dateDOM.value,
        appointment_time: timeDOM.value
    };

    try {
        // 2. ยิงข้อมูลไปหา Backend
        const response = await axios.post(`${BASE_URL}/appointments`, bookingData);
        
        // 3. ถ้าสำเร็จ (ไม่ชน)
        alert(response.data.message); 
        
        // ล้างข้อมูลฟอร์มหลังจากจองเสร็จ
        nameDOM.value = '';
        phoneDOM.value = '';
        dateDOM.value = '';
        timeDOM.value = '';
        if(messageDOM) {
            messageDOM.innerText = 'จองคิวเรียบร้อย!';
            messageDOM.style.color = 'green';
        }

    } catch (error) {
        // เช็คว่า Error ที่ได้รับมาจากเซิร์ฟเวอร์หรือไม่
        if (error.response && error.response.status === 400) {
            // ดึงข้อความจาก Backend มาแสดงผลโดยตรง
            const errorMessage = error.response.data.error; 
            
            // แสดง Alert เป็นข้อความที่คุณต้องการ
            alert(errorMessage); 
            
            // ถ้ามีที่แสดงข้อความบนหน้าเว็บ ก็ให้มันอัปเดตด้วย
            if (messageDOM) {
                messageDOM.innerText = errorMessage;
                messageDOM.style.color = 'red';
            }
        } else {
            // กรณีเป็น Error อื่นๆ ที่ไม่ใช่คิวชน
            console.error('System Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่ครับ');
        }
    }
}

// ผูกฟังก์ชันเข้ากับปุ่ม Submit ฟอร์ม (ถ้าคุณใช้ <form id="bookingForm">)
window.onload = () => {
    const form = document.getElementById('bookingForm');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // กันหน้าเว็บรีเฟรช
            submitBooking();
        });
    }
}