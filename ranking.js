var db = require('diskdb');

db.connect('./data', ['currencies']);



setInterval(function () {
    var currencies = db.currencies.find();
    var sortedCurrencies = currencies
        .sort((a, b) => {
            return parseFloat(b.sentiment) - parseFloat(a.sentiment);
        })
        .filter((c) => {
            return c.sentiment;
        })
        .map((c) => {
            return c.shortHand + '  ' + c.sentiment;
        });
    console.log(sortedCurrencies);
    console.log('');
}, 1000);