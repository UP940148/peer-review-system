const path = require('path');
module.exports.www = path.join(__dirname, '/www/');
module.exports.uploads = path.join(__dirname, '/server/uploads/');
module.exports.docStore = module.exports.www + '/saved/docs/';
module.exports.imageStore = module.exports.www + '/saved/img/';
module.exports.replyStore = module.exports.www + '/saved/replies/';

module.exports.PORT = 8080;
