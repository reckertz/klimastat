/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000 = {};

    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "?";
    let cancelletter = "?"; // soll font-abhängig sein, also Vorsicht

    kli1000.show = async function (parms) {
        debugger;
        kli1000.initUI("kli1000", "Basis", "Analyse Standort und weitere");
        kli6900.putMessage("kli1000 Standort etc.", 1);
        let ret = await kli6900.getScriptA("kli1000A");
        console.log("kli1000A", ret.error, ret.message);
        let ret1 = await kli6900.getScriptA("kli1000B");
        console.log("kli1000B", ret1.error, ret1.message);
        await kli1000.initApp(parms);
    };

    kli1000.initApp = async function (parms) {

        let ghcnd = kli1000A.GHCNDservices();

        let localization = await kli1000.getLocalization();
        // sofort Rundschlag auf GEOJSON oder erst mal GHCND
        // Harmloser ist GHCND
        let ret = null;
        if (localization !== null) {
            // GHCND-Stationen im Umfeld suchen
            if (localization.source === "geolocation") {
                ret = await ghcnd.getGHCNDStationsByLocationTMAX(localization.latitude, localization.longitude, 50);
            } else if (localization.source === "ip") {
                ret = await ghcnd.getGHCNDStationsByLocationTMAX(localization.latitude, localization.longitude, 50);
            }
        }
        // Verdichten auf continent, alpha3 und countryname
        let countrycontrol = {};
        let countries = [];
        let alpha3s = [];
        for (let record of ret.records) {
            if (typeof countrycontrol[record.continent] === "undefined") {
                countrycontrol[record.continent] = {
                    countries: {}
                };
                if (typeof countrycontrol[record.continent].countries[record.alpha3] === "undefined") {
                    countrycontrol[record.continent].countries[record.alpha3] = record.countryname;
                }
                if (!countries.includes(record.countryname)) {
                    countries.push(record.countryname);
                }
                if (!alpha3s.includes(record.alpha3)) {
                    alpha3s.push(record.alpha3);
                }
            }
        }
        await kli1000.showMainButtons(parms, countrycontrol, countries, alpha3s, localization, ret.records);

        $(".kli1000matrix")
            .append($("<div/>", {
                class: "col col-11 kli1000projects",
                id: "kli1000projects",
            }));

        await kli1000.calculateAutoHeight("#kli1000projects");

        let maps = kli1000B.mapService();

        let containerid = "kli1000projects";

        // links navigation, rechts Arbeits- und Ergebnisbereich
        // ret.records hat die Staionen um localization, wenn localization nicht null ist
        let centerlocation = localization;
        let geopoints = ret.records;
        let imagetype = "natural";
        let { worldmap, worldmapid, layerControl } = await maps.showWorldMap(containerid, imagetype);
        await maps.addMarkerLayer("TMAX", localization, geopoints, {});
        // countrypolygons holen vom Server über alpha3s
        await maps.addCountryLayer(alpha3s);
        let toolbar = maps.createLeafletToolbar();
    };


    kli1000.calculateAutoHeight = async function (selector) {
        if (typeof selector === "undefined") {
            selector = '.overflow-auto';
        }
        requestAnimationFrame(async function () {
            const element = document.querySelector(selector);
            const viewportHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            element.style.maxHeight = `${viewportHeight - elementTop - 20}px`;
        });
    };

    kli1000.showMainButtons = async function (parms, countrycontrol, countries, alpha3s, localization, geopoints) {
        // kli1000commands als id und class sowie row
        let fromyear = 9999;
        let toyear = 0;
        for (let record of geopoints) {
            if (parseInt(record.fromyear) < fromyear) {
                fromyear = parseInt(record.fromyear);
            }
            if (parseInt(record.toyear) > toyear) {
                toyear = parseInt(record.toyear);
            }
        }
        parms.fromyear = fromyear;
        parms.toyear = toyear;
        // Eckjahr 1991
        parms.ranges = [];
        let thisyear = new Date().getFullYear();
        for (let i = 1841; i < thisyear; i += 30) {
            let fromyear = i;
            let toyear = fromyear + 29;
            if (i > parms.toyear) {
                continue;
            }
            if (i < parms.fromyear) {
                continue;
            }
            if (toyear > parms.toyear) {
                toyear = parms.toyear
            }
            if (fromyear < parms.toyear && toyear > parms.fromyear) {
                parms.ranges.push({
                    fromyear: fromyear,
                    toyear: toyear
                });
            }
        }
        console.log(parms.fromyear, parms.toyear);
        console.log(parms.ranges);
        for (let range of parms.ranges) {
            $("#kli1000commands")
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary kli1000selbtn kli1000selrange",
                    css: {
                        "margin-left": "5px"
                    },
                    html: "<span> " + cancelsign + "</span><span> " + range.fromyear + "-" + range.toyear + "</span>",
                    fromyear: range.fromyear,
                    toyear: range.toyear
                }));
        }
        $(document).on("click", ".kli1000selbtn", function (evt) {
            evt.preventDefault();
            let status = $(this).find("span").first().text();
            if (status === okletter) {
                $(this).find("span").first().html(cancelsign);
            } else {
                $(this).find("span").first().html(oksign);
            }
        });

        $("#kli1000commands")
            .append($("<button/>", {
                class: "btn btn-sm btn-primary kli1000selbtn",
                css: {
                    "margin-left": "5px"
                },
                html: "<span> " + cancelsign + "</span><span> Bubble-Charts</span>",
                click: async function (evt) {
                    evt.preventDefault();
                    $("#kli1000bubblewrapper").remove();
                    $(".klicontainer")
                        .append($("<div/>", {
                            class: "row",
                            id: "kli1000bubblewrapper"
                        }));
                    await kli1000.showBubbleStats("kli1000bubblewrapper", parms, countrycontrol, countries, alpha3s, localization, geopoints);
                    await kli1000.calculateAutoHeight("#kli1000matrix");
                }
            }));
    };

    kli1000.showBubbleStats = async function (wrapperid, parms, countrycontrol, countries, alpha3s, localization, geopoints) {
        // Kandidaten für die Auswertungen:
        // parms.fromyear = fromyear; parms.toyear = toyear(Eckjahr 1991); parms.ranges = [];
        // records mit source, stationid, variable, fromyear, toyear sowie
        // latitude, longitude, height, alpha3, countryname, climatezone?
        // uopp HYDE Bebauung, popd HYDE Bevölkerungsdichte
        // uopp_1850(FLOAT), popd_1850(FLOAT), uopp_1950(FLOAT), popd_1950(FLOAT),uopp_2019(FLOAT), popd_2019(FLOAT)
        // zind_1950AD, zind_2019AD (coded) Zivilisationsindex
        let records = geopoints;

        let datasets = [];
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
        let dataset = {
            label: "Daten",
            data: bubbledata,
            backgroundColor: "rgba(54, 162, 235, 0.35)",
            borderColor: "rgba(54, 162, 235, 0.8)",
            borderWidth: 1
        };
        datasets.push(dataset);
        let title = "height / latitude";
        let xlabel = "latitude";
        let ylabel = "height";
        let cbtitle = function (items) {
            if (!items.length) {
                return "";
            }
            const row = items[0].raw.raw;
            return row.stationid ?? "";
        };
        let cblabel = function (context) {
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
        };
        let chartid = await kli1000.showOneBubbleStat(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let newcanvasid = chartid + "l";
        let newgraph = Chart.getChart(newcanvasid);
        // hier postprocessing möglich, z.B. Buttons zufügen


    };


    kli1000.showOneBubbleStat = async function (wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel) {
        let containerid = "kli1000bubble" + (Math.floor(Math.random() * 1000000) + 1000000);
        let mh = $("#kli1000projects").height() * 0.5;
        debugger;
        $("#" + wrapperid)
            .append($("<div/>", {
                class: "col col-4 kli1000bubble",
                css: {
                    "min-height": mh + "px"
                },
                id: containerid
            }));
        const chartConfig = {
            type: "bubble",
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                parsing: false,
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
        let canvas = document.getElementById(containerid + "l");
        let ctx = canvas.getContext("2d");
        let chart = new Chart(ctx, chartConfig);
        //chart1.showBubbleChart(containerid, records, filterconfig, chartconfig) {   };
        return containerid;   // wrapper des Charts
    }

    kli1000.getLocalization = async function () {
        let localization = null;
        // lokation feststellen als Einstiegsoption
        if ("geolocation" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
            localization = await new Promise(function (resolve, reject) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    console.log(pos.coords);
                    resolve({
                        error: false,
                        message: "found",
                        source: "geolocation",
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    });
                },
                    function (err) {
                        let errmsg = "";
                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                console.log("Access to Location denied");
                                errmsg = "Access to Location denied";
                                break
                            case err.POSITION_UNAVAILABLE:
                                console.log("Location not available");
                                errmsg = "Location not available";
                                break;

                            case err.TIMEOUT:
                                console.log("Timeout");
                                errmsg = "Timeout";
                                break;
                        }
                        resolve({
                            error: true,
                            message: errmsg
                        });
                    }
                );
            });
        } else {
            console.log("navigator.geolocation.getCurrentPosition-API not available");
        }
        // fallback auf ip-Lokation
        if (localization === null || localization.error === true) {
            try {
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                localization = {
                    source: "ip",
                    latitude: data.latitude,
                    longitude: data.longitude,
                    accuracy: null,
                    city: data.city,
                    region: data.region,
                    country: data.country_code
                };
            } catch (err) {
                console.error("Auch IP-Geolocation fehlgeschlagen:", err);
            }
        }
        return localization;
    };

    kli1000.initUI = function (pageid, name, title) {

        kli6900.initUI();

        console.log(pageid + " - " + name + " " + title);

        if (document.title != pageid + " " + name) {
            document.title = pageid + " " + name;
        }
        $('meta[name="description"]').attr("content", pageid + " " + name + " " + title);
        //kla6900.init("online");
        $(".klimobile").remove();
        $("body").removeClass("overflow-hidden");
        $("body").addClass("overflow-hidden");
        $("body").css("height", "100vh");

        let navh = $("nav.header").height();
        //let scrh = screen.height;
        let scrh = $("body").height();
        let h = scrh - navh * 1.2;
        let scrollbarwidth = kli6900.getScrollbarWidth("body");
        let w = screen.width - scrollbarwidth * 1.5;
        /**
         * .klicontainer ist der Top-Container, 
         * dazu werden div mit row appended
         */
        if ($(".klicontainer").length <= 0) {
            $("body").append(
                $("<div/>", {
                    class: "container-fluid klicontainer overflow-auto",
                    id: "kli1000",
                    css: {
                        "background-color": "navyblue",
                        height: h,
                        // width: w + "px"
                    },
                })
                    .append($("<div/>", {
                        id: "kli1000commandwrapper",
                        class: "row kli1000commandwrapper", // Reserve, ununsed
                        css: {
                            width: + "px"
                        },
                    })
                        .append($("<div/>", {
                            id: "kli1000commands",
                            class: "col col-11 kli1000commands d-flex flex-wrap", // Reserve, ununsed
                            //css: {
                            //    width: w
                            //},
                        }))
                    )
                    .append($("<div/>", {
                        class: "row kli1000matrix ", // dynamischer Ausgabebereich, scrollIntoView
                        id: "kli1000matrix",
                        css: {
                            "background-color": "navyblue",
                            height: h,
                            width: w + "px"
                        },
                    }))
                    .append($("<div/>", {
                        css: {
                            "background-color": "mistyrose",
                            width: w + "px"
                        },
                        class: "row kli1000parms",
                    }))
            );
        }
        $(".klicontainer").attr("pageid", pageid);
    };



    // --- Weitere Modul-API ---
    kli1000.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000 = kli1000;
})(window);