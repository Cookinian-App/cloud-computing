const axios = require('axios');
const url = 'http://localhost:3000/change-password'; 


const data = {
    email: 'user2@gmail.com',
    currentPassword: 'admin123',
    newPassword: 'adm12',
    confirmNewPassword: 'adm12', 
};

axios.post(url, data)
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.response.data);
    });
