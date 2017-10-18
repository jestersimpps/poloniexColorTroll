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

round = (number, decimals) => {
    var num = number ? +number : 0;
    return num.toFixed(decimals).toString();;
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
            var btc = c.btcLastTrend === 'UP' ? colors.green('∆ ' + round(c.btcLast,8)) : c.btcLastTrend === '-' ? colors.blue('▷ ' + round(c.btcLast,8)) : colors.red('∇ ' + round(c.btcLast,8));
            var eth = c.ethLastTrend === 'UP' ? colors.green('∆ ' + round(c.ethLast,8)) : c.ethLastTrend === '-' ? colors.blue('▷ ' + round(c.ethLast,8)) : colors.red('∇ ' + round(c.ethLast,8));
            var usd = c.usdLastTrend === 'UP' ? colors.green('∆ ' + round(c.usdLast,8)) : c.usdLastTrend === '-' ? colors.blue('▷ ' + round(c.usdLast,8)) : colors.red('∇ ' + round(c.usdLast,8));
            var sentiment = 0;
            var shortHand = colors.blue(c.shortHand);
            if (c.sentiment > 0) {
                shortHand = colors.green(c.shortHand);
                sentiment = colors.green('+' + c.sentiment);
            } else {
                shortHand = colors.red(c.shortHand);
                sentiment = colors.red(c.sentiment);
            }
            if (c.sentiment > 10) {
                // console.log('\u0007');
                return colors.green('∆ PUMPING: '
                    + shortHand
                    + ' | Sentiment: '
                    + sentiment + ' | '
                    + btc + ' BTC | '
                    + eth + ' USD | '
                    + usd + ' ETH');
            } else if (c.sentiment < -5) {
                // console.log('\u0007');
                return colors.red('∇ DUMPING: '
                    + shortHand
                    + ' | Sentiment: '
                    + sentiment + ' | '
                    + btc + ' BTC | '
                    + eth + ' USD | '
                    + usd + ' ETH');
            } else {
                return colors.yellow('▷ WATCHING: '
                    + shortHand
                    + ' | Sentiment: '
                    + sentiment + ' | '
                    + btc + ' BTC | '
                    + eth + ' USD | '
                    + usd + ' ETH');
            }
        });
}


setInterval(() => {

    request({ url: 'https://poloniex.com/public?command=returnTicker' }, refreshCurrencies);

    Currency.find({}, (err, currencies) => {
        process.stdout.write('\033c');
        console.log('');
        console.log(colors.grey(new Date() + ':'));
        var sortedCurrencies = createRankedList(currencies);
        if (sortedCurrencies.length) {
            sortedCurrencies.forEach(sc => {
                console.log(sc);
            });
        }
    });
}, 1000);