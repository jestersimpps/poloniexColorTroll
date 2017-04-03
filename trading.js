var db = require('diskdb');
var colors = require('colors');

db.connect('./data', ['currencies']);
db.connect('./data', ['trading']);
db.connect('./data', ['bought']);


process.stdout.write('\033c');
console.log('');
console.log('Trades:');
console.log('');
setInterval(() => {

    var currencies = db.currencies.find();
    currencies
        .map((c) => {
            if (c.sentiment > 1) {
                // console.log('\u0007');
                if (!db.bought.findOne({ shortHand: c.shortHand })) {
                    db.trading.save({ action: 'BUY', shortHand: c.shortHand, usdlast: c.btclast });
                    db.bought.save({ shortHand: c.shortHand });
                    console.log(colors.red('BUY ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
                }
            } else if (c.sentiment <= 0 && db.bought.findOne({ shortHand: c.shortHand })) {
                // console.log('\u0007');
                db.trading.save({ action: 'SELL', shortHand: c.shortHand, usdlast: c.btclast });
                db.bought.remove({ shortHand: c.shortHand });
                console.log(colors.green('SELL ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
            }
        });

}, 1000);