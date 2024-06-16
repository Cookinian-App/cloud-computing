const Joi = require('joi');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');


async function routeHandler(server) {
    const db = admin.firestore();
    const getRecipes = async (page, limit, ingredients) => {
        const db = admin.firestore();
        let query = db.collection('recipes').orderBy('title').limit(limit);
    
        // If page is greater than 1, we need to find the last document of the previous page
        if (page > 1) {
            const skip = (page - 1) * limit;
            let lastVisible = null;
    
            for (let i = 1; i < page; i++) {
                const snapshot = await query.get();
                lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
                query = db.collection('recipes')
                    .orderBy('title')
                    .startAfter(lastVisible)
                    .limit(limit);
            }
        }
    
        const querySnapshot = await query.get();
    
        let recipes = [];
        querySnapshot.forEach(doc => {
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
    
        return recipes;
    };
    
    server.route({
        method: 'GET',
        path: '/api/recipe/ingredient',
        handler: async (request, h) => {
            const query = request.query.s;
            const page = parseInt(request.query.page, 10) || 1;
            const limit = parseInt(request.query.limit, 10) || 20;
    
            if (!query) {
                return h.response({ error: true, message: 'Query parameter s is required' }).code(400);
            }
    
            const ingredients = query.split(',').map(ing => ing.trim().toLowerCase());
            console.log('Search ingredients:', ingredients);
    
            try {
                const recipes = await getRecipes(page, limit, ingredients);
    
                if (recipes.length === 0) {
                    return h.response({ error: true, message: 'No recipe found with the ingredients' }).code(404);
                }
    
                const responseRecipes = recipes.map(({ key, title, thumb, times, difficulty, matches }) => ({
                    key,
                    title,
                    thumb,
                    times,
                    difficulty,
                    matches
                }));
    
                return h.response({ error: false, recipes: responseRecipes }).code(200);
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
                return h.response({ error: true, message: "User not found" }).code(401);
            }

            const valSave = await db.collection('saves2').where('uid', '==', uid).where('key', '==', key).get();
            if (!valSave.empty) {
                return h.response({ error: true, message: title + " Recipe already saved" }).code(401);
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
            return h.response({ error: false, message: title + " Recipe saved" }).code(201);
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
                return h.response({ error: true, message: "User not found" }).code(401);
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
                return h.response({ error: true, message: "User not found" }).code(401);
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
    
            return h.response({ error: false, message: "Recipe deleted from saved" }).code(200);
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
                return h.response({ error: true, message: "User not found" }).code(401);
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
    
            return h.response({ error: false, message: "All recipes deleted from saved" }).code(200);
        }
    });

    

    
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

            const { error } = schema.validate(request.payload);
            if (error) {
                return h.response({ error: true, message: error.details[0].message }).code(400);
            }

            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (!userSnapshot.empty) {
                return h.response({ error: true, message: 'Email already used' }).code(400);
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
                return h.response({ error: true, message: "Email not found" }).code(401);
            }

            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();

            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Invalid Password' }).code(401);
            }

            const nameForAvatar = encodeURIComponent(user.name);
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
                return h.response({ error: true, message: 'Required field(s) missing' }).code(400);
            }
    
            if (newPassword.length < 8) {
                return h.response({ error: true, message: 'Password must be at least 8 characters long' }).code(400);
            }
    
            if (newPassword !== confirmNewPassword) {
                return h.response({ error: true, message: 'Passwords do not match' }).code(400);
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
                return h.response({ error: true, message: 'Invalid password' }).code(401);
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
