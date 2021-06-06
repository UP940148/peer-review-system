const config = require('../config.js');
const fs = require('fs');
const { promisify } = require('util');
const renameAsync = promisify(fs.rename);

async function swapDB() {
  const storedDBName = '/backup/db.sqlite';
  const currentDBName = '/sqlite.db';
  const tempDBName = '/backup/sqlite.db';

  // Check if secondary database exists in storage
  fs.access(config.root + storedDBName, fs.F_OK, (err) => {
    if (err) {
      console.log(err);
      return false;
    }
    return true;
  });

  // Check if primary database exists
  fs.access(config.root + currentDBName, fs.F_OK, (err) => {
    if (err) {
      console.log(err);
      return false;
    }
  });

  let failed;

  // Move primary database to backup dir
  failed = await renameAsync(config.root + currentDBName, config.root + tempDBName);
  if (failed) {
    console.log(failed);
    return false;
  }

  // Move secondary database to root
  failed = await renameAsync(config.root + storedDBName, config.root + currentDBName);
  if (failed) {
    console.log(failed);
    return false;
  }

  // Rename primary database to correct name
  failed = await renameAsync(config.root + tempDBName, config.root + storedDBName);
  if (failed) {
    console.log(failed);
    return false;
  }

  return true;
}

async function init() {
  const success = await swapDB();
  if (success) {
    console.log('Swap successful!');
  } else {
    console.log('Something went wrong! see outputs above');
    console.log();
    console.log('For marking: If testing database lost, a backup version of it is stored at', config.root + '/backup/backup.db');
    console.log("Move backup version to root and rename it 'sqlite.db' then run as normal");
  }
}

init();
