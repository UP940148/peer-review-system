// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const stayAwake = require('stay-awake');
const config = require('../config');
const googleAuth = require('simple-google-openid');
const multer = require('multer');
const api = require('./api-functions.js');
const fs = require('fs');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);


// Set up middleware
const jsonParser = bodyParser.json();
const auth = googleAuth(config.CLIENT_ID);
const uploader = multer({
  dest: config.uploads,
  limits: {
    fields: 10,
    fileSize: 1024 * 1024 * 20,
    files: 1,
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

app.get('/users/', api.getAllUsers);

app.use(auth);

// User Routes

app.post('/user/', googleAuth.guardMiddleware(), api.createUser);
app.get('/user/:profileId?/', api.getProfile);
app.delete('/user/', googleAuth.guardMiddleware(), api.deleteUser);

app.get('/doc/:documentId/', api.sendDoc);
app.get('/doc/download/:documentId/', api.downloadDoc);
app.get('/profile-pic/u/:userId?/', api.sendPic);
app.get('/profile-pic/g/:groupId?/', api.sendPic);


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
