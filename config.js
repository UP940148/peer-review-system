const path = require('path');
exports.www = path.join(__dirname, '/www/');
exports.files = path.join(__dirname, '/server/saved/');
exports.uploads = path.join(__dirname, '/server/uploads/');

exports.docStore = module.exports.files + 'docs/';
exports.imageStore = module.exports.files + 'img/';
exports.replyStore = module.exports.files + 'replies/';

exports.PORT = 8080;

exports.CLIENT_ID = '708615793330-085t8nucql4ft884ld0e35j8i29fl8ek.apps.googleusercontent.com';

// Test Comment
