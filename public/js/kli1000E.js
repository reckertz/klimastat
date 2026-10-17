/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000E = {};
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


    kli1000E.createLineChart = function () {

        let graph = null;
        let canvasid = null;


        /**
        * showLineChart - Ausgabe LineChart in einen DIV-Container,  canvas wird angelegt und die Buttons 
        * über dem canvas und rechts daneben, wenn gewüncht
        *
        * @param {any} wrapperid - DIV-Container als row, 
        *              es ist darin ein Chart-Container als col col-lg-4 einzurichten und der canvas dazu
        * @param {any} title - Überschrift, im canvas; kann string oder array von strings sein
        * @param {any} xlabels - labels der x-Achse
        * @param {any} datasets - array der dataset Elemente
        * @param {any} parms - parms.big mit topbuttons und rightbuttons sowie col-12
        * 
        * Hinweise: 
        * config.options.responsive = true initial, damit in den Container eingepasst wird,
        * danach rücksetzen, um z.B. Buttons zuzufügen, gibt sonst Durcheinander
        * config.options.scales.x und y differenzieren, type: "linear" passt fast immer, 
        * wenn type: "category", dann mit config.options.scales.x.labels als array dazu 
        * config.options.scales.x.title.text
        * config.options.scales.y.title.text
        * 
        * @returns {any} - This function does not return a value but performs assertions on the input data.
        */
        async function showLineChart(wrapperid, title, xlabels, datasets, parms) {
            let i = 1;
            let config = kli6900.cloneObject(getLineChartTemplate(title, xlabels, datasets));
            config.options.plugins.title.text = title;
            config.data.labels = xlabels;
            // callback-Function parms.cbconfig
            if (typeof parms !== "undefined" && typeof parms.cbconfig === "function") {
                parms.cbconfig(config);
            }
            let icolor = -1;

            for (let dataset of datasets) {
                if (typeof dataset.backgroundColor === "undefined") {
                    icolor++;
                    if (icolor >= 20) {
                        icolor = 0;
                    }
                    dataset.backgroundColor = kli6900.getOneOf20Colors(icolor);
                    dataset.borderColor = kli6900.getOneOf20Colors(icolor);
                    dataset.borderWidth = 2;
                    if (typeof dataset.pointRadius === "undefined") {
                        dataset.pointRadius = 0;
                    }
                    dataset.fill = false;
                    dataset.tension = 0;
                }
            }
            config.data.datasets = datasets;

            let mh = Math.ceil($("#" + wrapperid).parent().height() * 0.7);
            let containerid = wrapperid + (Math.floor(Math.random() * 1000000) + 1000000);
            let container = null;
            if (typeof parms !== "undefined" && parms.big === true) {
                $("#" + wrapperid)
                    .append($("<div/>", {
                        class: "col  col-12 kli1000chartwrapper d-flex flex-wrap",
                        css: {
                            "min-height": mh + "px"
                        },
                        id: containerid + "wrapper"
                    })
                        .append($("<div/>", {
                            class: "col  col-12 kli1000charttopbuttons",
                            id: containerid + "topbuttons"
                        }))
                        .append($("<div/>", {
                            class: "col col-8",
                            css: {
                                "min-height": mh + "px"
                            }
                        })
                            .append($("<canvas/>", {
                                id: containerid + "canvas"
                            }))
                        )
                        .append($("<div/>", {
                            class: "col  col-3 kli1000chartrightbuttons",
                            id: containerid + "rightbuttons"
                        }))
                    );
                container = document.getElementById(containerid);
            } else {
                $("#" + wrapperid)
                    .append($("<div/>", {
                        class: "col  col-lg-4 kli1000chart",
                        css: {
                            "min-height": mh + "px"
                        },
                        id: containerid
                    }));
                container = document.getElementById(containerid);
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
            }
            canvasid = containerid + "canvas";
            let canvas = document.getElementById(canvasid);
            let ctx = canvas.getContext("2d");
            graph = new Chart(ctx, config);
            graph.options.responsive = false;

            // Automatisch berechnete Achsengrenzen übernehmen
            // TODO: verallgemeinern, weitere Achsen sind denkbar
            for (const axis of ["x", "y"]) {
                const scale = graph.scales[axis];
                graph.options.scales[axis].min = scale.min;
                graph.options.scales[axis].max = scale.max;
            }

            graph.update("none");
            let topbuttoncontainerid = containerid + "topbuttons";
            await addChartStandardButtons(topbuttoncontainerid, canvasid);
            return canvasid;
        }

        async function addChartStandardButtons(buttoncontainerid, canvasid) {
            $("#" + buttoncontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
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

            $("#" + buttoncontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    html: "print table",
                    title: "show Table of label and data of the datasets",
                    click: async function (evt) {
                        evt.preventDefault();
                        let canvasid = $(this).attr("canvasid");
                        let wrapperid = $(this).closest(".kli1000chartwrapper").first().attr("id");
                        kli1000E.showTable4Chart(canvasid, wrapperid, {
                            maxprecision: 3
                        });

                        kli1000E.showTable4Clusters(canvasid, wrapperid, {
                            maxprecision: 3
                        });

                        kli1000E.showTable4Clusters(canvasid, wrapperid, {
                            maxprecision: 3,
                            rawdata: true,
                        });

                    }
                }));
        }


        function getLineChartTemplate(title, xlabels, datasets) {
            let template = {
                type: "line",
                data: {
                    labels: xlabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: !!title,
                            text: title
                        },
                        legend: {
                            position: "bottom",
                            display: datasets.length > 1
                        }
                    },
                    scales: {
                        x: {
                            type: "category",
                            labels: xlabels,
                            title: {
                                display: false,
                                text: "x"
                            }
                        },
                        y: {
                            type: "linear",
                            beginAtZero: false,
                            title: {
                                display: false,
                                text: "y"
                            }
                        }
                    },
                    elements: {
                        line: {
                            tension: 0,
                            borderWidth: 2
                        },
                        point: {
                            radius: 2,
                            hoverRadius: 5
                        }
                    }
                }
            };
            return template;
        }
        return {
            showLineChart
        }
    };

    kli1000E.showTable4Clusters = function (canvasid, wrapperid, parms) {
        // maxprecision: kli6900.harmonizeDecimalPrecision mit Feldvorgabe denkbar
        if (typeof parms.maxprecision === "undefined") {
            parms.maxprecision = 0;
        }
        let suffix = "";
        if (typeof parms.rawdata === "undefined") {
            parms.rawdata = false;
        }
        if (parms.rawdata === true) {
            suffix = "raw";
        }
        let graph = Chart.getChart(canvasid);
        let clusters = {};
        let irow = -1;
        for (let dataset of graph.data.datasets) {
            irow++;
            if (typeof dataset.cluster !== "undefined") {
                if (typeof clusters[dataset.cluster] === "undefined") {
                    clusters[dataset.cluster] = {
                        count: 0,
                        indexes: [],
                        labels: []
                    }
                }
                clusters[dataset.cluster].count++;
                clusters[dataset.cluster].indexes.push(irow);
                clusters[dataset.cluster].labels.push(dataset.label);
            }
        }
        let clusterids = Object.keys(clusters);
        for (let clusterid of clusterids) {
            $("#" + wrapperid)
                .append($("<div/>", {
                    class: "col col-12",
                    id: wrapperid + "charttablew" + clusterid + suffix
                })
                    .append($("<table/>", {
                        id: wrapperid + "charttable" + clusterid + suffix,
                        class: "display",
                        style: "width:100%"
                    }))
                );

            let tableid = wrapperid + "charttable" + clusterid + suffix;
            $("#" + tableid).empty();

            let theaders = [];
            theaders.push("label");
            theaders = theaders.concat(graph.data.labels);
            let headers = [];
            for (let theader of theaders) {
                headers.push({ data: theader, title: theader });
            }

            let rows = [];
            for (let index of clusters[clusterid].indexes) {
                let dataset = graph.data.datasets[index];
                //for (let dataset of graph.data.datasets) {
                let row = {};
                row.label = dataset.label;
                if (parms.rawdata === false) {
                    for (let i = 0; i < dataset.data.length; i++) {
                        let n = parms.maxprecision;
                        if (n > 0) {
                            for (let i = 0; i < dataset.data.length; i++) {
                                let value = dataset.data[i];
                                row[graph.data.labels[i]] = kli1000E.roundn(value, n);
                            }
                        } else {
                            row[graph.data.labels[i]] = dataset.data[i];
                        }
                    }
                } else {
                    for (let i = 0; i < dataset.data.length; i++) {
                        let value = dataset.raws[i];
                        value = kli1000E.roundn(value, 3);
                        row[graph.data.labels[i]] = value;
                    }
                }
                rows.push(row);
            }
            requestAnimationFrame(async function () {
                let table = $("#" + tableid).DataTable({
                    title: graph.options,
                    data: rows,
                    columns: headers,
                    destroy: true
                });
                let tableTitle = graph.options.plugins.title.text;
                $("#" + tableid)
                    .prepend($("<caption/>", {
                        html: tableTitle + " Cluster: " + clusterid + " (" + clusters[clusterid].count + ") " + suffix,
                        class: "lead",
                        css: {
                            "caption-side": "top",
                            "color": "black",
                            "font-weight": "bold",
                            "font-size": "large",
                            "text-align": "center"
                        }
                    }));
                kli6900.putMessage("Tabelle ausgegeben", 1);
            });
        }
    }

    kli1000E.showTable4Chart = function (canvasid, wrapperid, parms) {
        // maxprecision: kli6900.harmonizeDecimalPrecision mit Feldvorgabe denkbar
        if (typeof parms.maxprecision === "undefined") {
            parms.maxprecision = 0;
        }
        let graph = Chart.getChart(canvasid);
        $("#" + wrapperid)
            .append($("<div/>", {
                class: "col col-12",
                id: wrapperid + "charttablew"
            })
                .append($("<table/>", {
                    id: wrapperid + "charttable",
                    class: "display",
                    style: "width:100%"
                }))
            );

        let tableid = wrapperid + "charttable";
        $("#" + tableid).empty();

        let theaders = [];
        theaders.push("label");
        theaders = theaders.concat(graph.data.labels);
        let headers = [];
        for (let theader of theaders) {
            headers.push({ data: theader, title: theader });
        }

        let rows = [];
        for (let dataset of graph.data.datasets) {
            let row = {};
            row.label = dataset.label;
            for (let i = 0; i < dataset.data.length; i++) {
                let n = parms.maxprecision;
                if (n > 0) {
                    for (let i = 0; i < dataset.data.length; i++) {
                        let value = dataset.data[i];
                        dataset.data[i] = kli1000E.roundn(value, n);
                    }
                }
                row[graph.data.labels[i]] = dataset.data[i];
            }
            rows.push(row);
        }
        requestAnimationFrame(async function () {
            let table = $("#" + tableid).DataTable({
                title: graph.options,
                data: rows,
                columns: headers,
                destroy: true
            });
            let tableTitle = graph.options.plugins.title.text;
            $("#" + tableid)
                .prepend($("<caption/>", {
                    html: tableTitle,
                    class: "lead",
                    css: {
                        "caption-side": "top",
                        "color": "black",
                        "font-weight": "bold",
                        "font-size": "large",
                        "text-align": "center"
                    }
                }));

            kli6900.putMessage("Tabelle ausgegeben", 1);
        });
    }

    kli1000E.roundn = function (value, n) {
        if (typeof value === "number") {
            return Number(value.toFixed(n));
        }
        if (typeof value === "string" &&
            value.trim() !== "" &&
            Number.isFinite(Number(value))) {
            return String(Number(Number(value).toFixed(n)));
        }
        return value;
    }



    // --- Weitere Modul-API ---
    kli1000E.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000E = kli1000E;
})(window);
