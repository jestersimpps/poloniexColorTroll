var loki = require('lokijs');
var request = require('request');

var db = new loki('data.json');
var currencies = db.addCollection('currencies')
var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};

getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        var currencyNames = [];
        for (var x in info) {
            currencies.insert({
                shortHand: x,
                lowerCase: x.toLowerCase(),
                fullName: info[x].name.toLowerCase()
            });
        }
        console.log(currencies.find().length + ' cryptos mapped.');
    }
}

request(options, getCurrencies);
