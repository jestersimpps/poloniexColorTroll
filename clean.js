var request = require('request');
var Currency = require('./models/currency');
var Trade = require('./models/trade');
var Bought = require('./models/bought');


var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};

Currency.remove(function () { })
Trade.remove(function () { })
Bought.remove(function () { })


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
                btcLast: 0,
                btcLastTrend: '-',
                usdLast: 0,
                usdLastTrend: '-',
                ethLast: 0,
                ethLastTrend: '-'
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
