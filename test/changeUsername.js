const axios = require('axios');
const apiUrl = 'http://localhost:3000/change-name'; 


const payload = {
    email: 'user4@gmail.com', 
    newName: 'kelvin' 
};

axios.post(apiUrl, payload)
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.response.data);
    });
