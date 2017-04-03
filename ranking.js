var colors = require('colors');
var request = require('request');
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
    url: 'https://poloniex.com/public?command=returnTicker',
};


getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var newPrices = JSON.parse(body);
        Currency.find({}, (err, currencies) => {
            currencies.map(currencyObject => {
                currencyObject.ethlast = getCurrencyPrice('eth_', currencyObject, newPrices);
                currencyObject.usdlast = getCurrencyPrice('usd_', currencyObject, newPrices);
                currencyObject.btclast = getCurrencyPrice('btc_', currencyObject, newPrices);
                Currency.update({ shortHand: currencyObject.shortHand }, currencyObject);
            });
        });
    }
}

getCurrencyPrice = (typeString, currencyObject, newPrices) => {
    for (var x in newPrices) {
        var lcc = x.toLowerCase();
        if (lcc.indexOf(currencyObject.lowerCase) != -1) {
            if (lcc.indexOf(typeString) != -1) {
                return newPrices[x] ? newPrices[x].last : 0;
            }
        }
    }
    return 0;
}

setInterval(() => {

    request(options, getCurrencies);
    Currency.find({}, (err, currencies) => {

        //rank
        var sortedCurrencies = currencies
            .sort((a, b) => {
                return parseFloat(b.sentiment) - parseFloat(a.sentiment);
            })
            .filter((c) => {
                return c.sentiment;
            })
            .map((c) => {
                if (c.sentiment > 10) {
                    // console.log('\u0007');
                    return colors.green('PUMPING: '
                        + c.shortHand
                        + ' | Sentiment: '
                        + c.sentiment + ' | '
                        + c.btclast + ' BTC | '
                        + c.usdlast + ' USD | '
                        + c.ethlast + ' ETH');
                } else if (c.sentiment < -5) {
                    // console.log('\u0007');
                    return colors.red('DUMPING: '
                        + c.shortHand
                        + ' | Sentiment: '
                        + c.sentiment + ' | '
                        + c.btclast + ' BTC | '
                        + c.usdlast + ' USD | '
                        + c.ethlast + ' ETH');
                } else {
                    return colors.blue('WATCHING: '
                        + c.shortHand
                        + ' | Sentiment: '
                        + c.sentiment + ' | '
                        + c.btclast + ' BTC | '
                        + c.usdlast + ' USD | '
                        + c.ethlast + ' ETH');
                }
            });

        sortedCurrencies.forEach(sc => {
            console.log(sc);
        });

        //trade
        currencies
            .map((c) => {
                CurrentlyBought.findOne({ shortHand: c.shortHand }, (boughtCur) => {
                    if (c.sentiment > 10) {
                        // console.log('\u0007');
                        if (!boughtCur) {
                            Trade.insert({ action: 'BUY', shortHand: c.shortHand, usdlast: c.btclast });
                            CurrentlyBought.insert({ shortHand: c.shortHand });
                            console.log('');
                            console.log(colors.red('**************************************************'));
                            console.log(colors.red('BUY ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
                            console.log(colors.red('**************************************************'));
                        }
                    } else if (c.sentiment <= 0 && boughtCur && c.btclast > boughtCur.btclast) {
                        // console.log('\u0007');
                        Trade.insert({ action: 'SELL', shortHand: c.shortHand, usdlast: c.btclast });
                        CurrentlyBought.insert({ shortHand: c.shortHand });
                        console.log('');
                        console.log(colors.green('**************************************************'));
                        console.log(colors.green('SELL ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
                        console.log(colors.green('**************************************************'));
                    }
                });

            });

        console.log('');
    });
}, 1000);