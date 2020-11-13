const database = require('sqlite-async');
const DBSOURCE = 'sqlite.db';

let db;
database.open(DBSOURCE)
  .then(_db => {
    db = _db;
    // Connection established. Create tables
    console.log('Connection to SQLite database has been established!');
    db.run(`CREATE TABLE IF NOT EXISTS user (
      googleId PRIMARY KEY NOT NULL,
      name text NOT NULL,
      displayName text,
      profilePicture text,
      email text UNIQUE NOT NULL
      );`)
      .then(() => {
      // Table established
      console.log('Established user table');
    })
      .catch(err => {
      console.log(err.message);
    })

    db.run(`CREATE TABLE IF NOT EXISTS document (
      documentId INTEGER PRIMARY KEY AUTOINCREMENT,
      title text NOT NULL,
      author references user(googleId) NOT NULL,
      file text NOT NULL,
      timeCreated integer NOT NULL,
      lastEditted integer
      );`)
      .then(() => {
        // Table established
        console.log('Established document table');
      })
      .catch(err => {
        console.log(err.message);
      })

    db.run(`CREATE TABLE IF NOT EXISTS reply (
      replyId INTEGER PRIMARY KEY AUTOINCREMENT,
      document references document(documentId) NOT NULL,
      content text NOT NULL,
      parentReply references replies(replyId),
      author references user(googleId) NOT NULL,
      timeCreated integer NOT NULL
      );`)
      .then(() => {
        // Table established
        console.log('Established replies table');
      })
      .catch(err => {
        console.log(err.message);
      })
  })
  .catch(err => {
    // Can't open database
    console.log(err.message);
    throw err;
  })

async function addUser(values) {
  const sql = 'INSERT INTO user (googleId, name, displayName, profilePicture, email) VALUES (?, ?, ?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
      return null;
    })
    .catch(err => {
      return err;
    })
  return response;
};

async function addDoc(values) {
  const sql = 'INSERT INTO document (title, author, file, timeCreated, lastEditted) VALUES (?, ?, ?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
      })
    .catch(err => {
      return err;
    })
  return response;
}

async function addReply(values) {
  const sql = 'INSERT INTO reply (document, content, parentReply, author, timeCreated) VALUES (?, ?, ?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
      })
    .catch(err => {
      return err;
    })
  return response;
}

async function getUserById(userId) {
  // Get user information from the database using their Google ID as a selector
  let sql = `SELECT * FROM user WHERE googleId = ${userId};`;
  let response = await db.get(sql)
    .then(row => {
      return {failed: false, context: row};
    })
    .catch(err => {
      return {failed: true, context: err};
    })
  return response;
}

module.exports.addUser = addUser;
module.exports.getUserById = getUserById;
