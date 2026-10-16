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

            /*
            for (let i = 0; i < attrs.length; i++) {
                let reference = datasets
                    .map(ds => ds.vals[i])
                    .filter(Number.isFinite);
                // values sind jetzt vertikale arrays
                // Referenzwerte eines Merkmals
                const mean = ss.mean(reference);
                const sd = ss.standardDeviation(reference);
                // Z-Score einer ausgewählten Station
                for (let dataset of datasets) {
                    let stationValue = dataset.vals[i];
                    if (Number.isFinite(stationValue)) {
                        const z = (stationValue - mean) / sd;
                        dataset.data[i] = z;
                    }
                }
            }
            */

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
            });
        }

        async function showTopButtons(wrapperid, topcontainer, canvasid, attrs) {
            $(topcontainer).find("button.kli1000special").remove();
            for (let variable of ["TMAX", "TMIN"]) {
                $(topcontainer)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-primary kli1000special",
                        css: {
                            padding: "1px",
                            margin: "5px"
                        },
                        varname: variable,
                        canvasid: canvasid,
                        attrs: attrs,
                        html: "<span>" + cancelsign + "</span><span> " + variable + "</span>"
                    }));
            }

            $(topcontainer).on("click", "button.kli1000special", async function (evt) {
                evt.preventDefault();

                let status = $(this).find("span").first().text();
                if (status === okletter) {
                    return;
                }
                $(this).find("span").first().html(oksign);
                let canvasid = $(this).attr("canvasid");
                let attrs = $(this).attr("attrs");
                let varname = $(this).attr("varname");
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

                // Versuch das alte LineChart fortzuschreiben
                graph.data.labels = xlabels;
                graph.data.datasets = datasets;
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
            });

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

                        await doClusters(wrapperid, canvasid, attrs, topcontainerid);
                    }
                }));
        }

        async function doClusters(wrapperid, canvasid, attrs, topcontainerid) {
            console.log(wrapperid, canvasid);
            let graph = Chart.getChart(canvasid);
            let datasets = graph.data.datasets;
            let labels = graph.data.labels;
            let keycontrol = {};
            let ind = -1;
            let sortcontrol = [];
            for (let dataset of datasets) {
                ind++;
                let key = dataset.key;
                if (typeof keycontrol[key] === "undefined") {
                    keycontrol[key] = {};
                    keycontrol[key].ind = ind;
                }
                let sum = 0;
                for (let value of dataset.data) {
                    if (value !== null) {
                        sum += value;
                    }
                }
                keycontrol[key].sum = sum;
                let members = [];
                sortcontrol.push([sum, ind, key, members]);
            }
            sortcontrol = sortcontrol.sort(function (a, b) {
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
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
            let ihit = 0;
            let len = datasets.length;
            for (let r = 0; r < 10; r++) {
                let ind = Math.floor(Math.random() * len);
                if (!indcontrol.includes(ind)) {
                    indcontrol.push(ind);
                    kernels.push(sortcontrol[ind]);
                    ihit++;
                }
                if (ihit >= 2) {
                    break;
                }
            }
            // datasets auf die Kernel zuordnen
            for (let idataset = 0; idataset < datasets.length; idataset++) {
                let candidate = datasets[idataset];
                let a = candidate.data;
                let actkind = -1;
                let actdis = 999999;
                let actind = -1;
                for (let ikernel = 0; ikernel < kernels.length; ikernel++) {
                    let kernel = kernels[ikernel];
                    let kernelset = datasets[kernel[1]];
                    let b = kernelset.data;
                    let dis = squaredDistance(a, b);
                    if (dis < actdis) {
                        actkind = ikernel;
                        actdis = dis;
                        actind = idataset;
                    }
                }
                kernels[actkind][3].push(actind);
            }
            // .kli1000stationbutton" key="GHCND_GME00121042" canvasid="kli1000databubblewrapper1483048canvas" 
            // Vererben der Cluster auf die Datasets und Buttons sowie Abrufbuttons einrichten
            let i = -1;
            for (let kernel of kernels) {
                i++;
                console.log(i, kernel[0], kernel[2], kernel[3]);
            }
            $("#" + topcontainerid).find(".kli1000clusterbtns").remove();

            $("#" + topcontainerid)
            let kernelind = -1;
            for (let kernel of kernels) {
                kernelind++;
                let [sum, ind, key, members] = kernel;
                let clustermembers = [];
                for (let memberind of members) {
                    let dataset = datasets[memberind];
                    let key = dataset.key;
                    clustermembers.push(key);
                    datasets[memberind].cluster = kernelind;
                    $("button.kli1000stationbutton[key=" + key + "]").attr("cluster", kernelind);
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
            debugger;
            $("#" + topcontainerid).on("click", "button.kli1000clusterbtns", function (evt) {
                evt.preventDefault();
                
                let status = $(this).find("span").first().text();
                let doshow = false;
                if (status === okletter) {
                    doshow = false;
                    $(this).find("span").first().html(cancelsign);
                } else {
                    doshow = true;
                    $(this).find("span").first().html(oksign);
                }
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
