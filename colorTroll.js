var autobahn = require('autobahn');
var colors = require('colors');
var request = require('request');
fs = require('fs');



var bull = fs.readFileSync(`./sentimentconfig/bull.txt`, 'utf8').split(/\r?\n/);;
var bear = fs.readFileSync(`./sentimentconfig/bear.txt`, 'utf8').split(/\r?\n/);
var neutral = fs.readFileSync(`./sentimentconfig/neutral.txt`, 'utf8').split(/\r?\n/);


function colorStrings(words) {
    var wordsArray = words.split(/[\s,.\/?!]+/);
    var sentence = '';
    wordsArray.forEach(word => {
        if (neutral.includes(word.toLowerCase())) {
            sentence += word.blue;
        }
        if (bull.includes(word.toLowerCase())) {
            sentence += word.green;
            sentiment = 1;
        }
        else if (bear.includes(word.toLowerCase())) {
            sentence += word.red;
        }
        else if (currencies.includes(word.toLowerCase())) {
            sentence += word.bold.yellow.underline;
        } else {
            sentence += word;
        }
        sentence += ' ';
    })
    return sentence;
}

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        for (var x in info) {
            currencies.push(x.toLowerCase());
            currencies.push(info[x].name.toLowerCase());
        }
    }
}



var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
    url: wsuri,
    realm: "realm1"
});

var currencies = [];
var request = require('request');
var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};

request(options, callback);

connection.onopen = function (session) {
    function trollboxEvent(args, kwargs) {
        console.log(args[2].grey + ': '.grey + colorStrings(args[3]));
    }
    session.subscribe('trollbox', trollboxEvent);
}

connection.onclose = function () {
    console.log("Websocket connection closed");
}

connection.open();