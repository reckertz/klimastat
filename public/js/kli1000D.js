/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000D = {};
    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht
    /**
     * factory-module für ChartJS Bubble-Charts zu Wetterdaten
     * auf IPCC-Periodenvergleich oder Jahresvergleiche
     * mit Konfigurationsbutton nach Extremwerten der Stationen
     * und Extremwerten der Daten
     * mit entsprechenden Einfärbungen der Stationspunkte
     * Datenzugriff auf KLIDATA und KLIDATA10 mit Verdichtung auf Jahre und IPCC-Perioden
     */

    kli1000D.createBubbleChart = function () {
        let bubbleselparms = {};
        let bubblerecords = [];
        let bubblelayerdata = {};
        let bubblewrapperid = "";
        let bubbleparms = null;

        async function showOneBubbleChart(wrapperid, layerdata, selparms, title, xlabel, ylabel, cbtitle, cblabel) {
            bubbleparms = {
                title,
                xlabel,
                ylabel,
                cbtitle,
                cblabel
            };
            bubblewrapperid = wrapperid;
            /*
            layerdata = layercontrol[source] = {
                table: "<table>",
                source: layername,
                geopoints: geopoints
            };
            */
            debugger;
            bubblelayerdata = layerdata;
            let ret = await getData(layerdata, selparms);
            if (ret.error === true) {
                return;
            }
            bubbleselparms = selparms;
            // ergänzende Default-Setzungen
            bubbleselparms.filter = "default";
            bubblerecords = ret.records;
            let datasets = await getDatasets();
            await putBubbleChart(datasets, "default");
        }




        async function putBubbleChart(datasets, title) {
            let wrapperid = bubblewrapperid;
            let containerid = bubblewrapperid + (Math.floor(Math.random() * 1000000) + 1000000);
            let mh = $("#kli1000projects").height() * 0.5;
            debugger;
            let dataset = getDiagonaleFromDatasets(datasets);
            datasets.push(dataset.dataset);

            $("#" + wrapperid)
                .append($("<div/>", {
                    class: "col  col-lg-4 kli1000bubble",
                    css: {
                        "min-height": mh + "px"
                    },
                    id: containerid
                }));
            let chartConfig = {
                type: "bubble",
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    parsing: true,   // false oder true
                    interaction: {
                        mode: "nearest",
                        intersect: true
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: bubbleparms.title   //"height / latitude"  // config.options.plugins.title.text
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                /*
                                title: function (items) {
                                    if (!items.length) {
                                        return "";
                                    }
                                    const row = items[0].raw.raw;
                                    return row.stationid ?? "";
                                },
                                */
                                title: function (items) {
                                    let text = bubbleparms.cbtitle(items);
                                    return text;
                                },
                                /*
                                label: function (context) {
                                    const point = context.raw;
                                    const row = point.raw;
                                    // Trick der mehrzeiligen Ausgabe
                                    return [
                                        "stationid: " + row.stationid,
                                        "name: " + row.stationname
                                        //"Temperatur: " + point.x + " °C",
                                        //"CO₂: " + point.y + " ppm",
                                        //"Land: " + (row.country ?? ""),
                                        //"Höhe: " + (row.altitude ?? "") + " m",
                                        //"Wind: " + (row.windSpeed ?? "") + " m/s"
                                    ];
                                }
                                */
                                label: function (context) {
                                    let text = bubbleparms.cblabel(context);
                                    return text;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "linear",
                            title: {
                                display: true,
                                text: bubbleparms.xlabel
                            },
                            grid: {
                                display: true
                            }
                        },
                        y: {
                            type: "linear",
                            title: {
                                display: true,
                                text: bubbleparms.ylabel
                            },
                            grid: {
                                display: true
                            }
                        }
                    },
                    elements: {
                        point: {
                            borderWidth: 1
                        }
                    },
                    animation: false
                }
            };

            let container = document.getElementById(containerid);
            $(container)
                .append($("<div/>", {
                    class: "col col-11",
                    css: {
                        "min-height": mh + "px"
                    }
                })
                    .append($("<canvas/>", {
                        id: containerid + "l"
                    }))
                );
            let canvasid = containerid + "l";
            let canvas = document.getElementById(canvasid);
            let ctx = canvas.getContext("2d");
            let chart = new Chart(ctx, chartConfig);
            chart.options.responsive = false;
            chart.update("none");
            requestAnimationFrame(async function () {
                let ccontainer = $("#" + canvasid).parent();
                $(ccontainer)
                    .prepend($("<div/>", {
                        class: containerid + "btns",
                        id: containerid + "btns"
                    }));

                await addChartStandardButtons(containerid, canvasid)
            });
            return containerid;   // wrapper des Charts
        }


        function getDiagonaleFromDatasets(datasets) {
            let minx = null;
            let maxx = null;
            let miny = null;
            let maxy = null;
            for (let dataset of datasets) {
                for (let bubble of dataset.data) {
                    let x = bubble.x;
                    let y = bubble.y;
                    if (minx === null) {
                        minx = x;
                    } else if (minx > x) {
                        minx = x;
                    }
                    if (maxx === null) {
                        maxx = x;
                    } else if (maxx < x) {
                        maxx = x;
                    }
                    if (miny === null) {
                        miny = y;
                    } else if (miny > y) {
                        miny = y;
                    }
                    if (maxy === null) {
                        maxy = y;
                    } else if (maxy < y) {
                        maxy = y;
                    }
                }
            }
            // runden auf 5 Grad
            maxx = Math.ceil(maxx / 5) * 5;
            minx = Math.floor(minx / 5) * 5;
            maxy = Math.ceil(maxy / 5) * 5;
            miny = Math.floor(miny / 5) * 5;
            // egalisieren, damit die Diagonale aussagefähig wird
            if (miny < minx) {
                minx = miny;
            } else {
                miny = minx;
            }
            if (maxy > maxx) {
                maxx = maxy;
            } else {
                maxy = maxx;
            }
            let dataset = {
                type: 'line',
                label: "Controlline",
                backgroundColor: "black",
                borderColor: "black",
                borderWidth: 1,
                data: [
                    [minx, miny],
                    [maxx, maxy]
                ]
            }
            return {
                dataset: dataset
            };
        }


        async function getDatasets() {
            // records aufbereiten zu datasets
            // bubbleselparms = {}; bubblerecords = [];
            let datacontrol = {};
            for (let record of bubblerecords) {
                let key = record.source + "_" + record.stationid;
                if (typeof datacontrol[key] === "undefined") {
                    datacontrol[key] = {
                        source: record.source,
                        stationid: record.stationid,
                        variables: {
                            TMAX: {
                                yeardata: {}
                            },
                            TMIN: {
                                yeardata: {}
                            },
                            TMAXmax: [],
                            TMAXavg: [],
                            TMINmin: [],
                            TMINavg: []
                        },
                        attributes: {}  // Felder aus KLISTATIONS in 
                    }
                }
                let variable = record.variable;
                if (typeof record.years === "string") {
                    record.years = JSON.parse(record.years);
                }
                for (let i = 0; i < 2; i++) {
                    let { fromyear, toyear } = bubbleselparms.range[i];
                    // year-Verdichtung
                    for (let iyear = fromyear; iyear <= toyear; iyear++) {
                        let yeardata = record.years["" + iyear];
                        if (typeof yeardata !== "undefined") {
                            let result = kli6900.getTrivial(yeardata, false, false);   // doround, korr)
                            result.year = "" + iyear;
                            datacontrol[key].variables[variable].yeardata[result.year] = result;
                        }
                    }
                }
            }
            // datacontrol weiter verdichten auf rangedata
            /*
            datacontrol[key] = {
                source: record.source,
                stationid: record.stationid,
                variables: {
                    TMAX: {
                        yeardata: {}
                    },
                    TMIN: {
                        yeardata: {}
                    }
                    // Bereitstellung bubbles je Jahr
                    TMAXmax: [],
                    TMAXavg: [],
                    TMINmin: [],
                    TMINavg: [],        
                },
                attributes: {}  // Felder aus KLISTATIONS in 
            }
            */

            debugger;

            let p1fromyear = bubbleselparms.range[0].fromyear;
            let p1toyear = bubbleselparms.range[0].toyear;
            let p2fromyear = bubbleselparms.range[1].fromyear;
            let p2toyear = bubbleselparms.range[1].toyear;
            let anz = p1toyear - p1fromyear + 1;


            for (let geopoint of bubblelayerdata.geopoints) {
                let source = bubblelayerdata.source;
                let stationid = geopoint.stationid;
                let key = source + "_" + stationid;
                for (let i = 1; i <= anz; i++) {
                    let p1year = parseInt(p1fromyear) + i - 1;
                    let p2year = parseInt(p2fromyear) + i - 1;
                    if (typeof datacontrol[key].variables["TMAX"].yeardata[p1year] !== "undefined" &&
                        typeof datacontrol[key].variables["TMAX"].yeardata[p2year] !== "undefined") {
                        datacontrol[key].variables["TMAXmax"].push({
                            x: datacontrol[key].variables["TMAX"].yeardata[p1year].max,
                            y: datacontrol[key].variables["TMAX"].yeardata[p2year].max,
                            r: 3,
                            raw: {
                                year: p1year + "/" + p2year
                            }
                        });
                        datacontrol[key].variables["TMAXavg"].push({
                            x: datacontrol[key].variables["TMAX"].yeardata[p1year].avg,
                            y: datacontrol[key].variables["TMAX"].yeardata[p2year].avg,
                            r: 3,
                            raw: {
                                year: p1year + "/" + p2year
                            }
                        });
                        datacontrol[key].variables["TMINmin"].push({
                            x: datacontrol[key].variables["TMIN"].yeardata[p1year].min,
                            y: datacontrol[key].variables["TMIN"].yeardata[p2year].min,
                            r: 3,
                            raw: {
                                year: p1year + "/" + p2year
                            }
                        });
                        datacontrol[key].variables["TMINavg"].push({
                            x: datacontrol[key].variables["TMIN"].yeardata[p1year].avg,
                            y: datacontrol[key].variables["TMIN"].yeardata[p2year].avg,
                            r: 3,
                            raw: {
                                year: p1year + "/" + p2year
                            }
                        });
                    }
                }
            }
            /*
            let yeardatasets = [];
            let rangedatasets = [];
            for (let source of Object.keys(bubblelayerdata)) {
                for (let geopoint of bubblelayerdata[source].geopoints) {
                    let stationid = geopoint.stationid;
                    let key = source + "_" + stationid;
                    let record = datacontrol[key];

                    let yeardataset = {};   // eine bubble je year, color nach range
                    let rangedataset = {};  // eine bubble je range als x und y
                    yeardataset = kli6900.cloneObject(bubblelayerdata[source])
                }
            }
            */
            /*
            let bubbledata = [];
            for (let record of geopoints) {
                bubbledata.push({
                    x: parseFloat(record.latitude),
                    y: parseFloat(record.height),
                    r: 3,
                    raw: {
                        source: record.source,
                        stationid: record.stationid,
                        stationname: record.stationname
                    }
                });
            }
            */
            let datasets = [];
            for (let geopoint of bubblelayerdata.geopoints) {
                let source = bubblelayerdata.source;
                let stationid = geopoint.stationid;
                let key = source + "_" + stationid;
                let dataset = {
                    label: "Daten",
                    data: datacontrol[key].variables["TMAXavg"],
                    backgroundColor: "rgba(54, 162, 235, 0.35)",
                    borderColor: "rgba(54, 162, 235, 0.8)",
                    borderWidth: 1
                };
                datasets.push(dataset);
            }
            return datasets;
        }


        async function getData(layerdata) {
            let sql = "SELECT ";
            let table = layerdata.table;
            let source = layerdata.source;
            let stationids = [];
            for (let data of layerdata.geopoints) {
                stationids.push(data.stationid);
            }
            if (table === "KLIDATA") {
                sql += " source, stationid, variable, years"
                sql += " FROM KLIDATA";
                sql += " WHERE source = '" + source + "'";
                if (stationids.length === 1) {
                    sql += " AND stationid = '" + stationids[0] + "'";
                } else if (stationids.length > 1) {
                    sql += " AND stationid IN ('" + stationids.join("', '") + "')";
                }
                sql += " AND variable IN ('TMAX','TMIN')";
                sql += " ORDER BY source, stationid, variable";
            } else if (table === "KLIDATA10") {
                sql += " source, stationid, variable, years"
                sql += " FROM KLIDATA10";
                sql += " WHERE source = '" + source + "'";
                if (stationids.length === 1) {
                    sql += " AND stationid = '" + stationids[0] + "'";
                } else if (stationids.length > 1) {
                    sql += " AND stationid IN ('" + stationids.join("', '") + "')";
                }
                sql += " AND variable IN ('TMAX','TMIN')";
                sql += " ORDER BY source, stationid, variable";
            }
            // Zugriff auf den Server
            let startTime = new Date();
            let response = await fetch("/getallrecordsx", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                //make sure to serialize your JSON body bei POST, dann einfache url
                body: JSON.stringify({
                    sel: sql,
                    timeout: 10 * 60 * 1000,
                    skip: 0,
                    limit: 0
                })
            });
            let ret = await response.json();
            let pmsg = " " + kli6900.getPerformance(startTime).split(" ")[0];
            if (ret.error === true || ret.records === "undefined" || ret.records === null) {
                console.log(ret.message + pmsg);  // big problem
                kli6900.putMessage(ret.message + pmsg, 3);
                return {
                    error: true,
                    message: ret.message + pmsg
                };
            } else if (Array.isArray(ret.records) && ret.records.length === 0) {
                console.log(ret.message + " no data found " + pmsg);  // no data
                kli6900.putMessage(ret.message + " no data found " + pmsg, 3);
                return {
                    error: true,
                    message: ret.message + " no data found " + pmsg
                };
            } else {
                // brauchbare Daten zurückgeben
                console.log(ret.records.length + " found" + pmsg);
                kli6900.putMessage(ret.records.length + " found" + pmsg, 1);
                return {
                    error: false,
                    message: ret.records.length + " found" + pmsg,
                    records: ret.records
                }
            }
        }

        async function addChartStandardButtons(chartid, canvasid) {
            $("#" + chartid + "btns")
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    css: {
                        padding: "1px",
                        "margin-left": "5px"
                    },
                    chartid: chartid,
                    canvasid: canvasid,
                    html: "clipboard",
                    click: async function (evt) {
                        evt.preventDefault();
                        let canvas = document.getElementById(canvasid);
                        canvas.toBlob(function (pngImageBlob) {
                            // callback-Code
                            //https://stackoverflow.com/questions/33175909/copy-image-to-clipboard
                            // TODO: es kann ein Array von ClipboardItem's übergeben werden!!! auch img plus die labels dazu
                            navigator.clipboard.write([
                                new ClipboardItem({
                                    'image/png': pngImageBlob
                                })
                            ]);
                        }, 'image/png', 0.95); // png at 95% quality
                        kli6900.putMessage("Clipboard kopiert", 1);
                    }
                }));
        }


        async function addBubbleLineButton(chartid, canvasid) {
            $("#" + chartid + "btns")
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    html: "<span> " + cancelsign + "</span><span> lines</span>",
                    css: {
                        padding: "1px",
                        "margin-left": "5px"
                    },
                    chartid: chartid,
                    canvasid: canvasid,
                    click: async function (evt) {
                        evt.preventDefault();
                        let status = $(this).find("span").first().text();
                        if (status === okletter) {
                            $(this).find("span").first().html(cancelsign);
                        } else {
                            $(this).find("span").first().html(oksign);
                        }
                        let newstatus = $(this).find("span").first().text();
                        let canvasid = $(this).attr("canvasid");
                        let graph = Chart.getChart(canvasid);
                        // prüfen, ob category bei einer scale vorliegt

                        if (graph.scales.x.type === "category" || graph.scales.y.type === "category") {
                            await drawLines4Categories(graph, canvasid, newstatus);
                            return;
                        }
                        let linecontrol = {};
                        let ilines = 0;
                        let idataset = -1;
                        for (let dataset of graph.data.datasets) {
                            idataset++;
                            if (dataset.type === "line") {
                                ilines++;
                                if (newstatus === okletter) {
                                    graph.setDatasetVisibility(idataset, true);
                                } else {
                                    graph.setDatasetVisibility(idataset, false);
                                }
                                continue;
                            }
                            if (dataset.type === "bubble") {
                                if (newstatus !== okletter) {
                                    continue;
                                }
                                let bubbles = dataset.data;
                                for (let bubble of bubbles) {
                                    let key = bubble.raw.source + "_" + bubble.raw.stationid;
                                    if (typeof linecontrol[key] === "undefined") {
                                        linecontrol[key] = {};
                                    }
                                    linecontrol[key][bubble.raw.year] = {
                                        x: bubble.x,
                                        y: bubble.y
                                    };
                                }
                            }
                        }
                        if (newstatus === okletter) {
                            if (ilines > 0) {
                                graph.update();
                                return;
                            }
                        } else {
                            graph.update();
                            return;
                        }
                        let linekeys = Object.keys(linecontrol);
                        for (let linekey of linekeys) {
                            // Verbindung 1
                            let p1 = linecontrol[linekey]["1950"];
                            let p2 = linecontrol[linekey]["2019"];
                            if (typeof p1 !== "undefined" && p2 !== "undefined") {
                                let linedataset = {
                                    type: "line",
                                    data: [p1, p2],
                                    borderWidth: 2,
                                    pointRadius: 0
                                };
                                graph.data.datasets.push(linedataset);
                            }
                        }
                        graph.update();
                    }
                }));
        }
        // nicht öffentlich
        async function drawLines4Categories(graph, canvasid, newstatus) {
            let scalex = graph.scales.x.type;
            let scaley = graph.scales.y.type;

            if (newstatus !== okletter) {
                graph.update("none");   // Neuaufbau löscht die lines automatisch
                return;
            }

            const ctx = graph.ctx;
            let linecontrol = {};
            let ilines = 0;
            let idataset = -1;
            for (let dataset of graph.data.datasets) {
                idataset++;
                let meta = graph.getDatasetMeta(idataset);
                if (dataset.type === "bubble") {
                    for (let ibubble = 0; ibubble < meta.data.length; ibubble++) {
                        let bubb = {};
                        bubb.xvalue = dataset.data[ibubble].x;
                        bubb.yvalue = dataset.data[ibubble].y;
                        bubb.xpoint = meta.data[ibubble].x;
                        bubb.ypoint = meta.data[ibubble].y;
                        let key = dataset.data[ibubble].raw.source + "_" + dataset.data[ibubble].raw.stationid;
                        if (typeof linecontrol[key] === "undefined") {
                            linecontrol[key] = {};
                        }
                        linecontrol[key][dataset.data[ibubble].raw.year] = {
                            xvalue: bubb.xvalue,
                            yvalue: bubb.yvalue,
                            xpoint: bubb.xpoint,
                            ypoint: bubb.ypoint
                        };
                    }
                }
            }
            let linekeys = Object.keys(linecontrol);
            for (let linekey of linekeys) {
                // Verbindung 1
                let p1 = linecontrol[linekey]["1950"];
                let p2 = linecontrol[linekey]["2019"];
                ctx.beginPath();
                ctx.moveTo(p1.xpoint, p1.ypoint);
                ctx.lineTo(p2.xpoint, p2.ypoint);
                ctx.stroke();
            }
        }
        return {
            showOneBubbleChart,
            addBubbleLineButton
        };
    }


    // --- Weitere Modul-API ---
    kli1000D.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000D = kli1000D;
})(window);