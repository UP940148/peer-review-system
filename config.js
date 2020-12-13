const path = require('path');
module.exports.www = path.join(__dirname, '/www/');
module.exports.uploads = path.join(__dirname, '/server/uploads/');
module.exports.docStore = module.exports.www + '/docs/';
module.exports.imageStore = module.exports.www + '/img/';
module.exports.replyStore = module.exports.www + '/replies/';

module.exports.PORT = 8080;
