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
                        css: {
                            margin: "5px"
                        },
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




    // --- Weitere Modul-API ---
    kli1000E.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000E = kli1000E;
})(window);
