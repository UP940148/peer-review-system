const path = require('path');
module.exports.www = path.join(__dirname, '/www/');
module.exports.imageStore = path.join(__dirname, '/www/uploads/img/');
module.exports.docStore = path.join(__dirname, '/www/uploads/docs/')

module.exports.PORT = 8080;
