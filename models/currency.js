var mongoose = require('../connection');
var Schema = mongoose.Schema;

var CurrencySchema = new Schema({
    shortHand: String,
    lowerCase: String,
    fullName: String,
    sentiment: Number,
    btcLast: Number,
    btcLastTrend: String,
    usdLast: Number,
    usdLastTrend: String,
    ethLast: Number,
    ethLastTrend: String
});



module.exports = mongoose.model('Currency', CurrencySchema);