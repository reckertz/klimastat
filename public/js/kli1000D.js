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

        async function showOneDataBubbleChart(wrapperid, layerdata, selparms, title, xlabel, ylabel, cbtitle, cblabel) {
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

            bubblelayerdata = layerdata;
            bubbleselparms = selparms;
            // ergänzende Default-Setzungen
            bubbleselparms.filter = "default";
            let ret = await getData(layerdata, selparms);
            if (ret.error === true) {
                return;
            }

            bubblerecords = ret.records;

            let datacontrol = await getDataControl();
            // datacontrol[key].source
            // datacontrol[key].stationid
            // datacontrol[key].variables[variable].yeardata[year][values, , , , ]

            let datasets = await getDatasets4vars(datacontrol, layerdata, ["TMIN", "TMAX"]);
            // bubbleparms und datasets sind die Vorgaben

            // containerid: wrapper des Charts, suffixe: btns, canvas
            let containerid = await putBubbleChart(datasets, "default", false, {
                title: layerdata.source + " " + "TMAX vs. TMIN",
                xlabel: "TMIN",
                ylabel: "TMAX",
                fixed: true,
                harmonizedXY: true
            });
            let parms = {};
            await addFilterButtons(containerid + "canvas", containerid + "btns", "label", "variable", parms);
            let graph = Chart.getChart(containerid + "canvas");



            //let datasets01 = await getDatasets(datacontrol, "height");
            let datasets01 = await getDatasets4attrvars(datacontrol, layerdata, "height", ["TMIN", "TMAX"]);
            // bubbleparms und datasets sind die Vorgaben
            let containerid01 = await putBubbleChart(datasets01, "default", false, {
                title: layerdata.source + " " + "height vs" + "TMAX/TMIN",
                xlabel: "height",
                ylabel: "Celsius"
            });
            await addFilterButtons(containerid01 + "canvas", containerid01 + "btns", "label", "variable", parms);
            /*
            await putLineChart(datasets01, "default", false, {
                title: layerdata.source + " " + "height vs" + "TMAX/TMIN",
                xlabel: "height",
                ylabel: "Celsius"
            });
            */
        }

        async function addFilterButtons(canvasid, buttonsid, variable, vartype, selparms) {
            let varvalues = [];

            let graph = Chart.getChart(canvasid);
            for (let dataset of graph.data.datasets) {
                if (typeof dataset[variable] !== "undefined") {
                    if (!varvalues.includes(dataset[variable])) {
                        varvalues.push(dataset[variable])
                    }
                }
            }
            varvalues = varvalues.sort();
            for (let varvalue of varvalues) {
                $("#" + buttonsid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-primary kli1000dsfilter",
                        css: {
                            padding: "1px",
                            margin: "5px"
                        },
                        canvasid: canvasid,
                        buttonsid: buttonsid,
                        varname: variable,
                        varvalue: varvalue,
                        vartype: vartype,
                        // variable, attribute, xvariable (in bubble), yvariable (in bubble), raw (in bubble), xlabel
                        html: "<span>" + oksign + "</span><span> " + varvalue + "</span>",
                        title: variable + "=" + varvalue
                    }));
            }

            // nochmal prüfen - container - buttons
            $("#" + buttonsid).off(".kli1000dsfilter");
            $("#" + buttonsid).on("click", ".kli1000dsfilter", function (evt) {
                evt.preventDefault();
                debugger;  // initiale Prüfung
                let status = $(this).find("span").first().text();
                if (status === okletter) {
                    $(this).find("span").first().html(cancelsign);
                    status = "";
                } else {
                    $(this).find("span").first().html(oksign);
                    status = okletter;
                }
                let okvalues = [];
                let buttonsid = $(this).attr("buttonsid");
                // es kann button-Vorgaben und input-Vorgaben geben
                // daher immer .kli1000filter als Vorgabe
                let buttons = $("#" + buttonsid).find(".kli1000dsfilter").toArray();

                // let varname = $(this).attr("varname");
                // let varvalue = $(this).attr("varvalue");
                // let vartype = $(this).attr("vartype"); 
                // variable, attribute, xvariable (in bubble), yvariable (in bubble), raw (in bubble), xlabel
                // steuert den scope der Anzeigeauswirkung: dataset oder element in data oder column
                let canvasid = $(this).attr("canvasid");
                // Aufbereiten der User-Vorgaben
                let selparms = {};
                for (let button of buttons) {
                    let varname = $(button).attr("varname")
                    let varvalue = $(button).attr("varvalue");
                    let vartype = $(button).attr("vartype");
                    let tagName = $(button).prop("tagName");
                    if (tagName === "BUTTON") {
                        // der button-varvalue muss aktiv sein durch oksign
                        let status = $(button).find("span").first().text();
                        if (status !== okletter) {
                            continue;
                        }
                    } else if (tagName === "INPUT") {
                        // bei input den val nehmen
                        varvalue = $(button).val("varvalue");
                    }
                    if (typeof selparms[varname] === "undefined") {
                        selparms[varname] = {
                            varvalues: [],
                            vartype: vartype
                        };
                    }
                    selparms[varname].varvalues.push(varvalue);
                }
                let graph = Chart.getChart(canvasid);
                //for (let dataset of graph.data.datasets) {
                for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
                    let dataset = graph.data.datasets[idataset];
                    graph.setDatasetVisibility(idataset, true);  // initialisierung
                    let showdataset = true;
                    let showcolumn = false;
                    for (let varname of Object.keys(selparms)) {
                        let varvalues = selparms[varname].varvalues;
                        let vartype = selparms[varname].vartype;
                        if (vartype === "variable") {
                            let varvalue = dataset[variable];
                            if (!selparms[varname].varvalues.includes(varvalue)) {
                                showdataset = false;
                                break;
                            }
                        }
                    }
                    if (showdataset === false) {
                        graph.setDatasetVisibility(idataset, false);  // rücksetzung
                    }
                }
                graph.update("none");
            });
        };


        async function putLineChart(datasets, title, doline, parms) {
            //title: layerdata.source + " " + "height vs" + "TMAX/TMIN",
            //xlabel: "height",
            //ylabel: "Celsius"
        }


        async function putBubbleChart(datasets, attribute, doDiagonale, parms) {
            // title: layerdata.source + " " + "height vs" + "TMAX/TMIN",
            // xlabel: "height",
            // ylabel
            // fixed: false/true, ; harmonizedXY: false/true
            if (typeof parms === "undefined") {
                parms = bubbleparms;
            } else {
                parms.cbtitle = bubbleparms.cbtitle;
                parms.cblabel = bubbleparms.cblabel;

            }
            let wrapperid = bubblewrapperid;
            let containerid = bubblewrapperid + (Math.floor(Math.random() * 1000000) + 1000000);
            let mh = $("#kli1000projects").height() * 0.7;
            if (typeof doDiagonale !== "undefined" && doDiagonale === true) {
                let dataset = getDiagonaleFromDatasets(datasets);
                datasets.push(dataset.dataset);
            }

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
                            text: parms.title   //"height / latitude"  // config.options.plugins.title.text
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                title: function (items) {
                                    let text = parms.cbtitle(items);
                                    return text;
                                },
                                label: function (context) {
                                    let text = parms.cblabel(context);
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
                                text: parms.xlabel
                            },
                            grid: {
                                display: true
                            }
                        },
                        y: {
                            type: "linear",
                            title: {
                                display: true,
                                text: parms.ylabel
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
                        id: containerid + "canvas"
                    }))
                );
            let canvasid = containerid + "canvas";
            let canvas = document.getElementById(canvasid);
            let ctx = canvas.getContext("2d");
            let chart = new Chart(ctx, chartConfig);
            chart.options.responsive = false;
            chart.update("none");
            await new Promise(async function (resolve, reject) {
                requestAnimationFrame(async function () {
                    let ccontainer = $("#" + canvasid).parent();
                    $(ccontainer)
                        .prepend($("<div/>", {
                            class: containerid + "btns",
                            id: containerid + "btns"
                        }));
                    await addChartStandardButtons(containerid, canvasid)
                    resolve(true);
                });
            });
            //parms.fixed: true, ; parms.harmonizedXY: true
            if (parms.fixed === true) {
                fixChartScales(chart);
            }
            if (parms.harmonizedXY === true) {
                harmonizeXYChartScales(chart);
            }
            return containerid;   // containerid: wrapper des Charts, suffixe: btns, canvas
        }

        function fixChartScales(graph) {
            let scales = Object.keys(graph.scales);
            for (let scale of scales) {
                if (graph.scales[scale].type === "category") {
                    continue;
                }
                let min = graph.scales[scale].min;
                let max = graph.scales[scale].max;
                delete graph.scales[scale].min;
                delete graph.scales[scale].max;
                delete graph.options.scales[scale].min;
                delete graph.options.scales[scale].max;
                graph.options.scales[scale].suggestedMin = min;
                graph.options.scales[scale].suggestedMax = max;
                graph.update();
            }
        }


        function harmonizeXYChartScales(graph) {
            let scales = Object.keys(graph.scales);
            for (let scale of scales) {
                if (graph.scales["x"].type === "category" || graph.scales["y"].type === "category") {
                    continue;
                }
                let minx = graph.scales["x"].min;
                let maxx = graph.scales["x"].max;
                let miny = graph.scales["y"].min;
                let maxy = graph.scales["y"].max;
                if (minx < miny) {
                    miny = minx
                } else {
                    minx = miny
                }
                if (maxx > maxy) {
                    maxy = maxx
                } else {
                    maxx = maxy
                }
                delete graph.scales["x"].min;
                delete graph.scales["x"].max;
                delete graph.options.scales["x"].min;
                delete graph.options.scales["x"].max;

                delete graph.scales["y"].min;
                delete graph.scales["y"].max;
                delete graph.options.scales["y"].min;
                delete graph.options.scales["y"].max;

                graph.options.scales["x"].suggestedMin = minx;
                graph.options.scales["x"].suggestedMax = maxx;
                graph.options.scales["y"].suggestedMin = miny;
                graph.options.scales["y"].suggestedMax = maxy;

                graph.update();
            }
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

        async function getDataControl() {

            let datacontrol = {};
            for (let record of bubblerecords) {
                let key = record.source + "_" + record.stationid;
                if (typeof datacontrol[key] === "undefined") {
                    datacontrol[key] = {
                        source: record.source,
                        stationid: record.stationid,
                        ranges: [],
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
                    datacontrol[key].ranges.push(structuredClone(bubbleselparms.range[i]));
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
            for (let geopoint of bubblelayerdata.geopoints) {
                let key = bubblelayerdata.source + "_" + geopoint.stationid;
                if (typeof datacontrol[key] !== "undefined") {
                    datacontrol[key].attributes = kli6900.cloneObject(geopoint);
                }
            }

            return datacontrol;
        }

        //let datasets01 = await getDatasets4attrvars(datacontrol,height, ["TMIN", "TMAX"]);
        async function getDatasets4attrvars(datacontrol, layerdata, attrname, variables) {
            // datacontrol auswerten mit height und TMAX/TMIN auf Jahre bezogen
            // mit Einfärbung der Range
            // Aufbereitung layerdata
            let stationcontrol = {};
            for (let geopoint of layerdata.geopoints) {
                let key = geopoint.source + "_" + geopoint.stationid;
                stationcontrol[key] = structuredClone(geopoint); // für stationname
            }
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
            let p1fromyear = bubbleselparms.range[0].fromyear;
            let p1toyear = bubbleselparms.range[0].toyear;
            let p2fromyear = bubbleselparms.range[1].fromyear;
            let p2toyear = bubbleselparms.range[1].toyear;
            let anz = p1toyear - p1fromyear + 1;
            let datasets = [];
            for (let key of Object.keys(datacontrol)) {
                for (let variable of variables) {
                    let icolor = -1;
                    let colors = ["blue", "red"]
                    for (let fromyear of [p1fromyear, p2fromyear]) {
                        icolor++;
                        fromyear = parseInt(fromyear);
                        let toyear = fromyear + 30 - 1;
                        let dataset = {
                            label: fromyear + "-" + toyear,
                            data: [],
                            backgroundColor: colors[icolor],  // "rgba(54, 162, 235, 0.35)",
                            borderColor: colors[icolor],      // "rgba(54, 162, 235, 0.8)",
                            borderWidth: 1
                        };

                        for (let iyear = fromyear; iyear <= toyear; iyear++) {
                            let attrval = null;
                            let varival = null;
                            try {
                                //TMAX = datacontrol[key].variables[].yeardata["" + iyear].avg;
                                attrval = stationcontrol[key][attrname];
                                varival = datacontrol[key].variables[variable].yeardata["" + iyear].avg;
                            } catch (err) { };
                            if (typeof attrval !== "undefined" && attrval !== null &&
                                typeof varival !== "undefined" && varival !== null) {
                                let bubble = {
                                    x: attrval,
                                    y: varival,
                                    r: 3,
                                    tooltip: key,
                                    raw: {
                                        source: datacontrol[key].source,
                                        stationid: datacontrol[key].stationid,
                                        stationname: stationcontrol[key].stationname,
                                        attrname: attrname,
                                        variable: variable,
                                        year: iyear
                                    }
                                };
                                dataset.data.push(bubble);
                            }
                        }
                        datasets.push(dataset);
                    }
                }
            }
            return datasets;
        }

        async function getDatasets4vars(datacontrol, layerdata, variables) {
            // datacontrol auswerten als TMAX/TMIN auf Jahre bezogen
            // mit Einfärbung der Range
            let stationcontrol = {};
            for (let geopoint of layerdata.geopoints) {
                let key = geopoint.source + "_" + geopoint.stationid;
                stationcontrol[key] = structuredClone(geopoint); // für stationname
            }
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
            let p1fromyear = bubbleselparms.range[0].fromyear;
            let p1toyear = bubbleselparms.range[0].toyear;
            let p2fromyear = bubbleselparms.range[1].fromyear;
            let p2toyear = bubbleselparms.range[1].toyear;
            let anz = p1toyear - p1fromyear + 1;
            let datasets = [];
            for (let key of Object.keys(datacontrol)) {
                let icolor = -1;
                let colors = ["blue", "red"]
                for (let fromyear of [p1fromyear, p2fromyear]) {
                    icolor++;
                    fromyear = parseInt(fromyear);
                    let toyear = fromyear + 30 - 1;
                    let dataset = {
                        label: fromyear + "-" + toyear,
                        key: key,
                        source: stationcontrol[key].source,
                        stationid: stationcontrol[key].stationid,
                        data: [],
                        backgroundColor: colors[icolor],  // "rgba(54, 162, 235, 0.35)",
                        borderColor: colors[icolor],      // "rgba(54, 162, 235, 0.8)",
                        borderWidth: 1
                    };

                    for (let iyear = fromyear; iyear <= toyear; iyear++) {
                        let TMAX = null;
                        let TMIN = null;
                        try {
                            TMAX = datacontrol[key].variables["TMAX"].yeardata["" + iyear].avg;
                            TMIN = datacontrol[key].variables["TMIN"].yeardata["" + iyear].avg;
                        } catch (err) { };
                        if (typeof TMAX !== "undefined" && TMAX !== null &&
                            typeof TMIN !== "undefined" && TMIN !== null) {
                            let bubble = {
                                x: TMIN,
                                y: TMAX,
                                r: 3,
                                tooltip: key,
                                raw: {
                                    source: datacontrol[key].source,
                                    stationid: datacontrol[key].stationid,
                                    stationname: stationcontrol[key].stationname,
                                    year: iyear
                                }
                            };
                            dataset.data.push(bubble);
                        }
                    }
                    datasets.push(dataset);
                }
            }
            return datasets;
        }


        async function getDatasets(datacontrol, attribute) {
            // records aufbereiten zu datasets
            // bubbleselparms = {}; bubblerecords = [];

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

            let p1fromyear = bubbleselparms.range[0].fromyear;
            let p1toyear = bubbleselparms.range[0].toyear;
            let p2fromyear = bubbleselparms.range[1].fromyear;
            let p2toyear = bubbleselparms.range[1].toyear;
            let anz = p1toyear - p1fromyear + 1;

            let geopoints = [];
            for (let geopoint of bubblelayerdata.geopoints) {
                let source = bubblelayerdata.source;
                let stationid = geopoint.stationid;
                let key = source + "_" + stationid;
                if (typeof datacontrol[key] === "undefined") {
                    continue;
                }
                if (typeof geopoint[attribute] === "string") {
                    geopoint[attribute] = parseFloat(geopoint[attribute]);
                }
                geopoints.push(geopoint);
            }

            let datasets = [];

            if (typeof attribute !== "undefined" && ["height"].includes(attribute)) {
                geopoints = geopoints.sort(function (a, b) {
                    if (a[attribute] > b[attribute]) {
                        return 1;
                    } else if (a[attribute] < b[attribute]) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                // nach attribute sortiert, first 3, last 3
                if (geopoints.length >= 2) {
                    let middleindex = Math.floor(geopoints.length / 2);
                    if (middleindex > 3) middleindex = 3;
                    if (middleindex > 1) {
                        for (let i = 0; i < middleindex; i++) {
                            geopoints[i].level = 3;  // low
                            geopoints[i].levelcolor = "blue";
                        }
                        let fromind = geopoints.length - 1;
                        let toind = geopoints.length - middleindex - 1;
                        for (let i = fromind; i > toind; i--) {
                            geopoints[i].level = 1;  // high
                            geopoints[i].levelcolor = "orange";
                        }
                    }
                } else {
                    for (let i = 0; i < geopoints.length; i++) {
                        if (i % 2 === 0) {
                            geopoints[i].level = 1;  // high
                            geopoints[i].levelcolor = "orange";
                        } else {
                            geopoints[i].level = 3;  // low
                            geopoints[i].levelcolor = "blue";
                        }
                    }
                }

                for (let geopoint of geopoints) {
                    let source = bubblelayerdata.source;
                    let stationid = geopoint.stationid;
                    let key = source + "_" + stationid;
                    if (typeof datacontrol[key] === "undefined") {
                        continue;
                    }

                    for (let i = 1; i <= anz; i++) {
                        let p1year = parseInt(p1fromyear) + i - 1;
                        let p2year = parseInt(p2fromyear) + i - 1;
                        for (let variable of ["TMAX", "TMIN"]) {
                            if (typeof datacontrol[key].variables[variable] !== "undefined") {
                                for (let year of [p1year, p2year]) {
                                    if (typeof datacontrol[key].variables[variable].yeardata[year] === "undefined") {
                                        continue;
                                    }
                                    let dc = {
                                        x: datacontrol[key].attributes[attribute],
                                        y: datacontrol[key].variables[variable].yeardata[year].avg,
                                        r: 3,
                                        raw: {
                                            source: source,
                                            stationid: stationid,
                                            stationname: geopoint.stationname,
                                            year: year
                                        }
                                    };
                                    dc.raw.text = dc.x + "=>" + dc.y;
                                    datacontrol[key].variables[variable + "avg"].push(dc);
                                }
                            }
                        }
                    }
                }

                for (let geopoint of geopoints) {
                    let source = bubblelayerdata.source;
                    let stationid = geopoint.stationid;
                    let key = source + "_" + stationid;
                    if (typeof datacontrol[key] === "undefined") {
                        continue;
                    }
                    let icolor = -1;
                    let colors = ["blue", "red"]
                    for (let fromyear of [p1fromyear, p2fromyear]) {
                        icolor++;
                        let toyear = fromyear + 30 - 1;
                        for (let variable of ["TMAX", "TMIN"]) {
                            let dataset = {
                                label: fromyear + "-" + toyear,
                                data: datacontrol[key].variables[variable + "avg"],
                                backgroundColor: colors[icolor],  // "rgba(54, 162, 235, 0.35)",
                                borderColor: colors[icolor],      // "rgba(54, 162, 235, 0.8)",
                                borderWidth: 1
                            };
                            datasets.push(dataset);
                        }
                    }
                }
            }
            /**
             * undefined attribute
             */
            if (typeof attribute === "undefined") {
                for (let geopoint of geopoints) {
                    let source = bubblelayerdata.source;
                    let stationid = geopoint.stationid;
                    let key = source + "_" + stationid;
                    if (typeof datacontrol[key] === "undefined") {
                        continue;
                    }
                    for (let i = 1; i <= anz; i++) {
                        let p1year = parseInt(p1fromyear) + i - 1;
                        let p2year = parseInt(p2fromyear) + i - 1;
                        if (typeof datacontrol[key].variables["TMAX"].yeardata[p1year] !== "undefined" &&
                            typeof datacontrol[key].variables["TMAX"].yeardata[p2year] !== "undefined" &&
                            typeof datacontrol[key].variables["TMAX"].yeardata[p1year].min !== "undefined" &&
                            typeof datacontrol[key].variables["TMAX"].yeardata[p2year].min !== "undefined" &&
                            typeof datacontrol[key].variables["TMIN"].yeardata[p1year] !== "undefined" &&
                            typeof datacontrol[key].variables["TMIN"].yeardata[p2year] !== "undefined" &&
                            typeof datacontrol[key].variables["TMIN"].yeardata[p1year].min !== "undefined" &&
                            typeof datacontrol[key].variables["TMIN"].yeardata[p2year].min !== "undefined") {
                            datacontrol[key].variables["TMAXmax"].push({
                                x: datacontrol[key].variables["TMAX"].yeardata[p1year].max,
                                y: datacontrol[key].variables["TMAX"].yeardata[p2year].max,
                                r: 3,
                                raw: {
                                    source: source,
                                    stationid: stationid,
                                    stationname: geopoint.stationname,
                                    year: p1year + "/" + p2year
                                }
                            });
                            datacontrol[key].variables["TMAXavg"].push({
                                x: datacontrol[key].variables["TMAX"].yeardata[p1year].avg,
                                y: datacontrol[key].variables["TMAX"].yeardata[p2year].avg,
                                r: 3,
                                raw: {
                                    source: source,
                                    stationid: stationid,
                                    stationname: geopoint.stationname,
                                    year: p1year + "/" + p2year
                                }
                            });
                            datacontrol[key].variables["TMINmin"].push({
                                x: datacontrol[key].variables["TMIN"].yeardata[p1year].min,
                                y: datacontrol[key].variables["TMIN"].yeardata[p2year].min,
                                r: 3,
                                raw: {
                                    source: source,
                                    stationid: stationid,
                                    stationname: geopoint.stationname,
                                    year: p1year + "/" + p2year
                                }
                            });
                            datacontrol[key].variables["TMINavg"].push({
                                x: datacontrol[key].variables["TMIN"].yeardata[p1year].avg,
                                y: datacontrol[key].variables["TMIN"].yeardata[p2year].avg,
                                r: 3,
                                raw: {
                                    source: source,
                                    stationid: stationid,
                                    stationname: geopoint.stationname,
                                    year: p1year + "/" + p2year
                                }
                            });
                        } else {
                            console.log("******", key, " ausgesteuert, Datenmangel");
                            //console.log(datacontrol[key].variables["TMAX"].yeardata);
                            //console.log(datacontrol[key].variables["TMIN"].yeardata);
                        }
                    }
                }

                for (let geopoint of bubblelayerdata.geopoints) {
                    let source = bubblelayerdata.source;
                    let stationid = geopoint.stationid;
                    let key = source + "_" + stationid;
                    if (typeof datacontrol[key] === "undefined") {
                        continue;
                    }
                    let dataset = {
                        label: "Daten",
                        data: datacontrol[key].variables["TMAXavg"],
                        backgroundColor: "rgba(54, 162, 235, 0.35)",
                        borderColor: "rgba(54, 162, 235, 0.8)",
                        borderWidth: 1
                    };
                    datasets.push(dataset);
                }
            }
            return datasets;
        }


        async function getData(layerdata) {
            let p1fromyear = bubbleselparms.range[0].fromyear;
            let p1toyear = bubbleselparms.range[0].toyear;
            let p2fromyear = bubbleselparms.range[1].fromyear;
            let p2toyear = bubbleselparms.range[1].toyear;
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
                sql += " AND fromyear <= " + p1fromyear;
                sql += " AND toyear >= " + p1toyear;
                sql += " AND fromyear <= " + p2fromyear;
                sql += " AND toyear >= " + p2toyear;
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
                sql += " AND fromyear <= " + p1fromyear;
                sql += " AND toyear >= " + p1toyear;
                sql += " AND fromyear <= " + p2fromyear;
                sql += " AND toyear >= " + p2toyear;
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
            showOneDataBubbleChart,
            addBubbleLineButton,
            getDataControl,
            fixChartScales,
            harmonizeXYChartScales
        };
    }


    // --- Weitere Modul-API ---
    kli1000D.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000D = kli1000D;
})(window);