const axios = require('axios');

const url = 'http://localhost:3000/api/save/post';


const data = {
    uid: 'x', 
    key: 'x', 
    title: 'x',
    thumb: 'x',
    times: 'x',
    serving: 'x',
    difficulty: 'x',
    calories: 'x'
};

// Mengirim permintaan POST menggunakan Axios
axios.post(url, data)
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
