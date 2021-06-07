const path = require('path');
exports.root = __dirname;
exports.www = path.join(__dirname, '/www/');
exports.files = path.join(__dirname, '/server/saved/');
exports.uploadPath = '/server/uploads/';
exports.uploads = path.join(__dirname, exports.uploadPath);

// Setting relative path variables allows redundant files to be deleted, even if whole system changes directory
exports.docPath = '/server/saved/docs/';
exports.docStore = __dirname + exports.docPath;
exports.imagePath = '/server/saved/img/';
exports.imageStore = __dirname + exports.imagePath;

exports.redundants = module.exports.files + 'redundants.txt';

exports.PORT = 8080;

exports.CLIENT_ID = '708615793330-085t8nucql4ft884ld0e35j8i29fl8ek.apps.googleusercontent.com';
