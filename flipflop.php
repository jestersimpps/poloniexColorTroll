<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <meta name="googlebot" content="noindex, nofollow">
  <style type="text/css">
    #container {
	min-width: 310px;
	max-width: 100%;
	height: 800px;
	margin: 0 auto
}
  </style>
  <title>Flipflop</title>
</head>
<body>
<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
<script src="https://code.highcharts.com/stock/highstock.js"></script>
<div id="container"></div>
<?php

function getData($url){
    // Initiate curl
    $ch = curl_init();
    // Disable SSL verification
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    // Will return the response, if false it print the response
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Set the url
    curl_setopt($ch, CURLOPT_URL,$url);
    // Execute
    $result=curl_exec($ch);
    // Closing
    curl_close($ch);

    return json_decode($result, true);
}


function EMACalculator($range,$data)
{
	$lastEMA = 0;
	$k = 2/($range+1);
	for ($i; $i<count($data); ++$i) {
		$lastEMA = (1-$k) * $lastEMA + $k * $data[$i];
	}
	return $lastEMA;
}



$ethxbcdata = getData('https://api.kraken.com/0/public/OHLC?pair=ETHXBT&interval=15')['result']['XETHXXBT'];
$usdxbcdata = getData('https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=15')['result']['XXBTZUSD'];




function createPlotlines($data, $position, $color,$text ){
    return [
        'color' => $color, 
        'dashStyle'=> 'longdashdot', 
        'value'=> $position, 
        'width'=> 2,
        'label' => [
            'text'=> $text, // Content of the label. 
            'align'=> 'left', // Positioning of the label.  
        ]
    ];
}
set_time_limit(0); 

$pricesOnly = [];
foreach ($ethxbcdata as $key => $value) {
    $currentClose = floatval($value[4]);
    $pricesOnly[] = $currentClose;
}

function CalculateEma($pricesOnly){
    for ($shortEma=20; $shortEma < 40; $shortEma++) { 
        for ($longEma=40; $longEma < 50; $longEma++) {
            $action = 'buy';
            $balance = 0;
            foreach ($pricesOnly as $key => $value) { 
                $currentEma20 = floatval(EMACalculator($shortEma,array_slice($pricesOnly,0,$key)));
                $currentEma42 = floatval(EMACalculator($longEma,array_slice($pricesOnly,0,$key)));
                if($currentEma20 > $currentEma42 && $action == 'sell'){
                    $action = 'buy';
                    $balance -= $value;
                }
                if($currentEma20 < $currentEma42 && $action == 'buy'){
                    $action = 'sell';
                    $balance += $value;
                }
            }
            echo 'short:'.$shortEma.'long:'.$longEma.'balance:'.$balance.'<br>';
        }
    }
}
CalculateEma($pricesOnly);

?>
<!--
function createArrays($data, $multiplier){
        $shortEma = 2;
        $longEma = 9;



        $closePrices = [];
        $ema20 = [];
        $ema42 = [];
        $plotLines = [];
        $action = 'sell';
        $balance = 0;
        foreach ($data as $key => $value) {
            $currentClose = $multiplier * floatval($value[4]);

            $closePrices[] = [$value[0],$currentClose];
            $currentEma20 = floatval(EMACalculator($shortEma,array_slice($pricesOnly,0,$key)));
            $currentEma42 = floatval(EMACalculator($longEma,array_slice($pricesOnly,0,$key)));
            $ema20[] =  [$value[0],$currentEma20];
            $ema42[] =  [$value[0],$currentEma42];
            if($currentEma20 > $currentEma42 && $action == 'sell'){
                array_push( $plotLines, createPlotlines($data,$value[0] ,'green','buy at '.$currentClose));
                $action = 'buy';
                $balance -= $currentClose;
            }
            if($currentEma20 < $currentEma42 && $action == 'buy'){
                array_push( $plotLines, createPlotlines($data,$value[0],'red','sell at '.$currentClose));
                $action = 'sell';
                $balance += $currentClose;
            }
        }
        // echo 'short:'. $shortEma . ' long:'. $longEma . ' balance:'.$balance.'<br>';
        return [
            'closePrices'=>$closePrices,
            'ema20'=>$ema20,
            'ema42'=>$ema42,
            'plotLines'=>$plotLines,
            'balance'=>$balance
        ];

}


$ethArrays = createArrays($ethxbcdata,1);

// $usdArrays = createArrays($usdxbcdata, 1/25000);
echo json_encode($ethArrays['balance']);
?>
<script type='text/javascript'>//<![CDATA[
    Highcharts.stockChart('container', {
        chart: {
            zoomType: 'x'
        },
        title: {
            text: 'ETH XBC'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                    'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',           
            plotLines: <?php echo json_encode($ethArrays['plotLines']);
?>
        },
        yAxis: {
            title: {
                text: 'Exchange rate'
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 1,
                        x2: 0,
                        y2: 0
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },
        series: [{
            type: 'area',
            lineColor:'black',
            name: 'ETH to XBC',
            data: <?php echo json_encode($ethArrays['closePrices']);
?>
        },{
            type: 'area',
            lineColor:'black',
            name: 'USD to XBC',
            data: <?php echo json_encode($usdArrays['closePrices']);
?>
        }]
    });
</script>

  <script>
  // tell the embed parent frame the height of the content
  if (window.parent && window.parent.parent){
    window.parent.parent.postMessage(["resultsFrame", {
      height: document.body.getBoundingClientRect().height,
      slug: "None"
    }], "*")
  }
</script>-->
</body>
</html>
