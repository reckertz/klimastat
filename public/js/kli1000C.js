/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000C = {};
    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht
    /**
     * factory-module für ChartJS Ausgaben 
     * Übergabe recordset (record-array) und folgende Funktionen
     * Generierung Filterbuttons
     * Aufbereitung filterconfig aus den Filterbuttons
     * Anwendung filterconfig auf den recordset mit filter-function
     * Ausgabe der gefilterten Daten nach Konfigurationsvorgabe
     * Initial werden alle Daten ausgegeben???
     */

    kli1000C.createBubbleChart = function () {

        async function showOneBubbleChart(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel) {

            let containerid = "kli1000bubble" + (Math.floor(Math.random() * 1000000) + 1000000);
            let mh = $("#kli1000projects").height() * 0.5;

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
                            text: title   //"height / latitude"  // config.options.plugins.title.text
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
                                    let text = cbtitle(items);
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
                                    let text = cblabel(context);
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
                                text: xlabel
                            },
                            grid: {
                                display: true
                            }
                        },
                        y: {
                            type: "linear",
                            title: {
                                display: true,
                                text: ylabel
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
    kli1000C.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000C = kli1000C;
})(window);