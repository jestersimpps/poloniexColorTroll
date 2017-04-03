var autobahn = require('autobahn');
var colors = require('colors');
var request = require('request');
var sentiment = require('sentiment');
var fs = require('fs');
var url = 'mongodb://localhost:27017/polo';
var mongoose = require('mongoose');

mongoose.connect(url);
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('connection error', err);
});
db.once('open', function () {
    console.log('mongod connected.');
});

var Currency = mongoose.model('currencies', {
    shortHand: String,
    lowerCase: String,
    fullName: String,
    sentiment: Number,
    btclast: Number,
    usdlast: Number,
    ethlast: Number
});

var Trade = mongoose.model('trades', {
    action: String,
    shortHand: String,
    usdlast: Number
});

var bull = fs.readFileSync(`./sentimentconfig/bull.txt`, 'utf8').split(/\r?\n/);;
var bear = fs.readFileSync(`./sentimentconfig/bear.txt`, 'utf8').split(/\r?\n/);
var neutral = fs.readFileSync(`./sentimentconfig/neutral.txt`, 'utf8').split(/\r?\n/);

var CurrentlyBought = mongoose.model('currentlyBought', {
    shortHand: String
});

onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
}

colorStrings = (words) => {
    var sentimentScore = sentiment(words.toString()).score;
    var wordsArray = words.split(/[\s,.\/?!+-]+/);
    var sentence = '';
    var sentenceCurrencies = [];
    return getCurrencyNamesArray().then(currencyNamesArray => {
        wordsArray.forEach(word => {
            getCurrencyObject(word.toLowerCase()).then(currencyObject => {
                if (neutral.includes(word.toLowerCase())) {
                    sentence += word.blue;
                }
                else if (bull.includes(word.toLowerCase())) {
                    sentence += word.green;
                    sentimentScore += 3;
                }
                else if (bear.includes(word.toLowerCase())) {
                    sentence += word.red;
                    sentimentScore -= 3;
                }
                else if (currencyNamesArray.includes(word.toLowerCase())) {
                    sentence += word.bold.yellow.underline;
                    decreaseSentiment(currencyObject.shortHand);
                    sentenceCurrencies.push(currencyObject.shortHand);
                } else {
                    sentence += word;
                }
                sentence += ' ';
                sentenceCurrencies.forEach(sc => {
                    sentence += generateSentiment(sc.toLowerCase(), sentimentScore);
                });
                return sentence;
            });
        });

    })


}


generateSentiment = (currency, sentimentScore) => {
    getCurrentSentiment(currency).then(currentSentiment => {
        var newSentiment = currentSentiment + sentimentScore;
        var sentimentPart = ' (' + currency.bold
            + ': '
            + colorSentiment(newSentiment) + ') ';
        if (newSentiment < 20 && newSentiment > -20) {
            storeSentiment(currency, newSentiment);
        }
        if (newSentiment < 0) {
            return colors.italic.red(sentimentPart);
        } else if (newSentiment > 0) {
            return colors.italic.green(sentimentPart);
        } else {
            return colors.italic.blue(sentimentPart);
        }
    });
}


decreaseSentiment = (upCurrencyShortHand) => {
    Currency.find({}, currencies => {
        currencies.forEach(c => {
            if (c.shortHand != upCurrencyShortHand) {
                if (c.sentiment < 0) {
                    Currency.update({ fullName: c.fullName }, { sentiment: c.sentiment + 1 });
                } else if (c.sentiment > 0) {
                    Currency.update({ fullName: c.fullName }, { sentiment: c.sentiment - 1 });
                }
            }
        })
    });
}

colorSentiment = (sentiment) => {
    if (sentiment < 0) {
        return colors.red(sentiment);
    } else if (sentiment > 0) {
        return '+' + sentiment;
    } else {
        return colors.blue(sentiment);
    }
}

storeSentiment = (currency, newSentiment) => {
    Currency.update({ lowerCase: currency }, { sentiment: newSentiment });
    Currency.update({ fullName: currency }, { sentiment: newSentiment });
}

getCurrencyObject = (currency) => {
    return Currency.findOne({ lowerCase: currency }, currencyObject1 => {
        if (!currencyObject1) {
            return Currency.findOne({ fullName: currency }, currencyObject2 => {
                return currencyObject2;
            });
        } else {
            return {};
        }
    });
}

getCurrentSentiment = (c) => {
    return Currency.findOne({ lowerCase: c }, currency1 => {
        if (!currency1) {
            return Currency.findOne({ fullName: c }, currency2 => {
                return currency2 ? currency2.sentiment : 0;
            })
        } else {
            return 0
        };
    });
}

getCurrencyNamesArray = () => {
    return Currency.find({}, currencies => {
        var names = [];
        currencies.forEach(c => {
            names.push(c.lowerCase);
            names.push(c.fullName);
            names.push(c.fullName + 's');
        })
        return names;
    })
}

normalizeName = (name) => {
    name = name.magenta + ':   '.grey;
    return name;
}

var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

connection.onopen = (session) => {
    trollboxEvent = (args, kwargs) => {
        colorStrings(args[3]).then(colorSentence => {
            var troll = {
                name: normalizeName(args[2]),
                message: colorSentence
            };
            console.log(troll.name + troll.message);
        })
    }
    session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
    console.log("Websocket connection closed");
}

connection.open();

// var wsuri = "wss://ws.pusherapp.com/app/4e0ebd7a8b66fa3554a4?protocol=6&client=js&version=2.0.0&flash=false";
// var connection = new autobahn.Connection({
//     url: wsuri,
// });

// connection.onopen = (session) => {
//     trollboxEvent = (args, kwargs) => {
//         var troll = {
//             name: normalizeName(args[2]),
//             message: colorStrings(args[3])
//         };
//         console.log(troll.name + troll.message);
//     }
//     session.subscribe('trollbox', trollboxEvent);
// }

// connection.onclose = function () {
//     console.log("Websocket connection closed");
// }

// connection.open();
