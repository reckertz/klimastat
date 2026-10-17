/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000E01 = {};
    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht
    /**
     * factory-module für ein spezielles LineChart, das mit kli1000E ausgegeben wird
     * die Factory erzeugt eine Instanz zu Button-Vorgaben, dadurch
     * können weitere clones und varianten besser erzeugt werden
     * auf IPCC-Periodenvergleich oder Jahresvergleiche
     * mit Konfigurationsbutton nach Extremwerten der Stationen
     * und Extremwerten der Daten
     * Datenzugriff auf KLIDATA und KLIDATA10 mit Verdichtung auf Jahre und IPCC-Perioden
     * Aufruf auch von Clusteranalysen
     */

    kli1000E01.createGHCNDChart = function () {

        let recordset = {};   // mit key und allen attributen (labeln) für das dataset

        /**
        * showAllRanks - Integrierte Anzeige mehrere Attribute der Stationen im Linechart,
        * x-Achse als category je Attribut, normalisierte Werte mit z-order
        *
        * @param {any} wrapperid -
        * @param {any} geopoints -
        * @param {any} layername -
        * @param {any} dataControl -
        *
        * @returns {any} - This function does not return a value but performs assertions on the input data.
        */
        async function showAllRanks(wrapperid, geopoints, layername, dataControl) {
            // line-Chart mit category als x-Achse, das sind die Attribute
            let attrs = "latitude,height,popd_1950,popd_2019,uopp_1950,uopp_2019,zind_1950AD,zind_2019AD".split(",");
            let anz = attrs.length;
            let stationcontrol = {};
            let attrdata = [];
            let dobuf = {};
            let ind = -1;
            let datasets = [];
            let zindcontrol = kli6901.getZindControl();
            let zinds = Object.keys(zindcontrol);
            for (let geopoint of geopoints) {
                ind++;
                let key = geopoint.source + "_" + geopoint.stationid;
                if (typeof dataControl === "undefined") {
                    continue;
                } else if (typeof dataControl[key] === "undefined") {
                    continue;
                }
                let attrvalues = [];
                let dataset = {
                    ind: ind,
                    key: geopoint.source + "_" + geopoint.stationid,
                    source: geopoint.source,
                    stationid: geopoint.stationid,
                    stationname: geopoint.stationname,
                    raws: new Array(anz).fill(-1),
                    vals: new Array(anz).fill(-1),
                    data: new Array(anz).fill(-1),
                };
                // da die Attribute in geopoints enthalten sind, können sie vollständig übernommen werden nach values
                for (let i = 0; i < attrs.length; i++) {
                    let attribute = attrs[i];
                    let rawvalue = geopoint[attrs[i]];
                    dataset.raws[i] = rawvalue;
                    let value = Number(rawvalue);
                    if (!Number.isFinite(value)) {
                        dataset.vals[i] = null;
                        dataset.data[i] = null;
                        continue;
                    }
                    if (attribute.startsWith("popd")) {
                        value = value >= 0
                            ? Math.log1p(value)
                            : null;
                        dataset.vals[i] = value;
                    } else if (attribute.startsWith("zind")) {
                        let ind = zinds.indexOf("" + rawvalue);
                        if (ind >= 0) {
                            dataset.vals[i] = ind;
                        } else {
                            dataset.vals[i] = null;
                        }
                    } else {
                        dataset.vals[i] = value;
                    }
                }
                datasets.push(dataset);
            }
            // jetzt stehen in datasets[i].vals die transormierten Werte
            // jetzt geht es an die Analytic mit Z-Order nach datasets[i].data
            // latitude,height sind unabhängige Werte
            // popd_1950,popd_2019,uopp_1950,uopp_2019,zind_1950AD,zind_2019AD"
            // sind zeitabhängig und somit in ihrer Gesamtheit zu betrachten
            // es geht also um "attrgroups"
            let attrgroups = [
                ["latitude", 0, 0, "latitude", null, 1],
                ["height", 1, 1, "height", null, -1],
                ["popd", 2, 3, "popd_1950", "popd_2019", 1],
                ["uopp", 4, 5, "uopp_1950", "uopp_2019", 1],
                ["zind", 6, 7, "zind_1950AD", "zind_2019AD", -1]
            ];
            for (let attrgroup of attrgroups) {
                let [groupname, ind1, ind2, name1, name2, korrfakt] = attrgroup;
                let reference = [];
                for (let iattr = ind1; iattr <= ind2; iattr++) {
                    let ref = datasets
                        .map(ds => ds.vals[iattr])
                        .filter(Number.isFinite);
                    reference = reference.concat(ref);
                }
                // hier liegt der Gesamtvektor vor
                const mean = ss.mean(reference);
                const sd = ss.standardDeviation(reference);
                for (let dataset of datasets) {
                    for (let iattr = ind1; iattr <= ind2; iattr++) {
                        let stationValue = dataset.vals[iattr];
                        if (Number.isFinite(stationValue)) {
                            const z = (stationValue - mean) / sd;
                            dataset.data[iattr] = z * korrfakt;
                        }
                    }
                }
            }
            // dataset komplettieren
            for (let dataset of datasets) {
                dataset.type = "line";
                dataset.label = dataset.stationname;
                dataset.pointRadius = 3;
            }
            let xlabels = attrs;
            let title = layername + " Rangskalierung, statisch";
            let parms = {};

            let lineChart = kli1000E.createLineChart();
            console.log(datasets);
            parms.cbconfig = function (config) {
                config.options.plugins.legend.display = false;
            };
            parms.big = true;
            let canvasid = await lineChart.showLineChart(wrapperid, title, xlabels, datasets, parms);
            let graph = Chart.getChart(canvasid);

            graph.options.interaction = {
                mode: 'point',  //'nearest',
                intersect: true,  // false,
                axis: 'x'
            };
            graph.options.plugins.tooltip.callbacks = {
                title: (items) => {
                    // const ctx = items[0];
                    // return ctx.dataset.stationname;  //[ctx.dataIndex];  //  + " " + items[0].label;
                },
                label: (ctx) => {
                    let raw = ctx.dataset.raws[ctx.dataIndex];
                    const stationname = ctx.dataset.stationname;
                    const attr = attrs[ctx.dataIndex];
                    if (!attr.startsWith("zind") && raw !== null) {
                        raw = Number(raw).toFixed(1);
                    }
                    return [
                        stationname,
                        attr + ": " + raw
                        //`Raw: ${raw}`,
                        //`Var: ${attrs[ctx.dataIndex]}`
                        //`Wert: ${ctx.parsed.y}`
                    ];
                }
            };
            graph.update("none");
            requestAnimationFrame(async function () {
                let stationbuttonscontainerid = canvasid.replace("canvas", "rightbuttons");
                let stationbuttonscontainer = $("#" + stationbuttonscontainerid);
                await showStationButtons(stationbuttonscontainer, canvasid, attrs);
                let topcontainerid = canvasid.replace("canvas", "topbuttons");
                let topcontainer = $("#" + topcontainerid);
                await showTopButtons(wrapperid, topcontainer, canvasid, attrs);
                requestAnimationFrame(async function () {
                    await addDataColumns(canvasid);
                });
            });
        }

        async function showTopButtons(wrapperid, topcontainer, canvasid, attrs) {

            $(topcontainer).find("button.kli1000special").remove();
            let topcontainerid = $(topcontainer).attr("id");
            $(topcontainer).find("button.kli1000cluster").remove();
            $(topcontainer)
                .append($("<button/>", {
                    class: "btn btn-sm btn-success kli1000cluster",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    topcontainerid: topcontainerid,
                    attrs: attrs,
                    html: " Cluster ",
                    click: async function (evt) {
                        evt.preventDefault();
                        await showClusters(wrapperid, canvasid);

                    }
                }));
        }

        async function addDataColumns(canvasid) {

            let stationbuttonscontainerid = canvasid.replace("canvas", "rightbuttons");
            let stationbuttonscontainer = $("#" + stationbuttonscontainerid);
            let topcontainerid = canvasid.replace("canvas", "topbuttons");
            let topcontainer = $("#" + topcontainerid);

            let graph = Chart.getChart(canvasid);

            let stationcontrol = {};
            let keycontrol = {};
            let datasets = [];
            let xlabels = [];
            for (let dataset of graph.data.datasets) {
                if (typeof stationcontrol[dataset.source] === "undefined") {
                    stationcontrol[dataset.source] = [];
                }
                stationcontrol[dataset.source].push(dataset.stationid);
                let key = dataset.source + "_" + dataset.stationid;
                keycontrol[key] = dataset.ind;
            }
            let attrs = [];
            for (let varname of ["TMAX", "TMIN"]) {
                attrs = structuredClone(graph.data.labels);
                xlabels = [];
                let records = await getData4Varname(stationcontrol, varname, attrs);
                // ret.records hat jetzt zwei zusätzliche Felder mit varname als prefix
                // Transformation der Variablen
                let newlabels = [];
                xlabels = xlabels.concat(graph.data.labels);
                for (let record of records) {
                    if (newlabels.length === 0) {
                        for (let variable of Object.keys(record)) {
                            if (variable.startsWith(varname)) {
                                newlabels.push(variable);
                                xlabels.push(variable);
                            }
                        }
                    }
                    let key = record.source + "_" + record.stationid;
                    let ind = keycontrol[key];
                    let dataset = graph.data.datasets[ind];
                    dataset.data.push(record[newlabels[0]]);
                    dataset.data.push(record[newlabels[1]]);
                    dataset.raws.push(record[newlabels[0]]);
                    dataset.raws.push(record[newlabels[1]]);
                    dataset.vals.push(record[newlabels[0]]);
                    dataset.vals.push(record[newlabels[1]]);
                    datasets[ind] = dataset;
                }

                for (let dataset of datasets) {
                    dataset.type = "line";
                    dataset.label = dataset.stationname;
                    dataset.pointRadius = 3;
                }
                // generische Rangskalierung
                // let [groupname, ind1, ind2, name1, name2, korrfakt] = attrgroup;
                let groupname = varname;
                let ind1 = xlabels.indexOf(newlabels[0]);
                let ind2 = xlabels.indexOf(newlabels[1]);
                let name1 = newlabels[0];
                let name2 = newlabels[1];
                let korrfakt = 1; // für TMAX, TMIN

                let reference = [];
                for (let iattr = ind1; iattr <= ind2; iattr++) {
                    let ref = datasets
                        .map(ds => ds.data[iattr])
                        .filter(Number.isFinite);
                    reference = reference.concat(ref);
                }
                // hier liegt der Gesamtvektor vor
                if (reference.length < 1) {
                    debugger;
                }
                const mean = ss.mean(reference);
                const sd = ss.standardDeviation(reference);
                for (let dataset of datasets) {
                    for (let iattr = ind1; iattr <= ind2; iattr++) {
                        let stationValue = dataset.data[iattr];
                        if (Number.isFinite(stationValue)) {
                            const z = (stationValue - mean) / sd;
                            dataset.data[iattr] = z * korrfakt;
                        }
                    }
                }
                graph.data.labels = xlabels;
                graph.data.datasets = datasets;
            }
            // Versuch das alte LineChart fortzuschreiben
            delete graph.options.scales.y.min;
            delete graph.options.scales.y.max;
            delete graph.options.scales.x.min;
            delete graph.options.scales.x.max;
            graph.options.scales.x.labels = xlabels;
            graph.update("none");
            for (const axis of ["x", "y"]) {
                const scale = graph.scales[axis];
                if (axis === "y") {
                    if (scale.max > scale.min * -1) {
                        scale.min = scale.max * -1;
                    } else {
                        scale.max = scale.min * -1;
                    }
                }
                graph.options.scales[axis].min = scale.min;
                graph.options.scales[axis].max = scale.max;
            }
            graph.update("none");
        }


        async function showClusters(wrapperid, canvasid) {
            let stationbuttonscontainerid = canvasid.replace("canvas", "rightbuttons");
            let stationbuttonscontainer = $("#" + stationbuttonscontainerid);
            let topcontainerid = canvasid.replace("canvas", "topbuttons");
            let topcontainer = $("#" + topcontainerid);
            let graph = Chart.getChart(canvasid);

            $("body")
                .append($("<dialog/>", {
                    css: {
                        width: "40%",
                        "max-width": "none"
                    },
                    id: "kli1000clusterdialog"
                })
                    .append($("<form/>", {
                        id: "kli1000clusterformwrapper",
                        method: "dialog"
                    })
                        .append($("<h3/>", {
                            html: "Cluster-Analysis"
                        }))
                        .append($("<div/>", {
                            id: "kli1000clusterform",
                            class: "form-grid"
                        }))
                        .append($("<hr/>"))
                        // <div class="button-area">
                        .append($("<div/>", {
                            //class: "form-buttons"
                        })
                            .append($("<div/>", {
                                class: "d-flex flex-wrap",
                                id: "kli1000attrbuttons"
                            }))
                            .append($("<div/>", {
                                class: "d-flex flex-wrap",
                                id: "kli1000cmdbuttons"
                            }))
                        )
                        .append($("<div/>", {
                            class: "form-list overflow-auto",
                            "max-height": "50vh",
                            "overflow-y": "auto"
                        })
                            .append($("<ul/>", {
                                id: "kli1000locliste"
                            }))
                        )
                    )
                );
            let attrs = graph.data.labels;
            let basecontrol = [];
            for (let attr of attrs) {
                let basename = attr.split("_")[0];
                if (basecontrol.includes(basename)) {
                    continue;
                }
                basecontrol.push(basename);
                $("#kli1000attrbuttons")
                    .append($("<button/>", {
                        class: "btn btn-sm btn-primary kli1000clusterattr",
                        style: "margin:5px;padding: 3px;",
                        attrbasename: basename,
                        html: "<span>" + oksign + "</span><span> " + basename + "</span>"
                    }));
            }
            $("#kli1000attrbuttons").on("click", ".kli1000clusterattr", function (evt) {
                evt.preventDefault();
                let status = $(this).find("span").first().text();
                if (status === okletter) {
                    $(this).find("span").first().html(cancelsign);
                } else {
                    $(this).find("span").first().html(oksign);
                }
            });

            $("#kli1000cmdbuttons")
                .append($("<button/>", {
                    class: "btn btn-sm btn-secondary kli1000clustercmds",
                    style: "margin:5px;padding: 3px;",
                    cmd: "cluster",
                    html: "Clusteranalyse",
                    click: async function (evt) {
                        evt.preventDefault();
                        let buttons = $("#kli1000attrbuttons").find("button.kli1000clusterattr").toArray();
                        let attrbasenames = [];
                        for (let button of buttons) {
                            let status = $(button).find("span").first().text();
                            if (status === okletter) {
                                attrbasenames.push($(button).attr("attrbasename"));
                            }
                        }
                        console.log("attrbasenames-selected:");
                        console.log(attrbasenames);
                        console.log("columnOrder-all:");
                        console.log(columnOrder);
                        await doClusters(wrapperid, canvasid, attrbasenames, columnOrder);
                        dialog.close();
                        $("#kli1000clusterdialog").remove();
                    }
                }));


            $("#kli1000cmdbuttons")
                .append($("<button/>", {
                    class: "btn btn-sm btn-secondary kli1000clustercmds",
                    style: "margin:5px;padding: 3px;",
                    cmd: "cancel",
                    html: "Abbruch",
                    click: function (evt) {
                        evt.preventDefault();
                        dialog.close();
                        $("#kli1000clusterdialog").remove();
                    }
                }));

            // DragDrop: kli1000attrbuttons,kli1000clusterattr,attrbasename

            //await doClusters(wrapperid, canvasid, attrs);
            let dialog = document.getElementById("kli1000clusterdialog");
            let form = document.getElementById("kli1000clusterform");
            dialog.showModal();
            //let container = $("#kli1000attrbuttons");
            let container = document.getElementById("kli1000attrbuttons");

            let draggedButton = null;
            let columnOrder = [];
            container.querySelectorAll("button.kli1000clusterattr").forEach(button => {
                button.draggable = true;
                button.addEventListener("dragstart", e => {
                    draggedButton = button;
                    e.dataTransfer.effectAllowed = "move";
                });
                button.addEventListener("dragover", e => {
                    e.preventDefault();
                });
                button.addEventListener("drop", e => {
                    e.preventDefault();
                    if (!draggedButton || draggedButton === button) return;
                    // Gezogenen Button vor dem Zielbutton einfügen
                    container.insertBefore(draggedButton, button);
                    // Reihenfolge aus dem DOM übernehmen
                    columnOrder = [...container.querySelectorAll("button.kli1000clusterattr")]
                        .map(btn => btn.attributes["attrbasename"].textContent);  //Number(btn.dataset.col));
                    console.log(columnOrder);
                    // updateColumnOrder();
                });
                button.addEventListener("dragend", () => {
                    draggedButton = null;
                });
            });

            function updateColumnOrder() {
                chart.data.labels = columnOrder.map(i => labels[i]);
                chart.data.datasets.forEach((ds, j) => {
                    ds.data = columnOrder.map(i => datasets[j].data[i]);
                });
                chart.update("none");
            }

        }


        async function doClusters(wrapperid, canvasid, attrbasenames, columnOrder) {
            console.log(wrapperid, canvasid);
            let stationbuttonscontainerid = canvasid.replace("canvas", "rightbuttons");
            let stationbuttonscontainer = $("#" + stationbuttonscontainerid);
            let topcontainerid = canvasid.replace("canvas", "topbuttons");
            let topcontainer = $("#" + topcontainerid);

            let graph = Chart.getChart(canvasid);
            let datasets = graph.data.datasets;
            let labels = graph.data.labels;

            // Bereinigung datasets, Entfernung kernel-Sätze und means-Sätze
            for (let i = datasets.length - 1; i >= 0; i--) {
                let dataset = datasets[i];
                if (typeof dataset.settype === "undefined") {
                    datasets[i].settype = "raw";
                    dataset.settype = "raw";
                } else if (dataset.settype === "kernel") {
                    datasets[i].settype = "raw";
                    dataset.settype = "raw";
                } else {
                    datasets.splice(i, 1);
                }
            }

            let attrindexes = [];
            for (let i = 0; i < labels.length; i++) {
                let label = labels[i];
                let basename = label.split("_")[0];
                if (attrbasenames.includes(basename)) {
                    attrindexes.push(i);
                }
            }
            let keycontrol = {};
            let ind = -1;
            let sortcontrol = [];
            for (let dataset of datasets) {
                ind++;
                let cdata = [];
                for (let index of attrindexes) {
                    cdata.push(dataset.data[index]);
                }
                dataset.cdata = structuredClone(cdata);
                let key = dataset.key;
                if (typeof keycontrol[key] === "undefined") {
                    keycontrol[key] = {};
                    keycontrol[key].ind = ind;
                }
                let sum = 0;
                for (let value of dataset.cdata) {  // dataset.data
                    if (value !== null) {
                        sum += value;
                    }
                }
                keycontrol[key].sum = sum;
                let members = [];
                let keys = [];
                sortcontrol.push([sum, ind, key, members, keys]);
            }
            sortcontrol = sortcontrol.sort(function (a, b) {
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
                    return -1;
                } else if (a[1] > b[1]) {
                    return 1;
                } else if (a[1] < b[1]) {
                    return -1;
                } else {
                    return 0;
                }
            });
            let kernels = [];  // bekommt [sum, ind, key, members] als elemente
            let indcontrol = [];
            kernels.push(sortcontrol[0]);
            indcontrol.push(0);
            let lastind = sortcontrol.length - 1;
            kernels.push(sortcontrol[lastind]);
            indcontrol.push(lastind);
            let middleind = Math.floor(sortcontrol.length / 2);
            kernels.push(sortcontrol[middleind]);
            indcontrol.push(middleind);
            let ihit = kernels.length;
            let len = datasets.length;
            // test von detrandom - wie erwartet, wiederholbar!!!
            /*
            for (let i = 0; i < 10; i++) {
                let detrandomx = kli6900.seededRandom(4711);
                let rnds = [];
                for (let j = 0; j < 10; j++) {
                    rnds.push(detrandomx());
                }
                console.log(rnds);
            }
            */
            console.log(Math.sqrt(datasets.length));
            let maxclusters = Math.ceil(Math.sqrt(datasets.length) / 2);
            let detrandom = kli6900.seededRandom(4711);
            for (let r = 0; r < maxclusters; r++) {
                if (ihit >= maxclusters) {
                    break;
                }
                //let ind = Math.floor(Math.random() * len);
                let rnum = detrandom();
                let ind = Math.floor(rnum * len);
                if (!indcontrol.includes(ind)) {
                    indcontrol.push(ind);
                    kernels.push(sortcontrol[ind]);
                    ihit++;
                }
            }
            for (let kernel of kernels) {
                let index = kernel[1];
                datasets[index].settype = "kernel";
            }
            // datasets auf die Kernel zuordnen
            for (let idataset = 0; idataset < datasets.length; idataset++) {
                let candidate = datasets[idataset];
                let a = candidate.cdata;
                let actkind = -1;
                let actdis = 999999;
                let actind = -1;
                let actkey = "";
                for (let ikernel = 0; ikernel < kernels.length; ikernel++) {
                    let kernel = kernels[ikernel];
                    let kernelset = datasets[kernel[1]];
                    let b = kernelset.cdata;
                    let dis = squaredDistance(a, b);
                    if (dis < actdis) {
                        actkind = ikernel;
                        actdis = dis;
                        actind = idataset;
                        actkey = candidate.key;
                    }
                }
                kernels[actkind][3].push(actind);
                kernels[actkind][4].push(actkey);
                if (actind !== keycontrol[actkey].ind) {
                    alert("mist");
                }
            }
            // .kli1000stationbutton" key="GHCND_GME00121042" canvasid="kli1000databubblewrapper1483048canvas" 
            // Vererben der Cluster auf die Datasets und Buttons sowie Abrufbuttons einrichten
            let i = -1;
            for (let kernel of kernels) {
                i++;
                console.log(i, kernel[0], kernel[2], kernel[3]);
            }

            $("#" + topcontainerid).find("button.kli1000clusterbtns").off("click");
            $("button.kli1000clusterbtns").off("click");
            let oldbuttons = $("#" + topcontainerid).find("button.kli1000clusterbtns").toArray();
            for (let oldbutton of oldbuttons) {
                //$("#" + topcontainerid).find(".kli1000clusterbtns").off("click");
                $(oldbutton).off("click");
                $(oldbutton).remove();
            }

            $("#" + topcontainerid).find("button.kli1000clustervari").off("click");
            $("button.kli1000clustervari").off("click");
            let oldvaributtons = $("#" + topcontainerid).find("button.kli1000clustervari").toArray();
            for (let oldbutton of oldvaributtons) {
                //$("#" + topcontainerid).find(".kli1000clusterbtns").off("click");
                $(oldbutton).off("click");
                $(oldbutton).remove();
            }

            //$("#" + topcontainerid)
            // Vererben auf die datasets und die stationbuttons
            let kernelind = -1;
            for (let kernel of kernels) {
                kernelind++;
                let [sum, ind, key, members, memberkeys] = kernel;
                let clustermembers = [];
                //for (let memberind of members) {
                for (let i = 0; i < members.length; i++) {
                    let memberind = members[i];
                    let memberkey = memberkeys[i];
                    let dataset = datasets[memberind];
                    if (dataset.key !== memberkey) {
                        alert("Grosser Mist");
                    }
                    let key = dataset.key;
                    clustermembers.push(key);
                    datasets[memberind].cluster = kernelind;
                    let memberbutton = $(stationbuttonscontainer).find("button.kli1000stationbutton[key=" + key + "]");
                    if ($(memberbutton).length === 1) {
                        $(memberbutton).attr("cluster", kernelind);
                    } else {
                        alert("Grosser Mist++");
                    }
                }
                $("#" + topcontainerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-warning kli1000clusterbtns",
                        css: {
                            padding: "1px",
                            margin: "5px"
                        },
                        canvasid: canvasid,
                        cluster: kernelind,
                        html: "<span>" + oksign + "</span><span> cluster: " + kernelind + "</span>"
                    }));
            }


            $("#" + topcontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-info kli1000clustervari",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    doshow: "clusterkernels",
                    html: "<span>" + cancelsign + "</span><span> show kernels</span>",
                    title: "show original cluster-kernels"
                }));

            $("#" + topcontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-info kli1000clustervari",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    doshow: "hideraw",
                    html: "<span>" + cancelsign + "</span><span> hide raws</span>",
                    title: "hide normal datasets"
                }));

            $("#" + topcontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-info kli1000clustervari",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    doshow: "clustermeans",
                    html: "<span>" + cancelsign + "</span><span> show means</span>",
                    title: "show calculated cluster-means"
                }));

            $("#" + topcontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    html: "print cluster-table",
                    title: "show Table of label and data of the datasets after clustering",
                    click: async function (evt) {
                        evt.preventDefault();
                        let canvasid = $(this).attr("canvasid");
                        let wrapperid = $(this).closest(".kli1000chartwrapper").first().attr("id");
                        kli1000E.showTable4Clusters(canvasid, wrapperid, {
                            maxprecision: 3
                        });

                        //showTable4Clusters(canvasid, wrapperid, {
                        //    maxprecision: 3,
                        //    rawdata: true,
                        //});

                    }
                }));

            $("#" + topcontainerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary",
                    css: {
                        padding: "1px",
                        margin: "5px"
                    },
                    canvasid: canvasid,
                    html: "print raw-table",
                    title: "show Table of label and data of the rawdata after clustering",
                    click: async function (evt) {
                        evt.preventDefault();
                        let canvasid = $(this).attr("canvasid");
                        let wrapperid = $(this).closest(".kli1000chartwrapper").first().attr("id");
                        kli1000E.showTable4Clusters(canvasid, wrapperid, {
                            maxprecision: 3,
                            rawdata: true
                        });
                    }
                }));

            for (let i = 0; i < graph.data.datasets.length; i++) {
                graph.setDatasetVisibility(i, true);
            }
            graph.update("none");
            // columnOrder übernehmen, wenn vorhanden und Verstecken, wenn notwendig
            // attrbasenames ist die aktuelle Auswahl schon in der richtigen Reihenfolge
            if (columnOrder.length > 0) {
                // komplette Übernahme der Reihenfolge
                let oldOrder = graph.data.labels;
                // data, vals und raws müssen konvertiert werden ebenso wie labels bzw. xlabels.
                // das Prinzip: gezielt redundant in Zwischen array arbeiten
                // columnOrder und attrbasenames gehen nicht auf die konkrete Variable
                let newOrder = [];
                let icol = -1;
                for (let column of columnOrder) {
                    let ihit = 0;
                    for (let label of oldOrder) {
                        if (ihit >= 2) {
                            break;
                        }
                        if (label.startsWith(column)) {
                            ihit++;
                            icol++;
                            newOrder.push({
                                label: label,
                                base: column,
                                newcol: icol,
                                oldcol: oldOrder.indexOf(label),
                                visible: attrbasenames.includes(column)
                            });
                        }
                    }
                }
                let len = graph.data.datasets[0].data.length;

                for (let dataset of graph.data.datasets) {
                    let newdata = new Array(len).fill(null);
                    let newcdata = new Array(len).fill(null);
                    let newvals = new Array(len).fill(null);
                    let newraws = new Array(len).fill(null);
                    for (let order of newOrder) {
                        newdata[order.newcol] = dataset.data[order.oldcol];
                        newcdata[order.newcol] = dataset.cdata[order.oldcol];
                        newvals[order.newcol] = dataset.vals[order.oldcol];
                        newraws[order.newcol] = dataset.raws[order.oldcol];
                    }
                    dataset.data.length = 0;
                    dataset.cdata.length = 0;
                    dataset.vals.length = 0;
                    dataset.raws.length = 0;
                    dataset.data = newdata;
                    dataset.cdata = newcdata;
                    dataset.vals = newvals;
                    dataset.raws = newraws;
                }
                let newlabels = new Array(len).fill("");
                for (let order of newOrder) {
                    newlabels[order.newcol] = graph.data.labels[order.oldcol];
                }
                graph.data.labels.length = 0;
                graph.data.labels = newlabels;
                graph.options.scales.x.labels = newlabels;
                console.log(newlabels);
                console.log(newOrder);
                graph.update("none");
            }

            $("#" + topcontainerid).on("click", "button.kli1000clusterbtns", function (evt) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                evt.stopPropagation();
                let status = $(this).find("span").first().text();
                let doshow = false;
                if (status === okletter) {
                    doshow = false;
                    $(this).find("span").first().html(cancelsign);
                } else {
                    doshow = true;
                    $(this).find("span").first().html(oksign);
                }
                let canvasid = $(this).attr("canvasid");

                let cluster = $(this).attr("cluster");
                let buttons = $("button.kli1000stationbutton[cluster=" + cluster + "]").toArray();
                let keys = [];
                for (let button of buttons) {
                    if (doshow === true) {
                        $(button).find("span").first().html(oksign);
                    } else {
                        $(button).find("span").first().html(cancelsign);
                    }
                    keys.push($(button).attr("key"));
                }
                let graph = Chart.getChart(canvasid);
                for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
                    if (keys.includes(datasets[idataset].key)) {
                        if (doshow === true) {
                            graph.setDatasetVisibility(idataset, true);
                        } else {
                            graph.setDatasetVisibility(idataset, false);
                        }
                    }
                }
                graph.update("none");
            });

            $("#" + topcontainerid).on("click", "button.kli1000clustervari", function (evt) {
                //canvasid: canvasid,
                //doshow: "clustermeans", und "clusterkernels"
                let doshow = $(this).attr("doshow");
                let canvasid = $(this).attr("canvasid");
                let status = $(this).find("span").first().text();
                if (status === okletter) {
                    $(this).find("span").first().html(cancelsign);
                    status = "";
                } else {
                    $(this).find("span").first().html(oksign);
                    status = okletter;
                }
                let stationbuttonscontainerid = canvasid.replace("canvas", "rightbuttons");
                let stationbuttonscontainer = $("#" + stationbuttonscontainerid);
                let topcontainerid = canvasid.replace("canvas", "topbuttons");
                let topcontainer = $("#" + topcontainerid);

                let graph = Chart.getChart(canvasid);
                let datasets = graph.data.datasets;
                if (doshow === "clusterkernels") {
                    // bestehende Sichtbarkeit bleibt unverändert
                    for (let dataset of datasets) {
                        if (dataset.settype === "kernel") {
                            if (status === okletter) {
                                dataset.borderWidth = 7;
                            } else {
                                dataset.borderWidth = 2;
                            }
                        }
                    }
                    graph.update("none");
                } else if (doshow === "hideraw") {
                    // cluster-Sichtbarkeit muss geprüft werden
                    // kli1000clusterbtns und cluster sowie canvasid
                    let visibleclusters = [];
                    let buttons = $(topcontainer).find("button.kli1000clusterbtns").toArray();
                    for (let button of buttons) {
                        let status = $(button).find("span").first().text();
                        if (status === okletter) {
                            visibleclusters.push($(button).attr("cluster"));
                        }
                    }

                    for (let i = 0; i < datasets.length; i++) {
                        let dataset = datasets[i];
                        if (dataset.settype === "raw") {
                            let button = $(stationbuttonscontainer).find("button.kli1000stationbutton[key=" + dataset.key + "]");
                            if (status === okletter) {
                                graph.setDatasetVisibility(i, false);
                                //kli1000stationbutton" mit key und canvasid
                                $(button).find("span").first().html(cancelsign);
                            } else {
                                if (visibleclusters.includes("" + dataset.cluster)) {
                                    graph.setDatasetVisibility(i, true);
                                    $(button).find("span").first().html(oksign);
                                }
                            }
                        }
                    }
                    graph.update("none");
                } else if (doshow === "clustermeans") {
                    // Berechnen Mittelwerte und Ausgabe je Cluster
                    for (let kernel of kernels) {
                        //debugger;
                    }
                    debugger;
                }
                //datasets[index].settype = "kernel";
            });
        }


        function squaredDistance(a, b) {
            let sum = 0;
            for (let i = 0; i < a.length; i++) {
                const d = a[i] - b[i];
                sum += d * d;
            }
            return sum;
        }


        async function getData4Varname(stationcontrol, varname, attrs) {
            let meta = kli1000A.getMeta();
            // sourcemeta: sourcemeta, varmeta: varmeta
            let records = [];
            let datacontrol = {};
            for (let source of Object.keys(stationcontrol)) {
                let thismeta = null;
                for (let varparms of meta.varmeta) {
                    if (varparms.source === source && varparms.variable === varname) {
                        thismeta = structuredClone(varparms);
                        break;
                    }
                }
                let sql = "SELECT ";
                sql += " source, stationid, variable, years";
                sql += " FROM " + thismeta.table;
                sql += " WHERE source = '" + source + "'";
                sql += " AND stationid IN('" + stationcontrol[source].join("', '") + "')";
                sql += " AND variable = '" + varname + "'";
                sql += " ORDER BY source, stationid, variable";
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
                    continue;
                } else if (Array.isArray(ret.records) && ret.records.length === 0) {
                    console.log(ret.message + " no data found " + pmsg);  // no data
                    kli6900.putMessage(ret.message + " no data found " + pmsg, 3);
                    continue;
                } else {
                    // brauchbare Daten zurückgeben

                    console.log(ret.records.length + " found" + pmsg);
                    kli6900.putMessage(ret.records.length + " found" + pmsg, 1);
                    for (let record of ret.records) {
                        if (typeof record.years === "string") {
                            record.years = JSON.parse(record.years);
                        }
                        //datacontrol[key].variables[variable]
                        let key = record.source + "_" + record.stationid;
                        if (typeof datacontrol[key] === "undefined") {
                            datacontrol[key] = {
                                variables: {}
                            }
                        }
                        if (typeof datacontrol[key].variables[varname] === "undefined") {
                            datacontrol[key].variables[varname] = {
                                yeardata: {},
                                totaldata: {}
                            }
                        }
                        // Aufbereiten 1961-1990 und 1991-2020
                        let selparms = {};
                        let buttons = $("button.kli1000selbtn[varname=range").toArray();
                        for (let button of buttons) {
                            let status = $(button).find("span").first().text();
                            if (status !== okletter) {
                                continue;
                            }
                            let varname = $(button).attr("varname");
                            let varvalue = $(button).attr("varvalue");
                            let fromyear = $(button).attr("fromyear");
                            let toyear = $(button).attr("toyear");
                            if (typeof selparms[varname] === "undefined") {
                                selparms[varname] = [];
                            }
                            selparms[varname].push({
                                fromyear: fromyear,
                                toyear: toyear
                            });
                            if (selparms.fromyear > parseInt(fromyear)) {
                                selparms.fromyear = parseInt(fromyear);
                            }
                            if (selparms.toyear < parseInt(toyear)) {
                                selparms.toyear = parseInt(toyear);
                            }
                        }

                        for (let i = 0; i < 2; i++) {
                            let { fromyear, toyear } = selparms.range[i];
                            // year-Verdichtung
                            let ihit = 0;
                            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                                let yeardata = record.years["" + iyear];
                                if (typeof yeardata !== "undefined") {
                                    ihit++;
                                    let result = kli6900.getTrivial(yeardata, false, false);   // doround, korr)
                                    result.year = "" + iyear;
                                    datacontrol[key].variables[varname].yeardata[result.year] = result;
                                }
                            }
                            //console.log("+++++", fromyear, toyear, ihit);
                        }
                        let resultfields = {};
                        let newrecord = {
                            source: record.source,
                            stationid: record.stationid,
                            variable: record.variable,
                        };
                        for (let i = 0; i < 2; i++) {
                            let { fromyear, toyear } = selparms.range[i];
                            // year-Verdichtung
                            let avgs = [];
                            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                                let yeardata = datacontrol[key].variables[varname].yeardata[iyear];
                                if (typeof yeardata !== "undefined") {
                                    avgs.push(yeardata.avg);
                                }
                            }
                            let result = kli6900.getTrivial(avgs, false, false);   // doround, korr)
                            resultfields[varname + "_" + fromyear] = result.avg;
                            newrecord[varname + "_" + fromyear] = result.avg;
                        }
                        records.push(newrecord);
                    } // rec
                } // vorhanden?
            } // source
            return records;
        }



        async function showStationButtons(stationbuttonscontainer, canvasid, attrs) {
            /*
            let dataset = {
                ind: ind,
                source: geopoint.source,
                stationid: geopoint.stationid,
                stationname: geopoint.stationname,
                raws: new Array(anz).fill(-1),
                vals: new Array(anz).fill(-1),
                data: new Array(anz).fill(-1),
            };
            */
            $(stationbuttonscontainer).children().remove();
            let graph = Chart.getChart(canvasid);
            let datasets = structuredClone(graph.data.datasets);
            for (let dataset of datasets) {
                let key = dataset.source + "_" + dataset.stationid;
                let color = kli6900.getContrastYIQ(dataset.backgroundColor);
                $(stationbuttonscontainer)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-primary kli1000stationbutton",
                        css: {
                            margin: "5px",
                            color: color,   // "black",
                            backgroundColor: dataset.backgroundColor
                        },
                        key: key,
                        canvasid: canvasid,
                        attrs: attrs,
                        html: "<span>" + oksign + "</span><span> " + dataset.stationname + "</span>"
                    }));
            }

            $(document).on("click", "button.kli1000stationbutton", function (evt) {
                evt.preventDefault();
                let status = $(this).find("span").first().text();
                if (status === okletter) {
                    $(this).find("span").first().html(cancelsign);
                    status = "";
                } else {
                    $(this).find("span").first().html(oksign);
                    status = okletter;
                }
                let canvasid = $(this).attr("canvasid");
                let key = $(this).attr("key");
                let graph = Chart.getChart(canvasid);
                for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
                    let dataset = graph.data.datasets[idataset];
                    if (dataset.key === key) {
                        if (status === okletter) {
                            graph.setDatasetVisibility(idataset, true);
                        } else {
                            graph.setDatasetVisibility(idataset, false);
                        }
                        break;
                    }
                }
                graph.update("none");
            });
        };

        return {
            showAllRanks
        }
    };


    // --- Weitere Modul-API ---
    kli1000E01.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000E01 = kli1000E01;
})(window);
