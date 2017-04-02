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
            if (c.sentiment > 10) {
                console.log('\u0007');
                return 'PUMPING: ' + c.shortHand + ' => ' + c.sentiment;
            } else if (c.sentiment < -2) {
                console.log('\u0007');
                return 'DUMPING: ' + c.shortHand + ' => ' + c.sentiment;
            } else {
                return c.shortHand + ' => ' + c.sentiment;
            }
        });
    console.log(sortedCurrencies);
    console.log('');

}, 1000);