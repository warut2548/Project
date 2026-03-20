const API_URL = 'http://localhost:5000/admin';

async function fetchBookings() {
    try {
        // Path ตรงกับ Backend: app.get('/admin/appointments')
        const res = await fetch(`${API_URL}/appointments`);
        const bookings = await res.json();
        const tableBody = document.getElementById('adminBookingTable');
        tableBody.innerHTML = bookings.map(item => {
            const statusClass = (item.status || 'Pending').toLowerCase();
            return `
                <tr id="row-${item.id}">
                    <td class="name" style="font-weight:600;">${item.full_name}</td>
                    <td class="phone">${item.phone || '-'}</td>
                    <td>${item.service_name}</td>
                    <td>${new Date(item.appointment_date).toLocaleDateString('th-TH')} | ${item.appointment_time}</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-edit" onclick="toggleEdit(this, ${item.id})">✏️ แก้ไข</button>
                            <select onchange="updateStatus(${item.id}, this.value)">
                                <option value="Pending" ${item.status==='Pending'?'selected':''}>⏳ รอ</option>
                                <option value="Confirmed" ${item.status==='Confirmed'?'selected':''}>✅ ยัน</option>
                                <option value="Cancelled" ${item.status==='Cancelled'?'selected':''}>❌ ยกเลิก</option>
                            </select>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    } catch (error) {
        document.getElementById('adminBookingTable').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">❌ เกิดข้อผิดพลาดในการโหลดข้อมูล (เช็คพอร์ต 5000)</td></tr>';
    }
}

async function toggleEdit(btn, id) {
    const row = document.getElementById(`row-${id}`);
    const nameCell = row.querySelector('.name');
    const phoneCell = row.querySelector('.phone');

    if (btn.innerText === "✏️ แก้ไข") {
        nameCell.contentEditable = "true";
        phoneCell.contentEditable = "true";
        nameCell.focus();
        btn.innerText = "💾 บันทึก";
        btn.className = "btn-save";
    } else {
        try {
            // Path ตรงกับ Backend: app.put('/admin/update-user/:id')
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
                btn.className = "btn-edit";
                fetchBookings();
            }
        } catch (e) { alert("บันทึกไม่สำเร็จ"); }
    }
}

async function updateStatus(id, status) {
    try {
        // Path ตรงกับ Backend: app.put('/admin/appointments/:id')
        await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        fetchBookings();
    } catch (e) { alert("เปลี่ยนสถานะไม่สำเร็จ"); }
}

fetchBookings();