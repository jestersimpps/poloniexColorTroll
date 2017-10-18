var request = require('request');
var autobahn = require('autobahn');
var colors = require('colors');
var sentiment = require('sentiment');
var fs = require('fs');

//models
var Currency = require('./models/currency');
var Trade = require('./models/trade');
var Bought = require('./models/bought');


process.stdout.write('\033c');


executeTrades = (currencies) => {
    currencies
        .map((c) => {
            Bought.findOne({ shortHand: c.shortHand }, (err, boughtCur) => {
                if (c.sentiment > 10) {
                    if (!boughtCur) {
                        new Trade({
                            action: 'BUY',
                            shortHand: c.shortHand,
                            usdLast: c.usdLast,
                            btcLast: c.btcLast,
                            ethLast: c.ethLast
                        }).save((doc) => {
                            new Bought({
                                shortHand: c.shortHand,
                                usdLast: c.usdLast,
                                btcLast: c.btcLast,
                                ethLast: c.ethLast
                            }).save((doc) => {
                                console.log('\u0007');
                                console.log(colors.red('BUY ' + c.shortHand + ' for ' + c.btcLast + ' BTC'));
                            }).catch((err) => {
                                if (err) return console.log(err);
                            });
                        }).catch((err) => {
                            if (err) return console.log(err);
                        });
                    }
                } else if ((c.sentiment <= 0 && boughtCur && c.btcLast > boughtCur.btcLast) || (boughtCur && c.sentiment < -10)) {
                    new Trade({
                        action: 'SELL',
                        shortHand: c.shortHand,
                        usdLast: c.usdLast,
                        btcLast: c.btcLast,
                        ethLast: c.ethLast
                    }).save((doc) => {
                        Bought.remove({
                            shortHand: c.shortHand
                        }, (doc) => {
                            console.log('\u0007');
                            console.log(colors.green('SELL ' + c.shortHand + ' for ' + c.btcLast + ' BTC'));
                        }).catch((err) => {
                            if (err) return console.log(err);
                        });
                    }).catch((err) => {
                        if (err) return console.log(err);
                    });
                }
            });
        });
}


setInterval(() => {
    Currency.find({}, (err, currencies) => {
        //trade
        executeTrades(currencies);
    });
}, 1000);