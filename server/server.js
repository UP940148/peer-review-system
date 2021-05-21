// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const googleAuth = require('simple-google-openid');
const multer = require('multer');
const api = require('./api-functions.js');
const mkdirp = require('mkdirp');
const fs = require('fs');
// const { promisify } = require('util');
// const renameAsync = promisify(fs.rename);
try {
  const stayAwake = require('stay-awake');
  // Set up stay awake
  stayAwake.prevent((err, data) => {
    if (err) {
      console.log("Non-essential module 'stay-awake' not found. Skipping...");
      return;
    }
    console.log(`${data} routines are preventing sleep`);
  });
} catch (e) {
  console.log("Module not found 'stay-awake'. Skipping...");
}

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
  fileFilter: function (_req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  // Allowed types
  const filetypes = /image|audio|pdf/;
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

app.use('/', express.static(config.www + 'html/', { index: 'dashboard.html', extensions: ['html'] }));
app.use('/', express.static(config.www));

app.get('/admin/all/:table', api.getAllInTable);
app.get('/admin/:table/:value', api.getFromTableWherePrimaryKey);

app.post('/user', googleAuth.guardMiddleware(), api.createNewUser);
app.post('/cohort', googleAuth.guardMiddleware(), uploader.none(), api.createNewCohort);

app.get('/cohorts', googleAuth.guardMiddleware(), api.getUserCohorts);
app.get('/user', googleAuth.guardMiddleware(), api.getCurrentUser);

app.get('/profile-pic/:userId?', api.getProfilePic);
