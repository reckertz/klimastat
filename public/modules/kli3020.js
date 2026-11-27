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
    let topicParms1 = [
        ["Zeitreihe", addStandardPage, "yeardata", "TMAX", "avg", "max", "min"],
        ["Zeitreihe", addStandardPage, "yeardata", "TMIN", "avg", "min", "max"],
        ["Zeitreihenvergleich", addComparePage, "yeardata", "TMAX,TMIN", "avg", "min", "max"],
        ["Zeitreihe", addStandardPage, "yeardata", "DTR", "avg", "min", "max"],
        ["Zeitreihe", addStandardPage, "yeardata", "PRCP", "kum", "", ""],
        ["Zeitreihe", addStandardPage, "yeardata", "SNOW", "kum", "", ""],   // SNOW
        ["Zeitreihe", addStandardPage, "yeardata", "SNWD", "kum", "", ""],   // SNWD


        ["Trendanalyse", addStandardPage, "yeardata", "TMAX", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "TMIN", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "DTR", "avg_reg", "min", "max"],
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
        ["Schnee", addExtremePage, "years", "SNOW", "ext", "", ""],    // SNWD
        ["Schnee", addExtremePage, "years", "SNWD", "ext", "", ""]    // SNWD
        /*
            ["Korrelation", "yeardata", "TMAX-TMIN", "avg-korr", "", ""],
            ["Korrelation", "yeardata", "TMAX-PRCP", "avg-korr", "", ""],
            ["Korrelation", "yeardata", "PRCP-SNOW", "kum-korr", "", ""],
            ["Korrelation", "yeardata", "TMAX-EXT", "avg-cnt-korr", "", ""],
            */
    ];

    let topicParms2 = [

        ["Qualitycontrol", addQualityPage, "yeardata", "TMAX", "avg", "max", "min", "", "QC_TMAX_avg"],

        ["Zeitreihe", addStandardPage, "yeardata", "TMAX", "avg", "max", "min", "", "ZR_TMAX_avg"],
        ["Trendanalyse", addStandardPage, "yeardata", "TMAX", "avg_reg", "", "", "", "ZR_TMAX_avg_reg"],

        ["Zeitreihe", addStandardPage, "yeardata", "TMIN", "avg", "min", "max", "", "ZR_TMIN_avg"],
        ["Trendanalyse", addStandardPage, "yeardata", "TMIN", "avg_reg", "", "", "", "ZR_TMIN_avg_reg"],
        ["Zeitreihenvergleich", addComparePage, "yeardata", "TMAX,TMIN", "avg_reg", "", "", "", "CP_TMAXTMIN_avg_reg"],

        ["Höhenanalyse", addHydePage, "yeardata", "TMAX", "avg", "min", "max", "height", "HY_TMAX_height"],
        ["Höhenanalyse", addHydePage, "yeardata", "TMIN", "avg", "min", "max", "height", "HY_TMIN_height"],

        ["Zeitreihe", addStandardPage, "yeardata", "DTR", "avg", "min", "max", "", "ZR_DTR_avg"],
        ["Trendanalyse", addStandardPage, "yeardata", "DTR", "avg_reg", "min", "max", "", "ZR_DTR_avg_reg"],

        ["Zeitreihe", addStandardPage, "yeardata", "PRCP", "kum", "", "", "", "ZR_PRCP_kum"],
        ["Trendanalyse", addStandardPage, "yeardata", "PRCP", "kum_reg", "", "", "", "ZR_PRPC_kum_reg"],

        ["Zeitreihe", addStandardPage, "yeardata", "SNOW", "kum", "", "", "", "ZR_SNOW_kum"],   // SNOW
        ["Trendanalyse", addStandardPage, "yeardata", "SNOW", "kum_reg", "", "", "", "ZR_SNOW_kum_reg"],

        ["Zeitreihe", addStandardPage, "yeardata", "SNWD", "kum", "", "", "", "ZR_SNWD_kum"],   // SNWD
        ["Trendanalyse", addStandardPage, "yeardata", "SNWD", "kum_reg", "", "", "", "ZR_SNWD_kum_reg"],

        ["Höhenanalyse", addHydePage, "yeardata", "PRCP", "kum", "", "", "height", "ZR_PRPC_kum_height"],
        ["Höhenanalyse", addHydePage, "yeardata", "SNOW", "kum", "", "", "height", "ZR_SNOW_kum_height"],   // SNWD
        ["Höhenanalyse", addHydePage, "yeardata", "SNWD", "kum", "", "", "height", "ZR_SNWD_kum_height"],

        ["Bevölkerung", addHydePage, "yeardata", "TMAX", "avg", "", "", "popd", "ZR_TMAX_avg_popd"],
        ["Bevölkerung", addHydePage, "yeardata", "TMIN", "avg", "", "", "popd", "ZR_TMIN_avg_popd"],
        ["Bevölkerung", addHydePage, "yeardata", "PRCP", "kum", "", "", "popd", "ZR_PRCP_kum_popd"],
        ["Bevölkerung", addHydePage, "yeardata", "SNOW", "kum", "", "", "popd", "ZR_SNOW_kum_popd"],   // SNWD
        ["Bevölkerung", addHydePage, "yeardata", "SNWD", "kum", "", "", "popd", "ZR_SNWD_kum_popd"],

        ["Bebauung", addHydePage, "yeardata", "TMAX", "avg", "", "", "uopp", "ZR_TMAX_avg_uopp"],
        ["Bebauung", addHydePage, "yeardata", "TMIN", "avg", "", "", "uopp", "ZR_TMIN_avg_uopp"],
        ["Bebauung", addHydePage, "yeardata", "PRCP", "kum", "", "", "uopp", "ZR_PRCP_kum_uopp"],
        ["Bebauung", addHydePage, "yeardata", "SNOW", "kum", "", "", "uopp", "ZR_SNOW_kum_uopp"],   // SNWD
        ["Bebauung", addHydePage, "yeardata", "SNWD", "kum", "", "", "uopp", "ZR_SNWD_kum_uopp"],   // SNWD

        ["Urbanisierung", addHydePage, "yeardata", "TMAX", "avg", "", "", "zind", "ZR_TMAX_kum_popd"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "TMIN", "avg", "", "", "zind", "ZR_TMIN_kum_popd"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "PRCP", "kum", "", "", "zind", "ZR_PRPC_kum_popd"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "SNOW", "kum", "", "", "zind", "ZR_SNOW_kum_popd"],  // category!!!   // SNWD
        ["Urbanisierung", addHydePage, "yeardata", "SNWD", "kum", "", "", "zind", "ZR_SNWD_kum_popd"],

        ["Hitzewellen", addExtremePage, "years", "TMAX", "ext", "", "", "", "ZX_TMAX_ext"],
        ["Kältewellen", addExtremePage, "years", "TMIN", "ext", "", "", "", "ZX_TMIN_ext"],
        ["Starkregen", addExtremePage, "years", "PRCP", "ext", "", "", "", "ZX_PRCP_ext"],
        ["Schnee", addExtremePage, "years", "SNOW", "ext", "", "", "", "ZX_SNOW_ext"],    // SNWD
        ["Schnee", addExtremePage, "years", "SNWD", "ext", "", "", "", "ZX_SNWD_ext"]    // SNWD
        /*
            ["Korrelation", "yeardata", "TMAX-TMIN", "avg-korr", "", ""],
            ["Korrelation", "yeardata", "TMAX-PRCP", "avg-korr", "", ""],
            ["Korrelation", "yeardata", "PRCP-SNOW", "kum-korr", "", ""],
            ["Korrelation", "yeardata", "TMAX-EXT", "avg-cnt-korr", "", ""],
            */
    ];

    let topicParms = topicParms2;
    /*
    for (let topicParm of topicParms) {
        let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
        console.log(helpkey + "\t" + locfunction.name + "\t" + title + "\n");
    }
    */

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
        /*
        TMAX_avg: {
            title: "Zeitreihe TMAX",
            variable: "TMAX",
            func: addStandardPage,
            methods: "avg,min,max",
            initial: "minmax"  // kleinste und größte Line, aus avg über alle Werte
            // hyde: nur bei Hyde-Punkten
        },
        */
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

    function getCoreData() {
        return {
            criticalDays,
            topicParms,
            containerid,
            mode,
            location,
            locationkey,
            geosets,
            extdays,
            records,
            recindex
        }
    }


    async function addTopics(newcontainerid, colIndex, newmode, newlocation, newgeosets, theme) {
        await help.generate(topicParms);
        containerid = newcontainerid;
        mode = newmode;
        location = kli6900.cloneObject(newlocation);
        geosets = kli6900.cloneObject(newgeosets);
        locationkey = location.locname.replace(/[^\p{L}\p{N}]/gu, "");
        locationkey += " " + location.geonameid;
        let firstpage = {};
        // Prüfen, ob records bereits daten hat, wenn ja, dann kein Zugriff
        if (Array.isArray(records) && records.length > 0) {
            console.log("data already loaded");
        } else {
            const signal = activity.show(
                "Wetterdaten - Serverzugriff …"
            );
            let ret = await getKLIDATA(location, geosets);  // records je Instanz übergeordnet!!!
            recindex = new Map(records.map((rec, i) => [rec.key, i]));
            activity.message(
                "Klimadaten werden übernommen …"
            );
        }
        // Vorlauf für den Fall der Theme-Übergabe
        let tparms = topicParms;
        if (typeof theme !== "undefined") {
            let [name, imgname, references] = theme;
            let parms = [];
            for (let ref of references) {
                //["Hitzewellen", addExtremePage, "years", "TMAX", "ext", "", "", "", "ZX_TMAX_ext"],
                for (let topicParm of topicParms) {
                    let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
                    if (helpkey === ref) {
                        parms.push(topicParm);
                        break;
                    }
                }
            }
            tparms = parms;
        }
        for (let topicParm of tparms) {
            let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
            if (mode === "mobile") {
                let $slider = null;
                let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
                $slider = $("<section>", {
                    id: "ds" + (Math.floor(Math.random() * 1000000) + 1000000),
                    class: "col col-12 slider mobile",  //  place-slider",
                    "data-theme": theme[0],
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
                    "data-locname": location.locname,
                    "data-theme": theme[0],
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar,
                    "data-helpkey": helpkey
                });
                if (typeof firstpage.topicstring === "undefined") {
                    firstpage.topicstring = topicstring;
                    firstpage.type = "page";
                    firstpage.colIndex = colIndex;
                    firstpage.locationkey = locationkey;
                    firstpage.locname = location.locname;
                }
                $page.append("<hr>");
                /*
                $page.append(
                    $("<span style='font-weight: bold;margin:5px;'>").text(`${location.locname} ${variable} ${title}`),
                    // $("<span style='margin:5px'>").text(`(${locationkey})`)
                );
                */
                let pagetitle = `${location.locname} ${variable} ${title}`;
                addPageHeader($page, pagetitle, helpkey);
                $page.append(
                    $("<div/>", {
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
                // $("#" + containerid).append("<hr>");  // check
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
                        "data-theme": theme[0],
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
                    "data-locname": location.locname,
                    "data-theme": theme[0],
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar,
                    "data-helpkey": helpkey
                });
                if (typeof firstpage.topicstring === "undefined") {
                    firstpage.topicstring = topicstring;
                    firstpage.target = "slider";
                    firstpage.colIndex = null;
                    firstpage.locationkey = locationkey;
                    firstpage.locname = location.locname;
                }

                let pagetitle = `${location.locname} ${variable} ${title}`;
                addPageHeader($page, pagetitle, helpkey);
                $page.append(
                    $("<div/>", {
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
        activity.close();
        return firstpage;
    }

    function addPageHeader($page, title, topic) {
        let pageid = $page.attr("id");

        const header = $("<div>", {
            class: "article-header"
        });
        header.append(
            $("<span>").text(title)
        );
        const actions = $("<div>", {
            class: "article-actions"
        });
        actions.append(
            $("<button>", {
                html: "&#9432;",
                title: "Information",
                class: "helpinformation",
                mode: mode,
                topic: topic,
                pageid: pageid,
                "data-action": "info"
            }),
            $("<button>", {
                html: "&#10515;",
                title: "Download",
                topic: topic,
                pageid: pageid,
                "data-action": "download"
            }),
            /*
            $("<button>", {
                html: "&#8942;",
                title: "Menü",
                topic: topic,
                pageid: pageid,
                "data-action": "menu"
            })
            */
        );
        header.append(actions);
        $page.append(header);

        const menu = $("<details>", {
            class: "article-menu"
        });

        menu.append(
            $("<summary>", {
                html: "&#8942;",  // ⋮
                title: "Menü"
            })
        );

        const content = $("<div>", {
            class: "menu-content"
        });

        content.append(
            $("<button>", {
                class: "datamenu",
                text: "Hilfe Clipboard",
                "data-action": "helpcopy"
            }),
            $("<button>", {
                class: "datamenu",
                text: "Export",
                "data-action": "export"
            }),
            $("<button>", {
                class: "datamenu",
                text: "Einstellungen",
                "data-action": "settings"
            })
        );
        menu.append(content);
        // In den rechten Bereich der Überschrift einfügen
        actions.append(menu);
    }

    $(document).on("click", ".datamenu", async function (evt) {
        if ($(this).dataset.action === "helpcopy") {

            try {
                await navigator.clipboard.writeText(html);
            } catch (err) { };
        }
    });

    // die Qualitydata ausgeben!!! wie conditions
    async function addQualityPage($page, mode, location, geosets, topicParm) {

        // calculate row-header, first columns before data
        let rows = [];
        let header = [];
        header.push("station");
        header.push("from/to");
        header.push("cat");
        header.push("good");
        header.push("bad");
        header.push("miss");
        header.push("dist");
        rows.push(header);
        let icount = 0;
        for (let geoind of [0, 1, 2]) {
            for (let record of geosets[geoind]) {
                icount++;
                let sign = cancelsign;
                if (icount <= 5) {
                    sign = oksign;
                }
                let row = [];
                row.push(sign + " " + record.stationkey.replace(/_/g, " ") + " " + record.locname);
                row.push(record.fromyear + "<br>" + record.toyear);
                row.push(record.category);
                row.push(record.goodyears);
                row.push(record.badyears);
                row.push(record.missingyears);
                row.push(record.distancekm);
                rows.push(row);
            }
        }
        let html = rowsToTable(rows);
        let tid = "tbl" + (Math.floor(Math.random() * 1000000) + 1000000);
        $($page)
            .append($("<hr/>"));
        $($page)
            .append($("<div/>", {
                id: tid,
                css: {
                    width: "95%"
                }
            }));
        $("#" + tid)
            .append(html);
        let pageid = $page.attr("id");
        $("#" + pageid + "chart").remove();
    }


    async function addStandardPage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
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
        if (datasource === "yeardata" && ["TMAX", "TMIN", "DTR", "PRCP", "SNOW", "SNWD"].includes(variable) && ["avg", "kum"].includes(method)) {
            let stations = geosets[0];
            // Loop über die Stations
            for (let station of stations) {
                for (let setmethod of [method, altmethod1, altmethod2]) {
                    if (setmethod === "") continue;
                    let dataset = {
                        check: "data",
                        label: station.locname,
                        source: station.source,
                        stationid: station.stationid,
                        locname: station.locname,
                        stationkey: station.source + "_" + station.stationid,
                        datakey: station.source + "_" + station.stationid + "_" + variable,
                        variable: variable,
                        method: setmethod,
                        fromyear: fromyear,
                        toyear: toyear,
                        yAxisID: "y",
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
                    dataset.custom = {};
                    dataset.custom.grad = result.gradient;
                    dataset.custom.r2 = result.r2;
                    dataset.custom.yIntercept = result.yIntercept;
                    let erg = kli6900.getTrivial(dataset.data, false, false);   // doround, korr
                    dataset.custom = Object.assign(dataset.custom, erg, true);
                    datasets.push(dataset);
                    regdataset.data = result.regdata;
                    regdataset.method = method + "_reg";
                    if (doregression.length > 0 && dataset.method === doregression) {
                        datasets.push(regdataset);
                    }
                }
            }
            if (datasets.length === 0) {
                $page.find(".mychart").remove();
                $page.append(
                    $("<div/>", {
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
            } else if (["DTR"].includes(variable)) {
                ytitle = "Differenz TMAX-TMIN";
            }
            let config = getConfig4lineChart(thistitle, xlabels, datasets, xtitle, ytitle);
            config.options.scales.x.type = "category";

            let pageid = $page.attr("id");
            let container = $page.find("div.mychart");  // ist bereits definiert als container!!!
            $(container)
                .append($("<canvas/>", {
                    id: pageid + "canvas"
                }));
            await pause(100);
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

    //["Zeitreihenvergleich", addComparePage, "yeardata", "TMAX,TMIN", "avg_reg", "", ""],
    async function addComparePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
        // in locations[key] = {} stehen key, colindex, location, geosets bereit
        // holen der bereits vorhandenen pages und datasets
        let colindex = $page.attr("data-colindex");
        let $section = $page.parent();
        let $container = $($section).parent();

        let $TMAXpage = $container.find("article[data-colindex=" + colindex + "][data-variable=TMAX][data-method=avg_reg]");
        let TMAXcanvasid = $TMAXpage.find("canvas").first().attr("id");
        let TMAXgraph = Chart.getChart(TMAXcanvasid);

        let $TMINpage = $container.find("article[data-colindex=" + colindex + "][data-variable=TMIN][data-method=avg_reg]");
        let TMINcanvasid = $TMINpage.find("canvas").first().attr("id");
        let TMINgraph = Chart.getChart(TMINcanvasid);

        // Umsortieren der recindex
        let dataindex = new Map(TMINgraph.data.datasets.map(function (rec, i) {
            let key = rec.source + "_" + rec.stationid + "_" + rec.variable + "_" + rec.method;  // source_stationid_variable_method
            return [key, i];
        }));
        let datasets = [];
        for (let dataset of TMAXgraph.data.datasets) {
            datasets.push(dataset);
            let key = dataset.source + "_" + dataset.stationid + "_TMIN_" + dataset.method;
            let ind = dataindex.get(key);
            if (typeof TMINgraph.data.datasets[ind] !== "undefined") {
                datasets.push(TMINgraph.data.datasets[ind]);
            }
        }


        let fromyear = 1950;
        let toyear = 2019;

        let xlabels = TMAXgraph.data.labels;
        let anz = xlabels.length;

        if (datasets.length === 0) {
            $page.find(".mychart").remove();
            $page.append(
                $("<div/>", {
                    html: "keine Daten"
                }));
            return;
        }
        // hier sind xlabels und datasets bekannt
        let thistitle = location.locname + " " + "TMAX/TMIN" + title;
        let xtitle = "years";
        let ytitle = "Temperature";
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

    async function addHydePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min","height"],
        // async function showStatisticPageWithHydevar(hparms, xlabels, doregression) {
        //let { $page, itopic, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar } = hparms;
        if (!(datasource === "yeardata" && ["TMAX", "TMIN", "DTR", "PRCP", "SNOW", "SNWD"].includes(variable) && ["avg", "avg_reg", "kum", "kum_reg"].includes(method) && hydevar !== "")) {
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
                    check: "hydedata",
                    label: station.locname,
                    source: station.source,
                    stationid: station.stationid,
                    locname: station.locname,
                    stationkey: station.source + "_" + station.stationid,
                    datakey: station.source + "_" + station.stationid + "_" + variable,
                    variable: variable,
                    method: setmethod,
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
                    dataset.hydevar1 = "height";  // Feldname
                    dataset.hydevar2 = "height";  // Feldname
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
                    dataset.hydevar1 = hydevar1;
                    dataset.hydevar2 = hydevar2;
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
            hydedataset.check = "hyde";
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
            hydedataset.yAxisID = referencedataset.hydevar; // TODO: prüfen
            datasets.push(hydedataset);
        }

        let icount = 0;
        for (let dataset of datasets) {
            if (dataset.check === "hydedata") {
                icount++;
            }
        }
        if (icount === 0) {
            $page.find(".mychart").remove();
            $page.append(
                $("<div/>", {
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
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
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

        let topicstring = title + "_" + datasource + "_" + variable + "_" + method;

        // Map auf records setzen

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
        let datasets = [];
        for (let topic of Object.keys(extdays[variable])) {
            // topic = critical, z.B. TMAX_hot
            for (let stationkey of Object.keys(extdays[variable][topic].stations)) {
                //let stations = locations[key].geosets[0];
                let index = recindex.get(stationkey + "_" + variable);
                let station = records[index];
                let data = kli6900.cloneObject(extdays[variable][topic].stations[stationkey].data);
                let sum = ss.sum(data);
                if (sum === 0) {
                    continue;
                }
                let dataset = {
                    type: "line",
                    check: "topic",
                    label: station.stationname,
                    hidden: false,
                    visible: true,
                    source: station.source,
                    stationid: station.stationid,
                    locname: station.stationname,
                    stationkey: station.source + "_" + station.stationid,
                    datakey: station.source + "_" + station.stationid + "_" + variable + "_" + topic,
                    topic: topic,
                    variable: topic,   // variable,
                    method: "ext",
                    fromyear: fromyear,
                    toyear: toyear,
                    yAxisID: "y",
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
                $("<div/>", {
                    html: "keine Daten"
                }));
            return;
        }
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
        await pause(100);
        let canvasid = pageid + "canvas";
        let canvas = document.getElementById(canvasid);
        let ctx = canvas.getContext("2d");
        let chart = new Chart(ctx, config);
        //console.log("Original:", config.data.datasets);
        //console.log("Chart:", chart.data.datasets);
        //console.log("Metasets:", chart._metasets);
        chart.options.responsive = false;
        chart.update();
        showChartButtons($page, canvasid, ["topics", "stations"]);
        showTopicsTable($page, pageid + "canvas", criticalDays);
        // science
        console.log({
            datasets: chart.data.datasets.length,
            visible: chart.getVisibleDatasetCount(),
            points: chart.data.datasets.map(ds => ds.data?.length)
        });
    }


    async function pause(ms = 50) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    };


    function checkChart(chart) {
        let canvas = chart.canvas;
        let rect = canvas.getBoundingClientRect();
        let result = {
            connected: canvas.isConnected,
            width: rect.width,
            height: rect.height,
            chartWidth: chart.width,
            chartHeight: chart.height,
            datasets: chart.data.datasets.length,
            labels: chart.data.labels?.length,
            visibleDatasets: chart.getVisibleDatasetCount(),
            chartArea: chart.chartArea,
            scales: Object.fromEntries(
                Object.entries(chart.scales).map(function ([key, scale]) {
                    return [key, {
                        min: scale.min,
                        max: scale.max
                    }];
                })
            )
        };

        console.log(result);
        return result;
    }


    function showTopicsTable($page, canvasid, criticalDays) {
        let chart = Chart.getChart(canvasid);
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
        let fromyear = 1950;
        let toyear = 2019;
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
                    style: "font-weight:bold;",
                    html: ltitle
                }))
                .append($("<span/>", {
                    style: "font-weight:bold;",
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

        // erst mal die Science-Buttons erzeugen 1,2,3,4
        // showScienceButtons(containerid, "scienceClass", canvasid, graph, vcontrolfields, hydevar, vcontrol);
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
            // Postprocessing methods für P0,P1,P2 mit visibility "hidden" oder "visible"
            if (crit === "methods") {
                for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                    let [period, pfromyear, ptoyear] = pparms;
                    let fromind = pfromyear - fromyear;
                    let toind = ptoyear - fromyear;
                    $("#" + containerid)
                        .append($("<button/>", {
                            class: "btn btn-sm btn-success datasetfilter " + datasetclass,
                            css: {
                                visibility: "hidden",
                                margin: "5px",
                                padding: "0px"
                            },
                            canvasid: canvasid,
                            varname: crit.substring(0, crit.length - 1),
                            varvalue: period,
                            fromyear: pfromyear,
                            toyear: ptoyear,
                            html: "<span>" + oksign + "</span><span> " + period + "</span>",
                            title: "Auswertung Verdichtung auf 30 Jahre",
                            title: crit + " " + period
                        }));
                }
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
            addGenericFilterButtons(containerid, "datasetfilterX", canvasid, "stationkey");
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
                // erstes Kriterium aufsteigend
                if (a[0] > b[0]) {
                    return 1;
                } else if (a[0] < b[0]) {
                    return -1;
                    // zweites Kriterium absteigend
                } else if (a[1] > b[1]) {
                    return -1;
                } else if (a[1] < b[1]) {
                    return 1;
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
                class: "btn btn-sm btn-warning kli3020sciencedata " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Science",
                title: "Wissenschaftlicer Vergleich zur Klimaentwicklung"
            }));

        $("#" + containerid)
            .append($("<button/>", {
                class: "btn btn-sm btn-danger kli2000copydata " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Copy Data",
                title: "Copy label and data to Clipboard "
            }));

        $("#" + containerid)
            .append($("<button/>", {
                class: "btn btn-sm btn-danger kli2000copyall " + datasetclass,
                css: {
                    margin: "5px",
                    padding: "0px"
                },
                containerid: containerid,
                canvasid: canvasid,
                html: "Copy All",
                title: "Copy label, attributes and data to Clipboard "
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
                html: "Copy Chart",
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
                cmd: "show",
                html: "Show Table",
                title: "Show table with summary data"
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
                cmd: "showcopy",
                html: "Copy Table",
                title: "Show table with summary data and copy the table to the clipboard"
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


    function showScienceButtons(containerid, scienceClass, canvasid, graph, variables, hydevar, vcontrol) {
        let pparms = [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]];
        // detect leading variable und hydevar
        let action = "";
        if (typeof variables !== "undefined" && variables !== null &&
            Array.isArray(variables) && variables.length > 0 && variables[0] === "topics") {
            // case topics/topic    
            action = "topic";
        } else if (typeof hydevar !== "undefined" && hydevar !== null) {
            // case hydevar
            leading.hydevar = hydevar;
            action = "hydevar";
        } else {
            // case classic variable
            action = "variable";
        }
        console.log("action", action);
        // Extremwerte und damit extrem-datasets für leadvariable bestimmen.
        // minmax mit <attributename>: min:..., max:...
        let minmax = {};
        let ind = -1;
        for (let dataset of graph.data.datasets) {
            ind++;  // ab 0
            if (typeof dataset.custom === "undefined" && dataset.data.length === 70) {
                let erg = kli6900.getTrivial(dataset.data, false, false);
                dataset.custom = Object.assign({}, erg);
            } else if (typeof dataset.custom === "undefined" && dataset.data.length === 2) {
                let data = [];
                if (typeof dataset.data[0].y !== "undefined") {
                    data.push(dataset.data[0].y);
                }
                if (typeof dataset.data[1].y !== "undefined") {
                    data.push(dataset.data[1].y);
                }
                let erg = kli6900.getTrivial(data, false, false);
                dataset.custom = Object.assign({}, erg);
            }
            if (action === "topic") {
                // es könnte mehrere topics in einem Chart geben
                let attributename = dataset.topic;
                let avg = dataset.custom.avg;
                if (avg === null) {
                    continue;
                }
                if (typeof minmax[attributename] === "undefined") {
                    minmax[attributename] = {
                        min: null,
                        imin: null,
                        max: null,
                        imax: null
                    }
                }
                if (minmax[attributename].min === null) {
                    minmax[attributename].min = avg;
                    minmax[attributename].imin = ind;
                } else if (minmax[attributename].min > avg) {
                    minmax[attributename].min = avg;
                    minmax[attributename].imin = ind;
                }

                if (minmax[attributename].max === null) {
                    minmax[attributename].max = avg;
                    minmax[attributename].imax = ind;
                } else if (minmax[attributename].max < avg) {
                    minmax[attributename].max = avg;
                    minmax[attributename].imax = ind;
                }
            }

        }
        if (action === "topic") {
            let topics = Object.keys(minmax);
            for (let topic of topics) {
                let topicdata = minmax[topic];
                $("#" + containerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-info datasetscience",
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        action: action,
                        parms: JSON.stringify(topicdata),
                        phase: "1",
                        html: "1 " + topic,
                        title: "min und max " + topic + " raw data",
                    }));
                $("#" + containerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-info datasetscience",
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        action: action,
                        parms: JSON.stringify(topicdata),
                        phase: "2",
                        html: "2 ",
                        title: "min und max " + topic + " horizontal 30-year buckets",
                    }));
                $("#" + containerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-info datasetscience",
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        action: action,
                        parms: JSON.stringify(topicdata),
                        phase: "3",
                        html: "3 ",
                        title: "min und max " + topic + " gradients 30-year buckets",
                    }));
                $("#" + containerid)
                    .append($("<button/>", {
                        class: "btn btn-sm btn-info datasetscience",
                        css: {
                            margin: "5px",
                            padding: "0px"
                        },
                        canvasid: canvasid,
                        action: action,
                        parms: JSON.stringify(topicdata),
                        phase: "4",
                        html: "4 ",
                        title: "min und max " + topic + " regression",
                    }));
            }
        }
        console.log(minmax);
        /*
         $("#" + containerid)
             .append($("<button/>", {
                 class: "btn btn-sm btn-success datasetfilter " + datasetclass,
                 css: {
                     visibility: "hidden",
                     margin: "5px",
                     padding: "0px"
                 },
                 canvasid: canvasid,
                 varname: crit.substring(0, crit.length - 1),
                 varvalue: period,
                 fromyear: pfromyear,
                 toyear: ptoyear,
                 html: "<span>" + oksign + "</span><span> " + period + "</span>",
                 title: "Auswertung Verdichtung auf 30 Jahre",
                 title: crit + " " + period
             }));
         */
    }
    $(document).on("click", ".datasetscience", function (evt) {
        evt.preventDefault();
        let canvasid = $(this).attr("canvasid");
        let pageid = canvasid.replace("canvas", "");
        let action = $(this).attr("action");
        let parms = JSON.parse($(this).attr("parms")); // min, imin, max, imax
        let phase = $(this).attr("phase");
        let graph = Chart.getChart(canvasid);
        // erst alles aussetzen und dabei die Button-Kriterien sammeln
        let critcontrol = {}; // <varname>:[<varvalue>, ...]
        for (let crit of ["stationkey", "variable", "method"]) {
            let buttons = $("#" + pageid).find("button[varname='" + crit + "']").toArray();
            for (let button of buttons) {
                let varvalue = $(button).attr("varvalue");
                if (typeof varvalue === "undefined") {
                    continue;
                }
                if (typeof critcontrol[crit] === "undefined") {
                    critcontrol[crit] = [];
                }
                critcontrol[crit].push(varvalue);
                $(button).find("span").first().html(cancelsign);
            }
        }
        let datacontrol = {
            stationkey: [],
            variable: [],
            method: []
        };
        for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
            let dataset = graph.data.datasets[idataset];
            for (let crit of ["stationkey", "variable", "method"]) {
                if (crit === "stationkey") {
                    if (typeof dataset.source !== "undefined" && typeof dataset.stationid !== "undefined") {
                        let stationkey = dataset.source + "_" + dataset.stationid;
                        if (!datacontrol.stationkey.includes(stationkey)) {
                            datacontrol.stationkey.push(stationkey);
                        }
                    }
                } else {
                    if (typeof dataset[crit] !== "undefined") {
                        if (!datacontrol[crit].includes(dataset[crit])) {
                            datacontrol[crit].push(dataset[crit]);
                        }
                    }
                }
            }
        }

        if (action === "topic") {
            if (phase === "1") {
                // Rohdaten
                for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
                    if (idataset === parms.imin || idataset === parms.imax) {
                        graph.setDatasetVisibility(idataset, true);
                        // die Buttons müssen aktualisiert werden
                        let dataset = graph.data.datasets[idataset];
                        let stationkey = dataset.source + "_" + dataset.stationid;
                        let button = $("#" + pageid).find("button[varname=stationkey][varvalue='" + stationkey + "']");
                        $(button).find("span").first().html(oksign);
                    } else {
                        graph.setDatasetVisibility(idataset, false);
                    }
                }
                graph.update("none");
            } else if (phase === "2") {
                // Treppenstufen - Science
                let idataset = -1;
                let docancel = false;
                let len = graph.data.datasets.length;
                for (let dataset of graph.data.datasets) {
                    idataset++;
                    if (idataset >= len) {
                        break;  // Abbruch beim alten Stand length, sonst werden neue Sätze zu viel bearbeitet
                    }
                    if (dataset.variable === parms.variable && dataset.method === parms.method) {
                        let checkkey = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + "P0";
                        let checkind = setindex.get(checkkey);
                        if (typeof graph.data.datasets[checkind] !== "undefined") {
                            docancel = true;
                            break;
                        }
                        let visible = graph.isDatasetVisible(idataset);
                        for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                            let [period, pfromyear, ptoyear] = pparms;
                            let fromind = pfromyear - fromyear;
                            let toind = ptoyear - fromyear;
                            let pdata = dataset.data.slice(fromind, toind);
                            let erg = kli6900.getTrivial(pdata, false, false);
                            let pdataset = kli6900.cloneObject(dataset);
                            pdataset.originalmethod = dataset.method;
                            pdataset.method += period;
                            pdataset.key = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + period;
                            pdataset.label += period;
                            pdataset.period = period;
                            if (regscience === false) {
                                pdataset.data = [
                                    { x: fromind, y: erg.avg },
                                    { x: toind, y: erg.avg }
                                    //{ x: pfromyear, y: erg.avg },
                                    //{ x: ptoyear, y: erg.avg }
                                ];
                            } else {
                                // Regressionsrechnung 
                                let result = getregression(pdata, 0);
                                let y1 = result.regdata[0];
                                let y2 = result.regdata[result.regdata.length - 1];
                                pdataset.data = [
                                    { x: fromind, y: y1 },
                                    { x: toind, y: y2 }
                                    //{ x: pfromyear, y: erg.avg },
                                    //{ x: ptoyear, y: erg.avg }
                                ];
                            }
                            pdataset.parsing = false;
                            pdataset.borderColor = "red";
                            pdataset.pointRadius = 0;
                            pdataset.borderWidth = 3;
                            console.log(pdataset.yAxisID);
                            if (yAxisID === "") {
                                yAxisID = pdataset.yAxisID;
                            }
                            graph.data.datasets.push(pdataset);
                            console.log(pdataset.key, pdataset.yAxisID, pdataset.period);
                            graph.setDatasetVisibility(graph.data.datasets.length - 1, visible);
                        }
                    }
                }




                graph.update("none");
            }
        }
    });

    function addGenericFilterButtons(containerid, genericClass, canvasid, varname) {
        for (let oper of [">", "<", "*", "#"]) {
            let btnid = "gb" + (Math.floor(Math.random() * 1000000) + 1000000);
            $("#" + containerid)
                .append($("<button/>", {
                    id: btnid,
                    class: genericClass,  // + colorclass, "btn btn-sm " +
                    css: {
                        //"border": "2px solid white",
                        "margin": "5px",
                        padding: "0px"
                    },
                    canvasid: canvasid,
                    varname: varname,
                    oper: oper,
                    html: " " + oper + " ",
                    title: varname
                }));
        }
    };

    $(document).on("click", "button.datasetfilterX", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let oper = $(this).attr("oper");
        let canvasid = $(this).attr("canvasid");
        let varname = $(this).attr("varname");
        let buttons = $("button.datasetfilter[canvasid=" + canvasid + "][varname=" + varname + "]").toArray();
        let len = buttons.length;
        if (oper === "*") {
            for (let i = 0; i < buttons.length; i++) {
                $(buttons[i]).find("span").first().html(oksign);
            }
        }
        if (oper === "#") {
            for (let i = 0; i < buttons.length; i++) {
                $(buttons[i]).find("span").first().html(cancelsign);
            }
        }
        if (oper === ">") {
            let inext = -1;
            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                let status = $(button).find("span").first().text();
                if (status === okletter) {
                    if (i < len - 1) {
                        inext = i + 1;
                    } else {
                        inext = 0;
                    }
                }
                $(button).find("span").first().html(cancelsign);
            }
            if (inext > -1) {
                $(buttons[inext]).find("span").first().html(oksign);
            } else {
                $(buttons[0]).find("span").first().html(oksign);
            }
        }
        if (oper === "<") {
            let inext = -1;
            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                let status = $(button).find("span").first().text();
                if (status === okletter) {
                    if (i > 0) {
                        inext = i - 1;
                    } else {
                        inext = len - 1;
                    }
                }
                $(button).find("span").first().html(cancelsign);
            }
            if (inext > -1) {
                $(buttons[inext]).find("span").first().html(oksign);
            } else {
                $(buttons[len - 1]).find("span").first().html(oksign);
            }
        }
        updateChart(canvasid);
    });


    $(document).on("click", "button.kli2000sumtable", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        let containerid = $(this).attr("containerid");
        let cmd = $(this).attr("cmd");
        let $page = $("#" + canvasid).closest("article");
        if (cmd === "show") {
            let oldsummary = $page.find(".kli3020summarytable");
            if (oldsummary.length > 0) {
                $(oldsummary).remove();
            }
        }
        let graph = Chart.getChart(canvasid);
        await showTable4Chart(graph, containerid, canvasid, cmd);
    });

    async function showTable4Chart(chart, containerid, canvasid, cmd) {
        if (typeof cmd === "undefined") {
            cmd = "show";
        }
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
            row.push(erg.gradient.toFixed(3));
            row.push(erg.r2);
            //gradient: 0.032
            //r2: 0.425
            //regdata: (70) ['14.28', '14.31', '14.35', '14.38', '14.41', '14.44', '14.47', '14.51', '14.54', '14.57', '14.60', '14.63', '14.67', '14.70', '14.73', '14.76', '14.79', '14.83', '14.86', '14.89', '14.92', '14.95', '14.99', '15.02', '15.05', '15.08', '15.11', '15.15', '15.18', '15.21', '15.24', '15.27', '15.31', '15.34', '15.37', '15.40', '15.43', '15.47', '15.50', '15.53', '15.56', '15.59', '15.63', '15.66', '15.69', '15.72', '15.75', '15.79', '15.82', '15.85', '15.88', '15.91', '15.95', '15.98', '16.01', '16.04', '16.07', '16.11', '16.14', '16.17', '16.20', '16.23', '16.27', '16.30', '16.33', '16.36', '16.39', '16.43', '16.46', '16.49']
            //yIntercept: 14.282
            rows.push(row);
        }
        if (cmd === "show") {
            let $article = $("#" + containerid).closest("article");
            let locname = $article.attr("data-locname");
            let html = rowsToTable(rows, headerfields, locname);
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

            $("#" + containerid).find(".kli3020summarytable")
                .append($("<details/>")
                    .append($("<summary/>", {
                        html: "Erläuterungen"
                    }))
                    .append($("<p>").html(`
                    vals: Anzahl der Jahre mit Daten<br>
                    min: minimaler Jahresdurchschnitt aller Jahre<br>
                    avg: Durchschnitt über die Durchschnitte der Jahre<br>
                    max: maximaler Jahresdurchschnitt aller Jahre<br>
                    sum: Summe aller Durchschnittswerte<br>
                    grad: Gradient der Regressionsgerade<br>
                    r2: Streuung um die Regressionsgerade<br>
                    `
                    ))
                );
        } else if (cmd === "showcopy") {
            // nicht sichtbare Tabelle
            let $article = $("#" + containerid).closest("article");
            let locname = $article.attr("data-locname");
            let html = rowsToTable(rows, [], locname);
            // html bereitstellen im Clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": new Blob([html], { type: "text/html" }),
                })
            ]);
        }
    }


    /**
    * rowsToTable - Umsetzung rows in html-table
    * Sonderregel: kurzzeilen mit nur einer Zelle werden erkannt und speziell ausgegeben
    * mit colspan="2" bzw. colspan="n"
    * @param {any} rows -
    * @returns {any} - Ausgabe in DOM
    */
    function rowsToTable(rows, headerfields, locname) {
        if (typeof locname === "undefined") {
            locname = "";
        }
        if (!rows.length) return "";
        if (typeof headerfields !== "undefined" && Array.isArray(headerfields) && headerfields.length > 0) {
            let headlength = headerfields.length;
            let fulllength = rows[0].length;
            let difflength = fulllength - headlength;
            let html = "<table class='table-bordered'>";
            html += "<thead>";
            html += "<tr>";
            html += "<th colspan='" + difflength + "'>";
            html += locname + " Summary"; //  + " " + rows[0].slice(0, headlength).join(" "); // Indizes 0 bis n
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

    $(document).on("click", "button.kli3020sciencedata", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        $(this).prop("disabled", true);
        let canvasid = $(this).attr("canvasid");
        let pageid = canvasid.replace("canvas", "");
        let $page = $("#" + pageid);
        //$page.find("button[canvasid=" + canvasid + "][varname=method][varvalue=P0]").css("visibility", "visible");
        //$page.find("button[canvasid=" + canvasid + "][varname=method][varvalue=P1]").css("visibility", "visible");
        //$page.find("button[canvasid=" + canvasid + "][varname=method][varvalue=P2]").css("visibility", "visible");
        await showChartScience($page, pageid, canvasid);
    });

    function showChartScience($page, pageid, canvasid) {
        let fromyear = 1950;
        let toyear = 2019;
        let graph = Chart.getChart(canvasid);

        // bereinigen berechnete Daten reg, regper, 
        let idels = 0;
        for (let i = graph.data.datasets.length - 1; i >= 0; i--) {
            let dataset = graph.data.datasets[i];
            let parts = dataset.method.split("_");
            if (parts.length > 1) {
                graph.data.datasets.splice(i, 1);
                idels++;
            }
        }
        console.log("datasets gelöscht:" + idels);
        let crits = {
            "check": [],
            "stationkey": [],
            "variable": [],
            "method": [],
            "*hydevar": []
        };
        for (let dataset of graph.data.datasets) {
            for (let fieldname of ["check", "stationkey", "variable", "method", "*hydevar"]) {
                if (fieldname.startsWith("*")) {
                    // mit * werden Metafelder markiert, daher anderer Ablauf
                    let fldname = fieldname.substring(1);
                    // Berechnung auf der Metaebene
                    if (typeof dataset[fldname] !== "undefined") {
                        let value = dataset[fldname];
                        if (fldname !== null) {
                            if (typeof crits[fldname] === "undefined") {
                                crits[fldname] = [];
                            }
                            if (!crits[fldname].includes(value)) {
                                crits[fldname].push(value)
                            }
                        }
                        // Berechnung auf der Datenebene
                        if (typeof crits[value] === "undefined") {
                            crits[value] = [];
                        }
                        let datavalue1 = dataset.hydeval1;  // Wechsel der Ebene
                        if (datavalue1 !== null) {
                            if (!crits[value].includes(datavalue1)) {
                                crits[value].push(datavalue1)
                            }
                        }
                        let datavalue2 = dataset.hydeval2;  // Wechsel der Ebene
                        if (datavalue2 !== null) {
                            if (!crits[value].includes(datavalue2)) {
                                crits[value].push(datavalue2)
                            }
                        }
                    }
                } else {
                    if (typeof dataset[fieldname] !== "undefined") {
                        let value = dataset[fieldname];
                        if (fieldname !== null) {
                            if (!crits[fieldname].includes(value)) {
                                crits[fieldname].push(value)
                            }
                        }
                    }
                }
            }
        }
        console.log(crits);

        let pageparms = $page[0].dataset;
        console.log(pageparms);

        // alle datasets nicht sichtbar setzen
        for (let i = 0; i < graph.data.datasets.length; i++) {
            graph.setDatasetVisibility(i, false);
            graph.data.datasets[i].minmax = "*";
            if (typeof graph.data.datasets[i].period === "undefined") {
                graph.data.datasets[i].period = "P*";
            }
        }
        // Fallunterscheidung
        crits.minmax = {}
        if (crits.check.includes("data") || crits.check.includes("topics")) {
            // raw data
            for (let i = 0; i < graph.data.datasets.length; i++) {
                let dataset = graph.data.datasets[i];
                let minmaxvar = dataset.variable;
                if (!["avg", "kum", "ext"].includes(dataset.method)) {
                    continue;
                }
                if (typeof crits.minmax[minmaxvar] === "undefined") {
                    crits.minmax[minmaxvar] = {
                        min: null,
                        imin: null,
                        max: null,
                        imax: null
                    }
                }
                let stationkey = dataset.source + "_" + dataset.stationid;
                let value = dataset.custom.avg;
                if (value === null) {
                    continue;
                }
                if (crits.minmax[minmaxvar].min === null) {
                    crits.minmax[minmaxvar].min = value;
                    crits.minmax[minmaxvar].imin = i;
                    crits.minmax[minmaxvar].minstationkey = stationkey;
                } else if (crits.minmax[minmaxvar].min > value) {
                    crits.minmax[minmaxvar].min = value;
                    crits.minmax[minmaxvar].imin = i;
                    crits.minmax[minmaxvar].minstationkey = stationkey;
                }
                if (crits.minmax[minmaxvar].max === null) {
                    crits.minmax[minmaxvar].max = value;
                    crits.minmax[minmaxvar].imax = i;
                    crits.minmax[minmaxvar].maxstationkey = stationkey;
                } else if (crits.minmax[minmaxvar].max < value) {
                    crits.minmax[minmaxvar].max = value;
                    crits.minmax[minmaxvar].imax = i;
                    crits.minmax[minmaxvar].maxstationkey = stationkey;
                }
            }
        } else if (crits.check.includes("hyde")) {
            // raw data für Hyde, etwas kompliziert
            for (let i = 0; i < graph.data.datasets.length; i++) {
                let dataset = graph.data.datasets[i];
                if (dataset.check !== "hyde") {
                    continue;
                }

                let minmaxvar = dataset.hydevar;  // unterschied!
                if (typeof crits.minmax[minmaxvar] === "undefined") {
                    crits.minmax[minmaxvar] = {
                        min: null,
                        imin: null,
                        max: null,
                        imax: null
                    }
                }
                let stationkey = dataset.source + "_" + dataset.stationid;
                for (let value of [dataset.hydeval1, dataset.hydeval2]) {
                    if (value === null) {
                        continue;
                    }
                    if (crits.minmax[minmaxvar].min === null) {
                        crits.minmax[minmaxvar].min = value;
                        crits.minmax[minmaxvar].imin = i;
                        crits.minmax[minmaxvar].minstationkey = stationkey;
                    } else if (crits.minmax[minmaxvar].min > value) {
                        crits.minmax[minmaxvar].min = value;
                        crits.minmax[minmaxvar].imin = i;
                        crits.minmax[minmaxvar].minstationkey = stationkey;
                    }
                    if (crits.minmax[minmaxvar].max === null) {
                        crits.minmax[minmaxvar].max = value;
                        crits.minmax[minmaxvar].imax = i;
                        crits.minmax[minmaxvar].maxstationkey = stationkey;
                    } else if (crits.minmax[minmaxvar].max < value) {
                        crits.minmax[minmaxvar].max = value;
                        crits.minmax[minmaxvar].imax = i;
                        crits.minmax[minmaxvar].maxstationkey = stationkey;
                    }
                }
            }
        }
        // Vererben minmax in die Daten - raw-Sätze avg, kum, ext
        // und auf die stations-Buttons, alle anderen aussetzen außer den "einfachen"
        let stationbuttons = $page.find("button[canvasid='" + canvasid + "'][varname=stationkey]").toArray();
        for (let button of stationbuttons) {
            $(button).find("span").first().html(cancelsign);
        }
        for (let i = 0; i < graph.data.datasets.length; i++) {
            let dataset = graph.data.datasets[i];
            for (let minmaxvar of Object.keys(crits.minmax)) {
                if (dataset.variable === minmaxvar && ["data", "hydedata", "hyde", "topics"].includes(dataset.check)) {
                    if (i === crits.minmax[minmaxvar].imin) {
                        graph.data.datasets[i].minmax = "min";
                        graph.data.datasets[i].label += " MIN";
                        graph.setDatasetVisibility(i, true);
                    } else if (i === crits.minmax[minmaxvar].imax) {
                        graph.data.datasets[i].minmax = "max";
                        graph.data.datasets[i].label += " MAX";
                        graph.setDatasetVisibility(i, true);
                    }
                }
            }
        }
        for (let minmaxvar of Object.keys(crits.minmax)) {
            let minstationkey = crits.minmax[minmaxvar].minstationkey;
            let minbutton = $page.find("button[canvasid='" + canvasid + "'][varname=stationkey][varvalue='" + minstationkey + "']");
            $(minbutton).find("span").first().html(oksign);
            let maxstationkey = crits.minmax[minmaxvar].maxstationkey;
            let maxbutton = $page.find("button[canvasid='" + canvasid + "'][varname=stationkey][varvalue='" + maxstationkey + "']");
            $(maxbutton).find("span").first().html(oksign);
            break;  // es kann hier nur einen geben
        }


        graph.update("none");


        //if (!["avg", "kum", "ext"].includes(dataset.method)) {
        //    continue;
        //}

        // Buttons prüfen und generieren, erweiterte Daten löschen und neu generieren mit minmax Vererbung
        // Reminder Spezialfall crits.check='hyde' nur vererben 
        if (crits.variable.length > 1) {
            // variable-Buttons anlegen, vor allem bei hyde
        }
        // container für die neuen Buttons anlegen
        $("#" + pageid + "buttonslabels")
            .after($("<div/>", {
                id: pageid + "newbuttons",
                style: "width: 100%;",
            }));
        for (let method of ["avg", "kum", "ext"]) {
            if (!crits.method.includes(method)) {
                continue;
            }
            // method-Buttons anlegen, wenn notwendig, alle 4!
            let methods = [method, method + "_reg", method + "_regper", method + "_avgper"];
            let imethod = -1;
            for (let buttonmethod of methods) {
                imethod++;
                let button = $($page).find("button[varname=method][varvalue='" + buttonmethod + "']");
                if (button.length > 0) {
                    $(button).remove();
                }
                // Anlegen des Button <dp1579959buttons> als container
                let sign = cancelsign;
                if (imethod === 0) {
                    sign = oksign;
                }
                $("#" + pageid + "newbuttons")
                    .append($("<button/>", {
                        class: "btn btn-sm btn-success datasetfilter datasetclass" + $page.attr("data-colindex"),
                        canvasid: canvasid,
                        varname: "method",
                        varvalue: buttonmethod,
                        title: methods + " " + buttonmethod,
                        style: "margin: 5px; padding: 0px;",
                    })
                        .append($("<span/>", {
                            html: sign
                        }))
                        .append($("<span/>", {
                            html: " " + buttonmethod
                        }))
                    );
            }
            // erweiterte method-datasets anlegen, reminder: vorher wurden alle evt. vorhandenen gelöscht
            let len = graph.data.datasets.length;  // Referenzlänge, dort sind die raw-Data
            for (let i = 0; i < len; i++) {
                let dataset = graph.data.datasets[i];
                if (dataset.method !== method) {
                    continue;
                }
                //for (let datamethod of [method + "_reg", method + "_regper", method + "_avgper"]) {
                let datamethod = method + "_reg";
                let newdataset = structuredClone(dataset);
                newdataset.method = datamethod;
                newdataset.label = dataset.label + " " + datamethod;
                let period = "P*";
                newdataset.key = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + datamethod + "_" + period;
                let result = getregression(dataset.data, 0);
                let y1 = result.regdata[0];
                let y2 = result.regdata[result.regdata.length - 1];
                let fromind = 0;
                let toind = 69;
                newdataset.data = [
                    { x: fromind, y: y1 },
                    { x: toind, y: y2 }
                    //{ x: fromyear, y: y1 },
                    //{ x: toyear, y: y2 }
                ];
                newdataset.parsing = false;
                newdataset.borderColor = "red";
                newdataset.pointRadius = 0;
                newdataset.borderWidth = 3;
                console.log(newdataset.yAxisID);
                graph.data.datasets.push(newdataset);
                graph.setDatasetVisibility(graph.data.datasets.length - 1, false);

                // Ausgabe der _avgper-Sätze
                for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                    let [period, pfromyear, ptoyear] = pparms;
                    let fromind = pfromyear - fromyear;
                    let toind = ptoyear - fromyear;
                    let pdata = dataset.data.slice(fromind, toind);
                    let erg = kli6900.getTrivial(pdata, false, false);
                    let pdataset = kli6900.cloneObject(dataset);
                    pdataset.originalmethod = dataset.method;
                    pdataset.method = dataset.method + "_avgper";
                    pdataset.key = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + dataset.method + "_" + dataset.period;
                    pdataset.label += " " + period;
                    pdataset.period = period;

                    pdataset.data = [
                        { x: fromind, y: erg.avg },
                        { x: toind, y: erg.avg }
                        //{ x: pfromyear, y: erg.avg },
                        //{ x: ptoyear, y: erg.avg }
                    ];

                    pdataset.parsing = false;
                    pdataset.borderColor = "red";
                    pdataset.pointRadius = 0;
                    pdataset.borderWidth = 3;
                    console.log(pdataset.yAxisID);
                    graph.data.datasets.push(pdataset);
                    console.log(pdataset.key, pdataset.yAxisID, pdataset.period);
                    graph.setDatasetVisibility(graph.data.datasets.length - 1, false);
                }

                // Ausgabe der _regper-Sätze
                for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                    let [period, pfromyear, ptoyear] = pparms;
                    let fromind = pfromyear - fromyear;
                    let toind = ptoyear - fromyear;
                    let pdata = dataset.data.slice(fromind, toind);
                    let erg = kli6900.getTrivial(pdata, false, false);
                    let pdataset = kli6900.cloneObject(dataset);
                    pdataset.originalmethod = dataset.method;
                    pdataset.method = dataset.method + "_regper";
                    pdataset.key = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + dataset.method + "_" + dataset.period;
                    pdataset.label += " " + period;
                    pdataset.period = period;
                    // Regressionsrechnung 
                    let result = getregression(pdata, 0);
                    let y1 = result.regdata[0];
                    let y2 = result.regdata[result.regdata.length - 1];
                    pdataset.data = [
                        { x: fromind, y: y1 },
                        { x: toind, y: y2 }
                        //{ x: pfromyear, y: erg.avg },
                        //{ x: ptoyear, y: erg.avg }
                    ];
                    pdataset.parsing = false;
                    pdataset.borderColor = "red";
                    pdataset.pointRadius = 0;
                    pdataset.borderWidth = 3;
                    console.log(pdataset.yAxisID);
                    graph.data.datasets.push(pdataset);
                    console.log(pdataset.key, pdataset.yAxisID, pdataset.period);
                    graph.setDatasetVisibility(graph.data.datasets.length - 1, false);
                }

                for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                }

            }


        }
        graph.scales.x.type = "category";
        graph.update("none");
    }





    function showChartScience_OLD($page, pageid, canvasid) {
        // auf der Ebene pageid gibt es zahlreiche Attribute
        // <article id="dp1421410" 
        // class="page desktop" 
        // data-colindex="0" 
        // data-topic="Zeitreihe_yeardata_TMAX_avg" 
        // data-place="Trippelsdorf 2821102" 
        // data-title="Zeitreihe" 
        // data-datasource="yeardata" 
        // data-variable="TMAX" 
        // data-method="avg" 
        // data-altmethod1="max" 
        // data-altmethod2="min" 
        // style="flex: 0 0 31%; box-sizing: border-box; padding-top: 5px; margin: 3px; border: 3px solid red;"></article>
        // die einfache Darstellung mit method avg bekommt eine einfache Analyse
        let fromyear = 1950;
        let toyear = 2019;
        let graph = Chart.getChart(canvasid);

        let parms = $page[0].dataset;
        let setindex = new Map(graph.data.datasets.map(function (rec, i) {
            rec.key = rec.source + "_" + rec.stationid + "_" + rec.variable + "_" + rec.method;
            return [rec.key, i];
        }));


        let yAxisID = "";
        let regscience = false;
        if (parms.method === "avg_reg") {
            parms.method = "avg";
            regscience = true;
        }
        if (parms.method === "kum_reg") {
            parms.method = "kum";
            regscience = true;
        }
        if (parms.method === "avg" || parms.method === "kum" || parms.method === "ext") {
            let idataset = -1;
            let docancel = false;
            for (let dataset of graph.data.datasets) {
                idataset++;
                if (dataset.variable === parms.variable && dataset.method === parms.method) {
                    let checkkey = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + "P0";
                    let checkind = setindex.get(checkkey);
                    if (typeof graph.data.datasets[checkind] !== "undefined") {
                        docancel = true;
                        break;
                    }
                    let visible = graph.isDatasetVisible(idataset);
                    for (let pparms of [["P0", 1950, 1979], ["P1", 1970, 1999], ["P2", 1990, 2019]]) {
                        let [period, pfromyear, ptoyear] = pparms;
                        let fromind = pfromyear - fromyear;
                        let toind = ptoyear - fromyear;
                        let pdata = dataset.data.slice(fromind, toind);
                        let erg = kli6900.getTrivial(pdata, false, false);
                        let pdataset = kli6900.cloneObject(dataset);
                        pdataset.originalmethod = dataset.method;
                        pdataset.method += period;
                        pdataset.key = dataset.source + "_" + dataset.stationid + "_" + dataset.variable + "_" + period;
                        pdataset.label += period;
                        pdataset.period = period;
                        if (regscience === false) {
                            pdataset.data = [
                                { x: fromind, y: erg.avg },
                                { x: toind, y: erg.avg }
                                //{ x: pfromyear, y: erg.avg },
                                //{ x: ptoyear, y: erg.avg }
                            ];
                        } else {
                            // Regressionsrechnung 
                            let result = getregression(pdata, 0);
                            let y1 = result.regdata[0];
                            let y2 = result.regdata[result.regdata.length - 1];
                            pdataset.data = [
                                { x: fromind, y: y1 },
                                { x: toind, y: y2 }
                                //{ x: pfromyear, y: erg.avg },
                                //{ x: ptoyear, y: erg.avg }
                            ];
                        }
                        pdataset.parsing = false;
                        pdataset.borderColor = "red";
                        pdataset.pointRadius = 0;
                        pdataset.borderWidth = 3;
                        console.log(pdataset.yAxisID);
                        if (yAxisID === "") {
                            yAxisID = pdataset.yAxisID;
                        }
                        graph.data.datasets.push(pdataset);
                        console.log(pdataset.key, pdataset.yAxisID, pdataset.period);
                        graph.setDatasetVisibility(graph.data.datasets.length - 1, visible);
                    }
                }
            }
            if (docancel === true) {
                return;
            }
        }

        //graph.options.scales.x.type = "category";
        graph.scales.x.type = "category";
        let scalemin = graph.scales['y'].min;
        let scalemax = graph.scales['y'].max;
        graph.options.scales[yAxisID] = {
            axis: "y",
            type: "linear",
            position: "right",
            suggestedMin: scalemin,
            suggestedMax: scalemax,
            min: scalemin,
            max: scalemax,
            grid: {
                drawOnChartArea: false
            },
            title: {
                display: false,
                text: yAxisID
            },
            ticks: {
                maxTicksLimit: 6,
                font: { size: 10 }
            }
        };
        graph.update("none");
    }




    $(document).on("click", "button.kli2000copydata", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        let graph = Chart.getChart(canvasid);
        await copyChartCSV(graph);
    });



    $(document).on("click", "button.kli2000copyall", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();

        let canvasid = $(this).attr("canvasid");
        let graph = Chart.getChart(canvasid);
        await copyChartAttrsCSV(graph, canvasid);
    });


    $(document).on("click", "button.kli2000copychart", async function (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        let canvasid = $(this).attr("canvasid");
        const canvas = document.getElementById(canvasid); // Replace with your canvas element ID
        await copyCanvasToClipboard(canvas);
    });


    async function copyChartAttrsCSV(graph, canvasid) {

        const datasets = graph.data.datasets;

        let fields = "key,source,stationid,datakey,fromyear,toyear,";
        fields += "label,stationkey,locname,variable,method,check,";
        fields += "period,yAxisID";
        let rowfields = fields.split(",");
        let subfields = "counted,realcounted,missing,missingseqmax,max,min,imax,imin,avg,sum,grad,r2,yIntercept";
        let rowsubfields = subfields.split(",");

        let totalrows = rowfields.length + rowsubfields.length;

        // zuerst alle rows initialisieren mit der ersten Spalte
        let rows = [];
        for (let irow = 0; irow < rowfields.length; irow++) {
            rows[irow] = [];
            rows[irow].push(rowfields[irow]);
        }
        // jetzt die Zeilen für die rowsubfields
        let missings = 0;
        let visibles = 0;
        let availables = 0;
        let xydata = 0;
        for (let idataset = 0; idataset < datasets.length; idataset++) {
            let dataset = datasets[idataset];
            if (graph.isDatasetVisible(idataset) === false) {
                continue;
            }
            visibles++;
            if (typeof dataset.custom === "undefined") {
                missings++;
            } else {
                availables++;
            }
            if (dataset.data.length === 2) {
                xydata++;
            }
        }
        let docustom = false;
        if (availables > 0) {
            docustom = true;
        }
        if (docustom === true) {
            for (let irow = 0; irow < rowsubfields.length; irow++) {
                let rowind = rowfields.length - 1 + irow;
                rows[rowind] = [];
                rows[rowind].push(rowsubfields[irow]);
            }
        }
        // Lines for special lines with two objects with x and y
        if (xydata > 0) {
            rows[rows.length] = [];
            rows[rows.length - 1].push("xyfrom");
            rows[rows.length] = [];
            rows[rows.length - 1].push("xyto");
        }


        let icol = 0; // die fieldname-Spalte ist hier bereits vorhanden
        let i = -1;
        for (let dataset of datasets) {
            i++;
            if (graph.isDatasetVisible(i) === false) {
                continue;
            }
            icol++;
            for (let irow = 0; irow < rowfields.length; irow++) {
                let value = "" + dataset[rowfields[irow]];
                value = value.replace(/_/g, "<br>");
                rows[irow][icol] = value;
            }
            if (docustom === true) {
                for (let irow = 0; irow < rowsubfields.length; irow++) {
                    let rowind = rowfields.length - 1 + irow;
                    if (typeof dataset["custom"] !== "undefined") {
                        let value = "" + dataset["custom"][rowsubfields[irow]];
                        rows[rowind][icol] = value;
                    } else {
                        rows[rowind][icol] = "unknown";
                    }
                }
            }
            if (xydata > 0) {
                if (dataset.data.length === 2) {
                    let rind = rows.length - 2;
                    rows[rind][icol] = "x:" + dataset.data[0].x + ";<br>y:" + dataset.data[0].y;
                    rind++;
                    rows[rind][icol] = "x:" + dataset.data[1].x + ";<br>y:" + dataset.data[1].y;
                } else {
                    let rind = rows.length - 2;
                    rows[rind][icol] = "not available";
                    rind++;
                    rows[rind][icol] = "not available";
                }
            }
        }
        let $article = $("#" + containerid).closest("article");
        let locname = $article.attr("data-locname");
        let html = rowsToTable(rows, [], locname);
        // html bereitstellen im Clipboard
        await navigator.clipboard.write([
            new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" }),
            })
        ]);
    }


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
        await new Promise(function (resolve, reject) {
            requestAnimationFrame(function () {
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
        let fixedletter = $("button.fixedyscales").find("span").first().text();
        let dofixed = false;
        if (fixedletter === okletter) {
            dofixed = true;
        }
        let graph = Chart.getChart(canvasid);
        let buttonsid = canvasid.replace("canvas", "buttons");
        let buttons = $("#" + buttonsid).find("button.datasetfilter").toArray();
        let selparms = {};
        let btncontrol = {};  // count auf varname, grob
        for (let button of buttons) {
            let visibility = $(button).css("visibility");
            if (visibility === "hidden") {
                continue;
            }
            let varname = $(button).attr("varname");
            let varvalue = $(button).attr("varvalue");

            if (typeof btncontrol[varname] === "undefined") {
                btncontrol[varname] = 0;
            }
            btncontrol[varname]++;

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
        // selparms ist aufgebaut, datasets kann geprüft werden
        let idataset = -1;
        for (let dataset of graph.data.datasets) {
            idataset++;
            let found = true;
            for (let varname of Object.keys(selparms)) {
                let value = dataset[varname];
                if (!selparms[varname].includes(value)) {
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
        // bei parsing false scheint es Probleme mit y-Scales zu geben, daher
        let icount = -1;
        let scales = graph.scales;
        let visibles = {};
        for (let dataset of graph.data.datasets) {
            icount++;
            let scalekey = dataset.yAxisID + "_" + dataset.variable + "_" + dataset.method;
            if (typeof visibles[scalekey] !== "undefined") {
                if (visibles[scalekey].min === null) {
                    visibles[scalekey].min = dataset.custom.min;
                } else if (visibles[scalekey].min > dataset.custom.min) {
                    visibles[scalekey].min = dataset.custom.min;
                }
                if (visibles[scalekey].max === null) {
                    visibles[scalekey].max = dataset.custom.max;
                } else if (visibles[scalekey].max < dataset.custom.max) {
                    visibles[scalekey].max = dataset.custom.max;
                }
            }
        }
        // Übernehmen in die Konfiguration des Graph
        let scalecontrol = {};
        for (let scaleid of Object.keys(graph.scales)) {
            for (let visiblekey of Object.keys(visibles)) {
                let [yAxisID, variable, method] = visiblekey;
                if (scaleid !== yAxisID) {
                    continue;
                }
                if (typeof scalecontrol[yAxisID] === "undefined") {
                    scalecontrol[yAxisID] = 1;
                    scales[scaleid].min = Number.MAX_VALUE;
                    scales[scaleid].max = Number.MIN_VALUE;
                }
                let visible = visibles[visiblekey];
                if (visible.min < scales[scaleid].min) {
                    scales[scaleid].min = Math.floor(visible.min);
                }
                if (visible.max > scales[scaleid].max) {
                    scales[scaleid].max = Math.ceil(visible.max);
                }
            }
            graph.options.scales[scaleid].min = scales[scaleid].min;
            graph.options.scales[scaleid].max = scales[scaleid].max;
            graph.scales[scaleid].suggestedMin = scales[scaleid].min;
            graph.scales[scaleid].suggestedMax = scales[scaleid].max;
        }

        graph.update("none");
    }

    function updateChart_OLD(canvasid) {
        let fixedletter = $("button.fixedyscales").find("span").first().text();
        let dofixed = false;
        if (fixedletter === okletter) {
            dofixed = true;
        }
        let graph = Chart.getChart(canvasid);
        let buttonsid = canvasid.replace("canvas", "buttons");
        let buttons = $("#" + buttonsid).find("button.datasetfilter").toArray();
        let selparms = {};
        let btncontrol = {};
        for (let button of buttons) {
            let visibility = $(button).css("visibility");
            if (visibility === "hidden") {
                continue;
            }
            let varname = $(button).attr("varname");
            let varvalue = $(button).attr("varvalue");

            if (typeof btncontrol[varname] === "undefined") {
                btncontrol[varname] = 0;
            }
            btncontrol[varname]++;

            let status = $(button).find("span").first().text();
            if (status === okletter) {
                if (typeof selparms[varname] === "undefined") {
                    selparms[varname] = [];
                }
                if (varname === "method" &&
                    (varvalue.endsWith("P0") || varvalue.endsWith("P1") || varvalue.endsWith("P2"))) {
                    if (!selparms[varname].includes(varvalue)) {
                        selparms[varname].push(varvalue);
                    }
                } else {
                    if (!selparms[varname].includes(varvalue)) {
                        selparms[varname].push(varvalue);
                    }
                }
            }
        }
        // Abbruch wenn gewisse Kriterien überhaupt nicht angesetzt sind
        // method, topics und stationkey sind wichtige Kriterien, wenn es die Buttons gibt
        let doreset = false;
        if (typeof btncontrol["method"] !== "undefined" && (typeof selparms["method"] === "undefined" || selparms["method"].length === 0)) {
            doreset = true;
        } else if (typeof btncontrol["topics"] !== "undefined" && (typeof selparms["topics"] === "undefined" || selparms["topics"].length === 0)) {
            doreset = true;
        } else if (typeof btncontrol["stationkey"] !== "undefined" && (typeof selparms["stationkey"] === "undefined" || selparms["stationkey"].length === 0)) {
            doreset = true;
        }
        if (doreset === true) {
            for (let idataset = 0; idataset < graph.data.datasets.length; idataset++) {
                graph.setDatasetVisibility(idataset, false);
            }
            graph.update("none");
            return;
        }
        let idataset = -1;
        for (let dataset of graph.data.datasets) {
            idataset++;
            let found = true;
            for (let varname of Object.keys(selparms)) {
                let value = dataset[varname];
                if (varname === "method") {
                    if (value.endsWith("P0")) {
                        if (!selparms[varname].includes("P0")) {
                            found = false;
                            break;
                        }
                    } else if (value.endsWith("P1")) {
                        if (!selparms[varname].includes("P1")) {
                            found = false;
                            break;
                        }
                    } else if (value.endsWith("P2")) {
                        if (!selparms[varname].includes("P2")) {
                            found = false;
                            break;
                        }
                    } else {
                        if (!selparms[varname].includes(dataset[varname])) {
                            found = false;
                            break;
                        }
                    }
                } else {
                    if (!selparms[varname].includes(dataset[varname])) {
                        found = false;
                        break;
                    }
                }
            }
            if (found === false) {
                graph.setDatasetVisibility(idataset, false);
            } else {
                graph.setDatasetVisibility(idataset, true);
            }
        }
        if (dofixed === true) {
            let scales = graph.scales;
            let visibles = {};
            let icount = -1;
            for (let dataset of graph.data.datasets) {
                icount++;
                if (typeof dataset.custom === "undefined" && dataset.data.length === 70) {
                    let erg = kli6900.getTrivial(dataset.data, false, false);
                    dataset.custom = Object.assign({}, erg);
                } else if (typeof dataset.custom === "undefined" && dataset.data.length === 2) {
                    let data = [];
                    if (typeof dataset.data[0].y !== "undefined") {
                        data.push(dataset.data[0].y);
                    }
                    if (typeof dataset.data[1].y !== "undefined") {
                        data.push(dataset.data[1].y);
                    }
                    let erg = kli6900.getTrivial(data, false, false);
                    dataset.custom = Object.assign({}, erg);
                }
                let scalekey = dataset.yAxisID + "_" + dataset.variable + "_" + dataset.method;
                if (graph.isDatasetVisible(icount)) {
                    if (typeof visibles[scalekey] === "undefined") {
                        visibles[scalekey] = {
                            min: null,
                            max: null,
                            count: 0
                        }
                        visibles[scalekey].count++;
                    }
                }
            }
            icount = -1;
            for (let dataset of graph.data.datasets) {
                icount++;
                let scalekey = dataset.yAxisID + "_" + dataset.variable + "_" + dataset.method;
                if (typeof visibles[scalekey] !== "undefined") {
                    if (visibles[scalekey].min === null) {
                        visibles[scalekey].min = dataset.custom.min;
                    } else if (visibles[scalekey].min > dataset.custom.min) {
                        visibles[scalekey].min = dataset.custom.min;
                    }
                    if (visibles[scalekey].max === null) {
                        visibles[scalekey].max = dataset.custom.max;
                    } else if (visibles[scalekey].max < dataset.custom.max) {
                        visibles[scalekey].max = dataset.custom.max;
                    }
                }
            }
            // Übernehmen in die Konfiguration des Graph
            let scalecontrol = {};
            for (let scaleid of Object.keys(graph.scales)) {
                for (let visiblekey of Object.keys(visibles)) {
                    let [yAxisID, variable, method] = visiblekey;
                    if (scaleid !== yAxisID) {
                        continue;
                    }
                    if (typeof scalecontrol[yAxisID] === "undefined") {
                        scalecontrol[yAxisID] = 1;
                        scales[scaleid].min = Number.MAX_VALUE;
                        scales[scaleid].max = Number.MIN_VALUE;
                    }
                    let visible = visibles[visiblekey];
                    if (visible.min < scales[scaleid].min) {
                        scales[scaleid].min = Math.floor(visible.min);
                    }
                    if (visible.max > scales[scaleid].max) {
                        scales[scaleid].max = Math.ceil(visible.max);
                    }
                }
                graph.options.scales[scaleid].min = scales[scaleid].min;
                graph.options.scales[scaleid].max = scales[scaleid].max;
                graph.scales[scaleid].suggestedMin = scales[scaleid].min;
                graph.scales[scaleid].suggestedMax = scales[scaleid].max;
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
        return kli6900.cloneObject(config);
    }

    // locationkey, colindex, location, geosets in locations[locationkey]
    // Querzugriff notwendig, um die x/y scales zu Harmonisieren
    async function getKLIDATA(location, geosets) {
        //extdays: {GHCND_GM000001153: {2018-07-05: extevts:{ GHCND_GM000001153: {TMAX_hot: 30.5}, …}, 
        // dayindex: 1234 (Tagesindex) im Jahr, year: 2018 als Jahr }}
        let status = $("button.qualitycontrol").find("span").first().text();
        let doQualityControl = false;
        if (status === okletter) {
            doQualityControl = true;
        }
        stationpatterns = {};
        let stationdata = {};
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
            stationdata[record.source + "_" + record.stationid] = structuredClone(record);
        }
        let icount = 0;
        for (let record of geosets[1]) {
            //vcontrol.stations[key].dashPatternsIndex = ind;
            i++;
            if (i > 9) {
                i = 0;
            }
            record.dashPatternsIndex = i;
            stationpatterns[record.source + "_" + record.stationid] = i;   // dashPatternsIndex
            icount += 1;
            if (typeof sels[record.source] === "undefined") {
                sels[record.source] = [];
            }
            sels[record.source].push(record.stationid);
            stationdata[record.source + "_" + record.stationid] = structuredClone(record);
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

        let qualitydata = [];
        let catstations;
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
                if (doQualityControl === true && record.variable === "TMAX") {
                    // Prüfung anhand von record.yeardata[year]
                    let missingyears = 0;
                    let badyears = 0;
                    let sumcounted = 0;
                    let sumrealcounted = 0;
                    let goodyears = 0;
                    for (let iyear = fromyear; iyear <= toyear; iyear++) {
                        let result = record.yeardata["" + iyear];
                        if (typeof result === "undefined") {
                            missingyears++;
                            continue;
                        }
                        let limit = 365 * 0.2;
                        if (result.missing > limit || result.missingseqmax > 6) {
                            badyears++;
                            continue;
                        }
                        goodyears++;
                        sumcounted += result.counted;
                        sumrealcounted += result.realcounted;
                    }
                    let category = 0;
                    if (goodyears >= 65) {   // früher 68
                        category = 0;
                    } else if (goodyears >= 70 * 0.8) {
                        category = 1;
                    } else {
                        category = 2;
                    }
                    qualitydata.push({
                        stationkey: record.stationkey,
                        variable: record.variable,
                        category: category,
                        goodyears: goodyears,
                        distancekm: stationdata[record.stationkey].distancekm,
                        missingyears: missingyears,
                        badyears: badyears
                    });
                }
            }
            records = [];
            if (doQualityControl === true) {
                // sortieren qualitydata
                let qrecords = qualitydata.sort(function (a, b) {
                    if (a.category > b.category) {
                        return 1;
                    } else if (a.category < b.category) {
                        return -1
                    } else if (a.goodyears > b.goodyears) {
                        return -1
                    } else if (a.goodyears < b.goodyears) {
                        return +1
                    } else if (a.distancekm > b.distancekm) {
                        return 1;
                    } else if (a.distancekm < b.distancekm) {
                        return -1
                    } else {
                        return 0;
                    }
                });

                //stationdata[record.source + "_" + record.stationid]
                geosets[0].length = 0;
                geosets[1].length = 0;
                geosets[2].length = 0;
                for (let qrecord of qrecords) {
                    //if (catstations[qrecord.category] === 0) catstations[qrecord.category] = [];
                    let georec = stationdata[qrecord.stationkey];
                    georec = Object.assign(georec, qrecord);
                    geosets[qrecord.category].push(georec);
                }
                // Regorg geosets
                if (geosets[0].length < 5) {
                    if (geosets[1].length > 0) {
                        let diff = 5 - geosets[0].length;
                        if (geosets[1].length >= diff) {
                            geosets[0] = geosets[0].concat(geosets[1].splice(0, diff));
                        } else {
                            geosets[0] = geosets[0].concat(geosets[1]);
                        }
                    } else if (geosets[1].length > 5) {
                        geosets[0] = geosets[0].concat(geosets[1].splice(0, 5));
                    }
                } else if (geosets[0].length > 5) {
                    let moresets = geosets[0].splice(5);
                    geosets[1] = moresets.concat(geosets[1]);
                }
                let geokeys = [];
                for (let geoset of geosets[0]) {
                    geokeys.push(geoset.stationkey);
                }
                records = [];
                for (let record of ret1.records) {
                    if (geokeys.includes(record.stationkey)) {
                        records.push(structuredClone(record));
                    }
                }
            } else {
                records = ret1.records;
            }
            getDTR(records);
            // es sind die Werte jetzt auf float umgestellt, Rechnungen müssten also schneller gehen
            getExtdays(records);  // gehen automatisch nach extdays
            // extdays: {GHCND_GM000001153: {2018-07-05: extevts:{ GHCND_GM000001153: {TMAX_hot: 30.5}, …}, 
            // dayindex: 1234 (Tagesindex) im Jahr, year: 2018 als Jahr }}

            // Zuordnung der dashPatterns zu den wirklich vorhandenen stations
            stationpatterns = {};
            let ipattern = -1;
            for (let record of records) {
                if (typeof stationpatterns[record.stationkey] === "undefined") {
                    ipattern++;
                    if (ipattern > 9) {
                        ipattern = 0;
                    }
                    stationpatterns[record.stationkey] = ipattern;
                }
                record.dashPatternsIndex = stationpatterns[record.stationkey];
            }
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

    function getDTR(records) {
        let fromyear = 1950;
        let toyear = 2019;
        recindex = new Map(records.map((rec, i) => [rec.key, i]));
        for (let record of records) {
            if (record.variable !== "TMAX") {
                continue;
            }
            let stationkey = record.stationkey;
            let tminkey = stationkey + "_TMIN";
            let tminind = recindex.get(tminkey);
            let record1 = records[tminind];
            if (typeof record1 === "undefined") {
                continue;
            }
            let maxyears = record.years;
            let minyears = record1.years;
            let dtryears = {};
            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                let maxvalues = maxyears["" + iyear];
                let minvalues = minyears["" + iyear];
                if (typeof maxvalues === "undefined" || typeof minvalues === "undefined") {
                    continue;
                }
                for (let iday = 0; iday < maxvalues.length; iday++) {
                    let maxvalue = maxvalues[iday];
                    let minvalue = minvalues[iday];
                    if (typeof maxvalue === "undefined" || typeof minvalue === "undefined") {
                        continue;
                    }
                    if (maxvalue === null || minvalue === null || maxvalue === "" || minvalue === "") {
                        continue;
                    }
                    let dtrvalue = parseFloat(maxvalue) - parseFloat(minvalue);
                    dtrvalue = dtrvalue.toFixed(1);
                    if (typeof dtryears["" + iyear] === "undefined") {
                        dtryears["" + iyear] = new Array(maxvalues.length).fill("");
                    }
                    dtryears["" + iyear][iday] = dtrvalue;
                }
            } // end loop over years
            let dtrrecord = structuredClone(record);
            dtrrecord.variable = "DTR";
            dtrrecord.key = dtrrecord.stationkey + "_DTR";
            if (dtrrecord.fromyear < 1950) dtrrecord.fromyear = 1950;
            if (dtrrecord.toyear > 2019) dtrrecord.toyear = 2019;
            dtrrecord.years = dtryears;
            // yeardata erzeugen aus years für dtrrecord;
            dtrrecord.yeardata = {};
            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                let yeardata = dtrrecord.years["" + iyear];
                if (typeof yeardata !== "undefined") {
                    let result = kli6900.getTrivial(dtrrecord.years["" + iyear], false, true);   // doround, korr)
                    result.year = "" + iyear;
                    dtrrecord.yeardata[result.year] = result;
                }
            }
            records.push(dtrrecord);
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
                        try {
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
                        } catch (err) { }
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
        addTopics,
        getCoreData
    };
}

$(document).on("click", ".helpinformation", function (evt) {
    evt.preventDefault();
    let topic = $(this).attr("topic");
    let pageid = $(this).attr("pageid");
    let mode = $(this).attr("mode");
    // mode - ist gegeben
    // help-mode: dialog, window, embedded
    if (mode === "mobile") {
        if ($("#" + pageid + "help").length > 0) {
            let target = document.getElementById(pageid + "help");
            /*
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });
            */
            kli6900.scrollTop(target);
            return;
        }
        if ($("#" + pageid + "chart").length > 0) {
            $("#" + pageid + "chart")
                .after($("<div/>", {
                    id: pageid + "help"
                }));
        } else {
            $("#" + pageid)
                .after($("<div/>", {
                    id: pageid + "help"
                }));

        }
        let $pagehelp = $("#" + pageid + "help");
        help.show(topic, "embedded", $pagehelp);
        let target = document.getElementById(pageid + "help");
        kli6900.scrollTop(target);
    } else if (mode === "desktop") {
        help.show(topic, "dialog");
    }

});

$(document).on("click", function (event) {
    if ($(event.target).closest(".article-menu").length === 0) {
        $(".article-menu[open]").prop("open", false);
    }
});

$(document).on("toggle", ".article-menu", function () {
    if (this.open) {
        $(".article-menu").not(this).prop("open", false);
    }
});

$(document).on("click", ".article-menu summary", function () {
    $(".article-menu").not($(this).parent()).prop("open", false);
});

export {
    createLocation
}