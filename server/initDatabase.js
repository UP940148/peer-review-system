const database = require('sqlite-async');
const DBSOURCE = 'sqlite.db';
let success = true;
let db;


const groupTopics = [
  'portsoc',
  'computing',
  'maths',
  'literacy',
  'science',
  'physics',
  'chemistry',
  'biology',
  'psychology',
  'politics',
  'history',
  'geography',
  'art',
  'photography',
  'religious education',
  'PE',
  'music',
  'French',
  'Spanish',
  'German',
];

createDatabase();

async function createDatabase() {
  await database.open(DBSOURCE)
    .then(async _db => {
      db = _db;
      // Connection established. Create tables
      console.log('SQLite database has been established!\n');

      // Create user table
      await db.run(`
        CREATE TABLE IF NOT EXISTS user (
          userId PRIMARY KEY NOT NULL,
          username text UNIQUE NOT NULL,
          name text NOT NULL,
          email text UNIQUE NOT NULL,
          picture text,
          savedQuestions text
        );
      `)
        .then(() => {
          // Table created
          console.log('User table created!');
        })
        .catch(err => {
          console.log('Error creating user table:', err.message);
          success = false;
        });

      // Create cohort table
      await db.run(`
        CREATE TABLE IF NOT EXISTS cohort (
          cohortId integer PRIMARY KEY AUTOINCREMENT,
          name text NOT NULL,
          description text,
          isPrivate integer NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Cohort table created!');
        })
        .catch(err => {
          console.log('Error creating cohort table:', err.message);
          success = false;
        });

      // Create registration table
      await db.run(`
        CREATE TABLE IF NOT EXISTS registration (
          registrationId integer PRIMARY KEY AUTOINCREMENT,
          cohortId references cohort(cohortId) NOT NULL,
          userId references user(userId) NOT NULL,
          rank text NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Registration table created!');
        })
        .catch(err => {
          console.log('Error creating registration table:', err.message);
          success = false;
        });

      // Create invite table
      await db.run(`
        CREATE TABLE IF NOT EXISTS invite (
          inviteId integer PRIMARY KEY AUTOINCREMENT,
          cohortId references cohort(cohortId) NOT NULL,
          userId references user(userId) NOT NULL,
          message text NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Invite table created!');
        })
        .catch(err => {
          console.log('Error creating invite table:', err.message);
          success = false;
        });

      // Create request table
      await db.run(`
        CREATE TABLE IF NOT EXISTS request (
          requestId integer PRIMARY KEY AUTOINCREMENT,
          cohortId references cohort(cohortId) NOT NULL,
          userId references user(userId) NOT NULL,
          message text NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Request table created!');
        })
        .catch(err => {
          console.log('Error creating request table:', err.message);
          success = false;
        });

      // Create question table
      await db.run(`
        CREATE TABLE IF NOT EXISTS question (
          questionId integer PRIMARY KEY AUTOINCREMENT,
          questionContent text NOT NULL,
          type text NOT NULL,
          answers text
        );
      `)
        .then(() => {
          // Table created
          console.log('Question table created!');
        })
        .catch(err => {
          console.log('Error creating question table:', err.message);
          success = false;
        });

      // Create criteria table
      await db.run(`
        CREATE TABLE IF NOT EXISTS criteria (
          criteriaId integer PRIMARY KEY AUTOINCREMENT,
          questions text
        );
      `)
        .then(() => {
          // Table created
          console.log('Criteria table created!');
        })
        .catch(err => {
          console.log('Error creating criteria table:', err.message);
          success = false;
        });

      // Create response table
      await db.run(`
        CREATE TABLE IF NOT EXISTS response (
          responseId integer PRIMARY KEY AUTOINCREMENT,
          userId references user(userId) NOT NULL,
          questionId references question(questionId) NOT NULL,
          answer text NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Response table created!');
        })
        .catch(err => {
          console.log('Error creating response table:', err.message);
          success = false;
        });

      // Create post table
      await db.run(`
        CREATE TABLE IF NOT EXISTS post (
          postId integer PRIMARY KEY AUTOINCREMENT,
          registrationId references registration(registrationId) NOT NULL,
          criteriaId references criteria(criteriaId) NOT NULL,
          title text NOT NULL,
          description text NOT NULL,
          files text,
          timeCreated integer NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Post table created!');
        })
        .catch(err => {
          console.log('Error creating post table:', err.message);
          success = false;
        });

      // Create assignment table
      await db.run(`
        CREATE TABLE IF NOT EXISTS assignment (
          assignmentId integer PRIMARY KEY AUTOINCREMENT,
          cohortId references cohort(cohortId) NOT NULL,
          criteriaId references criteria(criteriaId) NOT NULL,
          title text NOT NULL,
          description text NOT NULL,
          resources text,
          due integer NOT NULL
        );
      `)
        .then(() => {
          // Table created
          console.log('Assignment table created!');
        })
        .catch(err => {
          console.log('Error creating assignment table:', err.message);
          success = false;
        });

      // Create submission table
      await db.run(`
        CREATE TABLE IF NOT EXISTS submission (
          submissionId integer PRIMARY KEY AUTOINCREMENT,
          assignmentId references assignment(assignmentId) NOT NULL,
          userId references user(userId) NOT NULL,
          files text,
          userComment text,
          status text,
          score text,
          feedback text
        );
      `)
        .then(() => {
          // Table created
          console.log('Submission table created!');
        })
        .catch(err => {
          console.log('Error creating submission table:', err.message);
          success = false;
        });

      console.log();

      const sql = 'INSERT INTO cohort (name, description, isPrivate) VALUES (?, ?, ?);';
      
/*
      // Insert feedback group
      await db.run(sql, ['Feedback', 'Please post any feedback/issues in this group', 0])
        .then(() => {
          console.log('Feedback group created!');
        })
        .catch(err => {
          console.log('Error creating Feedback group:', err.message);
          success = false;
        });
*/

      // Insert general group
      await db.run(sql, ['General', 'General group for all work and topics', 0])
        .then(() => {
          console.log('General group created!');
        })
        .catch(err => {
          console.log('Error creating General group:', err.message);
          success = false;
        });


      // Set up initial groups
      // Cycle through group topics and create entry for each
      for (let i = 0; i < groupTopics.length; i++) {
        await insertPublicGroup(groupTopics[i]);
      }

      // If one or more tables failed to create, notify
      if (success) {
        console.log('\nDatabase initialised. Ready to start...');
      } else {
        console.log('\n\nErr: One or more tables could not be established');
        console.log('\n    (╯°□°)╯ ┻━┻');
        console.log('"This never happened during production and testing, so I don\'t know how this happened" ~UP940148\n');
      }
    })
    .catch(err => {
      console.log('Error initialising database:', err);
    });
}


async function insertPublicGroup(topic) {
  // Add group to database
  const sql = 'INSERT INTO cohort (name, description, isPrivate) VALUES (?, ?, ?);';

  const capitalisedTopic = capitalise(topic);
  // Insert group
  await db.run(sql, [capitalisedTopic, `General group for ${topic} related work and topics`, 0])
    .then(() => {
      console.log(`${capitalisedTopic} group created!`);
    })
    .catch(err => {
      console.log(`Error creating ${capitalisedTopic} group:`, err.message);
      success = false;
    });
}

function capitalise(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
