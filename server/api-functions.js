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

exports.getAllGroups = async function (req, res) {
  // Retrieves all groups from database and returns them
  const response = await db.getAllGroups();
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If no groups found, return 204
  if (!response.context || response.context.length === 0) {
    res.sendStatus(204);
    return;
  }
  // If success, return 200
  res.status(200).json({
    data: response.context,
  });
};

exports.getAllRanks = async function (req, res) {
  // Retrieves all ranks from database and returns them
  const response = await db.getAllRanks();
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If no ranks found, return 204
  if (!response.context || response.context.length === 0) {
    res.sendStatus(204);
    return;
  }
  // If success, return 200
  res.status(200).json({
    data: response.context,
  });
};

exports.getAllRegistrations = async function (req, res) {
  // Retrieves all registrations from database and returns them
  const response = await db.getAllRegistrations();
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If no registrations found, return 204
  if (!response.context || response.context.length === 0) {
    res.sendStatus(204);
    return;
  }
  // If success, return 200
  res.status(200).json({
    data: response.context,
  });
};

exports.getAllPosts = async function (req, res) {
  // Retrieves all posts from database and returns them
  const response = await db.getAllPosts();
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If no posts found, return 204
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

// User Post Functions

exports.createPost = async function (req, res) {
  // Get data from body

  const groupId = parseInt(req.body.groupId);
  const title = req.body.title;
  const caption = req.body.caption || '';
  const files = req.body.files || '';

  const currentDate = new Date();
  const currentTime = currentDate.getTime();


  // Validate data

  // Insert data into database
  const data = [req.user.id, groupId, title, caption, files, currentTime];
  try {
    await db.addPost(data);
    // If post was successfully created, return 201
    res.status(201).json({ success: true });
  } catch (err) {
    // If there's an error, return 500
    res.status(500).json({ error: err.message });
  }
};

// Group Functions

exports.createGroup = async function (req, res) {
  // Get data from body
  // Create groupId

  const groupName = req.body.groupName;
  // If no group name specified
  if (!groupName) {
    res.status(400);
    return;
  }
  // If group name is only whitespace or blank
  if (!/\S/.test(groupName)) {
    res.status(400);
    return;
  }
  // If group name is too long
  if (groupName.length > 32) {
    res.status(400);
    return;
  }

  // Validate data
  let isPrivate = req.body.isPrivate;
  if (isPrivate) {
    isPrivate = 1;
  } else {
    isPrivate = 0;
  }

  // Check if any groups have the same name
  // If so, return error

  // Insert data into database

  try {
    const data = [req.body.groupName, req.body.isPrivate];
    const groupId = await db.addGroup(data);

    // Create admin rank
    const adminRankData = [groupId, 'Administrator', 0, '#FF0000', 1, 1, 1, 1];
    const rankId = db.addRank(adminRankData);

    // Create admin registration
    const adminRegistrationData = [req.user.id, groupId, rankId];
    db.addRegistration(adminRegistrationData);

    // Send response
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Document  functions

exports.uploadDocs = async function (req, res) {
  // Handle document upload
  const newFilenames = [];

  // Loop through every file
  for (const file of req.files) {
    // Get the file extension and add it to the random file name
    const fileExtList = file.originalname.split('.');
    const fileExt = fileExtList[fileExtList.length - 1];
    const newFilename = file.filename + '.' + fileExt;
    // Move file and rename it with extension
    await renameAsync(file.path, config.docStore + newFilename);
    // Add file to list
    newFilenames.push(newFilename);
  }
  // Return list of file names
  res.status(200).json({
    success: true,
    data: newFilenames,
  });
};

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

exports.getDocFromPost = async function (req, res) {
  // Set user ID if not logged in
  let userId;
  if (!req.user) {
    userId = undefined;
  } else {
    userId = req.user.id;
  }
  // Cast IDs as integers
  const documentId = parseInt(req.params.documentId);
  const postId = parseInt(req.params.postId);
  if (isNaN(documentId) || isNaN(postId)) {
    res.sendStatus(400);
    return;
  }
  // Make sure neither id is negative
  if (documentId < 0 || postId < 0) {
    res.sendStatus(400);
    return;
  }
  // Attempt to access the post
  const values = [postId, userId];
  const response = await db.getPost(values);
  // If something went wrong, return 500
  if (response.failed) {
    res.status(500).json({
      data: response.context.message,
    });
    return;
  }
  // If post not found, or no files in post, return 404
  if (!response.context || response.context.length === 0 || response.context.files === '') {
    res.sendStatus(404);
    return;
  }
  // Retrieve post files
  const fileList = response.context.files.split(',');
  if (documentId >= fileList.length) {
    res.sendStatus(404);
    return;
  }
  // Return correct file
  res.status(200);
  res.sendFile(config.docStore + fileList[documentId]);
};
