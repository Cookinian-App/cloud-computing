const axios = require('axios');

const recipeData = {
    uid: 'HkInjtxeEh3KtisaeAlj',
    key: 'resep-sup-kimlo-daging-sapi',
    title: 'Resep Sup Kimlo a la Hotel, Gurih dan Isinya Berlimpah',
    thumb: 'https://www.masakapahariini.com/wp-content/uploads/2019/01/sup-kimlo-daging-sapi-1-500x300.jpg',
    times: '1jam',
    difficulty: 'Mudah'
};

axios.post('http://localhost:3000/api/save', recipeData)
    .then(response => {
        console.log('Recipe saved successfully:', response.data);
    })
    .catch(error => {
        console.error('Request failed:', error.message);
    });
