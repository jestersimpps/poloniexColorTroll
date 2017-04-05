var request = require('request');
var autobahn = require('autobahn');
var colors = require('colors');
var sentiment = require('sentiment');
var fs = require('fs');

//models
var Currency = require('./models/currency');
var Trade = require('./models/trade');
var Bought = require('./models/bought');




executeTrades = (currencies) => {
    currencies
        .map((c) => {
            Bought.findOne({ shortHand: c.shortHand }, (err, boughtCur) => {
                if (c.sentiment > 1) {
                    // console.log('\u0007');
                    if (!boughtCur) {
                        new Trade({ action: 'BUY', shortHand: c.shortHand, usdlast: c.btclast }).save((doc) => {
                            new Bought({ shortHand: c.shortHand }).save((doc) => {
                                console.log(colors.red('BUY ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
                            }).catch((err) => {
                                if (err) return console.log(err);
                            });
                        }).catch((err) => {
                            if (err) return console.log(err);
                        });
                    }
                } else if (c.sentiment <= 0 && boughtCur && c.btclast >= boughtCur.btclast) {
                    // console.log('\u0007');
                    new Trade({ action: 'SELL', shortHand: c.shortHand, usdlast: c.btclast }).save((doc) => {
                        Bought.remove({ shortHand: c.shortHand }, (doc) => {
                            console.log(colors.green('SELL ' + c.shortHand + ' for ' + c.btclast + ' BTC'));
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