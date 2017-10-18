var request = require('request');
var autobahn = require('autobahn');
var colors = require('colors');
var sentiment = require('sentiment');
var fs = require('fs');

//models
var Currency = require('./models/currency');

//globals
var bull = fs.readFileSync(`./sentimentconfig/bull.txt`, 'utf8').split(/\r?\n/);;
var bear = fs.readFileSync(`./sentimentconfig/bear.txt`, 'utf8').split(/\r?\n/);
var neutral = fs.readFileSync(`./sentimentconfig/neutral.txt`, 'utf8').split(/\r?\n/);
var currencyNamesArray = [];

//websocket 
var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

var currencyNamesArray = [];
var currencyObjects = [];

Currency.find({}, (err, cObjs) => {
    if (err) return console.log(err);
    currencyNamesArray = getCurrencyNamesArray(cObjs);
    currencyObjects = cObjs;
    console.log(currencyObjects.length + ' Currencies found in db');
});

process.stdout.write('\033c');

getCurrencyNamesArray = (currencyObjects) => {
    var names = [];
    currencyObjects.forEach(c => {
        names.push(c.lowerCase);
        names.push(c.fullName);
        names.push(c.fullName + 's');
    })
    return names;
}

normalizeName = (name) => {
    name = name.magenta + ':   '.grey;
    return name;
}


colorStrings = (words, name) => {

    var name = normalizeName(name);
    var sentimentScore = sentiment(words.toString()).score;
    var wordsArray = words.split(/[\s,.\/?!+-]+/);
    var sentence = '';
    var sentenceCurrencies = [];

    wordsArray.forEach(word => {
        var lowerCaseWord = word.toLowerCase();
        if (neutral.includes(lowerCaseWord)) {
            sentence += word.blue;
        }
        else if (bull.includes(lowerCaseWord)) {
            sentence += word.green;
            sentimentScore += 3;
        }
        else if (bear.includes(lowerCaseWord)) {
            sentence += word.red;
            sentimentScore -= 3;
        }
        else if (currencyNamesArray.includes(lowerCaseWord)) {
            sentence += word.bold.yellow.underline;
            sentenceCurrencies.push(lowerCaseWord);
        } else {
            sentence += word;
        }
        sentence += ' ';
    });

    sentenceCurrencies.forEach(sc => {
        var currencyObject = getCurrencyObject(sc);
        if (sentimentScore) {
            decreaseSentiment(currencyObject);
        }
        sentence += generateSentiment(currencyObject, sentimentScore);
    });

    console.log(name + sentence);
}

getCurrencyObject = (lowerCaseWord) => {
    return currencyObjects.filter(c => {
        return c.lowerCase === lowerCaseWord || c.fullName === lowerCaseWord || c.fullName + 's' === lowerCaseWord;
    })[0];
}


generateSentiment = (currencyObject, sentimentScore) => {
    if (sentimentScore > 5) {
        sentimentScore = 5;
    }
    if (sentimentScore < -5) {
        sentimentScore = -5;
    }
    var currentSentiment = currencyObject.length ? currencyObject.sentiment : 0;
    var newSentiment = parseInt(currentSentiment + sentimentScore);
    var sentimentPart = ' ('
        + currencyObject.shortHand.bold
        + ': '
        + colorSentiment(newSentiment)
        + ') ';
    if (newSentiment > 21) {
        newSentiment = 20;
    }
    if (newSentiment < -20) {
        newSentiment = -20;
    }
    storeSentiment(currencyObject, newSentiment);
    if (newSentiment < 0) {
        return colors.italic.red(sentimentPart);
    } else if (newSentiment > 0) {
        return colors.italic.green(sentimentPart);
    } else {
        return colors.italic.blue(sentimentPart);
    }
}


decreaseSentiment = (currencyObject) => {
    Currency.find({}, (err, currencies) => {
        currencyObjects = currencies;
        currencyObjects.filter(co => {
            return co.sentiment;
        }).forEach(fco => {
            if (fco.lowerCase != currencyObject.lowerCase) {
                var change = fco.sentiment;
                if (fco.sentiment < 0) {
                    change = fco.sentiment + 1;
                } else if (fco.sentiment > 0) {
                    change = fco.sentiment - 1;
                }
                Currency.findByIdAndUpdate(fco._id, { sentiment: change }, { upsert: false }, (err, doc) => {
                    if (err) return console.log(err);
                });
            }
        })
    })
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

storeSentiment = (currencyObject, newSentiment) => {
    Currency.findByIdAndUpdate(currencyObject._id, { sentiment: newSentiment }, { upsert: false }, (err, doc) => {
        if (err) return console.log(err);
    });
}






connection.onopen = (session) => {
    trollboxEvent = (args, kwargs) => {
        colorStrings(args[3], args[2]);
    }
    session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
    console.log("Websocket connection closed");
}

connection.open();