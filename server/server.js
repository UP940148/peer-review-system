// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const stayAwake = require('stay-awake');
const config = require('../config');
const googleAuth = require('simple-google-openid');
const multer = require('multer');
const api = require('./api-functions.js');
// const fs = require('fs');
// const { promisify } = require('util');
// const renameAsync = promisify(fs.rename);


// Set up middleware
const jsonParser = bodyParser.json();
const auth = googleAuth(config.CLIENT_ID);
const uploader = multer({
  dest: config.uploads,
  limits: {
    fields: 10,
    fileSize: 1024 * 1024 * 30,
    files: 5,
  },
});

// Set up stay awake
stayAwake.prevent((err, data) => {
  if (err) {
    console.log("Non-essential module 'stay-awake' not found. Skipping...");
    return;
  }
  console.log(`${data} routines are preventing sleep`);
});

// Start express server
const app = express();
app.listen(config.PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Server runnning on port ${config.PORT}`);
});


app.use('/', express.static(config.www + 'html/', { index: 'feed.html', extensions: ['html'] }));
app.use('/', express.static(config.www));

// --- ADMIN ROUTES ---

app.get('/all-users/', api.getAllUsers);
app.get('/all-groups/', api.getAllGroups);
app.get('/all-ranks/', api.getAllRanks);
app.get('/all-registrations/', api.getAllRegistrations);
app.get('/all-posts/', api.getAllPosts);
app.get('/all-replies/', api.getAllReplies);

app.use(auth);

// User Routes

app.post('/user/', googleAuth.guardMiddleware(), api.createUser);
app.get('/user/:profileId?/', api.getProfile);
app.patch('/user/', googleAuth.guardMiddleware(), jsonParser, api.updateProfile);
app.delete('/user/', googleAuth.guardMiddleware(), api.deleteUser);
app.post('/profile-pic/', googleAuth.guardMiddleware(), uploader.single('picture'), api.uploadProfilePic);
app.delete('/profile-pic/', googleAuth.guardMiddleware(), api.deleteProfilePic);

// Group Routes

app.post('/group/', googleAuth.guardMiddleware(), jsonParser, api.createGroup);

// User Post Routes

app.post('/post/', googleAuth.guardMiddleware(), jsonParser, api.createPost);
app.get('/post/:postId/', api.getPost);
app.get('/posts/:offset/', api.getNextPosts);
app.delete('/post/:postId/', googleAuth.guardMiddleware(), api.deletePost);

// Post Comment Routes

app.post('/comment/:postId/', googleAuth.guardMiddleware(), jsonParser, api.createReply);
app.get('/comments/:postId/', api.getPrimaryComments);

// File Routes

app.post('/docs/', googleAuth.guardMiddleware(), uploader.array('document', 5), api.uploadDocs);
// app.get('/doc/:documentId/', api.sendDoc);
app.get('/doc/download/:documentId/', api.downloadDoc);
app.get('/post/:postId/:documentId/', api.getDocFromPost);

app.get('/profile-pic/u/:userId?/', api.sendPic);
app.get('/profile-pic/g/:groupId?/', api.sendPic);

// app.get('/test/', api.getComments);


// TINKERING
/*
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  secure: false, // use SSL
  port: 25, // port for secure SMTP
  auth: {
    user: 'insertUsername',
    pass: 'insertPassword',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const mailOptions = {
  from: 'insertUsername',
  to: 'up940148@myport.ac.uk',
  subject: 'Test NodeJS Email',
  html: "<h1>Hello World!</h1><h3>Foo Bar</h3><p><a href='www.lenniegames.co.uk'>Test Link!</a></p>",
};
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Email Sent: ' + info.response);
  }
});
*/
