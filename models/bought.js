var mongoose = require('../connection');
var Schema = mongoose.Schema;

var BoughtSchema = new Schema({
    shortHand: String,
    usdLast: Number,
    btcLast: Number,
    ethLast: Number
});


module.exports = mongoose.model('Bought', BoughtSchema);