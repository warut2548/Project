const API_URL = 'http://localhost:5000/appointments';

async function fetchAppointments() {
    const res = await fetch(API_URL);
    const data = await res.json();
    const body = document.getElementById('tableBody');
    body.innerHTML = '';
    data.forEach(app => {
        body.innerHTML += `<tr id="row-${app.id}" class="status-${app.status}">
            <td class="name">${app.customer_name}</td>
            <td class="phone">${app.phone_number}</td>
            <td>${app.service_name}</td>
            <td>${new Date(app.appointment_date).toLocaleDateString('th-TH')}</td>
            <td>${app.appointment_time}</td>
            <td>
                <button class="btn-edit" onclick="toggleEdit(this, ${app.id})">✏️ แก้ไข</button>
                <select onchange="changeStatus(${app.id}, this.value)">
                    <option value="pending" ${app.status==='pending'?'selected':''}>⏳ รอการยืนยัน</option>
                    <option value="confirmed" ${app.status==='confirmed'?'selected':''}>✅ ยืนยัน</option>
                    <option value="cancelled" ${app.status==='cancelled'?'selected':''}>❌ ยกเลิก</option>
                </select>
            </td>
        </tr>`;
    });
}

async function toggleEdit(btn, id) {
    const row = document.getElementById(`row-${id}`);
    const name = row.querySelector('.name');
    const phone = row.querySelector('.phone');
    if (btn.innerText === "✏️ แก้ไข") {
        name.contentEditable = "true";
        phone.contentEditable = "true";
        btn.innerText = "💾 บันทึก";
        btn.className = "btn-save";
    } else {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name.innerText, phone_number: phone.innerText })
        });
        fetchAppointments();
    }
}

async function changeStatus(id, status) {
    await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    fetchAppointments();
}
fetchAppointments();