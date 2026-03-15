const BASE_URL = 'http://localhost:8000';

let mode = 'CREATE'
let selectedId = ''
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id');
    console.log('id', id);
      if (id) {
        mode = 'EDIT';
        selectedId = id;

        //1. ดึงข้อมูล user ออกมา
        try{
            const response = await axios.get(`${BASE_URL}/users/${id}`);
            console.log('response', response.data);
    //2. นำข้อมูลที่ได้มาแสดงใน form
    let firstnameDOM = document.querySelector('input[name=firstname]')
    let lastnameDOM = document.querySelector('input[name=lastname]')
    let ageDOM = document.querySelector('input[name=age]')
    let descriptionDOM = document.querySelector('textarea[name=description]')

    firstnameDOM.value = user.firstname;
    lastnameDOM.value = user.lastname;
    ageDOM.value = user.age;
    descriptionDOM.value = user.description;

    let genderDOM = document.querySelector('input[name=gender]')
    let interestDOMs = document.querySelectorAll('input[name=interests]')

    for (let i = 0; i < genderDOM.length; i++) {
        if (genderDOM[i].value == user.gender) {
            genderDOM[i].checked = true;
        }
    }

    for (let i = 0; i < interestDOMs.length; i++) {
        if (user.interestDOMs.includes(interestDOMs[i].value)) {
            interestDOMs[i].checked = true;
        }
    }
        

} catch(error) {
            console.error('Error fetching user data:', error)
        }
        
      }
}

const submitData = async () => {
    let messageDOM = document.getElementById('message');
    
    let firstnameDOM = document.querySelector('input[name=firstname]')
    let lastnameDOM = document.querySelector('input[name=lastname]')
    let ageDOM = document.querySelector('input[name=age]')
    let genderDOM = document.querySelector('input[name=gender]:checked')
    let interestDOMs = document.querySelectorAll('input[name=interests]:checked')
    let descriptionDOM = document.querySelector('textarea[name=description]')

    let errors = [];
    if (!firstnameDOM.value) errors.push('กรุณากรอกชื่อ');
    if (!lastnameDOM.value) errors.push('กรุณากรอกนามสกุล');
    if (!ageDOM.value) errors.push('กรุณากรอกอายุ');
    if (!genderDOM) errors.push('กรุณาเลือกเพศ');

    if (errors.length > 0) {
        messageDOM.innerText = errors.join(' / ');
        messageDOM.className = 'message danger';
        return;
    }

    let interest = ''
    for (let i = 0; i < interestDOMs.length; i++) {
        interest += interestDOMs[i].value
        if (i != interestDOMs.length - 1) {
            interest += ','
        }
    }

    let userData = {
        firstname: firstnameDOM.value,
        lastname: lastnameDOM.value,
        age: ageDOM.value,
        gender: genderDOM.value,
        description: descriptionDOM.value,
        interests: interest
    }

    console.log('ข้อมูลที่จะส่ง:', userData)

    if (mode == 'CREATE') {
        const response = await axios.post(`${BASE_URL}/users`, userData);
        console.log('response', response.data);
    } else {
        const response = await axios.put(`${BASE_URL}/users/${selectedId}`, userData);
        message = 'แก้ไขข้อมูลสำเร็จ';
        console.log('response', response.data);
    }

    try {
        const response = await axios.post(`${BASE_URL}/users`, userData);
        
        messageDOM.innerText = 'บันทึกข้อมูลเรียบร้อยแล้ว!';
        messageDOM.className = 'message success';
        console.log('Response:', response.data);

    } catch (error) {
        
        console.error('เกิดข้อผิดพลาด:', error);
        messageDOM.innerText = 'ส่งข้อมูลไม่สำเร็จ: ตรวจสอบการเชื่อมต่อ Server (localhost:8000)';
        messageDOM.className = 'message danger';
    }
}