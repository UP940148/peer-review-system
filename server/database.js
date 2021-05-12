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
