var autobahn = require('autobahn');
var colors = require('colors');
var request = require('request');

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

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        for (var x in info) {
            currencies.push(x.toLowerCase());
            currencies.push(info[x].name.toLowerCase());
        }
    }
}

request(options, callback);


function colorStrings(words) {
    var wordsArray = words.split(/[\s,.\/?!]+/);
    var sentence = '';
    wordsArray.forEach(word => {
        if (['whale','whales','action','wall'].includes(word.toLowerCase())) {
            sentence += word.blue;
        }
        if (['pump', 'up', 'moon', 'sky', 'long', 'hodl', 'hold', 'buy','jumping','undervalued','mooning'].includes(word.toLowerCase())) {
            sentence += word.green;
            sentiment = 1;
        }
        else if (['dump', 'down', 'crashing', 'falling', 'sell','crash'].includes(word.toLowerCase())) {
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