// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const stayAwake = require('stay-awake');
const config = require('../config');
const googleAuth = require('simple-google-openid');
const auth = googleAuth(config.CLIENT_ID);
const multer = require('multer');
const db = require('./database.js');
const fs = require('fs');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);
const mime = require('mime-types');
//const sanitizer = require('sanitize-html');
const docxConverter = require('docx-pdf');
const mdConverter = require('markdown-pdf');

// Create express app
const app = express();
app.use(auth);

const uploader = multer({
  dest: config.uploads,
  limits: {
    fields: 10,
//    fileSize: 1024 * 1024 * 20,
    files: 1
  },
});

const jsonParser = bodyParser.json();

stayAwake.prevent(function(err, data) {
  console.log(`${data} routines are preventing sleep`);
});

app.listen(config.PORT, (err) => {
  console.log(`Server runnning on port ${config.PORT}`);
});

// Setting multiple served directories to avoid having folder names in the url
// 'http://localhost:8080/userfeed.html' rather than 'http://localhost:8080/html/userfeed.html'
app.use('/', express.static(config.www + 'html/', { index: 'userfeed.html', extensions: ['html'] }));
app.use('/', express.static(config.www + 'scripts/'));
app.use('/', express.static(config.www + 'css/'));

// POST

app.post('/doc-upload/', uploader.single('document'), async (req, res) => {
  console.log(req.file);
  const fileExtList = req.file.originalname.split('.');
  const fileExt = fileExtList[fileExtList.length-1];
  console.log(mime.lookup(fileExt));
  let newFilename = req.file.filename + '.' + fileExt;
  await renameAsync(req.file.path, config.docStore + newFilename);
  // Convert to PDF if word doc
  if (fileExt == 'docx') {
    await docxConverter(config.docStore + newFilename, config.docStore + req.file.filename + '.pdf', (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
      } else {
        newFilename = req.file.filename + '.pdf';
        res.json({ message: 'success', fileSource: newFilename});
      }
    });
  } else if (fileExt == 'md') {
    await mdConverter().from(config.docStore + newFilename).to(config.docStore + req.file.filename + '.pdf');
    newFilename = req.file.filename + '.pdf';
    res.json({ message: 'success', fileSource: newFilename});
  } else {
    res.json({ message: 'success', fileSource: newFilename});
    }
});

app.post('/img-upload/', uploader.single('image'), async (req, res) => {
  const fileExt = req.file.mimetype.split('/')[1];
  await renameAsync(req.file.path, req.file.path + '.' + fileExt);
});

app.post('/user/', jsonParser, async (req, res) => {
  const data = [req.body.googleId, req.body.name, req.body.displayName, req.body.profilePicture, req.body.email];
  try {
    await db.addUser(data);
    res.json({
      success: true,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post('/work/', jsonParser, async (req, res) => {
  const data = [req.body.title, req.body.author, req.body.file, req.body.timeCreated, req.body.lastEditted];
  let err = await db.addDoc(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/reply/', jsonParser, async (req, res) => {
  const data = [req.body.document, req.body.content, req.body.parentReply, req.body.author, req.body.timeCreated];
  let err = await db.addReply(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/registration/', jsonParser, async (req, res) => {
  const data = [req.body.groupId, req.body.userId, req.body.rankId];
  let err = await db.addRegistration(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/grievance/', jsonParser, async (req, res) => {
  const data = [req.body.prosecutorId, req.body.defendantId, req.body.documentId, req.body.replyId, req.body.content];
  let err = await db.addGrievance(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/share/', jsonParser, async (req, res) => {
  const data = [req.body.documentId, req.body.groupId];
  let err = await db.addShare(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/group/', jsonParser, async (req, res) => {
  const data = [req.body.groupName, req.body.groupPicture, req.body.groupDescription];
  let err = await db.addGroup(data, req.body.userId);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.post('/rank/', jsonParser, async (req, res) => {
  const data = [req.body.groupId, req.body.rankName, req.body.level, req.body.colour, req.body.canPost, req.body.canReply, req.body.canRemove, req.body.canBan];
  let err = await db.addRank(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
})

// GET

app.get('/users/u/:userId/', jsonParser, async (req, res) => {
  const id = req.params.userId;
  let response = await db.getUserById(id);
  if (response.failed) {
    res.status(400).json({
      success: false,
      data: response.context.message
    });
    return;
  }
  res.json({
    success: true,
    data: response.context,
  });
})

app.get('/work/d/:documentId/', (req, res) => {
  const id = [req.params.documentId];
  const file = `${config.docStore}/${id}`;
  res.sendFile(file);
});

app.get('/feed/:userId', async (req, res) => {
  const id = req.params.userId;
  let response = await db.getViewableDocs(id);
  if (response.failed) {
    res.status(400).json({
      success: false,
      data: response.context.message
    });
    return;
  }
  res.json({
    success: true,
    data: response.context,
  });
})

app.get('/download/:documentId/', (req, res) => {
  const id = req.params.documentId;
  const file = `${config.docStore}/${id}`;
  res.download(file);
})

app.get('*', function(request, response, next) {
  response.sendFile(config.www + '/html/invalidsource.html');
});
