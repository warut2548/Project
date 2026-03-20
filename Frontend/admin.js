const API_URL = 'http://localhost:5000/admin';

async function fetchBookings() {
    try {
        // ดึงข้อมูลจากเส้นทาง /admin/appointments
        const res = await fetch(`${API_URL}/appointments`);
        
        if (!res.ok) throw new Error('Network response was not ok');
        
        const bookings = await res.json();
        
        // ตรวจสอบว่า ID ตารางใน HTML ของพี่ชื่ออะไร (ถ้าใน HTML ใช้ tableBody ให้แก้ตรงนี้ครับ)
        const tableBody = document.getElementById('tableBody') || document.getElementById('adminBookingTable');
        
        if (!tableBody) return; // กันพังถ้าหาตารางไม่เจอ

        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการจองในระบบ</td></tr>';
            return;
        }

        tableBody.innerHTML = bookings.map(item => {
            // ปรับสถานะให้เป็นตัวเล็กเพื่อใช้กับ CSS class (pending, confirmed, cancelled)
            const statusClass = (item.status || 'Pending').toLowerCase();
            const displayName = item.full_name || 'ลูกค้าทั่วไป';
            const displayPhone = item.phone || item.phone_number || '-';
            
            return `
                <tr id="row-${item.id}" class="status-${statusClass}">
                    <td class="name" style="font-weight:600;">${displayName}</td>
                    <td class="phone">${displayPhone}</td>
                    <td>${item.service_name || 'ไม่ได้ระบุบริการ'}</td>
                    <td>${new Date(item.appointment_date).toLocaleDateString('th-TH')} | ${item.appointment_time} น.</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                    <td>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <button class="btn-edit" onclick="toggleEdit(this, ${item.id})">✏️ แก้ไข</button>
                            <select onchange="updateStatus(${item.id}, this.value)" style="padding:4px; border-radius:4px;">
                                <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>⏳ รอ</option>
                                <option value="Confirmed" ${item.status === 'Confirmed' ? 'selected' : ''}>✅ ยัน</option>
                                <option value="Cancelled" ${item.status === 'Cancelled' ? 'selected' : ''}>❌ ยกเลิก</option>
                            </select>
                        </div>
                    </td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error('Fetch Error:', error);
        const tableBody = document.getElementById('tableBody') || document.getElementById('adminBookingTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">❌ ไม่สามารถโหลดข้อมูลได้ (เช็คการรัน Backend พอร์ต 5000)</td></tr>';
        }
    }
}

// ฟังก์ชันแก้ไขชื่อและเบอร์โทร (Inline Edit)
async function toggleEdit(btn, id) {
    const row = document.getElementById(`row-${id}`);
    const nameCell = row.querySelector('.name');
    const phoneCell = row.querySelector('.phone');

    if (btn.innerText === "✏️ แก้ไข") {
        // เปิดโหมดแก้ไข
        nameCell.contentEditable = "true";
        phoneCell.contentEditable = "true";
        nameCell.focus();
        btn.innerText = "💾 บันทึก";
        btn.style.backgroundColor = "#2ecc71"; // เปลี่ยนสีปุ่มเป็นเขียวตอนจะบันทึก
    } else {
        // ส่งข้อมูลไปบันทึกที่ Backend
        try {
            const res = await fetch(`${API_URL}/update-user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    full_name: nameCell.innerText.trim(), 
                    phone: phoneCell.innerText.trim() 
                })
            });

            if (res.ok) {
                nameCell.contentEditable = "false";
                phoneCell.contentEditable = "false";
                btn.innerText = "✏️ แก้ไข";
                btn.style.backgroundColor = ""; // กลับไปใช้สีเดิมจาก CSS
                alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
                fetchBookings(); // รีโหลดข้อมูลใหม่
            } else {
                alert("บันทึกไม่สำเร็จ: " + (await res.json()).error);
            }
        } catch (e) { 
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์"); 
        }
    }
}

// ฟังก์ชันเปลี่ยนสถานะ (Pending / Confirmed / Cancelled)
async function updateStatus(id, status) {
    try {
        const res = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            fetchBookings(); // รีโหลดเพื่ออัปเดตสีแถวหรือ Badge
        }
    } catch (e) { 
        alert("เปลี่ยนสถานะไม่สำเร็จ"); 
    }
}

// สั่งให้ทำงานเมื่อโหลดหน้าเว็บ
fetchBookings();