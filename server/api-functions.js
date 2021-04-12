const config = require('../config');
const db = require('./database.js');

const fs = require('fs');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);

// --- ADMIN FUNCTIONS ---

exports.getAllUsers = async function (req, res) {
  // Retrieves all users from database and returns them
  const response = await db.getAllUsers();
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If no users found, return 204
  if (!response.context || response.context.length === 0) {
    res.sendStatus(204);
    return;
  }
  // If success, return 200
  res.status(200).json({
    data: response.context,
  });
};

// User Functions

exports.createUser = async function (req, res) {
  // Get user information from their Google account
  const name = req.user.name.givenName;
  const email = req.user.emails[0].value;
  const displayName = 'User' + req.user.id;

  const data = [req.user.id, name, displayName, '', email];
  try {
    await db.addUser(data);
    // If user was successfully created, return 201
    res.status(201).json({ success: true });
  } catch (err) {
    // If there's an error, return 500
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async function (req, res) {
  let response;
  if (!req.params.profileId) {
    // If no user specified, then return own profile
    if (!req.user.id) {
      // If no user specified and no user logged in, return 400
      res.status(400).json({
        success: false,
        data: 'User not signed in',
      });
    }
    response = await db.getOwnProfile(req.user.id);
  } else {
    // If user specified, retrieve their profile
    response = await db.getOtherProfile(req.params.profileId);
  }

  // If an error occured, return 500
  if (response.failed) {
    res.status(500).json({
      success: false,
      data: response.context.message,
    });
    return;
  }
  // If user not found, return 404
  if (!response.context) {
    res.status(404).json({
      success: false,
    });
    return;
  }
  // If success, return 200
  res.status(200).json({
    success: true,
    data: response.context,
  });
};

exports.updateProfile = async function (req, res) {
  // Update User Profile
  res.sendStatus(418);
};

exports.uploadDoc = async function (req, res) {
  // Handle document upload
  const fileExtList = req.file.originalname.split('.');
  const fileExt = fileExtList[fileExtList.length - 1];
  const newFilename = req.file.filename + '.' + fileExt;
  await renameAsync(req.file.path, config.docStore + newFilename);
  res.status(200).json({
    success: true,
    data: newFilename,
  });
};

exports.deleteUser = async function (req, res) {
  // Delete currently logged in user
  try {
    await db.deleteUser(req.user.id);
    // If user was successfully deleted, return 200
    res.status(200).json({ success: true });
  } catch (err) {
    // If there's an error, return 500
    res.status(500).json({ error: err.message });
  }
};

// Document retrieval functions

exports.sendDoc = function (req, res) {
  // Takes the document id specified in req.params and sends the associated file
  const id = req.params.documentId;
  const file = `${config.docStore}${id}`;
  res.sendFile(file);
};

exports.downloadDoc = function (req, res) {
  // Takes the document id specified in req.params and makes the client download it
  const id = req.params.documentId;
  const file = `${config.docStore}${id}`;
  res.download(file);
};

exports.sendPic = function (req, res) {
  // Get picture from database
  if (req.params.userId) {
    // Get user profile pic
  } else if (req.params.groupId) {
    // Get group picture
  }
  // Else serve default
  res.sendFile(config.imageStore + 'default-profile-pic.jpg');
};
