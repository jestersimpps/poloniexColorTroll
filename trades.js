var colors = require('colors');
var Trade = require('./models/trade');
var balance = 10;
Trade.find({}, (err, trades) => {
    trades.forEach(t => {
        if (t.action === 'BUY') {
            console.log(colors.red('BOUGHT ' + t.shortHand + ' for ' + t.btcLast + ' BTC'));
            balance -= t.btcLast;
        } else {
            console.log(colors.green('SOLD ' + t.shortHand + ' for ' + t.btcLast + ' BTC'));
            balance += t.btcLast;
        }
    });
    console.log('balance: '+balance);
    process.exit();
});