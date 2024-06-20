# Cookinian Api 🍔
Oauth Api and Recipes Api recipes Bahasa Indonesian 🇮🇩 were built with Node js using the Hapi JS framework, Credentials Account with Firebase Admin SDK, and for the database using NoSQL Cloud Firestore.

## Installation
To install the required dependencies, run the following command:
```bash
npm install
```

## Dependencies
The project uses the following dependencies:

+ @hapi/hapi: ^21.3.9 - A rich framework for building applications and services.
+ @hapi/joi: ^17.1.1 - Object schema validation.
+ argon2: ^0.40.3 - Password hashing library.
+ axios: ^1.7.2 - Promise-based HTTP client for the browser and node.js.
+ firebase-admin: ^12.1.1 - Firebase Admin SDK for managing your Firebase services.
+ joi: ^17.13.1 - Data validation library (a newer version is @hapi/joi).
+ jsonwebtoken: ^9.0.2 - JSON Web Token implementation (JWT).
+ nodemon: ^3.1.3 - Utility that monitors for changes in your source and automatically restarts your server.

## API Documentation
### Endpoint Usage
**Base Url** : `https://apicookinian-q2ofpd7xaa-et.a.run.app`

### GET /api/recipes/{page}

| Field   | Description                                                                         | Example                                         |
|---------|-------------------------------------------------------------------------------------|-------------------------------------------------|
| `page`  | Page number of the search results (in URL path).                                    |                                                 |
| `bahan` | Query parameter containing a comma-separated list of ingredients.                   | `/api/recipes/1?bahan=tomat,kentang`            |

### POST /api/save/post

| Field        | Description                        | Example                                                                                              |
|--------------|------------------------------------|------------------------------------------------------------------------------------------------------|
| `difficulty` | Difficulty level of the recipe.    | `Mudah` (string)                                                                                     |
| `key`        | ID of the recipe to be saved.      | `resep-sop-saudara` (string)                                                                         |
| `thumb`      | URL of the recipe thumbnail.       | `https://www.masakapahariini.com/wp-content/uploads/2022/07/resep-sop-saudara-featured-400x240.jpg` (string) |
| `times`      | Time required to cook the recipe.  | `1jam` (string)                                                                                      |
| `title`      | Title of the recipe to be saved.   | `Resep Sop Saudara, Lengkapi Ragam Sajian Istimewa Idul Adha` (string)                               |
| `uid`        | User ID saving the recipe.         | `F2HS8TJvPbwnL7AQvql8` (string)                                                                      |


### GET /api/save/get/{uid}

| Field   | Description                                                                         | Example               |
|---------|-------------------------------------------------------------------------------------|-----------------------|
| `uid`   | User ID who has saved the recipes (in URL path).                                    | `/api/save/get/F2HS8TJvPbwnL7AQvql8`  |

### DELETE /api/save/unsave/{uid},{key}

| Field   | Description                                                                         | Example                       |
|---------|-------------------------------------------------------------------------------------|-------------------------------|
| `uid`   | User ID who wants to remove the saved recipe (in URL path).                         |                               |
| `key`   | ID of the recipe to be removed from saved list (in URL path).                       | `/api/save/unsave/F2HS8TJvPbwnL7AQvql8,resep-sop-saudara`  |

### DELETE /api/save/delete-all/{uid}

| Field   | Description                                                                         | Example                       |
|---------|-------------------------------------------------------------------------------------|-------------------------------|
| `uid`   | User ID who wants to delete all saved recipes (in URL path).                        | `/api/save/delete-all/F2HS8TJvPbwnL7AQvql8`   |

### POST /register

| Field         | Description                                                | Example                   |
|---------------|------------------------------------------------------------|---------------------------|
| `name`        | Name of the new user.                                       | `Bangkit`                |
| `email`       | Email of the new user.                                      | `BangkitA@gmail.com`        |
| `password`    | Password of the new user.                                   | `Bangkit2024`             |

### POST /login

| Field         | Description                                                | Example                   |
|---------------|------------------------------------------------------------|---------------------------|
| `email`       | Email of the user logging in.                              | `BangkitA@gmail.com`        |
| `password`    | Password of the user logging in.                           | `Bangkit2024`              |

### POST /change-password

| Field               | Description                                                | Example                   |
|---------------------|------------------------------------------------------------|---------------------------|
| `email`             | Email of the user who wants to change the password.        | `BangkitA@gmail.com`        |
| `currentPassword`   | Current password.                                          | `Bangkit2024`      |
| `newPassword`       | New password.                                              | `Dicoding2024`          |
| `confirmNewPassword`| Confirm new password.                                      | `Dicoding2024`          |

### POST /change-name

| Field     | Description                                                | Example                   |
|-----------|------------------------------------------------------------|---------------------------|
| `email`   | Email of the user who wants to change the name.            | `BangkitA@gmail.com`        |
| `newName` | New name of the user.                                       | `Dicoding`              |

## Error Codes

| Code | Description                                     | Example                                          |
|------|-------------------------------------------------|--------------------------------------------------|
| 200  | OK                                              | Request succeeded and response sent successfully.|
| 201  | Created                                         | Data successfully created.                       |
| 400  | Bad Request (invalid or missing parameters)     | Invalid parameter or data sent.                  |
| 401  | Unauthorized (user not found or invalid permission) | User not authorized to access the resource.  |
| 404  | Not Found (data not found)                      | Requested data not found.                        |
| 500  | Internal Server Error                           | Server encountered an error.                     |


## Credits
Copyright © 2024 Cloud Computing Teams

Build With Smile (:
