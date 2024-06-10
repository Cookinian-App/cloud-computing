const Hapi = require('@hapi/hapi');
const admin = require('firebase-admin');
const serviceAccount = require('../src/serviceAccountKey.json');
const routeHandler = require('./route');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const init = async () => {  
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    });

    await routeHandler(server);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
