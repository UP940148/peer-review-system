// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const stayAwake = require('stay-awake');
const config = require('./config');
const googleAuth = require('simple-google-openid');
const db = require('./database.js');

// Create express app
const app = express();

const jsonParser = bodyParser.json();

stayAwake.prevent(function(err, data) {
  console.log(`${data} routines are preventing sleep`);
});

app.listen(config.PORT, (err) => {
  console.log(`Server runnning on port ${config.PORT}`);
});

app.use('/', express.static(config.www, { index: 'html/index.html', extenstions: ['HTML'] }));

app.post('/users/u/', jsonParser, async (req, res) => {
  const data = [req.body.googleId, req.body.name, req.body.displayName, req.body.profilePicture, req.body.email];
  let err = await db.addUser(data);
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.json({
    success: true,
  });
});

app.get('/users/u/:userId/', jsonParser, async (req, res) => {
  const id = [req.params.userId];
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
