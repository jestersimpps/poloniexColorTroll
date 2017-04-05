var mongoose = require('../connection');
var Schema = mongoose.Schema;

var BoughtSchema = new Schema({
    shortHand: String
});


module.exports =  mongoose.model('Bought', BoughtSchema);