var loki = require('lokijs');
var request = require('request');
var db = require('diskdb');

db.connect('./data', ['currencies']);
db.currencies.remove(); 
db.connect('./data', ['currencies']);

var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};

getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        var currencyNames = [];
        for (var x in info) {
            db.currencies.save({
                shortHand: x,
                lowerCase: x.toLowerCase(),
                fullName: info[x].name.toLowerCase(),
                sentiment: 0,
                btclast: 0,
                usdlast:0,
                ethlast:0
            })
        }

        console.log('Done! ' + db.currencies.find().length + ' cryptos mapped.');
    }
}

request(options, getCurrencies);
