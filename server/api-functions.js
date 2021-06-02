const config = require('../config');
const db = require('./database.js');

const zip = require('express-zip');
const fs = require('fs');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);

// ADMIN FUNCTIONS

exports.getAllInTable = async function (req, res) {
  const response = await db.getAllInTable(req.params.table);
  if (response.failed) {
    res.sendStatus(500);
  } else {
    res.status(200).json({
      data: response.context,
    });
  }
};

exports.getFromTableWherePrimaryKey = async function (req, res) {
  const response = await db.getRecordByPrimaryKey(req.params.table, req.params.value);
  if (response.failed || response.code) {
    const httpCode = response.code || 500;
    res.sendStatus(httpCode);
  } else {
    res.status(200).json({
      data: response.context,
    });
  }
};


exports.createNewUser = async function (req, res) {
  const name = req.user.name.givenName;
  const email = req.user.emails[0].value;
  const username = 'User' + req.user.id;
  const picture = req.user.photos[0].value;

  const data = [req.user.id, username, name, email, picture, ''];
  const response = await db.createUser(data);
  if (response.failed) {
    res.sendStatus(500);
  } else {
    res.sendStatus(201);
  }
};

exports.createUpdateCohort = async function (req, res) {
  // Format data correctly
  let isPrivate = 0;
  if (req.body.isPrivate) {
    isPrivate = 1;
  }
  const data = [req.body.cohortName, req.body.cohortDesc, isPrivate];

  if (req.params.cohortId) {
    // Check if cohort exists, if so then update and return
    const cohortId = parseInt(req.params.cohortId);
    const checkRank = await db.checkRegistration(cohortId, req.user.id);
    if (checkRank.context.rank === 'owner') {
      data.push(cohortId);
      const cohortResponse = await db.updateCohort(data);
      if (cohortResponse.failed) {
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(404);
    }
    return;
  }

  // Create cohort
  const response = await db.createCohort(data);
  if (response.failed) {
    res.sendStatus(500);
    return;
  }
  // Add current user to cohort registration
  const registration = await insertRegistration(req.user.id, response.context.id, 'owner');
  if (registration.failed) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
};

async function insertRegistration(userId, cohortId, rank = 'member') {
  const data = [userId, cohortId, rank];
  const response = await db.createRegistration(data);
  return response;
}

exports.getUserCohorts = async function (req, res) {
  const response = await db.getUserCohorts(req.user.id);
  if (response.failed) {
    res.sendStatus(500);
  } else {
    res.status(200).json({
      data: response.context,
    });
  }
};

exports.getCurrentUser = async function (req, res) {
  const response = await db.getRecordByPrimaryKey('user', req.user.id);
  if (response.failed) {
    // If an error occured, return 500
    res.sendStatus(500);
    return;
  }

  // If user wasn't found, return 404
  if (!response.context || response.context.length === 0) {
    res.sendStatus(404);
    return;
  }

  res.status(200).json({
    data: response.context,
  });
};

exports.getProfilePic = async function (req, res) {
  // If no user specified, return default image
  if (!req.params.userId) {
    res.sendFile(config.imageStore + 'default-profile-pic.jpg');
    return;
  }
  // Currently no need for anything else as I'm using google profile pictures which have external urls
  res.sendStatus(418);
};

exports.getCohort = async function (req, res) {
  const cohortId = parseInt(req.params.cohortId);
  // Get group from database
  const response = await db.getRecordByPrimaryKey('cohort', cohortId);

  // If group not found, return 404
  if (!response.context) {
    res.sendStatus(404);
    return;
  }
  // If group public
  if (!response.context.isPrivate) {
    // If group found, return 200
    res.status(200).json({
      data: response.context,
    });
    return;
  }

  // If group is private and user not logged in, return 404
  if (!req.user) {
    res.sendStatus(404);
    return;
  }

  // If group private and user logged in, check registration
  const registrationResponse = await db.checkRegistration(cohortId, req.user.id);
  // If user not registered, return 404
  if (!registrationResponse.context) {
    res.sendStatus(404);
    return;
  }

  // If user registration found, return 200
  res.status(200).json({
    data: response.context,
  });
};

exports.registerUser = async function (req, res) {
  // Check if cohort is public or not
  const cohortId = parseInt(req.params.cohortId);
  const response = await db.getPublicCohort(cohortId);
  if (!response.context) {
    res.sendStatus(404);
    return;
  }
  // If public, register user
  const registerResponse = await insertRegistration(req.user.id, cohortId);
  if (registerResponse.failed) {
    res.sendStatus(500);
    return;
  }
  // Check if user has pending invite
  const checkInvite = await db.checkInvite(cohortId, req.user.id);
  // If something went wrong, log it
  if (checkInvite.failed) {
    res.sendStatus(500);
    return;
  }
  const inviteId = checkInvite.context.inviteId;
  // If an invite was found
  if (checkInvite.context) {
    const decline = await db.deleteInvite(inviteId);
    // If something went wrong, return 500
    if (decline.failed) {
      res.sendStatus(500);
      return;
    }
  }
  res.sendStatus(200);
};

exports.getRegistration = async function (req, res) {
  const cohortId = parseInt(req.params.cohortId);
  if (!req.user) {
    res.sendStatus(404);
    return;
  }
  const response = await db.checkRegistration(cohortId, req.user.id);
  if (!response.context) {
    res.status(200).json({
      rank: 'guest',
    });
    return;
  }
  res.status(200).json({
    rank: response.context.rank,
  });
};

exports.inviteUsers = async function (req, res) {

  const cohortId = parseInt(req.params.cohortId);
  const checkRank = await db.checkRegistration(cohortId, req.user.id);
  if (!(checkRank.context.rank === 'owner' || checkRank.context.rank === 'admin')) {
    res.sendStatus(404);
    return;
  }
  const idList = req.body.userIds.replace(/\s+/g, '').split(',');

  for (let i = 0; i < idList.length; i++) {
    const isUser = await db.getRecordByPrimaryKey('user', idList[i]);
    if (isUser.context) {
      // Check if invite already exists
      const inviteExists = await db.checkInvite(cohortId, idList[i]);
      if (!inviteExists.context) {
        const response = await db.createInvite([cohortId, idList[i], '']);
        if (response.failed) {
          console.log(response);
        }
      }
    }
  }

  res.sendStatus(200);
};

exports.getInvites = async function (req, res) {
  const response = await db.getUserInvites(req.user.id);
  if (response.failed) {
    res.sendStatus(500);
    return;
  }
  if (response.context.length === 0) {
    res.sendStatus(204);
    return;
  }
  res.status(200).json({
    data: response.context,
  });
};

exports.acceptInvite = async function (req, res) {
  // Get invite by id
  const inviteId = parseInt(req.params.inviteId);
  const invite = await db.getRecordByPrimaryKey('invite', inviteId);

  // If invite not with this user, return 404
  if (invite.context.userId !== req.user.id) {
    res.sendStatus(404);
    return;
  }

  // If invite belongs to user, add user registration
  const register = await insertRegistration(invite.context.userId, invite.context.cohortId);
  // If something went wrong, return 500
  if (register.failed) {
    res.sendStatus(500);
    return;
  }

  // If accepted, delete invite record
  const decline = await db.deleteInvite(inviteId);
  // If something went wrong, return 500
  if (decline.failed) {
    res.sendStatus(500);
    return;
  }

  // If success, return 200
  res.sendStatus(200);
};

exports.declineInvite = async function (req, res) {
  // Get invite by id
  const inviteId = parseInt(req.params.inviteId);
  const invite = await db.getRecordByPrimaryKey('invite', inviteId);

  // If invite not with this user, return 404
  if (invite.context.userId !== req.user.id) {
    res.sendStatus(404);
    return;
  }

  // If invite belongs to user, delete
  const decline = await db.deleteInvite(inviteId);
  // If something went wrong, return 500
  if (decline.failed) {
    res.sendStatus(500);
    return;
  }
  // If success, return 200
  res.sendStatus(200);
};

exports.getPosts = async function (req, res) {
  // If attempting to get own posts but not logged in, return 404;
  if (!req.params.cohortId && !req.user) {
    res.sendStatus(404);
    return;
  }
  // If requesting group posts
  if (req.params.cohortId) {
    const cohortId = parseInt(req.params.cohortId);
    // Check if group is public
    const getPublic = await db.getPublicCohort(cohortId);
    if (!getPublic.context) {
      // Check if user is registered
      if (!req.user) {
        res.sendStatus(404);
        return;
      }
      // If not registered with group, return 404
      const checkRank = await db.checkRegistration(cohortId, req.user.id);
      if (!checkRank.context) {
        res.sendStatus(404);
        return;
      }
    }
    // Group is either public, or user is member of group, so display posts
    const posts = await db.getCohortPosts(cohortId);
    if (posts.failed) {
      res.sendStatus(500);
      return;
    }
    res.status(200).json({
      data: posts.context,
    });
  } else {
    // If requesting own posts
    const posts = await db.getUserPosts(req.user.id);
    if (posts.failed) {
      res.sendStatus(500);
      return;
    }
    res.status(200).json({
      data: posts.context,
    });
  }
};

exports.createPost = async function (req, res) {
  // If group ID invalid, return 404
  const cohortId = parseInt(req.params.cohortId);
  if (isNaN(cohortId)) {
    res.sendStatus(404);
    return;
  }

  // If not registered with group, return 404
  const checkRank = await db.checkRegistration(cohortId, req.user.id);
  if (!checkRank.context) {
    res.sendStatus(404);
    return;
  }
  const registrationId = checkRank.context.registrationId;

  const fileString = await handleFileUpload(req.files);

  const criteriaData = JSON.parse(req.body.questions);

  // List to store Ids to put in criteria record
  const questionIds = [];
  // Get question data
  for (let i = 0; i < criteriaData.questions.length; i++) {
    const currentQuestion = criteriaData.questions[i];
    const data = [];
    data.push(currentQuestion.question);
    data.push(currentQuestion.type);

    if (currentQuestion.type === 'text') {
      // If free text, no answers needed
      data.push(null);
    } else if (currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') {
      // If multiple choice, add answer strings
      const answerString = answerListToString(currentQuestion.answers);
      answerStringToList(answerString);
      data.push(answerString);
    } else {
      // If type not valid, return 404
      res.sendStatus(404);
      return;
    }

    // Insert question
    const questionCreation = await db.createQuestion(data);
    if (questionCreation.failed) {
      res.sendStatus(500);
      return;
    }
    // Add ID to list
    questionIds.push(questionCreation.context.id);
  }

  // Insert criteria record
  const questionIdString = questionIds.toString();
  const criteriaCreation = await db.createCriteria([questionIdString]);
  if (criteriaCreation.failed) {
    res.sendStatus(500);
    return;
  }
  const criteriaId = criteriaCreation.context.id;

  // Insert post data
  const datum = new Date();
  const unixTime = datum.getTime();
  const data = [registrationId, criteriaId, req.body.postTitle, req.body.postDesc, fileString, unixTime];

  const postCreation = await db.createPost(data);
  if (postCreation.failed) {
    res.sendStatus(500);
    return;
  }

  res.sendStatus(201);
};

exports.getPost = async function (req, res) {
  // Check postId is valid
  const postId = parseInt(req.params.postId);
  if (isNaN(postId)) {
    res.sendStatus(404);
    return;
  }

  const postRetrieval = await db.getPost(postId);
  if (postRetrieval.failed || !postRetrieval.context) {
    res.sendStatus(404);
    return;
  }

  const getPublic = await db.getPublicCohort(postRetrieval.context.cohortId);
  // If cohort private
  if (!getPublic.context) {
    // If not logged in, return 404
    if (!req.user) {
      res.sendStatus(404);
      return;
    }
    // If not registered with group, return 404
    const checkRank = await db.checkRegistration(postRetrieval.context.cohortId, req.user.id);
    if (!checkRank.context) {
      res.sendStatus(404);
      return;
    }
  }

  // If all good, send post data
  res.status(200).json({
    data: postRetrieval.context,
  });
};

exports.getCriteria = async function (req, res) {
  const criteriaId = parseInt(req.params.criteriaId);
  if (isNaN(criteriaId)) {
    res.sendStatus(404);
    return;
  }

  // Retrieve questions
  const criteriaRetrieval = await db.getRecordByPrimaryKey('criteria', criteriaId);
  if (criteriaRetrieval.failed) {
    res.sendStatus(404);
    return;
  }


  const questionList = criteriaRetrieval.context.questions.split(',');
  const questions = [];
  for (let i = 0; i < questionList.length; i++) {
    const currentQuestion = parseInt(questionList[i]);
    // Retrieve the question from the database
    const questionRetrieval = await db.getRecordByPrimaryKey('question', currentQuestion);
    if (questionRetrieval.failed) {
      res.sendStatus(500);
      return;
    }
    // Create a JSON object
    const questionObj = questionRetrieval.context;
    if (questionObj.answers) {
      const answers = answerStringToList(questionObj.answers);
      questionObj.answers = answers;
    }
    // Add to main object
    questions.push(questionObj);
  }

  // Return data to client
  res.status(200).json({
    data: questions,
  });
};

exports.createResponse = async function (req, res) {
  const postId = parseInt(req.params.postId);
  if (isNaN(postId)) {
    res.sendStatus(404);
    return;
  }

  // If post doesn't exist, return 404
  const postRetrieval = await db.getPost(postId);
  if (postRetrieval.failed || !postRetrieval.context) {
    res.sendStatus(404);
    return;
  }

  // Can't leave feedback on your own work
  if (postRetrieval.context.userId === req.user.id) {
    res.sendStatus(404);
    return;
  }

  const getPublic = await db.getPublicCohort(postRetrieval.context.cohortId);
  // If cohort private
  if (!getPublic.context) {
    // If not logged in, return 404
    if (!req.user) {
      res.sendStatus(404);
      return;
    }
    // If not registered with group, return 404
    const checkRank = await db.checkRegistration(postRetrieval.context.cohortId, req.user.id);
    if (!checkRank.context) {
      res.sendStatus(404);
      return;
    }
  }

  // Get Criteria record
  const criteriaRetrieval = await db.getRecordByPrimaryKey('criteria', postRetrieval.context.criteriaId);
  if (criteriaRetrieval.failed || !criteriaRetrieval.context) {
    res.sendStatus(404);
    return;
  }

  // Get questions from criteria
  const questionList = criteriaRetrieval.context.questions.split(',');


  // Check values in FormData
  const questionNumList = [];
  const answers = [];
  const body = Object.keys(req.body);
  for (let i = 0; i < body.length; i++) {

    // Get question number
    const questionNum = body[i].match(/\d+/)[0];
    // If this question doesn't already have an answer, create a new reference in list
    if (!questionNumList.includes(questionNum)) {
      questionNumList.push(questionNum);
    }
    // Was it a checkbox question
    const matchList = body[i].match(/\d+/g);
    if (matchList.length > 1) {
      // Get the index of the question
      const indexPos = questionNumList.indexOf(questionNum);
      // Check if the question has an answer already
      if (answers.length < indexPos + 1) {
        // If not, then create a list object for it
        answers.push([]);
      }
      // Else append to pre-existing list
      answers[indexPos].push(matchList[1]);
    } else {
      // Push answer
      answers.push(req.body[body[i]]);
    }
  }

  // Loop through all questions
  for (let i = 0; i < questionNumList.length; i++) {
    // Get current question
    const questionId = questionList[parseInt(questionNumList[i])];
    const currentQuestion = await db.getRecordByPrimaryKey('question', questionId);
    console.log(`Question ${questionId}`);
    console.log(currentQuestion.context);
    if (currentQuestion.failed || !currentQuestion.context) {
      res.sendStatus(404);
      return;
    }

    // If question has multiple answers, convert indexes to actual answers
    if (typeof answers[i] !== 'string') {
      if (currentQuestion.context.type !== 'checkbox') {
        res.sendStatus(404);
        return;
      }

      // Get answers from question
      const answerList = answerStringToList(currentQuestion.context.answers);
      // Convert indexes to answers
      for (let j = 0; j < answers[i].length; j++) {
        answers[i][j] = answerList[parseInt(answers[i][j])];
      }

      // Convert answers to single string
      answers[i] = answerListToString(answers[i]);
    }

    // If answer is blank, skip
    if (answers[i].length !== 0) {
      // Check if response already exists for question
      const checkResponse = await db.getUserResponse(req.user.id, questionId);
      if (checkResponse.failed) {
        res.sendStatus(500);
        return;
      }
      if (checkResponse.context) {
        const responseId = checkResponse.context.responseId;
        // Update response
        const updateResponse = await db.updateResponse(responseId, answers[i]);
        if (updateResponse.failed) {
          res.sendStatus(500);
          return;
        }
      } else {
        // Create new response
        const data = [req.user.id, questionId, answers[i]];
        const newResponse = await db.createResponse(data);
        if (newResponse.failed) {
          console.log(newResponse.context);
          res.sendStatus(500);
          return;
        }
      }
    }
  }

  res.sendStatus(201);
};

exports.getResponseStats = async function (req, res) {
  const postId = parseInt(req.params.postId);
  if (isNaN(postId)) {
    res.sendStatus(404);
    return;
  }

  // If post doesn't exist, return 404
  const postRetrieval = await db.getPost(postId);
  if (postRetrieval.failed || !postRetrieval.context) {
    res.sendStatus(404);
    return;
  }

  // Can only view stats on your own post
  if (postRetrieval.context.userId !== req.user.id) {
    res.sendStatus(404);
    return;
  }

  // Retrieve criteria info
  const criteriaId = postRetrieval.context.criteriaId;
  const criteriaRetrieval = await db.getRecordByPrimaryKey('criteria', criteriaId);
  if (criteriaRetrieval.failed) {
    res.sendStatus(404);
    return;
  }

  // Get stats for each question
  const questionList = criteriaRetrieval.context.questions.split(',');
  const data = [];
  for (let i = 0; i < questionList.length; i++) {
    const questionId = questionList[i];
    const questionStats = await getQuestionStats(questionId);
    data.push(questionStats);
  }

  // Return data
  res.status(200).json({
    data: data,
  });
};

async function getQuestionStats(questionId) {
  // Retrieve question
  const questionRetrieval = await db.getRecordByPrimaryKey('question', questionId);
  const questionStats = {
    question: questionRetrieval.context.questionContent,
    type: questionRetrieval.context.type,
  };

  if (questionRetrieval.context.type === 'text') {
    questionStats.responses = [];
    // Retrieve all responses to question
    const responses = await db.getAllResponses(questionId);
    for (let i = 0; i < responses.context.length; i++) {
      questionStats.responses.push(responses.context[i].answer);
    }
  } else {
    // Retrieve totals for each answer
    // Get all possible answers
    const answers = questionRetrieval.context.answers;
    const answerList = answerStringToList(answers);
    questionStats.answers = answerList;
    questionStats.totals = [];
    for (let i = 0; i < answerList.length; i++) {
      const currentAnswer = answerList[i];
      let countResponse;
      // If checkbox type, then regex is needed to match answer strings
      if (questionRetrieval.context.type === 'checkbox') {
        const formattedAnswer = currentAnswer + ' ';
        // Create list for regex strings
        const sqliteRegexList = [];
        sqliteRegexList.push(`${formattedAnswer},%`); // Starts with
        sqliteRegexList.push(`% ,${formattedAnswer},%`); // Contains
        sqliteRegexList.push(`% ,${formattedAnswer}`); // Ends with
        const data = [questionId, sqliteRegexList[0], sqliteRegexList[1], sqliteRegexList[2], formattedAnswer];
        countResponse = await db.getCheckboxResponseCount(data);
        console.log(countResponse);
      } else {
        // If radio type, then just match answer
        countResponse = await db.getRadioResponseCount(questionId, currentAnswer);
      }
      // Get total from response
      const totalCount = countResponse.context.total;
      questionStats.totals.push(totalCount);
    }
  }
  return questionStats;
}

exports.getFile = function (req, res) {
  res.sendFile(config.docStore + req.params.fileId);
};

exports.downloadFile = function (req, res) {
  res.download(config.docStore + req.params.fileId);
};

exports.downloadAll = async function (req, res) {
  const postId = parseInt(req.params.postId);
  if (isNaN(postId)) {
    res.sendStatus(404);
    return;
  }
  // Get files from post
  const postRetrieval = await db.getPost(postId);
  if (postRetrieval.failed || !postRetrieval.context) {
    res.sendStatus(404);
    return;
  }
  const files = postRetrieval.context.files.split(',');
  const fileObjs = [];
  files.forEach(file => {
    const object = {
      path: config.docStore + file,
      name: file,
    };
    fileObjs.push(object);
  });
  const datum = new Date();
  const unixTime = datum.getTime();
  res.zip(fileObjs, `LPRS-${postId}_${unixTime}.zip`);
};

async function handleFileUpload(files) {
  // Handle document upload
  const newFilenames = [];

  // Loop through every file
  for (const file of files) {
    // Get the file extension and add it to the random file name
    const fileExtList = file.originalname.split('.');
    const fileExt = fileExtList[fileExtList.length - 1];
    const newFilename = file.filename + '.' + fileExt;
    // Move file and rename it with extension
    await renameAsync(file.path, config.docStore + newFilename);
    // Add file to list
    newFilenames.push(newFilename);
  }

  // Return file list as string to store in database
  return newFilenames.toString();
}

function answerListToString(subjectList) {
  // Encode answer strings, then comma separate

  const newList = [];

  subjectList.forEach(subjectString => {
    // I need to make sure the last character in each string isn't a backslash
    subjectString += ' ';
    // Storing separate strings as comma separated in my database means that
    // I need a way to separate the commas in the string/s from the comma separations
    const newString = subjectString.replace(/,/g, '/,');

    newList.push(newString);
  });

  return newList.toString();
}

function answerStringToList(subjectString) {
  // Remove whitespace from end of string
  subjectString = subjectString.replace(/\s+$/, '');
  // Convert string to list
  const subjectList = subjectString.split(' ,');

  const newList = [];
  // Put all commas back where they should be
  subjectList.forEach(item => {
    const newString = item.replace(/\/,/g, ',');
    newList.push(newString);
  });

  return newList;
}
