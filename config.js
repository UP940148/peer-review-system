const path = require('path');
module.exports.www = path.join(__dirname, '/www/');
module.exports.files = path.join(__dirname, '/server/saved/');
module.exports.uploads = path.join(__dirname, '/server/uploads/');

module.exports.docStore = module.exports.files + '/docs/';
module.exports.imageStore = module.exports.files + '/img/';
module.exports.replyStore = module.exports.files + '/replies/';

module.exports.PORT = 8080;

module.exports.CLIENT_ID = '708615793330-085t8nucql4ft884ld0e35j8i29fl8ek.apps.googleusercontent.com';
