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
    var wordsArray = words.split(/[\s,.\/?!]+/);
    var sentence = '';
    var sentenceCurrencies = [];
    wordsArray.forEach(word => {
        if (neutral.includes(word.toLowerCase())) {
            sentence += word.blue;
        }
        else if (bull.includes(word.toLowerCase())) {
            sentence += word.green;
            sentimentScore += 2;
        }
        else if (bear.includes(word.toLowerCase())) {
            sentence += word.red;
            sentimentScore += -2;
        }
        else if (getCurrencyNamesArray().includes(word.toLowerCase())) {
            sentence += word.bold.yellow.underline;
            sentenceCurrencies.push(word.toLowerCase());
        } else {
            sentence += word;
        }
        sentence += ' ';
    })
    if (sentenceCurrencies.length) {
        if (sentimentScore < 0) {
            sentence += ' ( '.red + sentenceCurrencies.filter(onlyUnique).join(' ').red + ' ' + sentimentScore.toString().red + ' )'.red;
        } else if (sentimentScore > 0) {
            sentence += ' ( '.green + sentenceCurrencies.filter(onlyUnique).join(' ').green + ' +'.green + sentimentScore.toString().green + ' )'.green;
        }
    }
    return sentence;
}

getCurrencyNamesArray = () => {
    var names = [];
    db.currencies.find().forEach(c => {
        names.push(c.lowerCase);
        names.push(c.fullName);
    })
    return names;
}

normalizeName = (name) => {
    name = name.grey + ':   '.grey;
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