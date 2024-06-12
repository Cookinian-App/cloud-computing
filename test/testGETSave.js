const axios = require('axios');


const uid = 'user123'; 
const page = 1; 
const url = `http://localhost:3000/api/save/get/${uid}/${page}`; 


axios.get(url)
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        if (error.response) {
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    });
