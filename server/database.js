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

exports.checkRegistration = async function (cohortId, userId) {
  const sql = `
    SELECT
      registrationId
    FROM registration
    WHERE cohortId = ?
    AND userId = ?
    ;`;
    console.log(sql);
    console.log([cohortId, userId]);
  const response = await db.get(sql, [cohortId, userId])
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};
