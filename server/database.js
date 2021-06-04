const database = require('sqlite-async');
const DBSOURCE = 'sqlite.db';
const tableNames = ['request', 'user', 'invite', 'registration', 'cohort', 'assignment', 'post', 'criteria', 'submission', 'response', 'question'];

let db;
database.open(DBSOURCE)
  .then(_db => {
    db = _db;
    console.log('Successfully connected to SQLite database!');
  })
  .catch(err => {
    console.log('Error connecting to database:', err);
  });

// ADMIN FUNCTION/S
/* UP940148 Creds */
// Retrieve all records from a given table
exports.getAllInTable = async function (tableName) {
  const sql = `SELECT * FROM ${tableName};`;
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

// GENERAL QUERIES

// Count how many records exist in table
exports.recordCount = async function (tableName) {
  if (!tableNames.includes(tableName)) {
    return { failed: true, code: 404, context: `Bad data: tableName = ${tableName}` };
  }
  const sql = `SELECT COUNT(*) as total FROM ${tableName};`;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, code: 500, context: err };
    });
  return response;
};

// Retrieve single record with a given primary key value from a given table
exports.getRecordByPrimaryKey = async function (tableName, pKeyValue) {
  if (!tableNames.includes(tableName)) {
    return { failed: true, code: 404, context: `Bad data: tableName = ${tableName}` };
  }
  const sql = `SELECT * FROM ${tableName} WHERE ${tableName}Id = ?;`;
  const response = await db.get(sql, [pKeyValue])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, code: 500, context: err };
    });
  return response;
};

// Create Queries
exports.createUser = async function (data) {
  const sql = 'INSERT INTO user (userId, username, name, email, picture, savedQuestions) VALUES (?, ?, ?, ?, ?, ?);';
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.checkUsername = async function (username) {
  const sql = 'SELECT COUNT(*) as total FROM user WHERE username = ?';
  const response = await db.get(sql, [username])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.createCohort = async function (data) {
  const sql = 'INSERT INTO cohort (name, description, isPrivate) VALUES (?, ?, ?);';
  const response = await db.run(sql, data)
    .then(details => {
      return { failed: false, context: { id: details.lastID } };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.createRegistration = async function (data) {
  const sql = 'INSERT INTO registration (userId, cohortId, rank) VALUES (?, ?, ?);';
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.createInvite = async function (data) {
  const sql = 'INSERT INTO invite (cohortId, userId, message) VALUES (?, ?, ?);';
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

// Retrieve all cohorts that user is registered in
exports.getUserCohorts = async function (userId) {
  const sql = `
    SELECT
      cohort.cohortId,
      cohort.name,
      cohort.description,
      cohort.isPrivate,
      registration.rank
    FROM cohort
    INNER JOIN registration
      ON cohort.cohortId = registration.cohortId
    WHERE registration.userId = ?
    ;`;
  const response = await db.all(sql, [userId])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getUserPosts = async function (userId) {
  const sql = `
    SELECT *
    FROM post
    INNER JOIN registration
      ON post.registrationId = registration.registrationId
    WHERE registration.userId = ?
  ;`;
  const response = await db.all(sql, [userId])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.checkRegistration = async function (cohortId, userId) {
  const sql = `
    SELECT
      registrationId,
      rank
    FROM registration
    WHERE cohortId = ?
    AND userId = ?
    ;`;
  const response = await db.get(sql, [cohortId, userId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.checkInvite = async function (cohortId, userId) {
  const sql = `
    SELECT
      inviteId
    FROM invite
    WHERE cohortId = ?
    AND userId = ?
    ;`;
  const response = await db.get(sql, [cohortId, userId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getPublicCohort = async function (cohortId) {
  const sql = 'SELECT * FROM cohort WHERE cohortId = ? AND isPrivate = 0';
  const response = await db.get(sql, [cohortId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.updateCohort = async function (data) {
  const sql = `
    UPDATE cohort
    SET
      name = ?,
      description = ?,
      isPrivate = ?
    WHERE cohortId = ?;`;
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.getUserInvites = async function (userId) {
  const sql = `
    SELECT
      invite.inviteId,
      invite.message,
      cohort.name,
      cohort.description
    FROM invite
    INNER JOIN cohort
      ON invite.cohortId = cohort.cohortId
    WHERE invite.userId = ?
    ORDER BY invite.inviteId DESC
    ;`;
  const response = await db.all(sql, [userId])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.deleteInvite = async function (inviteId) {
  const sql = 'DELETE FROM invite WHERE inviteId = ?;';
  const response = await db.run(sql, [inviteId])
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.getCohortPosts = async function (cohortId) {
  const sql = `
    SELECT
      post.postId,
      post.criteriaId,
      post.title,
      post.description,
      post.files,
      post.timeCreated,
      user.username,
      user.picture
    FROM post
    INNER JOIN registration
      ON post.registrationId = registration.registrationId
    INNER JOIN user
      ON registration.userId = user.userId
    WHERE registration.cohortId = ?
    ORDER BY post.timeCreated DESC;
  `;
  const response = await db.all(sql, [cohortId])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.createPost = async function (data) {
  const sql = 'INSERT INTO post (registrationId, criteriaId, title, description, files, timeCreated) VALUES (?, ?, ?, ?, ?, ?);';
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.createQuestion = async function (data) {
  const sql = 'INSERT INTO question (questionContent, type, answers) VALUES (?, ?, ?);';
  const response = await db.run(sql, data)
    .then(details => {
      return { failed: false, context: { id: details.lastID } };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.createCriteria = async function (questions) {
  const sql = 'INSERT INTO criteria (questions) VALUES (?);';
  const response = await db.run(sql, questions)
    .then(details => {
      return { failed: false, context: { id: details.lastID } };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.getPost = async function (postId) {
  const sql = `
  SELECT
    postId,
    criteriaId,
    title,
    description,
    files,
    timeCreated,
    registration.cohortId,
    registration.userId,
    user.username,
    user.picture
  FROM post
  INNER JOIN registration
    ON post.registrationId = registration.registrationId
  INNER JOIN user
    ON registration.userId = user.userId
  WHERE postId = ?;
  `;
  const response = await db.get(sql, [postId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getUserResponse = async function (userId, questionId) {
  const sql = `
  SELECT
    responseId
  FROM response
  WHERE userId = ?
  AND questionId = ?
  ;`;
  const response = await db.get(sql, [userId, questionId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.updateResponse = async function (responseId, answer) {
  const sql = `
  UPDATE response
  SET
    answer = ?
  WHERE responseId = ?
  ;`;
  const response = await db.run(sql, [answer, responseId])
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.createResponse = async function (data) {
  const sql = 'INSERT INTO response (userId, questionId, answer) VALUES (?, ?, ?);';
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.getAllResponses = async function (questionId) {
  const sql = 'SELECT * FROM response WHERE questionId = ?;';
  const response = await db.all(sql, [questionId])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getCheckboxResponseCount = async function (data) {
  const sql = `
    SELECT
      COUNT(responseId) as total
    FROM response
    WHERE questionId = ?
    AND
    (
      answer LIKE ? -- Starts with expression
      OR answer LIKE ? -- Contains expression
      OR answer LIKE ? -- Ends with expression
      OR answer = ? -- Is equal to expression
    )
  ;`;
  const response = await db.get(sql, data)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getRadioResponseCount = async function (questionId, answer) {
  const sql = `
    SELECT
      COUNT(responseId) as total
    FROM response
    WHERE questionId = ?
    AND answer = ?
  ;`;
  const response = await db.get(sql, [questionId, answer])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.deletePost = async function (postId) {
  const sql = 'DELETE FROM post WHERE postId = ?;';
  const response = await db.get(sql, [postId])
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.deleteCriteria = async function (criteriaId) {
  const sql = 'DELETE FROM criteria WHERE criteriaId = ?;';
  const response = await db.get(sql, [criteriaId])
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.deleteQuestion = async function (questionId) {
  const sql = `
    DELETE FROM response WHERE questionId = ?;
    DELETE FROM question WHERE questionId = ?;
  `;
  const response = await db.get(sql, [questionId, questionId])
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.updateUser = async function (data) {
  const sql = `
    UPDATE
      user
    SET
      username = ?,
      name = ?
    WHERE userId = ?
  ;`;
  const response = await db.run(sql, data)
    .then(() => {
      return { failed: false, context: null };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};

exports.searchInviteableUsers = async function (query, cohortId) {
  const sql = `
    SELECT DISTINCT
      user.userId,
      user.username,
      user.picture,
      (
        SELECT
          COUNT(*)
        FROM registration
        WHERE registration.userId = user.userId
        AND registration.cohortId = ?
      ) AS registrationCount,
      (
        SELECT
          COUNT(*)
        FROM invite
        WHERE invite.userId = user.userId
        AND invite.cohortId = ?
      ) AS inviteCount
    FROM user
    WHERE
    (
      username LIKE ?
      OR email LIKE ?
    )
    AND registrationCount = 0 -- Don't return if user already registered
    AND inviteCount = 0 -- Don't return if user has pending invite
    ORDER BY username
    LIMIT 10
  ;`;
  const response = await db.all(sql, [cohortId, cohortId, query, query])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.searchCohorts = async function (query, userId) {
  const sql = `
    SELECT DISTINCT
      cohort.cohortId,
      cohort.name,
      cohort.description,
      (
        SELECT
          COUNT(*)
        FROM registration
        WHERE registration.cohortId = cohort.cohortId
        AND registration.userId = ?
      ) AS registrationCount
    FROM cohort
    WHERE cohort.name LIKE ?
    AND cohort.isPrivate = 0
    AND registrationCount = 0 -- Don't return if already registered
    ORDER BY cohort.name
  ;`;
  const response = await db.all(sql, [userId, query])
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

/*
exports.checkInvite = async function (cohortId, inviteId) {
  const sql = 'SELECT inviteId FROM invite WHERE cohortId = ? AND inviteId = ?;';
  const response = await db.get(sql, [cohortId, inviteId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};
*/
