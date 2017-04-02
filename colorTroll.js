var autobahn = require('autobahn');
var colors = require('colors');
var request = require('request');
var sentiment = require('sentiment');
var db = require('diskdb');
var fs = require('fs');

db.connect('./data', ['currencies']);


var currencies = db.currencies.find();

var bull = fs.readFileSync(`./sentimentconfig/bull.txt`, 'utf8').split(/\r?\n/);;
var bear = fs.readFileSync(`./sentimentconfig/bear.txt`, 'utf8').split(/\r?\n/);
var neutral = fs.readFileSync(`./sentimentconfig/neutral.txt`, 'utf8').split(/\r?\n/);

onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
}

colorStrings = (words) => {
    var sentimentScore = sentiment(words.toString()).score;
    var wordsArray = words.split(/[\s,.\/?!+-]+/);
    var sentence = '';
    var sentenceCurrencies = [];
    wordsArray.forEach(word => {
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
        else if (getCurrencyNamesArray().includes(word.toLowerCase())) {
            sentence += word.bold.yellow.underline;
            var currencyObject = getCurrencyObject(word.toLowerCase());
            decreaseSentiment(currencyObject.shortHand);
            sentenceCurrencies.push(currencyObject.shortHand);
        } else {
            sentence += word;
        }
        sentence += ' ';
    })
    sentenceCurrencies.forEach(sc => {
        sentence += generateSentiment(sc.toLowerCase(), sentimentScore);
    })
    return sentence;
}


generateSentiment = (currency, sentimentScore) => {
    var currentSentiment = getCurrentSentiment(currency);
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
}


decreaseSentiment = (upCurrencyShortHand) => {
    db.currencies.find().forEach(c => {
        if (c.shortHand != upCurrencyShortHand) {
            if (c.sentiment < 0) {
                db.currencies.update({ fullName: c.fullName }, { sentiment: c.sentiment + 1 });
            } else if (c.sentiment > 0) {
                db.currencies.update({ fullName: c.fullName }, { sentiment: c.sentiment - 1 });
            }
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

storeSentiment = (currency, newSentiment) => {
    db.currencies.update({ lowerCase: currency }, { sentiment: newSentiment });
    db.currencies.update({ fullName: currency }, { sentiment: newSentiment });
}

getCurrencyObject = (currency) => {
    var currencyObject = db.currencies.findOne({ lowerCase: currency });
    if (!currencyObject) { currencyObject = db.currencies.findOne({ fullName: currency }); }
    return currencyObject;
}

getCurrentSentiment = (c) => {
    var currency = db.currencies.findOne({ lowerCase: c });
    if (!currency) { currency = db.currencies.findOne({ fullName: c }) };
    return currency ? currency.sentiment : 0;
}

getCurrencyNamesArray = () => {
    var names = [];
    db.currencies.find().forEach(c => {
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

var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

connection.onopen = (session) => {
    trollboxEvent = (args, kwargs) => {
        var troll = {
            name: normalizeName(args[2]),
            message: colorStrings(args[3])
        };
        console.log(troll.name + troll.message);
    }
    session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
    console.log("Websocket connection closed");
}

connection.open();
