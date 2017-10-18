var request = require('request');

var options = {
    url: 'https://api.kraken.com/0/public/OHLC?pair=ETHXBT',
};


getHistory = (error, response, body) => {
    if (!error && response.statusCode == 200) {
        var responseBody = JSON.parse(body);
        var prices = responseBody.result['XETHXXBT']
            // .reverse()
            .filter(x=>{
                return x[4];
            })
            .map(x => {
                return x[4];
            });

        var ema20 = EMACalc(prices, 20);
        var ema42 = EMACalc(prices, 42);

        // console.log(prices);
        console.log('ema20: ' + ema20[ema20.length - 1]);
        console.log('ema42:' + ema42[ema42.length - 1]);
    }
}


EMACalc = (mArray, mRange) => {
    var k = 2 / (mRange + 1);
    // first item is just the same as the first item in the input
    emaArray = [mArray[0]];
    // for the rest of the items, they are computed with the previous one
    for (var i = 1; i < mArray.length; i++) {
        emaArray.push(mArray[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
}

request(options, getHistory);
