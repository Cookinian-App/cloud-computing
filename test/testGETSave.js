const axios = require('axios');

const uid = 'HkInjtxeEh3KtisaeAlj';

axios.get(`http://localhost:3000/api/save/get/${uid}`)
    .then(response => {
        if (response.data.error) {
            console.error('Error:', response.data.message);
        } else {
            console.log('Saved recipes:', response.data.recipes);
        }
    })
    .catch(error => {
        console.error('Request failed:', error.message);
    });
