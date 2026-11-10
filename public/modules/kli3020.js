/**
 * kli3020.js Module für die Topics einer location
 */

let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
let cancelsign = "&#10005;"; // x oder &#x25CF;
let okletter = "✓";
let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

let dashPatterns = [
    [],             // 0: durchgezogen
    [6, 4],         // 1: klassisch gestrichelt
    [2, 2],         // 2: fein gepunktet
    [10, 5],        // 3: lange Striche
    [8, 3, 2, 3],   // 4: dash-dot
    [1, 3],         // 5: sehr fein gepunktet
    [12, 4],        // 6: sehr lange Striche
    [3, 6],         // 7: kurze Striche, große Lücke
    [5, 2, 1, 2],   // 8: unregelmäßig
    [2, 4, 8, 4]    // 9: wechselnd
];

let methodShades = {
    avg: 0,
    min: 1,
    max: 2,
    kum: 0,
    "avg_reg": [0, 3],
    "kum_reg": [0, 3],
    val: 0,
    ext: 0
};


function createLocation() {

    //let parms = [title, function, datasource, variable, method, altmethod1, altmethod2, hydevar]
    let topicParms = [
        ["Zeitreihe", addStandardPage, "yeardata", "TMAX", "avg", "max", "min"],
        ["Zeitreihe", addStandardPage, "yeardata", "TMIN", "avg", "min", "max"],
        ["Zeitreihe", addStandardPage, "yeardata", "PRCP", "kum", "", ""],
        ["Zeitreihe", addStandardPage, "yeardata", "SNOW", "kum", "", ""],   // SNOW
        ["Zeitreihe", addStandardPage, "yeardata", "SNWD", "kum", "", ""],   // SNWD


        ["Trendanalyse", addStandardPage, "yeardata", "TMAX", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "TMIN", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "PRCP", "kum_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "SNOW", "kum_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "SNWD", "kum_reg", "", ""],

        ["Höhenanalyse", addHydePage, "yeardata", "TMAX", "avg", "min", "max", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "TMIN", "avg", "min", "max", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "PRCP", "kum", "", "", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "SNOW", "kum", "", "", "height"],   // SNWD
        ["Höhenanalyse", addHydePage, "yeardata", "SNWD", "kum", "", "", "height"],

        ["Bevölkerung", addHydePage, "yeardata", "TMAX", "avg", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "TMIN", "avg", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "PRCP", "kum", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "SNOW", "kum", "", "", "popd"],   // SNWD
        ["Bevölkerung", addHydePage, "yeardata", "SNWD", "kum", "", "", "popd"],

        ["Bebauung", addHydePage, "yeardata", "TMAX", "avg", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "TMIN", "avg", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "PRCP", "kum", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "SNOW", "kum", "", "", "uopp"],   // SNWD
        ["Bebauung", addHydePage, "yeardata", "SNWD", "kum", "", "", "uopp"],   // SNWD

        ["Urbanisierung", addHydePage, "yeardata", "TMAX", "avg", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "TMIN", "avg", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "PRCP", "kum", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "SNOW", "kum", "", "", "zind"],  // category!!!   // SNWD
        ["Urbanisierung", addHydePage, "yeardata", "SNWD", "kum", "", "", "zind"],

        ["Hitzewellen", addExtremePage, "years", "TMAX", "ext", "", ""],
        ["Kältewellen", addExtremePage, "years", "TMIN", "ext", "", ""],
        ["Starkregen", addExtremePage, "years", "PRCP", "ext", "", ""],
        ["Schnee", addExtremePage, "years", "SNOW", "ext", "", ""]    // SNWD
        ["Schnee", addExtremePage, "years", "SNWD", "ext", "", ""]    // SNWD
        /*
         ["Korrelation", "yeardata", "TMAX-TMIN", "avg-korr", "", ""],
         ["Korrelation", "yeardata", "TMAX-PRCP", "avg-korr", "", ""],
         ["Korrelation", "yeardata", "PRCP-SNOW", "kum-korr", "", ""],
         ["Korrelation", "yeardata", "TMAX-EXT", "avg-cnt-korr", "", ""],
         */
    ];

    let detailtopics = [
        ["Tagesreihe", "years", "TMAX", "val", "", ""],
        ["Tagesreihe", "years", "TMIN", "val", "", ""],
        ["Tagesreihe", "years", "PRCP", "val", "", ""],
        ["Tagesreihe", "years", "SNOW", "val", "", ""]
    ];

    // criticalDays[topic].title
    // criticalDays[topic].variable
    // criticalDays[topic].conditions[{days: n, mmin|max|minsum: m}];

    let criticalDays = {
        TMAX_hot: {
            title: "Hitzewelle",
            conditions: [
                { variable: "TMAX", days: 3, min: 30 }
            ],
            variable: "TMAX",
            color: "#FF0000",
            stations: {}  // mit <station>:[<isoday>...]
        },
        TMIN_tropic: {
            title: "Tropische Nächte",
            conditions: [
                { variable: "TMIN", days: 3, min: 20 }
            ],
            variable: "TMIN",
            color: "#ff9d00",
            stations: {}  // mit <station>:[<isoday>...]
        },
        TMIN_cold: {
            title: "Frostwelle",
            conditions: [
                { variable: "TMIN", days: 5, max: 0 }
            ],
            variable: "TMIN",
            color: "#0000FF",
            stations: {}  // mit <station>:[<isoday>...]
        },
        TMIN_cold1: {
            title: "Kältewelle",
            conditions: [
                { variable: "TMIN", days: 3, max: -10 },
            ],
            variable: "TMIN",
            color: "#0000FF",
            stations: {}  // mit <station>:[<isoday>...]
        },
        TMIN_danger1: {
            title: "Frosttage",
            conditions: [
                { days: 1, variable: "TMIN", max: 0 }
            ],
            variable: "TMIN",
            color: "#9000ff",
            stations: {}  // mit <station>:[<isoday>...]
        },

        TMIN_danger: {
            title: "Vereisungsgefahr",
            conditions: [
                { days: 1, variable: "TMIN", max: 0 },
                { days: 1, variable: "PRCP", min: 0.5 },
                { days: 1, variable: "SNWD", max: 1 }
            ],
            variable: "TMIN",
            color: "#9000ff",
            stations: {}  // mit <station>:[<isoday>...]
        },
        /*
        TMIN_danger2: {
            conditions: [
                { days: 1, variable: "PRCP", min: 0.5 }
            ],
            variable: "PRCP",
            color: "#9000ff",
            stations: {}  // mit <station>:[<isoday>...]
        },
        TMIN_danger3: {
            conditions: [
                { days: 1, variable: "SNWD", max: 1 }
            ],
            variable: "SNWD",
            color: "#9000ff",
            stations: {}  // mit <station>:[<isoday>...]
        },
        */
        PRCP_rain: {
            title: "Starkregen",
            conditions: [
                { variable: "PRCP", days: 1, min: 30 }
            ],
            variable: "PRCP",
            color: "#108cff", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        },
        PRCP_rain2: {
            title: "Dauerregen",
            conditions: [
                { variable: "PRCP", days: 3, minsum: 60 }
            ],
            variable: "PRCP",
            color: "#108cff", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        },
        SNWD_snow: {
            title: "Schneedecke-1",
            conditions: [
                { variable: "SNWD", days: 1, min: 20 },
            ],
            variable: "SNWD",
            color: "#FF10F0", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        },
        SNWD_snow2: {
            title: "Schneedecke-2",
            conditions: [
                { variable: "SNWD", days: 2, minsum: 30 }
            ],
            variable: "SNWD",
            color: "#FF10F0", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        },
        SNOW_snow: {
            title: "Schneefall-1",
            conditions: [
                { variable: "SNOW", days: 1, min: 20 }
            ],
            variable: "SNOW",
            color: "#FF10F0", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        },
        SNOW_snow2: {
            title: "Schneefall-2",
            conditions: [
                { variable: "SNOW", days: 2, minsum: 30 }
            ],
            variable: "SNOW",
            color: "#FF10F0", // neon-#FF1493
            stations: {}  // mit <station>:[<isoday>...]
        }
    };

    let containerid;
    let mode;
    let location;
    let locationkey;
    let geosets = [];
    let extdays = {};
    let records = [];
    let recindex;  // new Map auf records mit "key" aus <source>_<stationid>_<variable>
    //let maps = null;
    let vcontrol = {};
    let stationpatterns = {}; // stationkey auf dashPatternsIndex
    //locationInstances.push(createLocation());
    //let locIndex = locationInstances.length - 1;

    async function addTopics(newcontainerid, colIndex, newmode, newlocation, newgeosets) {
        containerid = newcontainerid;
        mode = newmode;
        location = kli6900.cloneObject(newlocation);
        geosets = kli6900.cloneObject(newgeosets);
        locationkey = location.locname.replace(/[^\p{L}\p{N}]/gu, "");
        locationkey += " " + location.geonameid;
        let firstpage = {};
        let ret = await getKLIDATA(location, geosets);  // records je Instanz übergeordnet!!!
        recindex = new Map(records.map((rec, i) => [rec.key, i]));
        console.log(records.length);
        for (let topicParm of topicParms) {
            let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
            if (mode === "mobile") {
                let $slider = null;
                let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
                $slider = $("<section>", {
                    id: "ds" + (Math.floor(Math.random() * 1000000) + 1000000),
                    class: "col col-12 slider mobile",  //  place-slider",
                    "data-topic": topicstring,
                    "data-colindex": colIndex,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar,
                });
                $("#" + containerid).append($slider);
                let pageid = "dp" + (Math.floor(Math.random() * 1000000) + 1000000);
                let $page = $("<article>", {
                    id: pageid,
                    class: "col col-12 page mobile",  //  place-page",
                    css: {
                        "scroll-margin-top": "50px"
                    },
                    "data-colindex": colIndex,
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar
                });
                if (typeof firstpage.topicstring === "undefined") {
                    firstpage.topicstring = topicstring;
                    firstpage.type = "page";
                    firstpage.colIndex = colIndex;
                    firstpage.locationkey = locationkey;
                    firstpage.locname = location.locname;
                }
                $page.append("<hr>");
                $page.append(
                    $("<span style='font-weight: bold;margin:5px;'>").text(`${location.locname} ${variable} ${title}`),
                    // $("<span style='margin:5px'>").text(`(${locationkey})`)
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "chart",
                        class: "mychart",
                        css: {
                            backgroundColor: "lightyellow"
                        }
                    })
                );
                $slider.append($page);
                let ret = await locfunction($page, mode, location, geosets, topicParm);
            } else if (mode === "desktop") {
                $("#" + containerid).append("<hr>");
                let $slider = null;
                let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
                $slider = $("section[data-topic='" + topicstring + "']");
                if ($slider.length === 0) {
                    $slider = $("<section>", {
                        id: "ds" + (Math.floor(Math.random() * 1000000) + 1000000),
                        class: "slider desktop",
                        //class: "col col-12",  //  place-slider",
                        css: {
                            width: "100%",
                            display: "flex",
                            "flex-wrap": "wrap"
                        },
                        "data-topic": topicstring,
                        "data-title": title,
                        "data-datasource": datasource,
                        "data-variable": variable,
                        "data-method": method,
                        "data-altmethod1": altmethod1,
                        "data-altmethod2": altmethod2,
                        "data-hydevar": hydevar,
                    });
                    $("#" + containerid).append($slider);
                }
                let pageid = "dp" + (Math.floor(Math.random() * 1000000) + 1000000);
                let $page = $("<article>", {
                    id: pageid,
                    class: "page desktop",
                    //class: "col col-4",  //  place-page",
                    css: {
                        flex: "0 0 31%",
                        "box-sizing": "border-box",
                        "padding-top": "5px",
                        margin: "3px",
                        border: "3px solid red"
                    },
                    "data-colindex": colIndex,
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar
                });
                if (typeof firstpage.topicstring === "undefined") {
                    firstpage.topicstring = topicstring;
                    firstpage.target = "slider";
                    firstpage.colIndex = null;
                    firstpage.locationkey = locationkey;
                    firstpage.locname = location.locname;
                }
                $page.append(
                    $("<span style='font-weight: bold;margin:5px;'>").text(`${location.locname} ${variable} ${title}`),
                    // $("<span style='margin:5px'>").text(`(${locationkey})`)
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "chart",
                        class: "mychart",
                        css: {
                            backgroundColor: "lightyellow"
                        }
                    })
                );
                $slider.append($page);
                let ret = await locfunction($page, mode, location, geosets, topicParm);
            }
        }
        return firstpage;
    }

    async function addStandardPage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min"],
        // bisher
        //async function showStatisticPage($page, itopic, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar) {
        // in locations[key] = {} stehen key, colindex, location, geosets bereit
        let fromyear = 1950;
        let toyear = 2019;
        let xlabels = [];
        for (let iyear = fromyear; iyear <= toyear; iyear++) {
            xlabels.push("" + iyear);
        }
        let anz = xlabels.length;
        // title, datasource, variable, method, altmethod1, altmethod2, hydevar
        // ["Zeitreihe", "yeardata", "TMAX", "avg", "max", "min",""],  // fehlende Werte sind durch "" ersetzt
        // ["Zeitreihe", "yeardata", "PRCP", "kum", "", ""],
        // ["Trendanalyse", "yeardata", "TMAX", "avg_reg", "", ""],
        // ["Höhenanalyse", "yeardata", "TMAX", "avg", "min", "max", "height"],
        // mehrere method denkbar
        let doregression = "";
        let methods = method.split("_");
        if (methods.length === 2) {
            method = methods[0];
            if (methods[1] === "reg") {
                doregression = methods[0];
            }
        }
        let datasets = [];
        if (datasource === "yeardata" && ["TMAX", "TMIN", "PRCP", "SNOW", "SNWD"].includes(variable) && ["avg", "kum"].includes(method)) {
            let stations = geosets[0];
            // Loop über die Stations
            for (let station of stations) {
                for (let setmethod of [method, altmethod1, altmethod2]) {
                    if (setmethod === "") continue;
                    let dataset = {
                        label: station.locname,
                        source: station.source,
                        stationid: station.stationid,
                        locname: station.locname,
                        stationkey: station.source + "_" + station.stationid,
                        datakey: station.source + "_" + station.stationid + "_" + variable,
                        variable: variable,
                        method: setmethod,
                        check: "data",
                        fromyear: fromyear,
                        toyear: toyear,
                        data: []
                    }
                    for (let record of records) {
                        if (dataset.datakey === record.key) {
                            // Daten übernehmen
                            for (let iyear = dataset.fromyear; iyear <= dataset.toyear; iyear++) {
                                if (typeof record.yeardata["" + iyear] === "undefined" || record.yeardata["" + iyear] === null) {
                                    dataset.data.push(null);
                                    continue;
                                }
                                if (setmethod === "avg") {
                                    dataset.data.push(record.yeardata["" + iyear].avg); // evtl. runden
                                    continue
                                }
                                if (setmethod === "min") {
                                    dataset.data.push(record.yeardata["" + iyear].min); // evtl. runden
                                    continue
                                }
                                if (setmethod === "max") {
                                    dataset.data.push(record.yeardata["" + iyear].max); // evtl. runden
                                    continue
                                }
                                if (setmethod === "kum") {
                                    dataset.data.push(record.yeardata["" + iyear].sum); // evtl. runden
                                    continue
                                }
                            }
                        }
                    }
                    const summe = dataset.data.reduce((sum, zahl) => sum + Math.abs(zahl), 0);
                    if (summe === 0) continue;

                    datasets.push(dataset);
                    if (doregression.length > 0 && dataset.method === doregression) {
                        // Daten des vorherigen Datensatzes für Regressionsanalyse nehmen
                        let regdataset = structuredClone(dataset);
                        let corrval = 273.15;
                        let regdata = [];
                        let xlabels = regdataset.data.labels;
                        for (let i = 0; i < regdataset.data.length; i++) {
                            let value = regdataset.data[i];
                            if (value !== null) {
                                regdata.push([value, i + 1]);
                            }
                        }
                        let result = getregression(regdataset.data, corrval);
                        regdataset.data = result.regdata;
                        regdataset.method = method + "_reg";
                        datasets.push(regdataset);
                    }
                }
            }
            if (datasets.length === 0) {
                $page.find(".mychart").remove();
                $page.append(
                    $("<div>", {
                        html: "keine Daten"
                    }));
                return;
            }
            // hier sind xlabels und datasets bekannt
            let thistitle = title + " " + variable + " " + location.locname;
            let xtitle = "years";
            let ytitle = "Temperature";
            if (variable === "PRCP") {
                ytitle = "Niederschlag kumuliert";
            } else if (["SNOW"].includes(variable)) {
                ytitle = "Schneefall kumuliert";
            } else if (["SNWD"].includes(variable)) {
                ytitle = "Schneedecke kumuliert";
            }

            let config = getConfig4lineChart(thistitle, xlabels, datasets, xtitle, ytitle);
            let pageid = $page.attr("id");
            let container = $page.find("div.mychart");  // ist bereits definiert als container!!!
            $(container)
                .append($("<canvas/>", {
                    id: pageid + "canvas"
                }));
            await new Promise(function (resolve, reject) {
                requestAnimationFrame(async function () {
                    let canvasid = pageid + "canvas";   // vorher "canvas"
                    let canvas = document.getElementById(canvasid);
                    let ctx = canvas.getContext("2d");
                    let chart = new Chart(ctx, config);
                    chart.options.responsive = false;
                    chart.update("none");
                    //let buttoncontainer = $("#" + pageid + "chart");
                    showChartButtons($page, canvasid);
                    resolve();
                });
            });
        }
    }

    async function addHydePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min","height"],
        // async function showStatisticPageWithHydevar(hparms, xlabels, doregression) {
        //let { $page, itopic, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar } = hparms;
        if (!(datasource === "yeardata" && ["TMAX", "TMIN", "PRCP", "SNOW", "SNWD"].includes(variable) && ["avg", "avg_reg", "kum", "kum_reg"].includes(method) && hydevar !== "")) {
            return {};
        }
        let fromyear = 1950;
        let toyear = 2019;
        let xlabels = [];
        for (let iyear = fromyear; iyear <= toyear; iyear++) {
            xlabels.push("" + iyear);
        }
        let anz = xlabels.length;
        let datasets = [];
        let stations = geosets[0];
        // Loop über die Stations
        for (let station of stations) {
            let referencedataset = null;
            for (let setmethod of [method, altmethod1, altmethod2]) {
                if (setmethod === "") continue;
                let dataset = {
                    label: station.locname,
                    source: station.source,
                    stationid: station.stationid,
                    locname: station.locname,
                    stationkey: station.source + "_" + station.stationid,
                    datakey: station.source + "_" + station.stationid + "_" + variable,
                    variable: variable,
                    method: setmethod,
                    check: "data",
                    hydevar: hydevar,
                    fromyear: fromyear,
                    toyear: toyear,
                    data: []
                }
                let recind = recindex.get(dataset.datakey);
                let record = records[recind];
                if (typeof record === "undefined") {

                    continue;
                }
                // hydevar => hydeval bereitstellen
                let hydeval = null;
                if (hydevar === "height") {
                    hydeval = record[hydevar];
                    dataset.hydevar = hydevar;   // Feld bzw. Feldtyp
                    dataset.hydevars = "height,height";
                    dataset.hydeval1 = hydeval;  // Wert
                    dataset.hydeval2 = hydeval;  // Wert
                    dataset.label = station.locname + " (" + hydeval + ")";
                } else {
                    dataset.hydevar = hydevar;
                    let hydevar1 = hydevar + "_1950";
                    if (hydevar.startsWith("zind")) {
                        hydevar1 += "AD"
                    }
                    dataset.hydevars = hydevar1;
                    let hydevar2 = hydevar + "_2019";
                    if (hydevar.startsWith("zind")) {
                        hydevar2 += "AD"
                    }
                    dataset.hydevars += "," + hydevar2;
                    let hydeval_1950 = record[hydevar1];
                    let hydeval_2019 = record[hydevar2];
                    dataset.hydeval1 = hydeval_1950;
                    dataset.hydeval2 = hydeval_2019;
                    // dedizierte Aufbereitung für bessere Lesbarkeint
                    if (hydevar === "zind") {
                        dataset.label = station.locname + " (" + parseInt(dataset.hydeval1) + "/" + parseInt(dataset.hydeval2) + ")";
                    } else {
                        dataset.label = station.locname + " (" + dataset.hydeval1.toFixed(1) + "/" + dataset.hydeval2.toFixed(1) + ")";
                    }
                }
                // Daten übernehmen
                for (let iyear = dataset.fromyear; iyear <= dataset.toyear; iyear++) {
                    if (typeof record.yeardata["" + iyear] === "undefined" || record.yeardata["" + iyear] === null) {
                        dataset.data.push(null);
                        continue;
                    }
                    if (setmethod === "avg") {
                        dataset.data.push(record.yeardata["" + iyear].avg); // evtl. runden
                        continue
                    }
                    if (setmethod === "min") {
                        dataset.data.push(record.yeardata["" + iyear].min); // evtl. runden
                        continue
                    }
                    if (setmethod === "max") {
                        dataset.data.push(record.yeardata["" + iyear].max); // evtl. runden
                        continue
                    }
                    if (setmethod === "kum") {
                        dataset.data.push(record.yeardata["" + iyear].sum); // evtl. runden
                        continue
                    }
                }
                dataset.yAxisID = "y";
                const summe = dataset.data.reduce((sum, zahl) => sum + Math.abs(zahl), 0);
                if (summe === 0) continue;
                datasets.push(dataset);
                if (referencedataset === null) {
                    referencedataset = structuredClone(dataset);
                }
                //if (doregression.length > 0 && dataset.method === doregression) {
                // Daten des vorherigen Datensatzes für Regressionsanalyse nehmen
                let regdataset = structuredClone(dataset);
                let corrval = 273.15;
                let regdata = [];
                let xlabels = regdataset.data.labels;
                for (let i = 0; i < regdataset.data.length; i++) {
                    let value = regdataset.data[i];
                    if (value !== null) {
                        regdata.push([value, i + 1]);
                    }
                }
                let result = getregression(regdataset.data, corrval);
                regdataset.data = result.regdata;
                regdataset.method = setmethod + "_reg";
                datasets.push(regdataset);
            }
            // jetzt die reinen hydevar-dataset ergänzen!!!
            // es gibt nur einen Datensatz mit zwei Datenpunkten je station
            // dataset mit hydevar, hydevars, hydeval1, hydeval2
            if (referencedataset === null) {
                continue;  // per Definition: keine Daten
            }
            let hydedataset = structuredClone(referencedataset);
            hydedataset.method = referencedataset.hydevar;
            hydedataset.variable = referencedataset.hydevar;
            hydedataset.label += " (" + referencedataset.hydeval1 + "/" + referencedataset.hydeval2 + ")";
            hydedataset.data = [
                { x: 0, y: parseFloat(referencedataset.hydeval1) },
                { x: 69, y: parseFloat(referencedataset.hydeval2) }
            ];
            hydedataset.parsing = false;
            hydedataset.borderColor = "red";
            hydedataset.pointRadius = 0;
            hydedataset.borderWidth = 2;
            hydedataset.check = "hyde";
            hydedataset.yAxisID = referencedataset.hydevar;
            datasets.push(hydedataset);
        }

        let icount = 0;
        for (let dataset of datasets) {
            if (dataset.check === "data") {
                icount++;
            }
        }
        if (icount === 0) {
            $page.find(".mychart").remove();
            $page.append(
                $("<div>", {
                    html: "keine Daten"
                }));
            return;
        }
        // hier sind xlabels und datasets bekannt
        let thistitle = title + " " + variable + " " + location.locname;
        let xtitle = "years";
        let ytitle = "Temperature";
        if (variable === "PRCP") {
            ytitle = "Niederschlag kumuliert";
        } else if (["SNOW", "SNWD"].includes(variable)) {
            ytitle = "Schnee kumuliert";
        }
        let config = getConfig4lineChart(thistitle, xlabels, datasets, xtitle, ytitle);

        // Post-Processing für hyde
        config.options.scales.x.type = "category";
        config.options.scales[hydevar] = {
            axis: "y",
            type: "linear",
            position: "right",
            grid: {
                drawOnChartArea: false
            },
            title: {
                display: false,
                text: hydevar
            },
            ticks: {
                maxTicksLimit: 6,
                font: { size: 10 }
            }
        };
        let pageid = $page.attr("id");
        let container = $page.find("div.mychart");  // ist bereits definiert als container!!!
        $(container)
            .append($("<canvas/>", {
                id: pageid + "canvas"
            }));
        await new Promise(function (resolve, reject) {
            requestAnimationFrame(async function () {
                let canvasid = pageid + "canvas";
                let canvas = document.getElementById(canvasid);
                let ctx = canvas.getContext("2d");
                let chart = new Chart(ctx, config);
                chart.options.responsive = false;
                chart.update("none");
                showChartButtons($page, canvasid, null, hydevar);
                resolve();
            });
        });
        return datasets;
    }


    async function addExtremePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min"],
        //async function showBarStatistics(doslider, colindex, locationkey, locations) {
        let fromyear = 1950;
        let toyear = 2019;
        let xlabels = [];
        for (let iyear = fromyear; iyear <= toyear; iyear++) {
            xlabels.push("" + iyear);
        }
        let anz = xlabels.length;

        let extremtopics = [
            ["Hitzewellen", "years", "TMAX", "ext", "", ""],
            ["Kältewellen", "years", "TMIN", "ext", "", ""],
            ["Starkregen", "years", "PRCP", "ext", "", ""],
            ["Schnee", "years", "SNOW", "ext", "", ""]
        ];

        console.log("*** ", title, " ****");
        let topicstring = title + "_" + datasource + "_" + variable + "_" + method;

        // Map auf records setzen
        let datasets = [];
        /*
            TMAX_hot: {
                title: "Hitzewelle",
                conditions: [
                    { days: 3, min: 30 }
                ],
                variable: "TMAX",
                color: "#FF0000",
                stations: {}  // mit <station>:[<isoday>...]
            },
            */
        // extdays[variable][critical].stations[stationkey].data[iyear - fromyear] += bucket.length;
        // extdays[variable][critical].stations[stationkey].rawdata.push([iyear, bucket]);
        for (let topic of Object.keys(extdays[variable])) {
            // topic = critical, z.B. TMAX_hot
            for (let stationkey of Object.keys(extdays[variable][topic].stations)) {
                //let stations = locations[key].geosets[0];
                let index = recindex.get(stationkey + "_" + variable);
                let station = records[index];
                let data = extdays[variable][topic].stations[stationkey].data;
                let sum = ss.sum(data);
                if (sum === 0) {
                    continue;
                }
                let dataset = {
                    label: station.stationname,
                    source: station.source,
                    stationid: station.stationid,
                    locname: station.stationname,
                    stationkey: station.source + "_" + station.stationid,
                    datakey: station.source + "_" + station.stationid + "_" + variable + "_" + topic,
                    topic: topic,
                    variable: variable,
                    method: "ext",
                    fromyear: fromyear,
                    toyear: toyear,
                    data: data
                };
                let key = dataset.source + "_" + dataset.stationid;
                let dashPatternsIndex = stationpatterns[key];
                dataset.borderDash = dashPatterns[dashPatternsIndex];
                dataset.borderWidth = 3;  // 1, 2, 3 kann genutzt werden
                let colorIndex = dashPatternsIndex;
                let shadeFactor = 1;  // methodShadeFactors[dataset.method];
                if (typeof shadeFactor === "number") {
                    dataset.color = kli6900.getOneOf20ColorShades(colorIndex, shadeFactor).color;
                    dataset.backgroundColor = dataset.color;
                    dataset.borderColor = dataset.color;
                    dataset.fill = false;
                }
                datasets.push(dataset);
            }
        }

        if (datasets.length === 0) {
            $page.find(".mychart").remove();
            $page.append(
                $("<div>", {
                    html: "keine Daten"
                }));
            return;
        }
        /*
        $page.append(
            $("<div>", {
                class: "mychart",
                css: {
                    backgroundColor: "lightyellow"
                }
            })
        );
        */
        let thistitle = title + " " + variable + " " + location.locname;
        let xtitle = "years";
        let ytitle = "count of days";
        let config = getConfig4lineChart(thistitle, xlabels, datasets, xtitle, ytitle);
        let pageid = $page.attr("id");
        let container = $page.find("div.mychart");  // ist bereits definiert als container!!!
        $(container)
            .append($("<canvas/>", {
                id: pageid + "canvas"
            }));
        let ret = await new Promise(function (resolve, reject) {
            requestAnimationFrame(async function () {
                let canvasid = pageid + "canvas";
                let canvas = document.getElementById(canvasid);
                let ctx = canvas.getContext("2d");
                let chart = new Chart(ctx, config);
                chart.options.responsive = false;
                chart.update("none");
                showChartButtons($page, canvasid, ["topics", "stations"]);
                // criticalDays[topic].title
                // criticalDays[topic].variable
                // criticalDays[topic].conditions[{days: n, mmin|max|minsum: m}];
                showTopicsTable($page, pageid + "canvas", criticalDays);
                resolve({ error: false, message: "" });
            });
        });

        console.log("page fertig");
    }

    function showTopicsTable($page, canvasid, criticalDays) {
        let chart = Chart.getChart(canvasid);
        //const datasets = chart.data.datasets.filter(
        //    (ds, i) => chart.isDatasetVisible(i)
        //);
        let datasets = chart.data.datasets;
        // get the topics
        let parms = {};
        for (let dataset of datasets) {
            if (typeof parms[dataset.variable] === "undefined") {
                parms[dataset.variable] = {};
            }
            if (typeof parms[dataset.variable][dataset.topic] === "undefined") {
                parms[dataset.variable][dataset.topic] = {};
            }
        }
        // calculate row-header, first columns before data
        let rows = [];
        let header = [];
        header.push("variable");
        header.push("topic");
        header.push("title");
        header.push("conditions");
        rows.push(header);
        for (let variable of Object.keys(parms)) {
            for (let topic of Object.keys(parms[variable])) {
                let row = [];
                row.push(variable);
                row.push(topic);
                row.push(criticalDays[topic].title);
                let texts = [];
                for (let condition of criticalDays[topic].conditions) {
                    let text = "";
                    if (typeof condition.min !== "undefined") {
                        text += "min: value >= " + condition.min + ";";
                        text += " days: for at least " + condition.days;
                        texts.push(text);
                    } else if (typeof condition.max !== "undefined") {
                        text += "max: value <= " + condition.max + ";";
                        text += " days: for at least " + condition.days;
                        texts.push(text);
                    } else if (typeof condition.minsum !== "undefined") {
                        text += "minsum: value >= " + condition.minsum + ";";
                        text += " days: for " + condition.days;
                        text += " and evtl. following days with value minsum/days";
                        texts.push(text);
                    }
                }
                row.push(texts.join("<br/>"));
                rows.push(row);
            }
        }
        let html = rowsToTable(rows);
        let tid = "tbl" + (Math.floor(Math.random() * 1000000) + 1000000);
        $($page)
            .append($("<hr/>"));
        $($page)
            .append($("<div/>", {
                id: tid
            }));
        $("#" + tid)
            .append(html);
    }

    function showChartButtons($page, canvasid, vcontrolfields, hydevar) {
        let containerid = $page.attr("id") + "buttons";
        $page.append($("<div/>", {
            id: containerid,
            class: "chartbuttons",
            css: {
                width: "100%"
            }
        }));

        let graph = Chart.getChart(canvasid);

        // zuerst links und u.U. rechts die titles der scales unterhalb des Chart
        let ltitle = graph.options.scales.y.title.text;
        let rtitle = "";
        if (typeof hydevar === "string") {
            rtitle = hydevar;
        }
        $("#" + containerid)
            .append($("<div/>", {
                id: containerid + "labels",
                css: {
                    display: "flex",
                    "justify-content": "space-between",
                    padding: "4px 8px",
                    "font-size": "12px"
                }
            })
                .append($("<span/>", {
                    html: ltitle
                }))
                .append($("<span/>", {
                    html: rtitle
                }))
            );

        if (typeof vcontrolfields === "undefined" || vcontrolfields === null) {
            vcontrol = {
                variables: {},
                methods: {},
                stations: {},
                hydevars: {}  // spezialfall
            };
        } else {
            vcontrol = {};
            for (let field of vcontrolfields) {
                vcontrol[field] = {};
            }
        }
        for (let dataset of graph.data.datasets) {
            if (typeof vcontrol.variables !== "undefined") {
                if (typeof vcontrol.variables[dataset.variable] === "undefined") {
                    vcontrol.variables[dataset.variable] = 0;
                }
                vcontrol.variables[dataset.variable] += 1;
            }
            if (typeof vcontrol.methods !== "undefined") {
                if (typeof vcontrol.methods[dataset.method] === "undefined") {
                    vcontrol.methods[dataset.method] = 0;
                }
                vcontrol.methods[dataset.method] += 1;
            }
            if (typeof vcontrol.hydevars !== "undefined") {
                if (typeof dataset.hydevar !== "undefined" && dataset.hydevar === dataset.variable) {
                    if (typeof vcontrol.hydevars[dataset.hydevar] === "undefined") {
                        vcontrol.hydevars[dataset.hydevar] = 0;
                    }
                    vcontrol.hydevars[dataset.hydevar] += 1;
                }
            }
            if (typeof vcontrol.topics !== "undefined") {
                if (typeof vcontrol.topics[dataset.topic] === "undefined") {
                    vcontrol.topics[dataset.topic] = 0;
                }
                vcontrol.topics[dataset.topic] += 1;
            }

            let skey = dataset.source + "_" + dataset.stationid;
            if (typeof vcontrol.stations[skey] === "undefined") {
                //let borderDash = dashPatterns[count - 1];
                //let dashImg = getBorderDashThumb(borderDash);
                vcontrol.stations[skey] = {
                    source: dataset.source,
                    stationid: dataset.stationid,
                    locname: dataset.locname,
                    label: dataset.label,
                    hydevar: dataset.hydevar,
                    hydeval1: dataset.hydeval1,
                    hydeval2: dataset.hydeval2,
                    count: 0
                };
            }
            vcontrol.stations[skey].count += 1;
        }
        // dashPatternsIndex zuordnen zu vcontrol.stations und dann vererben
        let sortedkeys = Object.keys(vcontrol.stations).sort();

        let ind = 0;
        for (let key of sortedkeys) {

            vcontrol.stations[key].dashPatternsIndex = ind;
            ind++;
        }
        // colindex umsetzen in class!!! damit die Events unique werden
        let datasetclass = "datasetclass" + $page.attr("data-colindex");

        // Buttons erzeugen
        let crits = Object.keys(vcontrol);
        for (let crit of crits) {
            if (crit === "stations") {
                continue;
            }
            let values = Object.keys(vcontrol[crit])
            if (values === "hydes" && values.length === 0) {
                continue;
            } else if (values.length <= 1) {
                continue;
            }
            let count = 0;
            for (let value of values) {
                let sign = oksign;
                count++;
                if (count > 1) {    // && crit !== "method" && value !== vcontrol["hydes"]) {
                    sign = cancelsign;
                }
                $("#" + containerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-success datasetfilter " + datasetclass,
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        varname: crit.substring(0, crit.length - 1),
                        varvalue: value,
                        html: "<span>" + sign + "</span><span> " + value + "</span>",
                        title: crit + " " + value
                    }));
            }
        }
        // Sonderabwicklung stations
        let values = Object.keys(vcontrol["stations"])
        if (values.length > 1) {
            let count = 0;
            for (let value of values) {
                let sign = oksign;
                count++;
                //let dashPatternsIndex = vcontrol.stations[value].dashPatternsIndex;
                let dashPatternsIndex = stationpatterns[value];
                let borderDash = dashPatterns[dashPatternsIndex];
                let color = kli6900.getOneOf20ColorShades(dashPatternsIndex, 1).color
                let dashImg = getBorderDashThumb(borderDash, 3, color); // , borderWidth, borderColor) {
                let html = dashImg;
                html += "<span>" + sign + "</span><span> " + vcontrol["stations"][value].label + "</span>";
                let btnid = "bt" + (Math.floor(Math.random() * 1000000) + 1000000);

                $("#" + containerid)
                    .append($("<button/>", {
                        id: btnid,
                        class: "datasetfilter " + datasetclass,
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        dashPatternsIndex: dashPatternsIndex,
                        varname: "stationkey",
                        varvalue: value,
                        html: html,
                        title: "Station " + value + " " + vcontrol["stations"][value].locname
                    }));
            }
        }
        // Vererben dashPatterns auf die datasets
        for (let dataset of graph.data.datasets) {
            let key = dataset.source + "_" + dataset.stationid;
            //let dashPatternsIndex = vcontrol["stations"][key].dashPatternsIndex;
            let dashPatternsIndex = stationpatterns[key];
            dataset.borderDash = dashPatterns[dashPatternsIndex];
            dataset.borderWidth = 3;  // 1, 2, 3 kann genutzt werden
            let colorIndex = dashPatternsIndex;
            //methodShades = { avg: 0, min: 1, max: 2, kum: 0, "avg_reg": 3, "kum_reg": 3, val: 0, ext: 0 };
            // 0.7 – 1.4 (hell ↔ dunkel)
            let methodShadeFactors = {
                avg: 1, min: 0.7, max: 1.4, kum: 1,
                "avg_reg": 1.2, "kum_reg": 1.2,
                "min_reg": 0.8, "max_reg": 1.4,
                val: 1, ext: 1
            };
            let shadeFactor = methodShadeFactors[dataset.method];
            if (typeof shadeFactor === "number") {
                dataset.color = kli6900.getOneOf20ColorShades(colorIndex, shadeFactor).color;
                dataset.backgroundColor = dataset.color;
                dataset.borderColor = dataset.color;
                dataset.fill = false;
            } else {
                // TODO
            }
        }
        // hier wäre der Ort für die HYDE-Vorbesetzungen:
        let sortarray = [];
        if (typeof vcontrol.hydevars !== "undefined") {
            for (let dataset of graph.data.datasets) {
                if (typeof vcontrol.hydevars[dataset.variable] !== "undefined") {
                    // der dataset steht für eine hyde-Variable selbst, daher kann hier die Sortierung eingreifen
                    dataset.stationkey = dataset.source + "_" + dataset.stationid;
                    sortarray.push([
                        parseFloat(dataset.hydeval2),
                        parseFloat(dataset.hydeval1),
                        dataset.hydevar,
                        dataset.stationkey,
                        dataset.label,
                        dataset.source,
                        dataset.stationid,
                        dataset.variable,
                        dataset.method,
                        dataset.varname
                    ]);
                }
            }
        }
        if (sortarray.length > 0) {
            sortarray = sortarray.sort(function (a, b) {
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
                    return -1;
                } else {
                    return 0
                }
            });
            let index = -1;
            let vglhydevar = null;
            for (let station of sortarray) {
                index++
                let [hydeval2,
                    hydeval1,
                    hydevar,
                    stationkey,
                    label,
                    source,
                    stationid,
                    variable,
                    method,
                    varname
                ] = station;
                if (vglhydevar === null && typeof hydevar !== "undefined" && hydevar.length > 0) {
                    vglhydevar = hydevar;
                }
                if (index === 0 || index === sortarray.length - 1) {
                    // selektieren
                    let button = $("button.datasetfilter[canvasid=" + canvasid + "][varname=stationkey][varvalue=" + stationkey + "]");
                    let status = $(button).find("span").first().text();
                    $(button).find("span").first().html(oksign);
                } else {
                    // nicht sel
                    let button = $("button.datasetfilter[canvasid=" + canvasid + "][varname=stationkey][varvalue=" + stationkey + "]");
                    let status = $(button).find("span").first().text();
                    $(button).find("span").first().html(cancelsign);
                }
            }
            // method und variable ansetzen für hydevar
            let button = $("button.datasetfilter[canvasid=" + canvasid + "][varname=variable][varvalue=" + vglhydevar + "]");
            let status = $(button).find("span").first().text();
            $(button).find("span").first().html(oksign);

            let button1 = $("button.datasetfilter[canvasid=" + canvasid + "][varname=method][varvalue=" + vglhydevar + "]");
            let status1 = $(button1).find("span").first().text();
            $(button1).find("span").first().html(oksign);
            $(button1).hide();
        }
        updateChart(canvasid);
        // ergänzende Buttons für Copy
        $("#" + containerid)
            .append($("<hr/>"));
        $("#" + containerid)
            .append($("<button/>", {
                class: "btn btn-sm btn-danger kli2000copydata " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Data",
                title: "Copy label and data to Clipboard "
            }));

        $("#" + containerid)
            .append($("<button/>", {
                class: "btn btn-sm btn-danger kli2000copychart  " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Chart",
                title: "Copy Chart to Clipboard"
            }));


        $("#" + containerid)
            .append($("<button/>", {
                class: "btn btn-sm btn-danger kli2000sumtable " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Table",
                title: "Show table with summary data"
            }));
        // jetzt werden erläuternde Kommentare zu den datasets generiert => Details
        // und dann Tabellen => Tabellen, adaptiv je 
        // $page, canvasid, vcontrolfields
        /*
        let containerid = $page.attr("id") + "buttons";
        $page.append($("<div/>", {
            id: containerid,
            class: "chartbuttons",
            css: {
                width: "100%"
            }
        }));
        */
    };

    $(document).on("click", "button.kli2000sumtable", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        let containerid = $(this).attr("containerid");
        let $page = $("#" + canvasid).closest("article");
        let oldsummary = $page.find(".kli3020summarytable");
        if (oldsummary.length > 0) {
            $(oldsummary).remove();
        }
        let graph = Chart.getChart(canvasid);
        await showTable4Chart(graph, containerid, canvasid);
    });

    async function showTable4Chart(chart, containerid, canvasid) {
        const datasets = chart.data.datasets.filter(
            (ds, i) => chart.isDatasetVisible(i)
        );

        // calculate row-header, first columns before data
        let rows = [];
        let headerfields = ["label", "variable", "method"];
        if (typeof datasets[0]["topic"] !== "undefined") {
            headerfields.push("topic");
        }
        let header = [];
        header = header.concat(headerfields);
        header.push("vals");
        header.push("min");
        header.push("avg");
        header.push("max");
        header.push("sum");
        header.push("grad");
        header.push("r2");
        rows.push(header);
        for (let dataset of datasets) {
            // Ausschließen x,y Bubbles  oder short-line definitions
            if (typeof dataset.data[0] === "object" && dataset.data[0] !== null) {
                continue;
            }
            if (dataset.method.includes("reg")) {
                continue;
            }
            let result = kli6900.getTrivial(dataset.data, false, false);   // doround, korr
            let row = [];
            for (let field of headerfields) {
                row.push(dataset[field]);
            }
            row.push(result.realcounted);
            row.push(result.min.toFixed(1));
            row.push(result.avg.toFixed(3));
            row.push(result.max.toFixed(1));
            row.push(result.sum.toFixed(1));
            // Regression über die Jahre und Ausgabe hier
            let erg = getregression(dataset.data, 0);
            row.push(erg.gradient.toFixed(2));
            row.push(erg.r2);
            //gradient: 0.032
            //r2: 0.425
            //regdata: (70) ['14.28', '14.31', '14.35', '14.38', '14.41', '14.44', '14.47', '14.51', '14.54', '14.57', '14.60', '14.63', '14.67', '14.70', '14.73', '14.76', '14.79', '14.83', '14.86', '14.89', '14.92', '14.95', '14.99', '15.02', '15.05', '15.08', '15.11', '15.15', '15.18', '15.21', '15.24', '15.27', '15.31', '15.34', '15.37', '15.40', '15.43', '15.47', '15.50', '15.53', '15.56', '15.59', '15.63', '15.66', '15.69', '15.72', '15.75', '15.79', '15.82', '15.85', '15.88', '15.91', '15.95', '15.98', '16.01', '16.04', '16.07', '16.11', '16.14', '16.17', '16.20', '16.23', '16.27', '16.30', '16.33', '16.36', '16.39', '16.43', '16.46', '16.49']
            //yIntercept: 14.282
            rows.push(row);
        }

        let html = rowsToTable(rows, headerfields);
        let tid = "tbl" + (Math.floor(Math.random() * 1000000) + 1000000);
        $("#" + containerid)
            .append($("<div/>", {
                class: "kli3020summarytable",
            })
                .append($("<hr/>"))
                .append($("<div/>", {
                    id: tid
                }))
            );
        $("#" + tid)
            .append(html);
    }


    /**
    * rowsToTable - Umsetzung rows in html-table
    * Sonderregel: kurzzeilen mit nur einer Zelle werden erkannt und speziell ausgegeben
    * mit colspan="2" bzw. colspan="n"
    * @param {any} rows -
    * @returns {any} - Ausgabe in DOM
    */
    function rowsToTable(rows, headerfields) {
        if (!rows.length) return "";
        if (typeof headerfields !== "undefined" && Array.isArray(headerfields) && headerfields.length > 0) {
            let headlength = headerfields.length;
            let fulllength = rows[0].length;
            let difflength = fulllength - headlength;
            let html = "<table class='table-bordered'>";
            html += "<thead>";
            html += "<tr>";
            html += "<th colspan='" + difflength + "'>";
            html += location.locname + " Summary"; //  + " " + rows[0].slice(0, headlength).join(" "); // Indizes 0 bis n
            html += "</th>";
            html += "</tr>";
            html += "<tr>";
            html += "<th>" + rows[0].slice(headlength, fulllength).join("</th><th>") + "</th>"; // Indizes 0 bis n
            html += "</tr>";
            html += "</thead>";
            // eigentliche Datenausgabe
            html += "<tbody>";
            for (let irow = 1; irow < rows.length; irow++) {
                // kopfzeile zu den Daten
                html += "<tr>";
                html += "<td colspan='" + difflength + "'>";
                html += rows[irow].slice(0, headlength).join(" "); // Indizes 0 bis n
                html += "</td>";
                html += "</tr>";
                html += "<tr>";
                html += "<td>" + rows[irow].slice(headlength, fulllength).join("</td><td>") + "</td>"; // Indizes 0 bis n
                html += "</tr>";
            }
            html += "</tbody>";
            html += "</table>";
            return html;
        }
        const header = rows[0]
            .map(value => `<th>${value}</th>`)
            .join("");

        const body = rows.slice(1)
            .map(row =>
                `<tr>${row.map(value => `<td>${value ?? ""}</td>`).join("")}</tr>`
            )
            .join("");

        return `
        <table  class='table-bordered'>
            <thead><tr>${header}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    `;
    }

    $(document).on("click", "button.kli2000copydata", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        let graph = Chart.getChart(canvasid);
        await copyChartCSV(graph);
    });

    $(document).on("click", "button.kli2000copychart", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        const canvas = document.getElementById(canvasid); // Replace with your canvas element ID
        await copyCanvasToClipboard(canvas);
    });

    async function copyChartCSV(chart) {
        const labels = chart.data.labels;
        //const datasets = chart.data.datasets;
        const datasets = chart.data.datasets.filter(
            (ds, i) => chart.isDatasetVisible(i)
        );
        // Kopfzeile
        const rows = [
            ["Label", ...datasets.map(ds => ds.label + " " + ds.variable + " " + ds.method)]
        ];
        // Datenzeilen
        labels.forEach((label, i) => {
            rows.push([
                label,
                ...datasets.map(ds => ds.data[i] ?? "")
            ]);
        });
        // CSV erzeugen
        const csv = rows
            .map(row => row.join(";"))
            .join("\r\n");
        await navigator.clipboard.writeText(csv);
    }

    async function copyCanvasToClipboard(canvas) {
        // Temporäres Canvas
        const temp = document.createElement("canvas");
        temp.width = canvas.width;
        temp.height = canvas.height;
        const ctx = temp.getContext("2d");
        // Weißer Hintergrund
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, temp.width, temp.height);
        // Original-Canvas darüber zeichnen
        ctx.drawImage(canvas, 0, 0);
        // Als PNG in die Zwischenablage
        const blob = await new Promise(resolve =>
            temp.toBlob(resolve, "image/png")
        );
        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
        ]);
    }

    // Usage: Get your canvas and pass it to the function
    //const canvas = document.getElementById('yourCanvasId'); // Replace with your canvas element ID
    //copyImageToClipboard(canvas);
    $(document).on("click", ".datasetfilter", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let that = this;
        let status = $(this).find("span").first().text();
        if (status === okletter) {
            $(this).find("span").first().html(cancelsign);
            status = "";
        } else {
            $(this).find("span").first().html(oksign);
            status = "ok";
        }
        await new Promise(function () {
            requestAnimationFrame(function (resolve, reject) {
                let canvasid = $(that).attr("canvasid");
                let varname = $(that).attr("varname");
                let varvalue = $(that).attr("varvalue");
                updateChart(canvasid);
                resolve();
            });
        });
        evt.stopImmediatePropagation();
        evt.stopPropagation();
    });

    function updateChart(canvasid) {
        let graph = Chart.getChart(canvasid);
        let buttonsid = canvasid.replace("canvas", "buttons");
        let buttons = $("#" + buttonsid).find("button.datasetfilter").toArray();
        let selparms = {};
        for (let button of buttons) {
            let varname = $(button).attr("varname");
            let varvalue = $(button).attr("varvalue");
            let status = $(button).find("span").first().text();
            if (status === okletter) {
                if (typeof selparms[varname] === "undefined") {
                    selparms[varname] = [];
                }
                if (!selparms[varname].includes(varvalue)) {
                    selparms[varname].push(varvalue);
                }
            }
        }
        console.log("datasetfilter-click");
        console.log(canvasid, buttonsid);
        console.log(selparms);
        let idataset = -1;
        for (let dataset of graph.data.datasets) {
            idataset++;
            let found = true;
            for (let varname of Object.keys(selparms)) {
                if (!selparms[varname].includes(dataset[varname])) {
                    found = false;
                    break;
                }
            }
            if (found === false) {
                graph.setDatasetVisibility(idataset, false);
            } else {
                graph.setDatasetVisibility(idataset, true);
            }
        }
        graph.update("none");
    };


    function getConfig4lineChart(title, xlabels, datasets, xtitle, ytitle) {
        /*
        let xlabels = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
            "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
         let datasets = [
            {
                label: "TMAX",
                data: [5, 7, 11, 16, 20, 24, 27, 26, 21, 15, 9, 6],
                borderColor: "#d9534f"
            }, . . .
        ];
        */
        let config = {
            type: "line",
            data: {
                labels: xlabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                spanGaps: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        display: false,
                        position: "bottom",
                        align: "center",
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.2,
                        borderWidth: 3
                    },
                    point: {
                        radius: 0,
                        hitRadius: 12,
                        hoverRadius: 4
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xtitle
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            maxRotation: 0,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        type: "linear",
                        position: "left",
                        title: {
                            display: false,
                            text: ytitle
                        },
                        ticks: {
                            maxTicksLimit: 6,
                            font: { size: 10 }
                        }
                    }
                }
            }
        };
        return structuredClone(config);
    }

    // locationkey, colindex, location, geosets in locations[locationkey]
    // Querzugriff notwendig, um die x/y scales zu Harmonisieren
    async function getKLIDATA(location, geosets) {
        //extdays: {GHCND_GM000001153: {2018-07-05: extevts:{ GHCND_GM000001153: {TMAX_hot: 30.5}, …}, 
        // dayindex: 1234 (Tagesindex) im Jahr, year: 2018 als Jahr }}
        stationpatterns = {};
        let sels = {};
        let i = -1;
        for (let record of geosets[0]) {
            //vcontrol.stations[key].dashPatternsIndex = ind;
            i++;
            if (i > 9) {
                i = 0;
            }
            record.dashPatternsIndex = i;
            stationpatterns[record.source + "_" + record.stationid] = i;   // dashPatternsIndex
            if (typeof sels[record.source] === "undefined") {
                sels[record.source] = [];
            }
            sels[record.source].push(record.stationid);
        }
        for (let record of geosets[1]) {
            //vcontrol.stations[key].dashPatternsIndex = ind;
            i++;
            if (i > 9) {
                i = 0;
            }
            record.dashPatternsIndex = i;
            stationpatterns[record.source + "_" + record.stationid] = i;   // dashPatternsIndex
        }
        let sql = "";
        sql += " SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
        sql += " KLISTATIONS.latitude, KLISTATIONS.longitude,";
        sql += " KLISTATIONS.countryname,KLISTATIONS.alpha3,";
        sql += " KLISTATIONS.height, ";
        sql += " KLISTATIONS.uopp_1850,KLISTATIONS.uopp_1950,KLISTATIONS.uopp_2019,";
        sql += " KLISTATIONS.popd_1850,KLISTATIONS.popd_1950,KLISTATIONS.popd_2019,";
        sql += " KLISTATIONS.zind_1950AD, KLISTATIONS.zind_2019AD,";
        sql += " KLIDATA.latitude AS dlatitude, KLIDATA.longitude AS dlongitude,";
        sql += " KLIDATA.variable, KLIDATA.fromyear, KLIDATA.toyear, KLIDATA.years";
        sql += " FROM KLISTATIONS";
        sql += " JOIN KLIDATA";
        sql += " ON KLISTATIONS.source = KLIDATA.source";
        sql += " AND KLISTATIONS.stationid = KLIDATA.stationid";
        sql += " AND KLIDATA.variable IN ('TMAX','TMIN','PRCP','SNOW','SNWD')";
        //sql += " WHERE source IN('GHCND','DWDD','ICOSCO2H')";
        sql += " WHERE "
        let ors = [];
        let sources = Object.keys(sels);
        let ands = [];
        if (sources.length === 1) {
            ands = [];
            ands.push(" KLISTATIONS.source = '" + sources[0] + "'");
            ands.push(" KLISTATIONS.stationid IN ('" + sels[sources[0]].join("', '") + "')");
            ors.push(ands.join(" AND "))
        } else {
            for (let source of sources) {
                ands = [];
                ands.push(" KLISTATIONS.source = '" + source + "'");
                ands.push(" KLISTATIONS.stationid IN ('" + sels[source].join("', '") + "')");
                ors.push(ands.join(" AND "))
            }
        }
        sql += ors.join(" OR ");
        sql += " ORDER BY KLISTATIONS.source, KLISTATIONS.stationid";  // KLIGEONAMES.geonameid";
        console.log(sql);
        // Zugriff auf SQL
        let startTime = new Date();
        let response = await fetch("/getallrecordsx", {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            //make sure to serialize your JSON body - nur bei POST, dann einfache url
            body: JSON.stringify({
                sel: sql,
                timeout: 10 * 60 * 1000,
                skip: 0,
                limit: 0
            })
        });
        let ret1 = await response.json();
        console.log(ret1.message);
        let geopoints = [];
        if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
            Array.isArray(ret1.records)) {
            for (let record of ret1.records) {
                record.key = record.source + "_" + record.stationid + "_" + record.variable;
                record.stationkey = record.source + "_" + record.stationid;
                record.dashPatternsIndex = stationpatterns[record.stationkey];   // dashPatternsIndex
                if (typeof record.years === "string") {
                    record.years = JSON.parse(record.years);
                }
                let fromyear = 1950;
                let toyear = 2019;
                record.yeardata = {};
                for (let iyear = fromyear; iyear <= toyear; iyear++) {
                    let yeardata = record.years["" + iyear];
                    if (typeof yeardata !== "undefined") {
                        let result = kli6900.getTrivial(record.years["" + iyear], false, true);   // doround, korr)
                        result.year = "" + iyear;
                        record.yeardata[result.year] = result;
                    }
                }
            }
            // es sind die Werte jetzt auf float umgestellt, Rechnungen müssten also schneller gehen
            getExtdays(ret1.records);  // gehen automatisch nach extdays
            // extdays: {GHCND_GM000001153: {2018-07-05: extevts:{ GHCND_GM000001153: {TMAX_hot: 30.5}, …}, 
            // dayindex: 1234 (Tagesindex) im Jahr, year: 2018 als Jahr }}
            records = structuredClone(ret1.records);
            delete ret1.records;
            return {
                error: false,
                message: "records:" + records.length
            };
        } else {
            return {
                error: true,
                message: ret1.message
            };
        }
    }

    function getExtdays(records) {
        let fromyear = 1950;
        let toyear = 2019;
        recindex = new Map(records.map((rec, i) => [rec.key, i]));
        let allcritKeys = Object.keys(criticalDays);
        let stationcontrol = {};
        for (let record of records) {
            if (typeof stationcontrol[record.stationkey] === "undefined") {
                stationcontrol[record.stationkey] = {}
            }
        }
        let stationkeys = Object.keys(stationcontrol);
        // Vorgaben in  criticalDays mit
        // TMIN_danger: {
        //    title: "Vereisungsgefahr",
        //      conditions: [
        //        { days: 1, variable: "TMIN", max: 0 },
        //        { days: 1, variable: "PRCP", min: 0.5 },
        //        { days: 1, variable: "SNWD", max: 1 }
        //      ],
        //      variable: "TMIN",
        //      color: "#9000ff",
        //      stations: { }  // mit <station>:[<isoday>...]
        // }

        // Results
        // extdays[variable][critical].stations[stationkey].data[iyear] => counter
        // extdays[variable][critical].stations[stationkey].rawdata[iyear] => dayindexes
        extdays = {};
        for (let topic of Object.keys(criticalDays)) {
            if (criticalDays[topic].conditions.length > 1) {
                // Sonderfall, TMIN_danger nur days: 1,drei conditions
                checkMultiDayMultiConditions(topic, criticalDays[topic].conditions, records, stationkeys, recindex, extdays);
            } else if (criticalDays[topic].conditions[0].days === 1) {
                checkMultiDayCondition(topic, criticalDays[topic].conditions[0], records, stationkeys, recindex, extdays);
            } else {   // days > 1
                // hardest out approach
                checkMultiDayCondition(topic, criticalDays[topic].conditions[0], records, stationkeys, recindex, extdays);
            }
        }


        function checkMultiDayMultiConditions(topic, conditions, records, stationkeys, recindex, extdays) {
            let fromyear = 1950;
            let toyear = 2019;
            let specialdays = {}; // Trick 17: separate Struktur für die multi-conditions zu einem Topic
            for (let condition of conditions) {
                checkMultiDayCondition(topic, condition, records, stationkeys, recindex, specialdays);
            }
            let variable = "TMIN";
            if (typeof extdays[variable] === "undefined") {
                extdays[variable] = {};
            }
            if (typeof extdays[variable][topic] === "undefined") {
                extdays[variable][topic] = {};
                extdays[variable][topic].stations = {};
            }
            for (let topic of Object.keys(specialdays[variable])) {
                for (let stationkey of Object.keys(specialdays[variable][topic].stations)) {
                    // specialdays stations[stationkey].data, rawdata und values vorhanden
                    // Vorbereiten des Ausgabebereichs in extdays                    
                    if (typeof extdays["TMIN"][topic].stations[stationkey] === "undefined") {
                        extdays["TMIN"][topic].stations[stationkey] = {
                            data: new Array(70).fill(0),
                            rawdata: {},
                            values: {}
                        };
                    }
                    for (let iyear = fromyear; iyear <= toyear; iyear++) {
                        let tmindata = specialdays["TMIN"][topic].stations[stationkey].rawdata["" + iyear];
                        let prcpdata = specialdays["PRCP"][topic].stations[stationkey].rawdata["" + iyear];
                        let snwddata = specialdays["SNWD"][topic].stations[stationkey].rawdata["" + iyear];
                        if (typeof prcpdata === "undefined" || typeof snwddata === "undefined" || typeof tmindata === "undefined") {
                            continue;
                        }
                        extdays["TMIN"][topic].stations[stationkey].rawdata["" + iyear] = [];
                        for (let iday of tmindata) {
                            if (snwddata.includes(iday) && prcpdata.includes(iday)) {
                                // Volltreffer
                                extdays["TMIN"][topic].stations[stationkey].data[iyear - fromyear] += 1;
                                extdays["TMIN"][topic].stations[stationkey].rawdata["" + iyear].push(iday);
                            }
                        }
                    }
                }
            }
        }

        // extdays[variable][topic].stations[stationkey].data["" + iyear] += anzdays;
        // extdays[variable][topic].stations[stationkey].rawdata["" + iyear].push(bucket.days);
        function checkMultiDayCondition(topic, condition, records, stationkeys, recindex, extdays) {
            let variable = condition.variable;
            let days = condition.days;
            if (typeof extdays[variable] === "undefined") {
                extdays[variable] = {};
            }
            if (typeof extdays[variable][topic] === "undefined") {
                extdays[variable][topic] = {};
                extdays[variable][topic].stations = {};
            }
            for (let stationkey of stationkeys) {
                let recordkey = stationkey + "_" + variable;
                let recordind = recindex.get(recordkey);
                let record = records[recordind];
                if (typeof record === "undefined") {
                    continue;
                }
                if (typeof extdays[variable][topic].stations[stationkey] === "undefined") {
                    extdays[variable][topic].stations[stationkey] = {};
                }
                extdays[variable][topic].stations[stationkey].data = new Array(toyear - fromyear + 1).fill(0);
                extdays[variable][topic].stations[stationkey].rawdata = {};
                extdays[variable][topic].stations[stationkey].values = {};
                let years = record.years;
                if (typeof years === "string") {
                    years = JSON.parse(years);
                }
                for (let iyear = fromyear; iyear <= toyear; iyear++) {
                    let dayvals = years["" + iyear];
                    if (typeof dayvals === "undefined") {
                        continue;
                    }
                    extdays[variable][topic].stations[stationkey].rawdata["" + iyear] = [];
                    extdays[variable][topic].stations[stationkey].values["" + iyear] = [];
                    let yearlength = dayvals.length;
                    let iskip = 0;
                    if (typeof condition.min !== "undefined" || typeof condition.max !== "undefined") {
                        for (let iday = 0; iday < yearlength; iday++) {
                            if (iskip > 0) {
                                if (iday < iskip) {
                                    continue;
                                }
                            }
                            iskip = 0;
                            let value = years["" + iyear][iday];
                            let check1 = checkMinMax(condition, value);
                            if (days === 1) {
                                if (check1.check === true) {
                                    extdays[variable][topic].stations[stationkey].data[iyear - fromyear] += 1;
                                    extdays[variable][topic].stations[stationkey].rawdata["" + iyear].push(iday);
                                    extdays[variable][topic].stations[stationkey].values["" + iyear].push(value);
                                }
                                continue;
                            }
                            if (check1.check === false) {
                                continue;
                            }
                            // look ahead nur wenn iday schon true war bei min und max
                            for (let mday = iday + 1; mday < yearlength; mday++) {
                                let value = years["" + iyear][mday];
                                let check2 = checkMinMax(condition, value);
                                if (check2.check === false || mday === yearlength - 1) {
                                    let duration = mday - iday;
                                    if (duration >= days) {
                                        extdays[variable][topic].stations[stationkey].data[iyear - fromyear] += duration;
                                        for (let i = iday; i < mday; i++) {
                                            extdays[variable][topic].stations[stationkey].rawdata["" + iyear].push(i);
                                            extdays[variable][topic].stations[stationkey].values["" + iyear].push(years["" + iyear][i]);
                                        }
                                        iskip = mday;
                                        break;
                                    }
                                }
                            }
                        }// ende iday
                        // hier prüfen, ob noch Tage auszugeben sind
                    } // min
                }   // years
            }
        }
    }


    function addBucket(iyear, bucket, extdata) {
        extdata.data["" + iyear] += bucket.days.length;
        if (typeof extdata.rawdata["" + iyear] === "undefined") {
            extdata.rawdata["" + iyear] = [];
        }
        extdata.rawdata["" + iyear].push(bucket.days);
        bucket = {
            sum: 0,
            days: [],
            values: []
        };
    };

    function checkMinMax(condition, value) {
        if (value === null) {
            return { check: false };
        }
        if (typeof value === "string") {
            if (value.length === 0) {
                return { check: false };
            }
            value = parseFloat(value);
        }
        if (typeof condition.min !== "undefined") {
            if (condition.min <= value) {
                return { check: true };
            } else {
                return { check: false };
            }
        }
        if (typeof condition.max !== "undefined") {
            if (condition.max >= value) {
                return { check: true };
            } else {
                return { check: false };
            }
        }
    }

    function checkValue(condition, value) {
        if (value === null) {
            return { check: false, add: null, value: value };
        }
        if (typeof value === "string") {
            if (value.length === 0) {
                return { check: false, add: null, value: value };
            }
            value = parseFloat(value);
        }
        if (typeof condition.min !== "undefined") {
            if (condition.min <= value) {
                return { check: true, add: null, value: value };
            } else {
                return { check: false, add: null, value: value };
            }
        }
        if (typeof condition.max !== "undefined") {
            if (condition.max >= value) {
                return { check: true, add: null, value: value };
            } else {
                return { check: false, add: null, value: value };
            }
        }
        if (typeof condition.minsum !== "undefined") {
            return { check: true, add: value, value: value };
        }
    }


    function getExtdays_old(records) {
        // record mit source, stationid, variable, years - aufbereitet
        // extdays: {GHCND_GM000001153: {2018-07-05: extevts:{ GHCND_GM000001153: {TMAX_hot: 30.5}, …}, 
        // dayindex: 1234 (Tagesindex) im Jahr, year: 2018 als Jahr }}
        let index = new Map(records.map((rec, i) => [rec.key, i]));
        let allcritKeys = Object.keys(criticalDays);
        let fromyear = 1950;
        let toyear = 2019;
        console.log(criticalDays);
        let stationkeys = {};
        for (let record of records) {
            let stationkey = record.source + "_" + record.stationid;
            record.stationkey = stationkey;
            if (typeof stationkeys[stationkey] === "undefined") {
                stationkeys[stationkey] = {};
            }
            // criticalDays["TMIN_danger"] kennt drei Prüfvariablen, die zusammen Vereisungsgefahr ergeben
            /* criticalDays["TMIN_danger"].stations{<iyear: [indexes of hits]}
                criticalDays["TMIN_danger"].conditions:[{days:n }]
                TMIN_danger: {
                    title: "Vereisungsgefahr",
                    conditions: [
                        { days: 1, variable: "TMIN", max: 0 },
                        { days: 1, variable: "PRCP", min: 0.5 },
                        { days: 1, variable: "SNWD", max: 1 }
                    ],
                    variable: "TMIN,PRCP,SNWD",
                    color: "#9000ff",
                    stations: {}  // mit <station>:[<isoday>...]
                },
            */
            // die conditions sind gewöhnlich geodert zu EINER variablen,
            // Ausnahme ist TMIN_danger, dort sind die conditions geundet!!!
            // erst werden alle Kriterien geprüft, die geodert sind, dann kommt die geundete TMIN_danger,
            // TMIN_danger1 wird als lead zu TMIN_danger genutzt!!!
            let selcritkeys = ["TMAX_hot"];
            selcritkeys = selcritkeys.concat(["TMIN_tropic", "TMIN_cold", "TMIN_cold1", "TMIN_danger", "TMIN_danger1"]);
            selcritkeys = selcritkeys.concat(["PRCP_rain", "PRCP_rain2"]);
            selcritkeys = selcritkeys.concat(["SNWD_snow", "SNWD_snow2"]);
            selcritkeys = selcritkeys.concat(["SNOW_snow", "SNOW_snow2"]);
            let criticalcontrols = {
                "TMAX": ["TMAX_hot"],
                "TMIN": ["TMIN_tropic", "TMIN_cold", "TMIN_cold1", "TMIN_danger", "TMIN_danger1"],
                "PRCP": ["PRCP_rain", "PRCP_rain2"],
                "SNWD": ["SNWD_snow", "SNWD_snow2"],
                "SNOW": ["SNOW_snow", "SNOW_snow2"]
            };
            let variable = record.variable;
            if (typeof criticalcontrols[variable] === "undefined") {
                continue;
            }
            let superdays = [];
            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                let isleapyear = kli6900.isleapyear(iyear);
                let yearlength = 365;
                if (isleapyear) yearlength = 366;
                let yearvals = record.years["" + iyear];
                if (typeof yearvals === "undefined") {
                    continue;
                }
                let len = yearvals.len;
                if (len === 365 && leapyear === true || len === 366 && leapyear === false) {
                    alert("problem");
                    debugger;
                }
                // Extender, wenn erforderlich
                if (len < yearlength) {
                    for (let i = len - 1; i < yearlength; i++) {
                        yearvals[i] = null;
                    }
                } else if (len > yearlength) {
                    for (let i = len - 1; i > yearlength; i--) {
                        let val = yearvals[i];
                        if (val !== null) {
                            alert("mist: " + val);
                            debugger;
                        }
                        yearvals.splice(i, 1);
                    }
                }
                let vals = structuredClone(yearvals);  // yearlength beachten
                //if (typeof record.years["" + (iyear + 1)] !== "undefined") {
                //    vals = vals.concat(record.years["" + (iyear + 1)]);
                //}
                for (let criticalkey of criticalcontrols[variable]) {
                    if (typeof criticalDays[criticalkey] === "undefined") {
                        alert("grosser Mist:" + criticalkey);
                        continue;
                    }
                    let conditions = criticalDays[criticalkey].conditions;
                    for (let condition of conditions) {
                        if (condition.days === 1) {
                            let indexes = [];
                            if (typeof condition.min !== "undefined") {
                                indexes = vals.flatMap(function (val, index) {
                                    return val !== null && val >= condition.min ? [index] : [];
                                });
                            } else if (typeof condition.max !== "undefined") {
                                indexes = vals.flatMap(function (val, index) {
                                    return val !== null && val <= condition.max ? [index] : [];
                                });
                            } else if (typeof condition.minsum !== "undefined") {
                                // sollte hier nicht auftauchen, nur bei days > 1
                                indexes = vals.flatMap(function (val, index) {
                                    return val !== null && val >= 0 ? [index] : [];
                                });
                            }
                            console.log(stationkey, criticalkey, iyear, indexes);
                            if (indexes.length > 0) {
                                if (typeof criticalDays[criticalkey].stations[stationkey] === "undefined") {
                                    criticalDays[criticalkey].stations[stationkey] = {};
                                }
                                criticalDays[criticalkey].stations[stationkey][iyear] = indexes;
                            }
                        } else {
                            // kays > 1 separat zu berechnen, etwas komplizierter
                            getExtDaysPlus(condition, iyear, vals, record, criticaldays)
                        }
                    }
                }
            }
        }
        //criticalDays["TMIN_danger"].stations{<stationkey>:{<iyear: [indexes of hits]}}
        //criticalDays["TMIN_danger"].conditions:[{days:n }]
        // extdays - not notwendig?
        let extdays = {};
        for (let critical of Object.keys(criticalDays)) {
            let variable = criticalDays[critical].variable;
            if (typeof extdays[variable] === "undefined") {
                extdays[variable] = {};
            }
            if (typeof extdays[variable][critical] === "undefined") {
                extdays[variable][critical] = {
                    stations: {}
                };
            }
            for (let stationkey of Object.keys(criticalDays[critical].stations)) {
                if (typeof extdays[variable][critical].stations[stationkey] === "undefined") {
                    extdays[variable][critical].stations[stationkey] = {
                        rawdata: {},
                        data: new Array(toyear - fromyear + 1).fill(0)
                    };
                }
                for (let condition of criticalDays[critical].conditions) {
                    let days = condition.days;
                    let allindexes = criticalDays[critical].stations[stationkey];
                    if (days === 1) {
                        for (let iyear = fromyear; iyear <= toyear; iyear++) {
                            let yearindexes = allindexes[iyear];
                            if (typeof yearindexes === "undefined") {
                                continue;
                            } else {
                                extdays[variable][critical].stations[stationkey].data[iyear - fromyear] += yearindexes.length;

                                if (typeof extdays[variable][critical].stations[stationkey].rawdata[iyear] === "undefined") {
                                    extdays[variable][critical].stations[stationkey].rawdata[iyear] = [];
                                }
                                extdays[variable][critical].stations[stationkey].rawdata[iyear] =
                                    extdays[variable][critical].stations[stationkey].rawdata[iyear].concat(yearindexes);
                            }
                        }
                    } else if (days > 1 && typeof condition.minsum === "undefined") {   // days > 1
                        for (let iyear = fromyear; iyear <= toyear; iyear++) {
                            if (stationkey === "GHCND_GME00121054" && critical === "TMAX_hot" && iyear === 1950) {
                                // debugger;
                            }
                            let isleapyear = kli6900.isleapyear(iyear);
                            let yearlength = 365;
                            if (isleapyear) yearlength = 366;
                            let indexes = allindexes[iyear];
                            if (typeof indexes === "undefined") {
                                continue;
                            }
                            let bucketyear = 0;
                            let bucket = [];  // Gruppenwechsellogik
                            for (let i = 0; i < indexes.length; i++) {
                                let index = indexes[i];
                                if (bucket.length === 0) {
                                    bucket.push(index);
                                    bucketyear = iyear;
                                    continue; // Initialisierung
                                }
                                let newindex = indexes[i];
                                let lastindex = bucket[bucket.length - 1];
                                if (newindex - lastindex === 1) {
                                    bucket.push(index);
                                    bucketyear = iyear;
                                    continue;   // Kette bilden
                                } else {
                                    // Gruppenwechsel
                                    if (bucket.length >= days) {
                                        extdays[variable][critical].stations[stationkey].data[iyear - fromyear] += bucket.length;
                                        // extdays[variable][critical].stations[stationkey].rawdata.push({ iyear: bucket });
                                        if (typeof extdays[variable][critical].stations[stationkey].rawdata[iyear] === "undefined") {
                                            extdays[variable][critical].stations[stationkey].rawdata[iyear] = [];
                                        }
                                        extdays[variable][critical].stations[stationkey].rawdata[iyear] =
                                            extdays[variable][critical].stations[stationkey].rawdata[iyear].concat(bucket);
                                    }
                                    bucket = [];
                                    bucket.push(index);
                                    bucketyear = iyear;
                                    continue; // neue Initialisierung
                                }
                            }
                            // letzter Fall
                            if (bucket.length >= days) {
                                let iyear = bucketyear;
                                extdays[variable][critical].stations[stationkey].data[iyear - fromyear] += bucket.length;
                                //extdays[variable][critical].stations[stationkey].rawdata.push({ iyear: bucket });
                                if (typeof extdays[variable][critical].stations[stationkey].rawdata[iyear] === "undefined") {
                                    extdays[variable][critical].stations[stationkey].rawdata[iyear] = [];
                                }
                                extdays[variable][critical].stations[stationkey].rawdata[iyear] =
                                    extdays[variable][critical].stations[stationkey].rawdata[iyear].concat(bucket);

                            }
                        }
                    } else {
                        // days > 1 && minsum als Vorgabe; stationkey bekannt und variable

                        if (typeof recindex === "undefined") {
                            recindex = new Map(records.map((rec, i) => [rec.key, i]));
                        }
                        let recind = recindex.get(stationkey + "_" + variable);
                        let record = records[recind];
                        if (typeof record === "undefined") {
                            continue;
                        }
                        let years = record.years;
                        let minsum = condition.minsum;
                        let data = new Array(toyear - fromyear + 1).fill(0);
                        let bucket = { sum: 0, days: [] };
                        for (let iyear = fromyear; iyear <= toyear; iyear++) {
                            if (typeof years["" + iyear] === "undefined" || years["" + iyear] === null) {
                                continue;
                            }
                            if (stationkey === "GHCND_GME00121054" && critical === "TMAX_hot" && iyear === 1950) {
                                // debugger;
                            }
                            let isleapyear = kli6900.isleapyear(iyear);
                            let yearlength = 365;
                            if (isleapyear) yearlength = 366;
                            bucket = { sum: 0, days: [] };
                            let skipto = 0;
                            for (let iday = 0; iday < yearlength; iday++) {
                                // skipto-Prüfung, überspringt zugeordnete Tage
                                if (skipto > 0 && iday < skipto) {
                                    continue;
                                } else {
                                    skipto = 0;
                                }
                                // Prüfung Tag 1
                                let val = years["" + iyear][iday];
                                if (typeof val === "undefined" || val === null) {
                                    bucket = { sum: 0, days: [] };
                                    continue;
                                }
                                if (val <= 0) {
                                    bucket = { sum: 0, days: [] };
                                    continue;
                                }
                                bucket.sum += val;
                                bucket.days.push(iday);
                                // Prüfung Tag 2 - n
                                let fday = iday;
                                for (fday = iday + 1; fday < iday + days; fday++) {
                                    let val = years["" + iyear][fday];
                                    if (typeof val === "undefined" || val === null) {
                                        continue;
                                    }
                                    bucket.sum += val;
                                    bucket.days.push(fday);
                                }
                                if (bucket.sum <= minsum) {
                                    continue;
                                }
                                // Prüfung Folgetage, klassisch look ahead
                                for (let mday = fday + 1; mday < yearlength; mday++) {
                                    let val = years["" + iyear][mday];
                                    if (typeof val === "undefined" || val === null || parseFloat(val) < minsum / days) {
                                        // Übernehmen bucket nach data
                                        // 1. erst undefined - close und break
                                        // dann parseFloat und Prüfung => break oder weiter
                                        data[iyear - fromyear] += bucket.days.length;
                                        for (let i1 = 0; i1 < bucket.days.length; i1++) {
                                            extdays[variable][critical].stations[stationkey].rawdata[iyear] = bucket.days[i1];
                                        }
                                        bucket = { sum: 0, days: [] };
                                        skipto = mday;
                                        continue;
                                    } else {
                                        bucket.sum += parseFloat(val);
                                        bucket.days.push(mday);
                                    }
                                }
                                // Auswertung bucket
                                // Fortschreibung data[iyear - fromyear];
                            }
                            // Abschluss: bucket prüfen und ggf. ausgeben
                            if (bucket.days > days && bucket.sum >= minsum) {
                                data[iyear - fromyear] += bucket.days.length;
                                for (let i1 = 0; i1 < bucket.days.length; i1++) {
                                    extdays[variable][critical].stations[stationkey].rawdata[iyear] = bucket.days[i1];
                                }
                            }
                        }
                        // iyear-Loop zu ende, data übernehmen
                        extdays[variable][critical].stations[stationkey].data = data;
                        console.log(extdays[variable][critical].stations[stationkey].data);
                        console.log(extdays[variable][critical].stations[stationkey].rawdata);
                    }
                }
            }
        }
        return extdays;
    }

    function getBorderDashThumb(borderDash, borderWidth, borderColor) {
        let canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 14;
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = borderColor || "#000";
        ctx.lineWidth = borderWidth || 2;
        if (typeof borderDash !== "undefined" && borderDash.length > 0) {
            ctx.setLineDash(borderDash);
        }
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        let src = canvas.toDataURL();
        let html = "<img src='" + src + "' alt='no borderDash' style='margin-left:5px'></img> ";
        return html;
    };

    // von ChatGPT nach Lehrbuch, years als 1950 etc.!
    function newgetregression(years, values) {
        let points = [];
        for (let i = 0; i < years.length; i++) {
            let y = values[i];
            if (y === null || y === undefined || !Number.isFinite(y)) {
                continue;
            }
            points.push({
                x: years[i],
                y: y
            });
        }

        let n = points.length;

        if (n < 2) return null;

        let meanX = points.reduce((s, p) => s + p.x, 0) / n;
        let meanY = points.reduce((s, p) => s + p.y, 0) / n;

        let sxx = 0;
        let sxy = 0;
        let syy = 0;

        for (let p of points) {
            let dx = p.x - meanX;
            let dy = p.y - meanY;

            sxx += dx * dx;
            sxy += dx * dy;
            syy += dy * dy;
        }

        if (sxx === 0) return null;

        let slope = sxy / sxx;
        let intercept = meanY - slope * meanX;

        let r2 = syy > 0
            ? (sxy * sxy) / (sxx * syy)
            : null;

        let result = {
            slope,  // gradient
            intercept,
            r2,
            count: n,
            trendDecade: slope * 10,
            trendPeriod: slope * (2019 - 1950)
        };
        // Hinweis: die Ausgabe im Chart kann vereinfacht werden
        /*
        type: "line", 
        data: [
            { x: 1950, y: intercept + slope * 1950 },
            { x: 2019, y: intercept + slope * 2019 }
        ],
        */
        return result;
    }

    /**
     * getregression - data ist array der Ausgangsdaten, regdata wird zurückgegeben mit anderen Werten!!!
     * @param {*} row 
     * @param {*} corrval - verhindert negative Zahlen, dann muss nicht normalisiert werden, Default: 0
     * für Temperaturen corrval = 273.15; zur Umrechnung in Kelvin und Retransformation
     * return result mit regdata, gradient, yIntercept, r2; regdata sind die neuen Werte im Array.
     */
    function getregression(data, corrval) {
        // das gewählte Verfahren hat eine Schwäche bei negativen Zahlen, daher Transformation entsprechend
        // regressionsrechnung durchführen
        if (typeof corrval === "undefined") {
            corrval = 0;
        }
        let minval = 0;
        if (corrval === 0) {
            // loop über alle Werte
            data.forEach(function (value, ival) {
                if (value !== null && value !== "") {
                    if (value < minval) {
                        minval = value;
                    }
                }
            });
        }
        if (minval < 0) {
            corrval = minval * -1;
        }
        let regvals = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i] !== null) {
                regvals.push([
                    i,
                    parseFloat(data[i]) + corrval
                ]);
            }
        }
        let regresult = regression.linear(regvals, {
            order: 2,
            precision: 3,
        });
        let gradient = regresult.equation[0];
        let yIntercept = regresult.equation[1] - corrval;
        let r2 = regresult.r2; // the coefficient of determination
        let newpoints = regresult.points;
        // Punkte der Regressionsgeraden
        let newvalues = new Array(data.length).fill(null);
        // dann dynamisch füllen
        for (let i = 0; i < newvalues.length; i++) {
            newvalues[i] = (regresult.predict(i)[1] - corrval).toFixed(2);
        }
        let result = {
            regdata: newvalues,
            gradient: gradient,
            yIntercept: yIntercept,
            r2: r2
        };
        return result;
    }
    return {
        addTopics
    };
}

export {
    createLocation
}