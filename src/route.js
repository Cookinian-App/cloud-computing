const Joi = require('joi');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');


async function routeHandler(server) {
    const db = admin.firestore();
    server.route({
        method: 'GET',
        path: '/api/recipes/{page}',
        handler: async (request, h) => {
            const page = parseInt(request.params.page, 10) || 1;
            const bahan = request.query.bahan;
    
            if (!bahan) {
                return h.response({ error: true, message: 'Query parameter bahan is required' }).code(400);
            }
    
            const ingredients = bahan.split(',').map(ing => ing.trim().toLowerCase());
            console.log('Search ingredients:', ingredients);
    
            try {
                const recipesSnapshot = await db.collection('recipes').get();
                let recipes = [];
    
                recipesSnapshot.forEach(doc => {
                    const recipeData = doc.data();
                    const recipeIngredients = recipeData.ingredient.toLowerCase();
    
                    let matchCount = 0;
    
                    ingredients.forEach(ing => {
                        if (recipeIngredients.includes(ing)) {
                            matchCount++;
                        }
                    });
    
                    if (matchCount > 0) {
                        const { title, thumb, times, difficulty } = recipeData;
                        recipes.push({
                            key: doc.id,
                            title,
                            thumb,
                            times,
                            difficulty,
                            matches: matchCount
                        });
                    }
                });
    
                recipes.sort((a, b) => b.matches - a.matches);
    
                if (recipes.length === 0) {
                    return h.response({ error: true, message: 'No recipe found with the ingredients' }).code(404);
                }
    
                const startIndex = (page - 1) * 10;
                const endIndex = page * 10;
                const paginatedRecipes = recipes.slice(startIndex, endIndex);
    
                const responseRecipes = paginatedRecipes.map(({ key, title, thumb, times, difficulty, matches }) => ({
                    key,
                    title,
                    thumb,
                    times,
                    difficulty,
                    matches
                }));
    
                return h.response({ 
                    error: false, 
                    recipes: responseRecipes
                }).code(200);
            } catch (error) {
                console.error('Error getting recipes: ', error);
                return h.response({ error: true, message: 'Internal Server Error' }).code(500);
            }
        }
    });
    
    

    server.route({
        method: 'POST',
        path: '/api/save/post',
        handler: async (request, h) => {
            const { uid, key, title, thumb, times, difficulty } = request.payload;
            const db = admin.firestore();

            const valUser = await db.collection('users').doc(uid).get();
            if (!valUser.exists) {
                return h.response({ error: true, message: "Pengguna tidak ditemukan" }).code(401);
            }

            const valSave = await db.collection('saves2').where('uid', '==', uid).where('key', '==', key).get();
            if (!valSave.empty) {
                return h.response({ error: true, message: "Resep sudah disimpan sebelumnya" }).code(401);
            }

            const saveRecipe = db.collection('saves2').doc();
            await saveRecipe.set({
                uid,
                key,
                title,
                thumb,
                times,
                difficulty
            });
            return h.response({ error: false, message: "Resep berhasil disimpan" }).code(201);
        }
    });

    
    server.route({
        method: 'GET',
        path: '/api/save/get/{uid}',
        handler: async (request, h) => {
            const { uid } = request.params;
            const db = admin.firestore();
    
            
            const valUser = await db.collection('users').doc(uid).get();
            if (!valUser.exists) {
                return h.response({ error: true, message: "Pengguna tidak ditemuka" }).code(401);
            }
    
            
            const savedRecipesSnapshot = await db.collection('saves2').where('uid', '==', uid).get();
            if (savedRecipesSnapshot.empty) {
                return h.response({ error: false, recipes: [] }).code(200);
            }
    
            const recipes = [];
            savedRecipesSnapshot.forEach(doc => {
                recipes.push(doc.data());
            });
    
            return h.response({ error: false, recipes }).code(200);
        }
    });
    server.route({
        method: 'DELETE',
        path: '/api/save/unsave/{uid},{key}',
        handler: async (request, h) => {
            const { uid, key } = request.params; 
            const db = admin.firestore();
    
            const valUser = await db.collection('users').doc(uid).get();
            if (!valUser.exists) {
                return h.response({ error: true, message: "Pengguna tidak ditemuka" }).code(401);
            }
    
            const valSave = await db.collection('saves2').where('uid', '==', uid).where('key', '==', key).get();
            if (valSave.empty) {
                return h.response({ error: false, recipes: [] }).code(200);
            }
    
            const batch = db.batch();
            valSave.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
    
            return h.response({ error: false, message: "Resep berhasil dihapus dari simpanan" }).code(200);
        }
    });
    server.route({
        method: 'DELETE',
        path: '/api/save/delete-all/{uid}',
        handler: async (request, h) => {
            const { uid } = request.params; 
            const db = admin.firestore();
    
            const valUser = await db.collection('users').doc(uid).get();
            if (!valUser.exists) {
                return h.response({ error: true, message: "Pengguna tidak ditemukan" }).code(401);
            }
    
            const valSave = await db.collection('saves2').where('uid', '==', uid).get();
            if (valSave.empty) {
                return h.response({ error: false, recipes: [] }).code(200);
            }
    
            const batch = db.batch();
            valSave.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
    
            return h.response({ error: false, message: "Semua resep yang disimpan berhasil dihapus" }).code(200);
        }
    });

    

    
    const translateJoiError = (error) => {
        switch (error.type) {
            case 'string.min':
                return `Panjang minimal untuk ${error.context.label} adalah ${error.context.limit} karakter`;
            case 'string.max':
                return `Panjang maksimal untuk ${error.context.label} adalah ${error.context.limit} karakter`;
            case 'string.email':
                return `Format ${error.context.label} tidak valid`;
            case 'any.required':
                return `${error.context.label} harus diisi`;
            default:
                return error.message;
        }
    };
    
    server.route({
        method: 'POST',
        path: '/register',
        handler: async (request, h) => {
            const { name, email, password } = request.payload;
            const db = admin.firestore();
    
            const schema = Joi.object({
                name: Joi.string().min(3).max(20).required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required()
            });
    
            const { error } = schema.validate(request.payload, { abortEarly: false });
            if (error) {
                const translatedErrors = error.details.map(err => translateJoiError(err));
                return h.response({ error: true, message: translatedErrors.join(', ') }).code(400);
            }
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (!userSnapshot.empty) {
                return h.response({ error: true, message: 'Email sudah digunakan, silakan coba lagi' }).code(400);
            }
    
            const hashedPassword = await argon2.hash(password);
    
            const userRef = db.collection('users').doc();
            await userRef.set({
                name,
                email,
                password: hashedPassword
            });
    
            return h.response({ error: false, message: 'Pengguna berhasil dibuat' }).code(201);
        }
    });

    
    server.route({
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {
            const { email, password } = request.payload;
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return h.response({ error: true, message: "Email tidak ditemukan. Pastikan Anda telah mendaftar dengan email yang benar." }).code(401);
            }
    
            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();
    
            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Password salah. Silakan periksa kembali password Anda.' }).code(401);
            }
    
            const nameForAvatar = encodeURIComponent(user.name);
            const avatarUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}`;
    
            const token = jwt.sign({ userId: userDoc.id, name: user.name, avatarUrl }, 'kunci-rahasia-anda', { expiresIn: '1h' });
    
            return h.response({
                error: false,
                message: 'Sukses',
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
                return h.response({ error: true, message: 'Email, kata sandi saat ini, kata sandi baru, dan konfirmasi kata sandi baru diperlukan' }).code(400);
            }
    
            if (newPassword.length < 8) {
                return h.response({ error: true, message: 'Kata sandi baru harus minimal 8 karakter' }).code(400);
            }
    
            if (newPassword !== confirmNewPassword) {
                return h.response({ error: true, message: 'Kata sandi baru dan konfirmasi kata sandi baru tidak cocok' }).code(400);
            }
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return h.response({ error: true, message: 'Pengguna tidak ditemukan' }).code(404);
            }
    
            let user;
            userSnapshot.forEach(doc => {
                user = doc.data();
            });
    
            const isPasswordValid = await argon2.verify(user.password, currentPassword);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Kata sandi saat ini tidak valid' }).code(401);
            }
    
            const hashedNewPassword = await argon2.hash(newPassword);
            await db.collection('users').doc(userSnapshot.docs[0].id).update({
                password: hashedNewPassword
            });
    
            return h.response({ error: false, message: 'Kata sandi berhasil diperbarui' }).code(200);
        }
    });
    

    
    server.route({
        method: 'POST',
        path: '/change-name',
        handler: async (request, h) => {
            const { email, newName } = request.payload;
            const db = admin.firestore();
    
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
                    return h.response({ error: true, message: 'Pengguna tidak ditemukan' }).code(404);
                }
    
                const userDoc = userSnapshot.docs[0];
                const userRef = db.collection('users').doc(userDoc.id);
    
                await userRef.update({
                    name: newName
                });
    
                return h.response({ error: false, message: 'Nama berhasil diperbarui' }).code(200);
            } catch (err) {
                console.error('Error updating name:', err);
                return h.response({ error: true, message: 'Kesalahan server internal' }).code(500);
            }
        }
    });
    
}

module.exports = routeHandler;
