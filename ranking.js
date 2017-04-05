var request = require('request');
var autobahn = require('autobahn');
var colors = require('colors');
var sentiment = require('sentiment');
var fs = require('fs');

//models
var Currency = require('./models/currency');
var Trade = require('./models/trade');
var Bought = require('./models/bought');

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


refreshCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var newPrices = JSON.parse(body);
        //get currencies from db
        Currency.find({}, (err, currencies) => {
            currencies.map(currencyObject => {
                var currentEthPrice = getCurrencyPrice('eth_', currencyObject, newPrices);
                if (currentEthPrice > currencyObject.ethLast) {
                    currencyObject.ethLastTrend = 'UP';
                } else if (currentEthPrice < currencyObject.ethLast) {
                    currencyObject.ethLastTrend = 'DOWN';
                } else {
                    currencyObject.ethLastTrend = '-';
                }
                currencyObject.ethLast = currentEthPrice;

                var currentBtcPrice = getCurrencyPrice('btc_', currencyObject, newPrices);
                if (currentBtcPrice > currencyObject.btcLast) {
                    currencyObject.btcLastTrend = 'UP';
                } else if (currentBtcPrice < currencyObject.btcLast) {
                    currencyObject.btcLastTrend = 'DOWN';
                } else {
                    currencyObject.btcLastTrend = '-';
                }
                currencyObject.btcLast = currentBtcPrice;

                var currentUsdPrice = getCurrencyPrice('usd_', currencyObject, newPrices);
                if (currentUsdPrice > currencyObject.usdLast) {
                    currencyObject.usdLastTrend = 'UP';
                } else if (currentUsdPrice < currencyObject.usdLast) {
                    currencyObject.usdLastTrend = 'DOWN';
                } else {
                    currencyObject.usdLastTrend = '-';
                }
                currencyObject.usdLast = currentUsdPrice;

                Currency.findByIdAndUpdate(currencyObject._id, currencyObject, { upsert: false }, (err, doc) => {
                    if (err) return console.log(err);
                });
            });
        });
    }
}

createRankedList = (currencies) => {
    return currencies
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
                    + c.btcLast + ' BTC | '
                    + c.usdLast + ' USD | '
                    + c.ethLast + ' ETH');
            } else if (c.sentiment < -5) {
                // console.log('\u0007');
                return colors.red('DUMPING: '
                    + c.shortHand
                    + ' | Sentiment: '
                    + c.sentiment + ' | '
                    + c.btcLast + ' BTC | '
                    + c.usdLast + ' USD | '
                    + c.ethLast + ' ETH');
            } else {
                var btc = c.btcLastTrend === 'UP' ? colors.green(c.btcLast) : c.btcLastTrend === '-' ? colors.blue(c.btcLast) : colors.red(c.btcLast);
                var eth = c.ethLastTrend === 'UP' ? colors.green(c.ethLast) : c.ethLastTrend === '-' ? colors.blue(c.ethLast) : colors.red(c.ethLast);
                var usd = c.usdLastTrend === 'UP' ? colors.green(c.usdLast) : c.usdLastTrend === '-' ? colors.blue(c.usdLast) : colors.red(c.usdLast);
                return colors.blue('WATCHING: '
                    + c.shortHand
                    + ' | Sentiment: '
                    + c.sentiment + ' | '
                    + btc + ' BTC | '
                    + c.usdLast + ' USD | '
                    + c.ethLast + ' ETH');
            }
        });
}


setInterval(() => {

    request({ url: 'https://poloniex.com/public?command=returnTicker' }, refreshCurrencies);

    Currency.find({}, (err, currencies) => {
        console.log(colors.grey(new Date() + ':'));
        var sortedCurrencies = createRankedList(currencies);
        if (sortedCurrencies.length) {
            sortedCurrencies.forEach(sc => {
                console.log(sc);
            });
        } else {
            console.log(colors.blue('WAITING'));
        }
    });
}, 1000);