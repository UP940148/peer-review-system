const database = require('sqlite-async');
const DBSOURCE = 'sqlite.db';

let db;
database.open(DBSOURCE)
  .then(_db => {
    db = _db;
    console.log('Successfully connected to SQLite database!');
  })
  .catch(err => {
    console.log('Error connecting to database:', err);
  });

// ADMIN FUNCTIONS

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
  const sql = `SELECT * FROM ${tableName} WHERE ${tableName}Id = ${pKeyValue};`;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
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
    .then((record) => {
      return { failed: false, context: { id: record.lastID } };
    })
    .catch(err => {
      return { failed: true, context: err.message };
    });
  return response;
};
