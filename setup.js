var request = require('request');
var assert = require('assert');
var url = 'mongodb://localhost:27017/polo';
var mongoose = require('mongoose');


mongoose.connect(url);
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('connection error', err);
});
db.once('open', function () {
    console.log('mongod connected.');
});


var Currency = mongoose.model('currencies', {
    shortHand: String,
    lowerCase: String,
    fullName: String,
    sentiment: Number,
    btclast: Number,
    usdlast: Number,
    ethlast: Number
});

var Trade = mongoose.model('trades', {
    action: String,
    shortHand: String,
    usdlast: Number
});

var CurrentlyBought = mongoose.model('currentlyBought', {
    shortHand: String
});

var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};


Currency.collection.drop();
Trade.collection.drop();
CurrentlyBought.collection.drop();


getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        var currencyNames = [];
        for (var x in info) {
            currencyNames.push({
                shortHand: x,
                lowerCase: x.toLowerCase(),
                fullName: info[x].name.toLowerCase(),
                sentiment: 0,
                btclast: 0,
                usdlast: 0,
                ethlast: 0
            });
        }
        Currency.insertMany(currencyNames)
            .then((mongooseDocuments) => {
                Currency.find({}, (err, docs) => {
                    if (err) return console.error(err);
                    console.log(docs.length + ' currencies mapped.');
                    process.exit();
                })
            })
            .catch((err) => {
                console.log('something went wrong...');
                process.exit();
            });
    }
}

request(options, getCurrencies);
