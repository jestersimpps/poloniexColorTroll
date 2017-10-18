var mongoose = require('../connection');
var Schema = mongoose.Schema;

var TradeSchema = new Schema({
    action: String,
    shortHand: String,
    usdLast: Number,
    btcLast: Number,
    ethLast: Number
});

module.exports = mongoose.model('Trade', TradeSchema);