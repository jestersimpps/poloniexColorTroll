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
    var currencyNamesArray = [];

    Currency.find({}, (err, currencyObjects) => {
        currencyNamesArray = getCurrencyNamesArray(currencyObjects);
        return currencyObjects;
    }).then((currencyObjects) => {
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
                decreaseSentiment(lowerCaseWord, currencyObjects);
                sentenceCurrencies.push(lowerCaseWord);
            } else {
                sentence += word;
            }
            sentence += ' ';
        });
        return {
            sentence: sentence,
            currencyObjects: currencyObjects,
            sentimentScore: sentimentScore,
            sentenceCurrencies: sentenceCurrencies
        };
    }).then((data) => {
        data.sentenceCurrencies.forEach(sc => {
            var currencyObject = data.currencyObjects.filter(c => {
                return c.lowerCase === sc;
            });
            var sentiment = currencyObject.length ? currencyObject[0].sentiment : 0;
            data.sentence += generateSentiment(sc, sentiment, data.sentimentScore);
        });
        console.log(name + data.sentence);
    });
}


generateSentiment = (lowerCaseWord, currentSentiment, sentimentScore) => {
    var newSentiment = parseInt(currentSentiment + sentimentScore);
    var sentimentPart = ' ('
        + lowerCaseWord.bold
        + ': '
        + colorSentiment(newSentiment)
        + ') ';
    if (newSentiment < 21 && newSentiment > -21) {
        storeSentiment(lowerCaseWord, newSentiment);
    }
    if (newSentiment < 0) {
        return colors.italic.red(sentimentPart);
    } else if (newSentiment > 0) {
        return colors.italic.green(sentimentPart);
    } else {
        return colors.italic.blue(sentimentPart);
    }
}


decreaseSentiment = (lowerCaseWord, currencyObjects) => {
    currencyObjects.forEach(c => {
        if (c.lowerCase != lowerCaseWord) {
            var change = c.sentiment;
            if (c.sentiment < 0) {
                change = c.sentiment + 1;
            } else if (c.sentiment > 0) {
                change = c.sentiment - 1;
            }
            Currency.update({ lowerCase: c.lowerCase }, { sentiment: change }, { upsert: false }, (err, doc) => {
                if (err) return console.log(err);
            });
        }
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

storeSentiment = (lowerCaseWord, newSentiment) => {
    Currency.update({ fullName: lowerCaseWord }, { sentiment: newSentiment }, { upsert: false }, (err, doc) => {
        if (err) return console.log(err);
    });
    Currency.update({ lowerCase: lowerCaseWord }, { sentiment: newSentiment }, { upsert: false }, (err, doc) => {
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