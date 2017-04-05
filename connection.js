var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/polo');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection Error : '));
db.once('open', function(){
  console.log('Connection ok!');
});

module.exports = mongoose;