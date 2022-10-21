var keys = [],
    colors = {
        "open": "#ED7E17",
        "high": "#439942",
        "low": "#ff0000",
        "close": "#058DC7",
        "other": [
            "#974CD9", "#A25115", "#928C8B", "#E8CB7D", "#18ED9C",
            "#3EC792", "#B3ED18", "#FF8F8C", "#E89C74", "#710EED"
        ]
    }

function prepareData(allData) {
    let currData = JSON.parse(JSON.stringify(allData));

    if (new Date(currData[0].Date) > new Date(currData[currData.length - 1].Date))
        currData.reverse();

    let data = [[]];
    keys = Object.keys(currData[0]);

    for (var i in currData) {
        data[0].push(new Date(currData[i].Date).getTime() / 1000);

        for (var n = 1; n < keys.length; n++) {
            if (data[n] == undefined) data[n] = [];
            data[n].push(!isNaN(parseFloat(currData[i][keys[n]])) ? parseFloat(currData[i][keys[n]]) : null);
        }
    }

    return data;
}

var spanGaps = false,
    subSpanGaps = false,
    showVals = false,
    subShowVals = false,
    candleActive, volumeActive,
    openIdx, highIdx, lowIdx, closeIdx, volIdx,
    lastHeight, lastSubHeight, real_decimal = 4, decimalNumber = 4,
    lineschart, zoomchart, candlechart, volumechart, distanceX = 0,
    linessubchart, zoomsubchart, candlesubchart, volumesubchart;

function getSize(name, fixheight = null, fixwidth = null) {
    return {
        width: (fixwidth !== null) ? fixwidth : $(name).width(),
        height: (fixheight !== null) ? fixheight : $(name).height(),
    }
}

function throttle(cb, limit) {
    var wait = false;
    return() => {
        if(!wait){
            requestAnimationFrame(cb);
            wait = true;
            setTimeout(() => { wait = false; }, limit);
        }
    }
}
function changeRange(lineschart, panel, xMin, xMax) {
    setTimeout(() => {
        var pMin = lineschart.scales.x.min;
        var pMax = lineschart.scales.x.max;
        $('.' + panel).css({
            left: ((pMin - xMin) * $('.' + panel).parent().width()) / (xMax - xMin),
            width: ((pMax - pMin) * $('.' + panel).parent().width()) / (xMax - xMin)
        });
    }, 2);
}

function CFL(string) {
    let firstchar = string[0].toUpperCase();
    string = string.slice(1);
    return firstchar + string;
}

function createChart(rowsData) {
    let data = prepareData(rowsData);

    volIdx = keys.findIndex(item => "volume" === item.toLowerCase());
    volumeActive = (volIdx !== -1);
    if (volumeActive) {
        // Prepare the data for volume chart
        var volumeColorGreen = [];
        var volumeColorRed = [];

        data[volIdx].map(function (v, i) {
            if (i !== 0) {
                if (data[volIdx][i - 1] < v) {
                    volumeColorGreen.push(v);
                    volumeColorRed.push(null);
                } else {
                    volumeColorGreen.push(null);
                    volumeColorRed.push(v);
                }
            } else {
                volumeColorGreen.push(v);
                volumeColorRed.push(null);
            }
        });

        var colData = [ data[0], volumeColorRed, volumeColorGreen ];
        data.splice(volIdx, 1);
        keys.splice(volIdx, 1);
    } else {
        $("#bottom-chart").hide();
        $("#top-chart").css("height", "calc(100% - 95px)");
        showVals = true;
    }

    var ops = {
        id: "bigChart",
        width: $('#top-chart').width(),
        height: $('#top-chart').height(),
        hooks: {
            init: [
                u => {
                    let timeAxisVals = u.axes[0].values;
                    u.axes[0].values = (...args) => showVals ? timeAxisVals(...args) : [];
                }
            ],
            ready:[()=>{
                initialise_chart_for_click()
            }],
            setSize:[()=>{
                initialise_chart_for_click()
            }]
        },
        axes: [
            {
                space: 100,
                size: volumeActive ? 12 : 50,
                values: (self,splits) => {
                    var _a = [];
                    for(var i=0;i<splits.length;i++){
                        var date = new Date(splits[i]*1000);
                        var shorthMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        var month = shorthMonths[date.getMonth()], day = ('0'+date.getDate()+'').slice(-2);
                        _a.push(day+'-'+month+'-'+date.getFullYear().toString().substring(2));
                        //dates.length > 60 ? _a.push(month+' '+date.getFullYear()) : _a.push(day+' '+month+' '+date.getFullYear());
                        //splits[i]);
                    };
                    return _a;
                }
            },
            {
                space: 24,
                size: 80,
                values: (u, vals) => vals.map(

                    function(currentValue, index, arr) {
                        if (Math.abs(parseInt(u.scales.y.max))>2000 || Math.abs(parseInt(u.scales.y.min)) >2000 || ((Math.abs(parseInt(u.scales.y.min))+Math.abs(parseInt(u.scales.y.max)))>4000))
                         return  (currentValue / 1000) + "K";
                      else
                            return currentValue;
                    },u

                )
            }
        ],
        cursor: {
            lock: false,
            sync: {
                key: "eod", setSeries: false,
            },
            drag: { dist: 20, setScale: true, x: true }
        },
        scales: {
            x: {
                range: (self, newMin, newMax) => {
                    // console.log(self, newMin, newMax);
                    let curMin = self.scales.x.min;
                    let curMax = self.scales.x.max;

                    // prevent zoom
                    if (newMin / newMax > 0.9999)
                        return [curMin, curMax];

                    // allow zoom
                    return [newMin, newMax];
                }
            }
        },
        legend: {
            show: true
        },
        series: [
            {
                label: "Date",
                value: (u, v) => v == null ? "-" : new Date(v * 1000).toISOString().split("T")[0]
            }
        ]
    };

    // dynamic bates
    var labelName;
    for (var x = 1; x < keys.length; x++) {
        labelName = keys[x].toLowerCase();

        ops.series.push(
            {
                label: CFL(labelName),
                stroke: (colors[labelName] !== undefined) ? colors[labelName] : colors.other[x - 1],
                spanGaps: (u, gaps) => spanGaps ? gaps : [],
                value: (u, v) => v == null ? "-" : v.toFixed(decimalNumber),
                points: {
                    show: false
                }
            }
        );

        if (labelName.toLowerCase() == "close")
            ops.series[ops.series.length - 1].fill = "rgba(5, 141, 199, 0.1)";

        if (labelName.toLowerCase() == "adjusted_close") {
            ops.series[ops.series.length - 1].label = "Adj Cl.";
            ops.series[ops.series.length - 1].show = false;
        }
    }

    console.log(ops);
    lineschart = new uPlot(ops, data, $('#top-chart')[0]);

    var leg = lineschart.root.querySelector(".u-legend");
    for (var i in lineschart.series) {
        if (lineschart.series[i].show) {
            if (lineschart.series[i].stroke !== undefined) {
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css({"background-color": lineschart.series[i].stroke});
            }
        } else {
            if (lineschart.series[i].stroke !== undefined) {
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css("background-color", "none");
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css("border-color", lineschart.series[i].stroke);
            }
        }
    }

    $(lineschart.root.querySelector(".u-legend")).appendTo('#legend-chart .uplot');
    window.addEventListener("resize",throttle(()=>{
        if (getParameterByName("tab") == "chart" && $('#top-chart').width() > 10)
            lineschart.setSize(getSize('#top-chart'));
    }, 100));

    /*============== Candles Chart ==============*/

    openIdx = keys.findIndex(item => "open" === item.toLowerCase());
    highIdx = keys.findIndex(item => "high" === item.toLowerCase());
    lowIdx = keys.findIndex(item => "low" === item.toLowerCase());
    closeIdx = keys.findIndex(item => "close" === item.toLowerCase());
    candleActive = (openIdx !== -1 && highIdx !== -1 && lowIdx !== -1 && closeIdx !== -1);

    if (candleActive) {
        // converts the legend into a simple tooltip
        function legendAsTooltipPlugin({className, style = {backgroundColor: "rgba(255, 249, 196, 0.92)", color: "black"}} = {}) {
            var legendEl;

            function init(u, opts) {
                legendEl = u.root.querySelector(".u-legend");
                $(legendEl).removeClass("inline");
                $(legendEl).addClass("hidden");
                className && $(legendEl).addClass(className);

                uPlot.assign(legendEl.style, {
                    textAlign: "left",
                    pointerEvents: "none",
                    display: "none",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 100,
                    boxShadow: "2px 2px 10px rgba(0,0,0,0.5)",
                    ...style
                });

                // hide series color markers
                const idents = legendEl.querySelectorAll(".ident");

                for (var i = 0; i < idents.length; i++)
                    idents[i].style.display = "none";

                const overEl = u.root.querySelector(".u-over");
                overEl.style.overflow = "visible";

                // move legend into plot bounds
                overEl.appendChild(legendEl);

                // show/hide tooltip on enter/exit
                overEl.addEventListener("mouseenter", () => {
                    setTimeout(() => { legendEl.style.display = null; }, 100)
                });
                overEl.addEventListener("mouseleave", () => {
                    legendEl.style.display = "none";
                });
                // var tooltip exit plot
                // overEl.style.overflow = "visible";
            }
            function update(u) {
                const {left, top} = u.cursor;
                legendEl.style.transform = "translate(" + left + "px, " + 0 + "px)";
            }
            return { hooks: { init: init, setCursor: update } };
        }


        // draws candlestick symbols (expects data in OHLC order)
        function candlestickPlugin({gap = 10, bearishShadowColor = "#980C13", bullishShadowColor = "#245423", bearishColor = "#e54245", bullishColor = "#4ab650", bodyMaxWidth = 10, shadowWidth = 1, bodyOutline = 1} = {}) {

            function drawCandles(c) {
                c.ctx.save();

                const offset = (shadowWidth % 2) / 2;
                c.ctx.translate(offset, offset);

                var [minV, maxV] = c.series[0].idxs;

                for (var i = minV; i <= maxV; i++) {
                    var open = data[openIdx][i];
                    var high = data[highIdx][i];
                    var low = data[lowIdx][i];
                    var close = data[closeIdx][i];

                    var timeAsX = c.valToPos(c.scales.x.distr == 2 ? i : c.data[0][i], "x", true);
                    var lowAsY = c.valToPos(low, "y", true);
                    var highAsY = c.valToPos(high, "y", true);
                    var openAsY = c.valToPos(open, "y", true);
                    var closeAsY = c.valToPos(close, "y", true);

                    // shadow rect
                    var shadowHeight = Math.max(highAsY, lowAsY) - Math.min(highAsY, lowAsY);
                    var shadowX = timeAsX - (shadowWidth / 2);
                    var shadowY = Math.min(highAsY, lowAsY);

                    c.ctx.fillStyle = open > close ? bearishShadowColor : bullishShadowColor;
                    c.ctx.fillRect(
                        Math.round(shadowX),
                        Math.round(shadowY),
                        Math.round(shadowWidth),
                        Math.round(shadowHeight),
                    );

                    // body rect
                    var columnWidth = c.bbox.width / (maxV - minV);
                    var bodyWidth = Math.min(bodyMaxWidth, columnWidth - gap);
                    var bodyHeight = Math.max(closeAsY, openAsY) - Math.min(closeAsY, openAsY);
                    var bodyX = timeAsX - (bodyWidth / 2);
                    var bodyY = Math.min(closeAsY, openAsY);
                    var bodyColor = open > close ? bearishColor : bullishColor;

                    c.ctx.fillStyle = open > close ? bearishShadowColor : bullishShadowColor;
                    c.ctx.fillRect(
                        Math.round(bodyX),
                        Math.round(bodyY),
                        Math.round(bodyWidth),
                        Math.round(bodyHeight),
                    );

                    c.ctx.fillStyle = bodyColor;
                    c.ctx.fillRect(
                        Math.round(bodyX + bodyOutline),
                        Math.round(bodyY + bodyOutline),
                        Math.round(bodyWidth - bodyOutline * 2),
                        Math.round(bodyHeight - bodyOutline * 2),
                    );
                }

                c.ctx.translate(-offset, -offset);
                c.ctx.restore();
            }

            return {
                opts: (u, opts) => {
                    uPlot.assign(opts, {
                        cursor: {
                            points: {
                                show: false,
                            }
                        }
                    });

                    opts.series.forEach(series => {
                        series.paths = () => null;
                        series.points = {show: false};
                    });
                },
                hooks: {
                    draw: drawCandles,
                }
            };
        }

        var candleData = [
            data[0],
            data[openIdx],
            data[highIdx],
            data[lowIdx],
            data[closeIdx]
        ];

        var ops2 = {
            id: "bigChart2",
            width: $('#top-chart').width(),
            height: $('#top-chart').height(),
            plugins: [ legendAsTooltipPlugin(), candlestickPlugin(), ],
            legend: { show: true },
            series: [
                {
                    label: "Date",
                    value: (c, v) => v == null ? "-" : new Date(v * 1000).toISOString().split("T")[0]
                },
                {
                    label: "Open",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "High",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "Low",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "Close",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
            ],
            scales: {
                x: {
                    range: (self, newMin, newMax) => {
                        let curMin = self.scales.x.min;
                        let curMax = self.scales.x.max;
                        // prevent zoom
                        if (newMin / newMax > 0.9999)
                            return [curMin, curMax];
                        // allow zoom
                        return [newMin, newMax];
                    }
                }
            },
            axes: [
                { space: 100, size: 12, values: () => [] },
                {
                    space: 24, size: 80,
                    values: (c, vals) => vals.map(
                        function(currentValue, index, arr) {
                            if (Math.abs(parseInt(c.scales.y.max))>2000 || Math.abs(parseInt(c.scales.y.min)) >2000 || ((Math.abs(parseInt(c.scales.y.min))+Math.abs(parseInt(c.scales.y.max)))>4000))
                                return  (currentValue / 1000) + "K";
                            else
                                return currentValue;
                        },c
                    )
                }
            ],
            cursor: {
                lock: false,
                sync: {
                    key: "eod", setSeries: false,
                },
                points: { show: false,},
                drag: { dist: 20, setScale: true, x: true }
            }
        };
        candlechart = new uPlot(ops2, candleData, $('#top-chart')[0]);
        candlechart.root.style.display = 'none';
        window.addEventListener("resize", throttle(() => {
            if (getParameterByName("tab") == "chart" && $('#top-chart').width() > 10)
                candlechart.setSize(getSize('#top-chart'))
        }, 100));
    }


    /*============== Columns Chart =============*/
    if (volumeActive) {
        function seriesBarsPlugin(opts) {
            const barWidth = Math.round(2 * devicePixelRatio);
            const margin = 0.5;

            function drawThings(u, sidx, i0, i1, draw) {
                const s = u.series[sidx];
                const xdata = u.data[0];
                const ydata = u.data[sidx];
                const scaleX = 'x';
                const scaleY = s.scale;

                const totalWidth = (u.series.length - 1) * barWidth;
                const offs = (sidx - 1) * barWidth;

                for (var i = i0; i <= i1; i++) {
                    var x0 = Math.round(u.valToPos(xdata[i], scaleX, true));
                    var y0 = Math.round(u.valToPos(ydata[i], scaleY, true));

                    draw(i, x0, y0, offs, (i == 0) ? totalWidth / 2 : (i == i1) ? totalWidth * 2 : totalWidth);
                }
            }

            function drawBars(u, sidx, i0, i1) {
                const scaleY = u.series[sidx].scale;
                const zeroY = Math.round(u.valToPos(0, scaleY, true));
                const fill = new Path2D();

                drawThings(u, sidx, i0, i1, (i, x0, y0, offs, totalWidth) => {
                    fill.rect(
                        x0 - totalWidth / 2 + offs,
                        y0,
                        barWidth,
                        zeroY - y0
                    );
                });

                return {fill};
            }

            return {
                opts: (u, opts) => {
                    opts.series.forEach((s, i) => {
                        if (i > 0 && i !== 0) {
                            uPlot.assign(s, {
                                width: 0,
                                paths: drawBars,
                                points: {
                                    show: false
                                }
                            });
                        }
                    });

                }
            };
        }

        var ops3 = {
            id: "bigChart3",
            width: $('#bottom-chart').width(),
            height: $('#bottom-chart').height(),
            axes: [
                {
                    space: 100,
                    ticks: {
                        show: true,
                        stroke: "#eee",
                        width: 2,
                        dash: [10],
                        size: 10,
                    },
                    values: (self,splits) => {
                        var _a = [];
                        for(var i=0;i<splits.length;i++){
                            var date = new Date(splits[i]*1000);
                            var shorthMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
							var month = shorthMonths[date.getMonth()], day = ('0'+date.getDate()+'').slice(-2);
                            _a.push(day+'-'+month+'-'+date.getFullYear().toString().substring(2));
							//dates.length > 60 ? _a.push(month+' '+date.getFullYear()) : _a.push(day+' '+month+' '+date.getFullYear());
                            //splits[i]);
                        };
                        return _a;
                    }
                    /*,
                    values: [
                        [3600 * 24 * 365, "{YYYY}"],
                        [3600 * 24 * 28, "{MMM}"],
                        [3600 * 24, "{D} {MMM}"],
                        [3600, "{h}{aa}"],
                        [60, "{h}:{mm}{aa}"],
                        [1, "{h}:{mm}:{ss}{aa}"],
                    ]*/
                },
                {
                    space: 20,
                    size: 80,
                    values: (u, vals) => vals.map(
                        function(currentValue, index, arr) {
                            if (Math.abs(parseInt(u.scales.y.max))>2000 || Math.abs(parseInt(u.scales.y.min)) >2000 || ((Math.abs(parseInt(u.scales.y.min))+Math.abs(parseInt(u.scales.y.max)))>4000))
                                return  (currentValue / 1000) + "K";
                            else
                                return currentValue;
                        },u
                    )
                }
            ],
            cursor: {
                lock: false,
                sync: { key: "eod", setSeries: false, },
                drag: { dist: 20, setScale: true, x: true }
            },
            series: [
                {},
                {
                    label: "Vol",
                    fill: "rgb(250, 143, 149)",
                    stroke: "rgb(252, 177, 182)"
                },
                {
                    label: "Volume up",
                    fill: "rgb(183, 214, 180)",
                    stroke: "rgb(159, 200, 155)"
                }
            ],
            scales: {
                x: {
                    range: (self, newMin, newMax) => {
                        let curMin = self.scales.x.min;
                        let curMax = self.scales.x.max;

                        // prevent zoom
                        if (newMin / newMax > 0.9999)
                            return [curMin, curMax];

                        // allow zoom
                        return [newMin, newMax];
                    }
                }
            },
            plugins: [
                seriesBarsPlugin(),
            ],
        };

        volumechart = new uPlot(ops3, colData, $("#bottom-chart")[0]);

        var leg = volumechart.root.querySelector(".u-legend");
        $(leg).find('.series:last-child').hide();

        for (var i in volumechart.series) {
            if (volumechart.series[i].show) {
                if (volumechart.series[i].stroke !== undefined) {
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css({"background-color": volumechart.series[i].stroke, "border-color": volumechart.series[i].stroke});
                }
            } else {
                if (volumechart.series[i].stroke !== undefined) {
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css("background-color", "none");
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css("border-color", volumechart.series[i].stroke);
                }
            }
        }
        $(volumechart.root.querySelector(".u-legend")).find('.series:nth-of-type(1)').remove();
        $(volumechart.root.querySelector(".u-legend")).appendTo('#legend-chart .uplot');

        window.addEventListener("resize", throttle(() => {

            if ($('#bottom-chart').css("display") !== "none" && getParameterByName("tab") == "chart" && $('#bottom-chart').width() > 10)
                volumechart.setSize(getSize('#bottom-chart'));

        }, 100));
    }


    /*============ cursor ===========*/

    var y = lineschart.root.querySelector(".u-cursor-y");
    var plot = lineschart.root.querySelector(".u-over");

    if (volumeActive) {
        var y2 = volumechart.root.querySelector(".u-cursor-y");
        var plot2 = volumechart.root.querySelector(".u-over");
    }
    if (candleActive) {
        var y3 = candlechart.root.querySelector(".u-cursor-y");
        var plot3 = candlechart.root.querySelector(".u-over");
    }

    $(plot).hover(
        () => {
            y.style.display = "block";
            if (volumeActive) y2.style.display = "none";
            if (candleActive) y3.style.display = "none";
        },
        () => {
            y.style.display = "none";
            if (volumeActive) y2.style.display = "block";
            if (candleActive) y3.style.display = "none";
        });

    if (volumeActive) {
        $(plot2).hover(
            () => {
                y.style.display = "none";
                if (volumeActive) y2.style.display = "block";
                if (candleActive) y3.style.display = "none";
            },
            () => {
                y.style.display = "block";
                if (volumeActive) y2.style.display = "none";
                if (candleActive) y3.style.display = "block";
            });
    }

    if (candleActive) {
        $(plot3).hover(
            () => {
                y.style.display = "none";
                if (volumeActive) y2.style.display = "none";
                if (candleActive) y3.style.display = "block";
            },
            () => {
                y.style.display = "none";
                if (volumeActive) y2.style.display = "block";
                if (candleActive) y3.style.display = "none";
            });
    }


    /*============= resize the chart =============*/

    if (volumeActive) {
        $('#top-chart').resizable({
            handles: "s",
            minHeight: 50,
            maxHeight: $('#chart').height() - 200,
            resize: function (e, ui) {
                lineschart.setSize({
                    width: lineschart.width,
                    height: ui.size.height
                });

                if (candleActive)
                    candlechart.setSize({
                        width: lineschart.width,
                        height: ui.size.height
                    });

                if (volumeActive)
                    volumechart.setSize({
                        width: volumechart.width,
                        height: $('#chart').height() - ui.size.height - 103
                    });

                $("#top-chart").height(ui.size.height);
                $("#bottom-chart").height($('#chart').height() - ui.size.height - 103);
            },
            stop: function () {
                window.dispatchEvent(new Event('resize'));
            }
        });
    }


    /*========== legends ===========*/

    $("#legend-chart .u-legend .series th").on('click', function (e) {
        if ($(this).parent().hasClass('off')) {
            $(this).find('.ident').css({"background-color": "transparent"});
        } else {
            $(this).find('.ident').css({"background-color": $(this).find('.ident').css("border-color")});
        }
    });

    $("#legend-chart .u-legend:nth-of-type(2) .series:nth-of-type(1) th").on('click', function (e) {
        $("#legend-chart .u-legend:nth-of-type(2) .series:nth-of-type(2) th").click();
        if ($("#legend-chart .u-legend:nth-of-type(2) .series:nth-of-type(1)").hasClass("off")) {
            lastHeight = $("#bottom-chart").height();
            $("#bottom-chart").hide();
            $("#top-chart").css("height", "calc(100% - 95px)");
            $('#top-chart').resizable('disable');
            showVals = true;
            lineschart.axes[0].size = 50;
            lineschart.redraw();
        } else {
            $("#top-chart").height($("#chart").height() - lastHeight - 100);
            $('#top-chart').resizable('enable');
            $("#bottom-chart").show();
            showVals = false;
            lineschart.axes[0].size = 12;
            lineschart.redraw();
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 1);
    });

    /*========== chart zoom for big chart ===========*/
    var ops4 = {
        id: "bigZoom",
        width: $('#top-chart').width() - 95,
        height: 45,
        left:80,
        axes: [ {show: false}, {show: true} ],
        legend: {show: false},
        cursor: {show: false},
        series: [
            {},
            {
                stroke: "rgba(5, 141, 199, 1)",
                fill: "rgba(5, 141, 199, 0.1)",
                points: { show: false }
            }
        ],
    }
    zoomchart = new uPlot(ops4, data, $("#zoom-chart")[0]);
    window.addEventListener("resize", throttle(() => {

        if (getParameterByName("tab") == "chart" && $('#top-chart').width() > 10) {
            let old_size = zoomchart.width,
                old_position = $(".zoom-panel")[0].offsetLeft,
                panel_width = $(".zoom-panel").width();
            zoomchart.setSize(getSize('#top-chart', 45, $('#top-chart').width() - 95));
            let new_size = zoomchart.width;
            $(".zoom-panel").width((panel_width / old_size) * new_size);
            $(".zoom-panel").css("left", (old_position / old_size) * new_size);
        }

    }, 100));

    var xMin = lineschart.scales.x.min;
    var xMax = lineschart.scales.x.max;
    /*
    lineschart.setScale("x", {
        min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
        max: xMax
    });

    if (candleActive)
        candlechart.setScale("x", {
            min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
            max: xMax
        });

    if (volumeActive)
        volumechart.setScale("x", {
            min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
            max: xMax
        });
    */
    $('.zoom-panel')
        .draggable({
            containment: "parent",
            axis: "x",
            drag: function (e, ui) {
                lineschart.batch(() => {
                    lineschart.setScale("x", {
                        min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                        max: (((ui.position.left + $(this).width()) * (xMax - xMin)) / $(this).parent().width()) + xMin
                    });
                });

                if (candleActive)
                    candlechart.batch(() => {
                        candlechart.setScale("x", {
                            min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                            max: (((ui.position.left + $(this).width()) * (xMax - xMin)) / $(this).parent().width()) + xMin
                        });
                    });

                if (volumeActive)
                    volumechart.batch(() => {
                        volumechart.setScale("x", {
                            min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                            max: (((ui.position.left + $(this).width()) * (xMax - xMin)) / $(this).parent().width()) + xMin
                        });
                    });
            }
        })
        .resizable({
            handles: "e, w",
            containment: "parent",
            resize: function (e, ui) {
                lineschart.batch(() => {
                    lineschart.setScale("x", {
                        min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                        max: (((ui.position.left + ui.size.width) * (xMax - xMin)) / $(this).parent().width()) + xMin
                    });
                });

                if (candleActive)
                    candlechart.batch(() => {
                        candlechart.setScale("x", {
                            min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                            max: (((ui.position.left + ui.size.width) * (xMax - xMin)) / $(this).parent().width()) + xMin
                        });
                    });

                if (volumeActive)
                    volumechart.batch(() => {
                        volumechart.setScale("x", {
                            min: ((ui.position.left * (xMax - xMin)) / $(this).parent().width()) + xMin,
                            max: (((ui.position.left + ui.size.width) * (xMax - xMin)) / $(this).parent().width()) + xMin
                        });
                    });
            }
        });

    $(plot).on('mouseup', function () {
        changeRange(lineschart, 'zoom-panel', xMin, xMax)
    });
    if (candleActive) $(plot2).on('mouseup', function () {
        changeRange(lineschart, 'zoom-panel', xMin, xMax)
    });
    if (volumeActive) $(plot3).on('mouseup', function () {
        changeRange(lineschart, 'zoom-panel', xMin, xMax)
    });


    /*============== Chart Menu =============*/

    var contextMenuChart = $("#jqxgridMenuChart").jqxMenu({theme: 'light', width: 180, height: (candleActive) ? 120 : 88, autoOpenPopup: false, mode: 'popup'});
    if (!candleActive) $("#jqxgridMenuChart ul li:first-child").remove();

    contextMenuChart.on('itemclick', function (event) {

        var args = event.args;

        switch ($.trim($(args).text())) {
            case "Candlestick":
                if (candleActive) {
                    var isChecked = ($('.chart-candlestick').css("display") == "none");
                    $('.chart-candlestick').toggle(isChecked);
                    if (isChecked) {
                        lineschart.root.style.display = 'none';
                        candlechart.root.style.display = 'block';

                        if (linessubchart !== undefined) {
                            linessubchart.root.style.display = 'none';
                            candlesubchart.root.style.display = 'block';
                        }
                    } else {
                        candlechart.root.style.display = 'none';
                        lineschart.root.style.display = 'block';

                        if (linessubchart !== undefined) {
                            candlesubchart.root.style.display = 'none';
                            linessubchart.root.style.display = 'block';
                        }
                    }
                }
                break;

            case "Hide missing values":
                var isChecked = ($('.chart-missing').css("display") == "none");
                $('.chart-missing').toggle(isChecked);
                spanGaps = isChecked;
                var min = lineschart.scales.x.min;
                var max = lineschart.scales.x.max;
                lineschart.setData(data);
                lineschart.setScale("x", {
                    min: min,
                    max: max
                });
                break;

            case "Hints":
                var isChecked = ($('.chart-hints').css("display") == "none");
                $('.chart-hints').toggle(isChecked);

                if (candleActive) {
                    candlechart.root.querySelector(".u-legend").style.visibility = isChecked ? "visible" : "hidden";

                    if (candlesubchart !== undefined)
                        candlesubchart.root.querySelector(".u-legend").style.visibility = isChecked ? "visible" : "hidden";
                }
                break;

            case "Zoom Reset":
                lineschart.setData(data);
                zoomchart.setData(data);
                $('.zoom-panel').css({left: 0, width: "100%"});

                if (linessubchart !== undefined) {
                    linessubchart.setData(data);
                    zoomsubchart.setData(data);
                    $('.zoom-subpanel').css({left: 0, width: "100%"});
                }

                if (candleActive) {
                    candlechart.setData(candleData);

                    if (candlesubchart !== undefined)
                        candlesubchart.setData(candleData);
                }
                break;
        }
    });

    lineschart.root.querySelector('.u-over').oncontextmenu = function (event) {
        var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
        contextMenuChart.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
        return false;
    };

    if (candleActive)
        candlechart.root.querySelector('.u-over').oncontextmenu = function (event) {
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            contextMenuChart.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
            return false;
        };

    if (linessubchart !== undefined) {
        $('.chart-candlestick').toggle(linessubchart.root.style.visibility == "hidden");
        lineschart.root.style.visibility = linessubchart.root.style.visibility;
        if (candleActive) {
            candlechart.root.style.visibility = candlesubchart.root.style.visibility;
            $('.chart-hints').toggle(candlesubchart.root.querySelector(".u-legend").style.visibility !== "hidden");
            candlechart.root.querySelector(".u-legend").style.visibility == candlesubchart.root.querySelector(".u-legend").style.visibility
        }
    } else {
        if (candleActive)
            candlechart.root.querySelector(".u-legend").style.visibility = "hidden";

        $('.chart-hints').toggle(false);
    }
}

function createSubChart(rowsData) {
    let data = prepareData(rowsData);

    volIdx = keys.findIndex(item => "volume" === item.toLowerCase());
    volumeActive = (volIdx !== -1);

    if (volumeActive) {
        // Prepare the data for volume chart
        var volumeColorGreen = [];
        var volumeColorRed = [];

        data[volIdx].map(function (v, i) {
            if (i !== 0) {
                if (data[volIdx][i - 1] < v) {
                    volumeColorGreen.push(v);
                    volumeColorRed.push(null);
                } else {
                    volumeColorGreen.push(null);
                    volumeColorRed.push(v);
                }
                ;
            } else {
                volumeColorGreen.push(v);
                volumeColorRed.push(null);
            }
        });

        var colData = [
            data[0],
            volumeColorRed,
            volumeColorGreen
        ];
        data.splice(volIdx, 1);
        keys.splice(volIdx, 1);
    } else {
        $("#top-subchart").css("height", "calc(100% - 95px)");
        $("#bottom-subchart").hide();
        subShowVals = true;
    }

    /*============== Series Chart =============*/

    var ops_sub = {
        class: "smallChart",
        width: 560,
        height: $('#top-subchart').height(),
        hooks: {
            init: [
                u => {
                    let timeAxisVals = u.axes[0].values;
                    u.axes[0].values = (...args) => subShowVals ? timeAxisVals(...args) : [];
                }
            ]
        },
        axes: [
            {
                space: 100,
                size: volumeActive ? 12 : 50,
                ticks: {
                    show: true,
                    stroke: "#eee",
                    width: 2,
                    dash: [10],
                    size: 10,
                },
                values: (self,splits) => {
                    var _a = [];
                    for(var i=0;i<splits.length;i++){
                        var date = new Date(splits[i]*1000);
                        var shorthMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        var month = shorthMonths[date.getMonth()], day = ('0'+date.getDate()+'').slice(-2);
                        _a.push(day+'-'+month+'-'+date.getFullYear().toString().substring(2));
                        //dates.length > 60 ? _a.push(month+' '+date.getFullYear()) : _a.push(day+' '+month+' '+date.getFullYear());
                        //splits[i]);
                    };
                    return _a;
                }
                /*
                values: [
                    [3600 * 24 * 365, "{YYYY}", 7, "{YYYY}"],
                    [3600 * 24 * 28, "{MMM}", 7, "{MMM}\n{YYYY}"],
                    [3600 * 24, "{D} {MMM}", 7, "{D} {MMM}\n{YYYY}"],
                    [3600, "{h}{aa}", 4, "{h}{aa}\n{M}/{D}"],
                    [60, "{h}:{mm}{aa}", 4, "{h}:{mm}{aa}\n{M}/{D}"],
                    [1, "{h}:{mm}:{ss}{aa}", 4, "{h}:{mm}:{ss}{aa}\n{M}/{D}"],
                ]*/
            },
            {
                space: 24,
                size: 80,
                values: (u, vals) => vals.map(
                    function(currentValue, index, arr) {
                        if (Math.abs(parseInt(u.scales.y.max))>2000 || Math.abs(parseInt(u.scales.y.min)) >2000 || ((Math.abs(parseInt(u.scales.y.min))+Math.abs(parseInt(u.scales.y.max)))>4000))
                            return  (currentValue / 1000) + "K";
                        else
                            return currentValue;
                    },u
                )
            }
        ],
        scales: {
            x: {
                range: (self, newMin, newMax) => {
                    let curMin = self.scales.x.min;
                    let curMax = self.scales.x.max;

                    // prevent zoom
                    if (newMin / newMax > 0.9999)
                        return [curMin, curMax];

                    // allow zoom
                    return [newMin, newMax];
                }
            }
        },
        cursor: {
            lock: false,
            sync: { key: "subeod", setSeries: false, },
            drag: { dist: 20, setScale: true, x: true }
        },
        legend: { show: true },
        series: [{ 
                    label: "Date", 
                    value: (u, v) => v == null ? "-" : new Date(v * 1000).toISOString().split("T")[0]
                }
        ]
    };

    // dynamic bates
    var labelName;
    for (var x = 1; x < keys.length; x++) {
        labelName = keys[x].toLowerCase();

        ops_sub.series.push(
            {
                label: CFL(labelName),
                stroke: (colors[labelName] !== undefined) ? colors[labelName] : colors.other[x - 1],
                spanGaps: (u, gaps) => subSpanGaps ? gaps : [],
                value: (u, v) => v == null ? "-" : v.toFixed(decimalNumber),
                points: {
                    show: false
                }
            }
        );

        if (labelName.toLowerCase() == "close")
            ops_sub.series[ops_sub.series.length - 1].fill = "rgba(5, 141, 199, 0.1)";

        if (labelName.toLowerCase() == "adjusted_close") {
            ops_sub.series[ops_sub.series.length - 1].label = "Adj Cl.";
            ops_sub.series[ops_sub.series.length - 1].show = false;
        }
    }

    linessubchart = new uPlot(ops_sub, data, $('#top-subchart')[0]);


    var leg = linessubchart.root.querySelector(".u-legend");
    for (var i in linessubchart.series) {
        if (linessubchart.series[i].show) {
            if (linessubchart.series[i].stroke !== undefined) {
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css({"background-color": linessubchart.series[i].stroke});
            }
        } else {
            if (linessubchart.series[i].stroke !== undefined) {
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css("background-color", "none");
                $(leg).find('.series').eq(parseInt(i)).find('.ident').css("border-color", linessubchart.series[i].stroke);
            }
        }
    }

    $(linessubchart.root.querySelector(".u-legend")).appendTo('#legend-subchart .uplot');
    window.addEventListener("resize", throttle(() => {

        if (getParameterByName("tab") == "prices" && $('#top-subchart').width() > 10)
            linessubchart.setSize(getSize('#top-subchart'));

    }, 100));

    /*============== Candles Chart ==============*/

    openIdx = keys.findIndex(item => "open" === item.toLowerCase());
    highIdx = keys.findIndex(item => "high" === item.toLowerCase());
    lowIdx = keys.findIndex(item => "low" === item.toLowerCase());
    closeIdx = keys.findIndex(item => "close" === item.toLowerCase());

    candleActive = (openIdx !== -1 && highIdx !== -1 && lowIdx !== -1 && closeIdx !== -1);

    if (candleActive) {
        // converts the legend into a simple tooltip
        function legendAsTooltipPluginSub({className, style = {backgroundColor: "rgba(255, 249, 196, 0.92)", color: "black"}} = {}) {
            var legendEl;

            function init(u, opts) {
                legendEl = u.root.querySelector(".u-legend");

                $(legendEl).removeClass("inline");
                $(legendEl).addClass("hidden");
                className && $(legendEl).addClass(className);

                uPlot.assign(legendEl.style, {
                    textAlign: "left",
                    pointerEvents: "none",
                    display: "none",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 100,
                    boxShadow: "2px 2px 10px rgba(0,0,0,0.5)",
                    ...style
                });

                // hide series color markers
                const idents = legendEl.querySelectorAll(".ident");

                for (var i = 0; i < idents.length; i++)
                    idents[i].style.display = "none";

                const overEl = u.root.querySelector(".u-over");
                overEl.style.overflow = "visible";

                // move legend into plot bounds
                overEl.appendChild(legendEl);

                // show/hide tooltip on enter/exit
                overEl.addEventListener("mouseenter", () => {
                    setTimeout(() => {
                        legendEl.style.display = null;
                    }, 100)
                });
                overEl.addEventListener("mouseleave", () => {
                    legendEl.style.display = "none";
                });

                // var tooltip exit plot
                //	overEl.style.overflow = "visible";
            }
            function update(u) {
                const {left, top} = u.cursor;
                legendEl.style.transform = "translate(" + left + "px, " + top + "px)";
            }
            return {
                hooks:  { init: init, setCursor: update,
                            ready:[()=>{ initialise_chart_for_click(); }],
                            setSize:[()=>{
                                initialise_chart_for_click()
                            }]
                        }
            };
        }

        // draws candlestick symbols (expects data in OHLC order)
        function candlestickPluginSub({gap = 10, bearishShadowColor = "#980C13", bullishShadowColor = "#245423", bearishColor = "#e54245", bullishColor = "#4ab650", bodyMaxWidth = 10, shadowWidth = 1, bodyOutline = 1} = {}) {

            function drawCandles(c) {
                c.ctx.save();

                const offset = (shadowWidth % 2) / 2;
                c.ctx.translate(offset, offset);

                var [minV, maxV] = c.series[0].idxs;

                for (var i = minV; i <= maxV; i++) {
                    var open = data[openIdx][i];
                    var high = data[highIdx][i];
                    var low = data[lowIdx][i];
                    var close = data[closeIdx][i];

                    var timeAsX = c.valToPos(c.scales.x.distr == 2 ? i : c.data[0][i], "x", true);
                    var lowAsY = c.valToPos(low, "y", true);
                    var highAsY = c.valToPos(high, "y", true);
                    var openAsY = c.valToPos(open, "y", true);
                    var closeAsY = c.valToPos(close, "y", true);


                    // shadow rect
                    var shadowHeight = Math.max(highAsY, lowAsY) - Math.min(highAsY, lowAsY);
                    var shadowX = timeAsX - (shadowWidth / 2);
                    var shadowY = Math.min(highAsY, lowAsY);

                    c.ctx.fillStyle = open > close ? bearishShadowColor : bullishShadowColor;
                    c.ctx.fillRect(
                        Math.round(shadowX),
                        Math.round(shadowY),
                        Math.round(shadowWidth),
                        Math.round(shadowHeight),
                    );

                    // body rect
                    var columnWidth = c.bbox.width / (maxV - minV);
                    var bodyWidth = Math.min(bodyMaxWidth, columnWidth - gap);
                    var bodyHeight = Math.max(closeAsY, openAsY) - Math.min(closeAsY, openAsY);
                    var bodyX = timeAsX - (bodyWidth / 2);
                    var bodyY = Math.min(closeAsY, openAsY);
                    var bodyColor = open > close ? bearishColor : bullishColor;

                    c.ctx.fillStyle = open > close ? bearishShadowColor : bullishShadowColor;
                    c.ctx.fillRect(
                        Math.round(bodyX),
                        Math.round(bodyY),
                        Math.round(bodyWidth),
                        Math.round(bodyHeight),
                    );

                    c.ctx.fillStyle = bodyColor;
                    c.ctx.fillRect(
                        Math.round(bodyX + bodyOutline),
                        Math.round(bodyY + bodyOutline),
                        Math.round(bodyWidth - bodyOutline * 2),
                        Math.round(bodyHeight - bodyOutline * 2),
                    );
                }

                c.ctx.translate(-offset, -offset);
                c.ctx.restore();
            }

            return {
                opts: (u, opts) => {
                    uPlot.assign(opts, {
                        cursor: {
                            points: {
                                show: false,
                            }
                        }
                    });

                    opts.series.forEach(series => {
                        series.paths = () => null;
                        series.points = {show: false};
                    });
                },
                hooks: {
                    draw: drawCandles,
                }
            };
        }

        var candleData = [
            data[0],
            data[openIdx],
            data[highIdx],
            data[lowIdx],
            data[closeIdx]
        ];

        var ops2_sub = {
            class: "smallChart",
            width: 560,
            height: $('#top-subchart').height(),
            plugins: [
                legendAsTooltipPluginSub(),
                candlestickPluginSub(),
            ],
            legend: {
                show: true
            },
            series: [
                {
                    label: "Date",
                    value: (c, v) => v == null ? "-" : new Date(v * 1000).toISOString().split("T")[0]
                },
                {
                    label: "Open",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "High",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "Low",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
                {
                    label: "Close",
                    value: (c, v) => v == null ? "-" : v.toFixed(decimalNumber),
                },
            ],
            axes: [
                {
                    space: 100,
                    size: 12,
                    values: (self,splits) => {
                        var _a = [];
                        for(var i=0;i<splits.length;i++){
                            var date = new Date(splits[i]*1000);
                            var shorthMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
							var month = shorthMonths[date.getMonth()], day = ('0'+date.getDate()+'').slice(-2);
                            _a.push(day+'-'+month+'-'+date.getFullYear().toString().substring(2));
							//dates.length > 60 ? _a.push(month+' '+date.getFullYear()) : _a.push(day+' '+month+' '+date.getFullYear());
                            //splits[i]);
                        };
                        return _a;
                    }
                },
                {
                    space: 24,
                    size: 80,
                    values: (c, vals) => vals.map(
                        function(currentValue, index, arr) {
                            if (Math.abs(parseInt(c.scales.y.max))>2000 || Math.abs(parseInt(c.scales.y.min)) >2000 || ((Math.abs(parseInt(c.scales.y.min))+Math.abs(parseInt(c.scales.y.max)))>4000))
                                return  (currentValue / 1000) + "K";
                            else
                                return currentValue;
                        },c
                    )
                }
            ],
            scales: {
                x: {
                    range: (self, newMin, newMax) => {
                        let curMin = self.scales.x.min;
                        let curMax = self.scales.x.max;

                        // prevent zoom
                        if (newMin / newMax > 0.9999)
                            return [curMin, curMax];

                        // allow zoom
                        return [newMin, newMax];
                    }
                }
            },
            cursor: {
                lock: false,
                sync: {
                    key: "subeod",
                    setSeries: false,
                },
                points: {
                    show: false,
                },
                drag: {
                    dist: 20,
                    setScale: true,
                    x: true
                }
            }
        };

        candlesubchart = new uPlot(ops2_sub, candleData, $('#top-subchart')[0]);
        candlesubchart.root.style.display = 'none';
        window.addEventListener("resize", throttle(() => {

            if (getParameterByName("tab") == "prices" && $('#top-subchart').width() > 10)
                candlesubchart.setSize(getSize('#top-subchart'));

        }, 100));

    }


    /*============== Columns Chart =============*/

    if (volumeActive) {
        function seriesBarsPluginSub(opts) {
            const barWidth = Math.round(2 * devicePixelRatio);
            const margin = 0.5;

            function drawThings(u, sidx, i0, i1, draw) {
                const s = u.series[sidx];
                const xdata = u.data[0];
                const ydata = u.data[sidx];
                const scaleX = 'x';
                const scaleY = s.scale;

                const totalWidth = (u.series.length - 1) * barWidth;
                const offs = (sidx - 1) * barWidth;

                for (var i = i0; i <= i1; i++) {
                    var x0 = Math.round(u.valToPos(xdata[i], scaleX, true));
                    var y0 = Math.round(u.valToPos(ydata[i], scaleY, true));

                    draw(i, x0, y0, offs, (i == 0) ? totalWidth / 2 : (i == i1) ? totalWidth * 2 : totalWidth);
                }
            }

            function drawBars(u, sidx, i0, i1) {
                const scaleY = u.series[sidx].scale;
                const zeroY = Math.round(u.valToPos(0, scaleY, true));
                const fill = new Path2D();

                drawThings(u, sidx, i0, i1, (i, x0, y0, offs, totalWidth) => {
                    fill.rect(
                        x0 - totalWidth / 2 + offs,
                        y0,
                        barWidth,
                        zeroY - y0
                    );
                });

                return {fill};
            }

            return {
                opts: (u, opts) => {
                    opts.series.forEach((s, i) => {
                        if (i > 0 && i !== 0) {
                            uPlot.assign(s, {
                                width: 0,
                                paths: drawBars,
                                points: {
                                    show: false
                                }
                            });
                        }
                    });

                }
            };
        }

        var ops3_sub = {
            class: "smallChart",
            width: 560,
            height: $('#bottom-subchart').height(),
            axes: [
                {
                    space: 100,
                    ticks: {
                        show: true,
                        stroke: "#eee",
                        width: 2,
                        dash: [10],
                        size: 10,
                    },
                    values: (self,splits) => {
                        var _a = [];
                        for(var i=0;i<splits.length;i++){
                            var date = new Date(splits[i]*1000);
                            var shorthMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
							var month = shorthMonths[date.getMonth()], day = ('0'+date.getDate()+'').slice(-2);
                            _a.push(day+'-'+month+'-'+date.getFullYear().toString().substring(2));
							//dates.length > 60 ? _a.push(month+' '+date.getFullYear()) : _a.push(day+' '+month+' '+date.getFullYear());
                            //splits[i]);
                        };
                        return _a;
                    }
                },
                {
                    space: 20,
                    size: 80,
                    values: (u, vals) => vals.map(
                        function(currentValue, index, arr) {
                            if (Math.abs(parseInt(u.scales.y.max))>2000 || Math.abs(parseInt(u.scales.y.min)) >2000 || ((Math.abs(parseInt(u.scales.y.min))+Math.abs(parseInt(u.scales.y.max)))>4000))
                                return  (currentValue / 1000) + "K";
                            else
                                return currentValue;
                        },u
                    )
                }
            ],
            cursor: {
                lock: false,
                sync: {
                    key: "subeod",
                    setSeries: false,
                },
                drag: {
                    dist: 20,
                    setScale: true,
                    x: true
                }
            },
            scales: {
                x: {
                    range: (self, newMin, newMax) => {
                        let curMin = self.scales.x.min;
                        let curMax = self.scales.x.max;

                        // prevent zoom
                        if ( newMin/newMax > 0.9999 )
                        return [curMin, curMax];

                        // allow zoom
                        return [newMin, newMax];
                    }
                }
            },
            series: [
                {},
                {
                    label: "Vol",
                    fill: "rgb(250, 143, 149)",
                    stroke: "rgb(252, 177, 182)"
                },
                {
                    label: "Volume up",
                    fill: "rgb(183, 214, 180)",
                    stroke: "rgb(159, 200, 155)"
                }
            ],
            plugins: [
                seriesBarsPluginSub()
            ],
        };

        volumesubchart = new uPlot(ops3_sub, colData, $("#bottom-subchart")[0]);

        var leg = volumesubchart.root.querySelector(".u-legend");
        $(leg).find('.series:last-child').hide();

        for (var i in volumesubchart.series) {
            if (volumesubchart.series[i].show) {
                if (volumesubchart.series[i].stroke !== undefined) {
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css({"background-color": volumesubchart.series[i].stroke, "border-color": volumesubchart.series[i].stroke});
                }
            } else {
                if (volumesubchart.series[i].stroke !== undefined) {
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css("background-color", "none");
                    $(leg).find('.series').eq(parseInt(i)).find('.ident').css("border-color", volumesubchart.series[i].stroke);
                }
            }
        }
        $(volumesubchart.root.querySelector(".u-legend")).find('.series:nth-of-type(1)').remove();
        $(volumesubchart.root.querySelector(".u-legend")).appendTo('#legend-subchart .uplot');

        window.addEventListener("resize", throttle(() => {

            if ($('#bottom-subchart').css("display") !== "none" && getParameterByName("tab") == "prices" && $('#bottom-subchart').width() > 10)
                volumesubchart.setSize(getSize('#bottom-subchart'));

        }, 100));
    }


    /*============ cursor ===========*/

    var ys = linessubchart.root.querySelector(".u-cursor-y");
    var plots = linessubchart.root.querySelector(".u-over");

    if (volumeActive) {
        var y2s = volumesubchart.root.querySelector(".u-cursor-y");
        var plot2s = volumesubchart.root.querySelector(".u-over");
    }

    if (candleActive) {
        var y3s = candlesubchart.root.querySelector(".u-cursor-y");
        var plot3s = candlesubchart.root.querySelector(".u-over");
    }

    $(plots).hover(
        () => {
            ys.style.display = "block";
            if (volumeActive) y2s.style.display = "none";
            if (candleActive) y3s.style.display = "none";
        },
        () => {
            ys.style.display = "none";
            if (volumeActive) y2s.style.display = "block";
            if (candleActive) y3s.style.display = "none";
        });

    if (volumeActive) {
        $(plot2s).hover(
            () => {
                ys.style.display = "none";
                if (volumeActive) y2s.style.display = "block";
                if (candleActive) y3s.style.display = "none";
            },
            () => {
                ys.style.display = "block";
                if (volumeActive) y2s.style.display = "none";
                if (candleActive) y3s.style.display = "block";
            });
    }

    if (candleActive) {
        $(plot3s).hover(
            () => {
                ys.style.display = "none";
                if (volumeActive) y2s.style.display = "none";
                if (candleActive) y3s.style.display = "block";
            },
            () => {
                ys.style.display = "none";
                if (volumeActive) y2s.style.display = "block";
                if (candleActive) y3s.style.display = "none";
            });
    }

    if (volumeActive) {
        $('#top-subchart').resizable({
            handles: "s",
            minHeight: 50,
            maxHeight: $('#subchart').height() - 200,
            resize: function (e, ui) {
                linessubchart.setSize({
                    width: linessubchart.width,
                    height: ui.size.height
                });

                if (candleActive)
                    candlesubchart.setSize({
                        width: linessubchart.width,
                        height: ui.size.height
                    });

                if (volumeActive)
                    volumesubchart.setSize({
                        width: volumesubchart.width,
                        height: $('#subchart').height() - ui.size.height - 103
                    });

                $("#top-subchart").height(ui.size.height);
                $("#bottom-subchart").height($('#subchart').height() - ui.size.height - 103);
            },
            stop: function () {
                window.dispatchEvent(new Event('resize'));
            }
        });
    }


    /*========== legends ===========*/

    $("#legend-subchart .u-legend .series th").on('click', function (e) {
        if ($(this).parent().hasClass('off')) {
            $(this).find('.ident').css({"background-color": "transparent"});
        } else {
            $(this).find('.ident').css({"background-color": $(this).find('.ident').css("border-color")});
        }
    });

    $("#legend-subchart .u-legend:nth-of-type(2) .series:nth-of-type(1) th").on('click', function (e) {
        $("#legend-subchart .u-legend:nth-of-type(2) .series:nth-of-type(2) th").click();
        if ($("#legend-subchart .u-legend:nth-of-type(2) .series:nth-of-type(1)").hasClass("off")) {
            lastSubHeight = $("#bottom-subchart").height();
            $("#top-subchart").css("height", "calc(100% - 95px)");
            $('#top-subchart').resizable('disable');
            $("#bottom-subchart").hide();
            subShowVals = true;
            linessubchart.axes[0].size = 50;
            linessubchart.redraw();
        } else {
            $("#top-subchart").height($("#subchart").height() - lastSubHeight - 100);
            $('#top-subchart').resizable('enable');
            $("#bottom-subchart").show();
            subShowVals = false;
            linessubchart.axes[0].size = 12;
            linessubchart.redraw();
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 1);
    });


    /*========== chart zoom ===========*/

    var ops4_sub = {
        width: 511,
        left:80,
        height: 45,
        axes: [
            {show: false},
            {show: false}
        ],
        legend: {show: false},
        cursor: {show: false},
        series: [
            {},
            {
                stroke: "rgba(5, 141, 199, 1)",
                fill: "rgba(5, 141, 199, 0.1)",
                points: {
                    show: false
                }
            }
        ],
    }

    zoomsubchart = new uPlot(ops4_sub, data, $("#zoom-subchart")[0]);
    window.addEventListener("resize", throttle(() => {
        if (getParameterByName("tab") == "prices" && $('#top-subchart').width() > 10) {
            let old_size = zoomsubchart.width, old_position = $(".zoom-subpanel")[0].offsetLeft,
                panel_width = $(".zoom-subpanel").width();
            zoomsubchart.setSize(getSize('#top-subchart', 45, $('#top-subchart').width() - 95));
            let new_size = zoomsubchart.width;
            $(".zoom-subpanel").width((panel_width / old_size) * new_size);
            $(".zoom-subpanel").css("left", (old_position / old_size) * new_size);
        }
    }, 100));

    var xMins = linessubchart.scales.x.min;
    var xMaxs = linessubchart.scales.x.max;

    setTimeout(() => {
        /*
        linessubchart.setScale("x", {
            min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
            max: xMaxs
        });

        if (candleActive)
            candlesubchart.setScale("x", {
                min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
                max: xMaxs
            });

        if (volumeActive)
            volumesubchart.setScale("x", {
                min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
                max: xMaxs
            });*/
    }, 0);
    $('.zoom-subpanel').css({'width':'500px','left':'70px'});
    $('.zoom-subpanel').draggable({
            containment: "parent",
            axis: "x",
            drag: function (e, ui) {
                //runs when dragging the range slider showing below the graph
                linessubchart.batch(() => {
                    // console.log(xMaxs,xMins);
                    linessubchart.setScale("x", {
                        min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                        max: (((ui.position.left + $(this).width()) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                    });
                });

                if (candleActive)
                    candlesubchart.batch(() => {
                        candlesubchart.setScale("x", {
                            min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                            max: (((ui.position.left + $(this).width()) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                        });
                    });

                if (volumeActive)
                    volumesubchart.batch(() => {
                        volumesubchart.setScale("x", {
                            min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                            max: (((ui.position.left + $(this).width()) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                        });
                    });
            }
        })
        .resizable({
            handles: "e, w",
            containment: "parent",
            resize: function (e, ui) {
                linessubchart.batch(() => {
                    linessubchart.setScale("x", {
                        min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                        max: (((ui.position.left + ui.size.width) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                    });
                });

                if (candleActive)
                    candlesubchart.batch(() => {
                        candlesubchart.setScale("x", {
                            min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                            max: (((ui.position.left + ui.size.width) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                        });
                    });

                if (volumeActive)
                    volumesubchart.batch(() => {
                        volumesubchart.setScale("x", {
                            min: ((ui.position.left * (xMaxs - xMins)) / $(this).parent().width()) + xMins,
                            max: (((ui.position.left + ui.size.width) * (xMaxs - xMins)) / $(this).parent().width()) + xMins
                        });
                    });
            }
        });


    $(plots).on('mouseup', function () {
        changeRange(linessubchart, 'zoom-subpanel', xMins, xMaxs)
    });
    if (volumeActive) $(plot2s).on('mouseup', function () {
        changeRange(linessubchart, 'zoom-subpanel', xMins, xMaxs)
    });
    if (candleActive) $(plot3s).on('mouseup', function () {
        changeRange(linessubchart, 'zoom-subpanel', xMins, xMaxs)
    });


    /*============== Chart Menu =============*/

    var contextMenuSubChart = $("#jqxgridMenuSubChart").jqxMenu({theme: 'light', width: 180, height: (candleActive) ? 120 : 88, autoOpenPopup: false, mode: 'popup'});
    if (!candleActive) $("#jqxgridMenuSubChart ul li:first-child").remove();
    contextMenuSubChart.on('itemclick', function (event) {

        var args = event.args;

        switch ($.trim($(args).text())) {
            case "Candlestick":
                if (candleActive) {
                    var isChecked = ($('#jqxgridMenuSubChart .chart-candlestick').css("display") == "none");
                    $('#jqxgridMenuSubChart .chart-candlestick').toggle(isChecked);
                    if (isChecked) {
                        linessubchart.root.style.display = 'none';
                        candlesubchart.root.style.display = 'block';

                        if (lineschart !== undefined) {
                            lineschart.root.style.display = 'none';
                            candlechart.root.style.display = 'block';
                        }
                    } else {
                        candlesubchart.root.style.display = 'none';
                        linessubchart.root.style.display = 'block';

                        if (lineschart !== undefined) {
                            candlechart.root.style.display = 'none';
                            lineschart.root.style.display = 'block';
                        }
                    }
                }
                break;

            case "Hide missing values":
                var isChecked = ($('#jqxgridMenuSubChart .chart-missing').css("display") == "none");
                $('#jqxgridMenuSubChart .chart-missing').toggle(isChecked);
                subSpanGaps = isChecked;
                var min = linessubchart.scales.x.min;
                var max = linessubchart.scales.x.max;
                linessubchart.setData(data);
                linessubchart.setScale("x", {
                    min: min, max: max
                });
                break;

            case "Hints":
                var isChecked = ($('.chart-hints').css("display") == "none");
                $('.chart-hints').toggle(isChecked);

                if (candleActive) {
                    candlesubchart.root.querySelector(".u-legend").style.visibility = isChecked ? "visible" : "hidden";

                    if (candlechart !== undefined)
                        candlechart.root.querySelector(".u-legend").style.visibility = isChecked ? "visible" : "hidden";
                }
                break;

            case "Zoom Reset":
                linessubchart.setData(data);
                zoomsubchart.setData(data);
                $('.zoom-subpanel').css({left: 0, width: "100%"});

                if (lineschart !== undefined) {
                    lineschart.setData(data);
                    zoomchart.setData(data);
                    $('.zoom-panel').css({left: 0, width: "100%"});
                }

                if (candleActive) {
                    candlesubchart.setData(candleData);

                    if (candlechart !== undefined)
                        candlechart.setData(candleData);
                }
                break;
        }
    });

    linessubchart.root.querySelector('.u-over').oncontextmenu = function (event) {
        var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
        contextMenuSubChart.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
        return false;
    };

    if (candleActive)
        candlesubchart.root.querySelector('.u-over').oncontextmenu = function (event) {
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            contextMenuSubChart.jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
            return false;
        };
// after how much time chat loads or start displaying
    setTimeout(() => {
        $(".smallChart").css("opacity", 1)
    }, 2);

    if (lineschart !== undefined) {
        $('.chart-candlestick').toggle(lineschart.root.style.visibility == "hidden");
        linessubchart.root.style.visibility = lineschart.root.style.visibility;
        if (candleActive) {
            candlesubchart.root.style.visibility = candlechart.root.style.visibility;
            $('.chart-hints').toggle(candlechart.root.querySelector(".u-legend").style.visibility !== "hidden");
            candlesubchart.root.querySelector(".u-legend").style.visibility == candlechart.root.querySelector(".u-legend").style.visibility
        }
    } else {
        if (candleActive)
            candlesubchart.root.querySelector(".u-legend").style.visibility = "hidden";

        $('.chart-hints').toggle(false);
    }
}

function updateChart(rowsData, isChartLoaded, isSubChartLoaded) {
    let data = prepareData(rowsData);

    volIdx = keys.findIndex(item => "volume" === item.toLowerCase());
    volumeActive = (volIdx !== -1);

    if (volumeActive) {
        // Prepare the data for volume chart
        var volumeColorGreen = [];
        var volumeColorRed = [];

        data[volIdx].map(function (v, i) {
            if (i !== 0) {
                if (data[volIdx][i - 1] < v) {
                    volumeColorGreen.push(v);
                    volumeColorRed.push(null);
                } else {
                    volumeColorGreen.push(null);
                    volumeColorRed.push(v);
                }
                ;
            } else {
                volumeColorGreen.push(v);
                volumeColorRed.push(null);
            }
        });
        data.splice(volIdx, 1);
        keys.splice(volIdx, 1);
    }

    openIdx = keys.findIndex(item => "open" === item.toLowerCase());
    highIdx = keys.findIndex(item => "high" === item.toLowerCase());
    lowIdx = keys.findIndex(item => "low" === item.toLowerCase());
    closeIdx = keys.findIndex(item => "close" === item.toLowerCase());
    candleActive = (openIdx !== -1 && highIdx !== -1 && lowIdx !== -1 && closeIdx !== -1);

    var colData = [data[0], volumeColorRed, volumeColorGreen],
        candleData = [data[0], data[openIdx], data[highIdx], data[lowIdx], data[closeIdx]];

    if (isChartLoaded) {
        for (var i = lineschart.series.length - 1; i > 0; i--) {
            lineschart.delSeries(i);
        }

        for (var x = 1; x < keys.length; x++) {
            labelName = keys[x].toLowerCase();

            let new_series = {
                label: CFL(labelName),
                stroke: (colors[labelName] !== undefined) ? colors[labelName] : colors.other[x - 1],
                spanGaps: (u, gaps) => spanGaps ? gaps : [],
                value: (u, v) => v == null ? "-" : v.toFixed(decimalNumber),
                points: {
                    show: false
                }
            }
            if (labelName.toLowerCase() == "close")
                new_series.fill = "rgba(5, 141, 199, 0.1)";

            if (labelName.toLowerCase() == "adjusted_close") {
                new_series.label = "Adj Cl.";
                new_series.show = false;
            }

            lineschart.addSeries(new_series, x);
        }

        lineschart.setData(data);
        zoomchart.setData(data);
        if (candleActive) candlechart.setData(candleData);
        if (volumeActive) volumechart.setData(colData);

        var xMin = lineschart.scales.x.min;
        var xMax = lineschart.scales.x.max;

        lineschart.setScale("x", {
            min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
            max: xMax
        });

        if (candleActive)
            candlechart.setScale("x", {
                min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
                max: xMax
            });

        if (volumeActive)
            volumechart.setScale("x", {
                min: (((zoomchart.width - $('.zoom-panel').width()) * (xMax - xMin)) / zoomchart.width) + xMin,
                max: xMax
            });
    }

    if (isSubChartLoaded) {
        for (var i = linessubchart.series.length - 1; i > 0; i--) {
            linessubchart.delSeries(i);
        }

        for (var x = 1; x < keys.length; x++) {
            labelName = keys[x].toLowerCase();

            let new_series = {
                label: CFL(labelName),
                stroke: (colors[labelName] !== undefined) ? colors[labelName] : colors.other[x - 1],
                spanGaps: (u, gaps) => spanGaps ? gaps : [],
                value: (u, v) => v == null ? "-" : v.toFixed(decimalNumber),
                points: {
                    show: false
                }
            }
            if (labelName.toLowerCase() == "close")
                new_series.fill = "rgba(5, 141, 199, 0.1)";

            if (labelName.toLowerCase() == "adjusted_close") {
                new_series.label = "Adj Cl.";
                new_series.show = false;
            }

            linessubchart.addSeries(new_series, x);
        }

        linessubchart.setData(data);
        zoomsubchart.setData(data);
        if (candleActive) candlesubchart.setData(candleData);
        if (volumeActive) volumesubchart.setData(colData);

        var xMins = linessubchart.scales.x.min;
        var xMaxs = linessubchart.scales.x.max;

        linessubchart.setScale("x", {
            min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
            max: xMaxs
        });

        if (candleActive)
            candlesubchart.setScale("x", {
                min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
                max: xMaxs
            });

        if (volumeActive)
            volumesubchart.setScale("x", {
                min: (((zoomsubchart.width - $('.zoom-subpanel').width()) * (xMaxs - xMins)) / zoomsubchart.width) + xMins,
                max: xMaxs
            });
    }
}