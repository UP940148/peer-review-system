// Required modules
const config = require('../config');
const api = require('./api-functions.js');
const express = require('express');
const googleAuth = require('simple-google-openid');
const multer = require('multer');
const mkdirp = require('mkdirp');
const fs = require('fs');

// Set up middleware
const auth = googleAuth(config.CLIENT_ID);
const docUploader = multer({
  dest: config.uploads,
  limits: {
    fileSize: 1024 * 1024 * 50,
    files: 25,
  },
  fileFilter: function (_req, file, cb) {
    checkDocType(file, cb);
  },
});

function checkDocType(file, cb) {
  // Allowed types
  const filetypes = /image|audio|pdf|application\/zip/;
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    // If file is accepted, return true
    return cb(null, true);
  } else {
    // Else skip the file
    return cb(null, false);
  }
}

const profileUploader = multer({
  dest: config.uploads,
  limits: {
    fields: 5,
    fileSize: 1024 * 1024 * 25,
    files: 1,
  },
  fileFilter: function (_req, file, cb) {
    checkProfileType(file, cb);
  },
});

function checkProfileType(file, cb) {
  // Allowed types
  // Maybe make this more specific at some point, I already know that .jfif files don't load nicely
  const filetypes = /image/;
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    // If file is accepted, return true
    return cb(null, true);
  } else {
    // Else skip the file
    return cb(null, false);
  }
}


// Start express server
const app = express();
app.listen(config.PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Server runnning on port ${config.PORT}`);
});

async function logRequests(req, res, next) {
  await next();
  if (req.hostname === 'localhost') {
    return;
  }
  const currentTime = new Date();
  const fileDir = `./logs/${currentTime.getFullYear()}/${currentTime.getMonth() + 1}/`;
  const filePath = fileDir + currentTime.getDate() + '.log';
  const data = `${req.ip} - - [${currentTime}] "${req.method} ${req.headers.host} ${req.path}" ${res.statusCode}`;
  await mkdirp(fileDir);
  fs.appendFile(filePath, data + '\n', err => {
    if (err) {
      console.log(err);
    }
  });
}

app.use(logRequests);
app.use(auth);

app.use('/', express.static(config.www + 'html/', { index: 'signup.html', extensions: ['html'] }));
app.use('/', express.static(config.www));

app.get('/admin/all/:table', api.getAllInTable);
app.get('/admin/wipe', api.wipeEmails);
app.get('/admin/:table/:value', api.getFromTableWherePrimaryKey);

app.post('/user', googleAuth.guardMiddleware(), api.createNewUser);
app.post('/cohort/:cohortId?', googleAuth.guardMiddleware(), docUploader.none(), api.createUpdateCohort);
app.post('/register/:cohortId', googleAuth.guardMiddleware(), api.registerUser);
app.post('/invite/:cohortId', googleAuth.guardMiddleware(), docUploader.none(), api.inviteUsers);
app.post('/accept-invite/:inviteId', googleAuth.guardMiddleware(), api.acceptInvite);
app.post('/post/:cohortId', googleAuth.guardMiddleware(), docUploader.array('file'), api.createPost);
app.post('/response/:postId', googleAuth.guardMiddleware(), docUploader.none(), api.createResponse);

app.get('/cohorts', googleAuth.guardMiddleware(), api.getUserCohorts);
app.get('/user', googleAuth.guardMiddleware(), api.getCurrentUser);
app.get('/cohort/:cohortId', api.getCohort);
app.get('/post/:postId', api.getPost);
app.get('/posts/:cohortId?', api.getPosts);
app.get('/registration/:cohortId', api.getRegistration);
app.get('/invites', googleAuth.guardMiddleware(), api.getInvites);
app.get('/criteria/:criteriaId', api.getCriteria);
app.get('/response-stats/:postId', googleAuth.guardMiddleware(), api.getResponseStats);
app.get('/username/:username', googleAuth.guardMiddleware(), api.checkUniqueUsername);
app.get('/inviteable-users/:cohortId/:query', googleAuth.guardMiddleware(), api.searchInviteableUsers);
app.get('/cohorts/:query', googleAuth.guardMiddleware(), api.searchCohorts);

app.patch('/user', googleAuth.guardMiddleware(), profileUploader.none(), api.updateUser);
app.patch('/profile-pic/', googleAuth.guardMiddleware(), profileUploader.single('picture'), api.updateProfilePic);

app.delete('/decline-invite/:inviteId', googleAuth.guardMiddleware(), api.declineInvite);
app.delete('/post/:postId', googleAuth.guardMiddleware(), api.deletePost);
app.delete('/profile-pic/', googleAuth.guardMiddleware(), api.updateProfilePic);

app.get('/profile-pic/:userId?', api.getProfilePic);
app.get('/img/:imageId', api.getImage);
app.get('/file/:fileId', api.getFile);
app.get('/download/:fileId', api.downloadFile);
app.get('/downloadAll/:postId', api.downloadAll);

// Every 10 minutes, delete unused documents
setInterval(api.clearUnused, 600000);
