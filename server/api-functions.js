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


exports.createNewUser = async function (req, res) {
  const data = [req.body.userId, req.body.username, req.body.name, req.body.email, req.body.picture, req.body.savedQuestions];
  const response = await db.createUser(data);
  if (response.failed) {
    // If an error occured: Output to console for debugging
    console.log('ERR OUTPUT "database.createUser:"');
    console.log(req.body);
    console.log(response.context);
    res.sendStatus(500);
  } else {
    res.sendStatus(201);
  }
};

exports.createNewCohort = async function (req, res) {
  const data = [req.body.name, req.body.description, req.body.isPrivate];
  const response = await db.createCohort(data);
  if (response.failed) {
    // If an error occured: Output to console for debugging
    console.log('ERR OUTPUT "database.createCohort:"');
    console.log(req.body);
    console.log(response.context);
    res.sendStatus(500);
  } else {
    res.sendStatus(201);
  }
};
