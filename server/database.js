const database = require('sqlite-async');
const DBSOURCE = 'sqlite.db';

let db;
database.open(DBSOURCE)
  .then(async _db => {
    db = _db;
    // Connection established. Create tables
    console.log('Connection to SQLite database has been established!');
    await db.run(`CREATE TABLE IF NOT EXISTS user (
      googleId PRIMARY KEY NOT NULL,
      name text NOT NULL,
      displayName text UNIQUE,
      profilePicture text,
      email text UNIQUE NOT NULL
      );`)
      .then(() => {
        // Table established
        console.log('Established user table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS groups (
        groupId INTEGER PRIMARY KEY AUTOINCREMENT,
        groupName text UNIQUE NOT NULL,
        groupPicture text,
        groupDescription text,
        isPrivate integer NOT NULL
        );`)
      .then(() => {
        // Table established
        console.log('Established group table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS post (
        postId INTEGER PRIMARY KEY AUTOINCREMENT,
        author references user(googleId) NOT NULL,
        groupId references groups(groupId),
        title text NOT NULL,
        caption text NOT NULL,
        files text,
        timeCreated integer NOT NULL
        );`)
      .then(() => {
        // Table established
        console.log('Established post table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS rank (
        rankId INTEGER PRIMARY KEY AUTOINCREMENT,
        groupId references groups(groupId),
        rankName text NOT NULL,
        level integer NOT NULL,
        colour text,
        canPost integer NOT NULL,
        canReply integer NOT NULL,
        canRemove integer NOT NULL,
        canBan integer NOT NULL
        );`)
      .then(() => {
        // Table established
        console.log('Established rank table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS registration (
        registrationId INTEGER PRIMARY KEY AUTOINCREMENT,
        userId references user(googleId),
        groupId references groups(groupId),
        rankId references rank(rankId)
        );`)
      .then(() => {
        // Table established
        console.log('Established registration table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS reply (
      replyId INTEGER PRIMARY KEY AUTOINCREMENT,
      author references user(googleId) NOT NULL,
      postId references post(postId) NOT NULL,
      parentReply references reply(replyId),
      content text NOT NULL,
      timeCreated integer NOT NULL
      );`)
      .then(() => {
        // Table established
        console.log('Established reply table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`CREATE TABLE IF NOT EXISTS grievance (
        grievanceId INTEGER PRIMARY KEY AUTOINCREMENT,
        prosecutorId references user(googleId),
        defendantId references user(googleId),
        documentId references share(shareId),
        replyId references reply(replyId),
        content text
        );`)
      .then(() => {
        // Table established
        console.log('Established grievance table');
      })
      .catch(err => {
        console.log(err.message);
      });

    await db.run(`
        INSERT INTO groups
        (groupName, isPrivate)
        VALUES ('Public', 0);`)
      .then(async () => {
        console.log('Created public group');
        await db.run(`
          INSERT INTO rank
          (groupId, rankName, level, colour, canPost, canReply, canRemove, canBan)
          VALUES (1, 'Administrator', 0, '#ff0000', 1, 1, 1, 1);`)
          .then(() => {
            console.log('Created public admin rank');
          })
          .catch((err) => {
            console.log(err.message);
          });

        await db.run(`
          INSERT INTO rank
          (groupId, rankName, level, canPost, canReply, canRemove, canBan)
          VALUES (1, 'Member', 1, 1, 1, 0, 0);`)
          .then(() => {
            console.log('Created public member rank');
          })
          .catch((err) => {
            console.log(err.message);
          });
      })
      .catch(() => {});
  })
  .catch(err => {
    // Can't open database
    console.log(err.message);
    throw err;
  });


// ADMIN Functions
exports.getAllUsers = async function () {
  const sql = 'SELECT * FROM user;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getAllGroups = async function () {
  const sql = 'SELECT * FROM groups;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getAllRanks = async function () {
  const sql = 'SELECT * FROM rank;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getAllRegistrations = async function () {
  const sql = 'SELECT * FROM registration;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getAllPosts = async function () {
  const sql = 'SELECT * FROM post;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getAllReplies = async function () {
  const sql = 'SELECT * FROM reply;';
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

// User Table Functions

exports.getOwnProfile = async function (userId) {
  // Get private user information from the database using their Google ID as a selector
  const sql = `SELECT * FROM user WHERE googleId = "${userId}";`;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getOtherProfile = async function (userId) {
  // Get public user information from the database using their Google ID as a selector
  const sql = `SELECT name, displayName FROM user WHERE googleId = "${userId}";`;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getProfilePic = async function (userId) {
  const sql = `SELECT profilePicture FROM user WHERE googleId = "${userId}";`;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.updateProfilePic = async function (values) {
  const sql = 'UPDATE user SET profilePicture = ? WHERE googleId = ?;';
  await db.run(sql, values);
};

exports.deleteProfilePicture = async function (userId) {
  const sql = `UPDATE user SET profilePicture = '' WHERE googleId = "${userId}"`;
  await db.run(sql);
};

exports.updateProfile = async function (values) {
  const sql = `
  UPDATE user
  SET
    name = ?,
    displayName = ?
  WHERE
    googleId = ?
  ;`;
  await db.run(sql, values);
};

exports.addUser = async function (values) {
  // Insert new record into User Table
  const sql = 'INSERT INTO user (googleId, name, displayName, profilePicture, email) VALUES (?, ?, ?, ?, ?)';
  await db.run(sql, values);
};

exports.deleteUser = async function (userId) {
  // Delete user record based on their Google ID
  const sql = `DELETE FROM user WHERE googleId = "${userId}"`;
  await db.run(sql);
};

// Groups Table Functions

exports.addGroup = async function (values) {
  const sql = 'INSERT INTO groups (groupName, isPrivate) VALUES (?, ?);';
  const data = await db.run(sql, values);
  // Return groupId for later use
  return data.lastID;
};

// Registration Table Functions

exports.addRegistration = async function (values) {
  const sql = 'INSERT INTO registration (userId, groupId, rankId) VALUES (?, ?, ?);';
  await db.run(sql, values);
};

// Rank Table Functions

exports.addRank = async function (values) {
  const sql = 'INSERT INTO rank (groupId, rankName, level, colour, canPost, canReply, canRemove, canBan) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
  const data = await db.run(sql, values);
  // Return rankId for later use
  return data.lastID;
};

// Post Table Functions

exports.addPost = async function (values) {
  const sql = 'INSERT INTO post (author, groupId, title, caption, files, timeCreated) VALUES (?, ?, ?, ?, ?, ?);';
  await db.run(sql, values);
};

exports.getPost = async function (values) {
  // This SQL is very gross
  // It retrieves the post if the post is public,
  // or if the user is registered with the private group it's posted in
  const sql = `
  SELECT
    post.postId,
    post.groupId,
    post.title,
    post.caption,
    post.author,
    post.files,
    post.timeCreated,
    author.displayName,
    groups.groupName as "group"
  FROM post
  INNER JOIN user as author
    ON author.googleId = post.author
  INNER JOIN groups
    ON groups.groupId = post.groupId
  INNER JOIN registration
    ON registration.groupId = groups.groupId
  INNER JOIN user
    ON user.googleId = registration.userId
  WHERE post.postId = ?
    AND (groups.isPrivate = 0 OR user.googleId = ?);
  `;
  const response = await db.get(sql, values)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getNextPosts = async function (values) {
  const sql = `
  SELECT DISTINCT
    post.postId as id,
    post.groupId as groupId,
    post.title as title,
    post.caption,
    post.author as authorId,
    post.files as files,
    post.timeCreated as timeCreated,
    author.displayName as author,
    groups.groupName as "group"
  FROM post
  INNER JOIN user as author
    ON author.googleId = post.author
  INNER JOIN groups
    ON groups.groupId = post.groupId
  INNER JOIN registration
    ON registration.groupId = groups.groupId
  INNER JOIN user
    ON user.googleId = registration.userId
  WHERE (groups.isPrivate = 0 OR user.googleId = ?)
  ORDER BY post.timeCreated DESC
  LIMIT 10
  OFFSET ?;
  `;
  const response = await db.all(sql, values)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.deletePost = async function (postId) {
  // Delete all comments made on the post
  let sql = `DELETE FROM reply WHERE postId = "${postId}";`;
  await db.run(sql);
  // Delete post
  sql = `DELETE FROM post WHERE postId = "${postId}";`;
  await db.run(sql);
};

// Replies Functions

exports.addReply = async function (values) {
  const sql = 'INSERT INTO reply (author, postId, parentReply, content, timeCreated) VALUES (?, ?, ?, ?, ?);';
  await db.run(sql, values);
};

exports.getPrimaryComments = async function (postId) {
  const sql = `
  SELECT
    reply.replyId,
    reply.author,
    reply.content,
    reply.timeCreated,
    author.displayName as displayName
  FROM reply
  INNER JOIN user as author
    ON author.googleId = reply.author
  WHERE reply.postId = ${postId}
  ORDER BY
    reply.parentReply ASC,
    reply.timeCreated DESC;
  `;
  const response = await db.all(sql)
    .then(rows => {
      return { failed: false, context: rows };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

exports.getReplyPost = async function (replyId) {
  const sql = `
  SELECT postId
  FROM reply
  WHERE replyId = "${replyId}";
  `;
  const response = await db.get(sql)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  return response;
};

// Misc Functions

exports.isPostAuthor = async function (values) {
  const sql = `
  SELECT 1
  FROM post
  WHERE postId = ?
  AND author = ?;`;
  const response = await db.get(sql, values)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  if (!response.failed && response.context) {
    return true;
  }
  return false;
};

exports.canUserViewPost = async function (values) {
  const sql = `
  SELECT 1
  FROM post
  INNER JOIN groups
    ON groups.groupId = post.groupId
  INNER JOIN registration
    ON registration.groupId = groups.groupId
  INNER JOIN user
    ON user.googleId = registration.userId
  WHERE post.postId = ?
    AND (groups.isPrivate = 0 OR user.googleId = ?);
  `;
  const response = await db.get(sql, values)
    .then(row => {
      return { failed: false, context: row };
    })
    .catch(err => {
      return { failed: true, context: err };
    });
  if (!response.failed && response.context) {
    return true;
  }
  return false;
};
// CREATE
/*
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

async function addRegistration(values) {
  const sql = 'INSERT INTO registration (groupId, userId, rankId) VALUES (?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
    })
    .catch(err => {
        return err;
    })
  return response;
}

async function addGrievance(values) {
  const sql = 'INSERT INTO grievance (prosecutorId, defendantId, documentId, replyId, content) VALUES (?, ?, ?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
    })
    .catch(err => {
        return err;
    })
  return response;
}

async function addShare(values) {
  const sql = 'INSERT INTO share (documentId, groupId) VALUES (?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
    })
    .catch(err => {
        return err;
    })
  return response;
}

async function addGroup(values, admin) {
  const sql = 'INSERT INTO groups (groupName, groupPicture, groupDescription) VALUES (?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
    })
    .catch(err => {
        return err;
    })

  // Once a group is created, the creator needs the rank of owner
  const id = await db.get('SELECT last_insert_rowid() as rowid;')
    .then(row => {
      return row.rowid;
    });
  const groupId = await db.get('SELECT groupId from groups where rowid = ?', id)
    .then(row => {
      return row.groupId;
    });

  const data = [groupId, 'Owner', 0, null, 1, 1, 1, 1];
  let rankResponse = await addRank(data)
    .then(() => {
      return null;
    })
    .catch(err => {
      return err;
    })

  if (rankResponse) {
    console.log(rankResponse);
    return rankResponse;
  }
  return response;
}

async function addRank(values) {
  const sql = 'INSERT INTO rank (groupId, rankName, level, colour, canPost, canReply, canRemove, canBan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  let response = await db.run(sql, values)
    .then(() => {
        return null;
    })
    .catch(err => {
        return err;
    })
  return response;
}

// RETRIEVE


async function getUserById(userId) {
  // Get user information from the database using their Google ID as a selector
  let sql = `SELECT * FROM user WHERE googleId = "${userId}";`;
  let response = await db.get(sql)
    .then(row => {
      return {failed: false, context: row};
    })
    .catch(err => {
      return {failed: true, context: err};
    })
  return response;
}

async function getViewableDocs(userId) {
  // I just know this SQL is gonna be disgusting and I haven't written it yet
  let sql = `
  SELECT *
  FROM document
  INNER JOIN share ON share.documentId = document.documentId
  INNER JOIN groups ON groups.groupId = share.groupId
  INNER JOIN registration ON registration.groupId = groups.groupId
  INNER JOIN user ON user.googleId = registration.userId
  WHERE user.googleId = ${userId};`;
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
module.exports.addDoc = addDoc;
module.exports.addReply = addReply;
module.exports.addRegistration = addRegistration;
module.exports.addGrievance = addGrievance;
module.exports.addShare = addShare;
module.exports.addGroup = addGroup;
module.exports.addRank = addRank;
module.exports.getUserById = getUserById;
module.exports.getViewableDocs = getViewableDocs;
*/
