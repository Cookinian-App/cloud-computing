const Joi = require('joi');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const axios = require('axios');


async function routeHandler(server) {
    const db = admin.firestore();

    server.route({
        method: 'POST',
        path: '/register',
        handler: async (request, h) => {
            const { name, email, password } = request.payload;
            const db = admin.firestore();

            // Validate request payload using Joi schema
            const schema = Joi.object({
                name: Joi.string().min(3).max(20).required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required()
            });

            const { error } = schema.validate(request.payload);
            if (error) {
                return h.response({ error: true, message: error.details[0].message }).code(400);
            }

            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (!userSnapshot.empty) {
                return h.response({ error: true, message: 'Email already in use' }).code(400);
            }

            const hashedPassword = await argon2.hash(password);

            const userRef = db.collection('users').doc();
            await userRef.set({
                name,
                email,
                password: hashedPassword
            });

            return h.response({ error: false, message: 'User Created' }).code(201);
        }
    });



    server.route({
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {
            const { email, password } = request.payload;

            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return h.response({ error: true, message: "Email Doesn't Exist" }).code(401);
            }

            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();

            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Invalid Password' }).code(401);
            }

            // Generate URL avatar karakter menggunakan layanan UI Avatars
            const nameForAvatar = encodeURIComponent(user.name); // Encode nama untuk URL yang valid
            const avatarUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}`;

            const token = jwt.sign({ userId: userDoc.id, name: user.name, avatarUrl }, 'your-secret-key', { expiresIn: '1h' });

            return h.response({
                error: false,
                message: 'success',
                loginResult: {
                    userId: userDoc.id,
                    name: user.name,
                    avatarUrl,
                    token: token
                }
            }).code(200);
        }
    });


    server.route({
        method: 'POST',
        path: '/change-password',
        handler: async (request, h) => {
            const { email, currentPassword, newPassword, confirmNewPassword } = request.payload;
            const db = admin.firestore();
    
            if (!email || !currentPassword || !newPassword || !confirmNewPassword) {
                return h.response({ error: true, message: 'Email, current password, new password, and confirm new password are required' }).code(400);
            }
    
            if (newPassword.length < 8) {
                return h.response({ error: true, message: 'New password must be at least 8 characters long' }).code(400);
            }
    
            if (newPassword !== confirmNewPassword) {
                return h.response({ error: true, message: 'New password and confirm new password do not match' }).code(400);
            }
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return h.response({ error: true, message: 'User not found' }).code(404);
            }
    
            let user;
            userSnapshot.forEach(doc => {
                user = doc.data();
            });
    
            const isPasswordValid = await argon2.verify(user.password, currentPassword);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Invalid current password' }).code(401);
            }
    
            const hashedNewPassword = await argon2.hash(newPassword);
            await db.collection('users').doc(userSnapshot.docs[0].id).update({
                password: hashedNewPassword
            });
    
            return h.response({ error: false, message: 'Password updated successfully' }).code(200);
        }
    });
    
    


    server.route({
        method: 'POST',
        path: '/change-name',
        handler: async (request, h) => {
            const { email, newName } = request.payload;
            const db = admin.firestore();
    
            // Validate request payload using Joi schema
            const schema = Joi.object({
                email: Joi.string().email().required(),
                newName: Joi.string().required()
            });
    
            const { error } = schema.validate(request.payload);
            if (error) {
                return h.response({ error: true, message: error.details[0].message }).code(400);
            }
    
            try {
                const userSnapshot = await db.collection('users').where('email', '==', email).get();
    
                if (userSnapshot.empty) {
                    return h.response({ error: true, message: 'User not found' }).code(404);
                }
    
                const userDoc = userSnapshot.docs[0];
                const userRef = db.collection('users').doc(userDoc.id);
    
                await userRef.update({
                    name: newName
                });
    
                return h.response({ error: false, message: 'Name updated successfully' }).code(200);
            } catch (err) {
                console.error('Error updating name:', err);
                return h.response({ error: true, message: 'Internal server error' }).code(500);
            }
        }
    });
    
}

module.exports = routeHandler;