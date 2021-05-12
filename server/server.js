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


app.use('/', express.static(config.www + 'html/', { index: 'dashboard.html', extensions: ['html'] }));
app.use('/', express.static(config.www));
