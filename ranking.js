var db = require('diskdb');
var colors = require('colors');
var request = require('request');

var options = {
    url: 'https://poloniex.com/public?command=returnTicker',
};


db.connect('./data', ['currencies']);
db.connect('./data', ['currencies']);


getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        var currencyNames = db.currencies.find();
        for (var x in info) {
            currencyNames.forEach(cn => {
                var lcc = x.toLowerCase();
                if (lcc.indexOf(cn.lowerCase) != -1) {
                    if (lcc.indexOf('btc_') != -1) {
                        db.currencies.update({ shortHand: cn.shortHand }, { btclast: info[x] ? info[x].last : 0 });
                    }
                    if (lcc.indexOf('eth_') != -1) {
                        db.currencies.update({ shortHand: cn.shortHand }, { ethlast: info[x] ? info[x].last : 0 });
                    }
                    if (lcc.indexOf('usd_') != -1) {
                        db.currencies.update({ shortHand: cn.shortHand }, { usdlast: info[x] ? info[x].last : 0 });
                    }
                }
            })
        }
    }
}


setInterval(() => {
    request(options, getCurrencies);
}, 5000);

setInterval(() => {

    var currencies = db.currencies.find();
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
            } else if (c.sentiment < -10) {
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
    process.stdout.write('\033c');
    console.log('');
    console.log('Sentiment analysis:');
    console.log('');
    sortedCurrencies.forEach(sc => {
        console.log(sc);
    });
    console.log('');
}, 1000);