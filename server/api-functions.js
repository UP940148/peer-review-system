const config = require('../config');
const db = require('./database.js');

// ADMIN FUNCTIONS

exports.getAllInTable = async function (req, res) {
  const response = await db.getAllInTable(req.params.table);
  if (response.failed) {
    console.log(response.context);
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
    console.log(httpCode + ':', response.context);
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
    // If an error occured: Output to console for debugging
    console.log('\nERR OUTPUT "database.createUser:"');
    console.log(req.user);
    console.log(response.context);
    console.log();
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
    // If an error occured: Output to console for debugging
    console.log('\nERR OUTPUT "database.createCohort:"');
    console.log(req.body);
    console.log(response.context);
    console.log();
    res.sendStatus(500);
    return;
  }
  // Add current user to cohort registration
  const registration = await insertRegistration(req.user.id, response.context.id, 'owner');
  if (registration.failed) {
    // If an error occured: Output to console for debugging
    console.log('\nERR OUTPUT "database.createRegistration:"');
    console.log('User:\n', req.user);
    console.log('Cohort ID:', response.context.id);
    console.log(registration.context);
    console.log();
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
    // If an error occured: Output to console for debugging
    console.log('\nERR OUTPUT "database.getUserCohorts:"');
    console.log(req.user);
    console.log(response.context);
    console.log();
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
    console.log(response);
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
  console.log(registrationResponse);
  // If user not registered, return 404
  if (!registrationResponse.context) {
    console.log('Not registered');
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
      console.log(decline.context);
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
    console.log(register.context);
    res.sendStatus(500);
    return;
  }

  // If accepted, delete invite record
  const decline = await db.deleteInvite(inviteId);
  // If something went wrong, return 500
  if (decline.failed) {
    console.log(decline.context);
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
    console.log(decline.context);
    res.sendStatus(500);
    return;
  }
  // If success, return 200
  res.sendStatus(200);
};
