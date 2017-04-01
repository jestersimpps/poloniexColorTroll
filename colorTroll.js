var autobahn = require('autobahn');
var colors = require('colors');
var request = require('request');

fs = require('fs');



var bull = fs.readFileSync(`./sentimentconfig/bull.txt`, 'utf8').split(/\r?\n/);;
var bear = fs.readFileSync(`./sentimentconfig/bear.txt`, 'utf8').split(/\r?\n/);
var neutral = fs.readFileSync(`./sentimentconfig/neutral.txt`, 'utf8').split(/\r?\n/);


colorStrings = (words) => {
    var wordsArray = words.split(/[\s,.\/?!]+/);
    var sentence = '';
    wordsArray.forEach(word => {
        if (neutral.includes(word.toLowerCase())) {
            sentence += word.blue;
        }
        else if (bull.includes(word.toLowerCase())) {
            sentence += word.green;
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

getCurrencies = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        for (var x in info) {
            currencies.push(x.toLowerCase());
            currencies.push(info[x].name.toLowerCase());
        }
    }
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

var currencies = [];
var request = require('request');
var options = {
    url: 'https://poloniex.com/public?command=returnCurrencies',
};

request(options, getCurrencies);

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