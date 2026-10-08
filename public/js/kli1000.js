/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000 = {};

    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

    let maps = null;
    let mapid = "";
    let gblLayerControl = null;
    let localization = null;
    let geo = null;

    kli1000.show = async function (parms) {
        debugger;
        let config = kli6900.getCookie("config");
        if (config === null) {
            config = {};
            config.nocookie = false;
            kli6900.setCookie("config", JSON.stringify(config), {
                expires: 1000, // Tage
                SameSite: "Strict"
            });
        }
        kli1000.initUI("kli1000", "Basis", "Analyse Standort und weitere");
        kli6900.putMessage("kli1000 Standort etc.", 1);
        let ret = await kli6900.getScriptA("kli1000A");
        console.log("kli1000A", ret.error, ret.message);
        let ret1 = await kli6900.getScriptA("kli1000B");
        console.log("kli1000B", ret1.error, ret1.message);
        let ret2 = await kli6900.getScriptA("kli1000C");
        console.log("kli1000C", ret2.error, ret2.message);
        let ret3 = await kli6900.getScriptA("kli1000D");
        console.log("kli1000D", ret3.error, ret3.message);

        $("nav.navbar").find("button").last()
            .after(
                $("<button/>", {
                    class: "btn btn-primary",
                    style: "float: left; margin-left: 20px;",
                    title: "Neue Vorgabe für Bezugspunkt",
                    html: "Localization",
                    click: async function (evt) {
                        evt.preventDefault();
                        let ret = await kli1000.initLocalization(parms);
                    }
                }));

        $("nav.navbar").find("button").last()
            .after(
                $("<button/>", {
                    class: "btn btn-primary",
                    id: "kli1000app",
                    style: "float: left; margin-left: 20px;",
                    title: "Anzeige Worldmap mit Stationen gemäß Auswahlbuttons",
                    html: "Anwendung",
                    click: async function (evt) {
                        evt.preventDefault();
                        await kli1000.initApp(parms);
                    }
                }));

        $("nav.navbar").find("button").last()
            .after(
                $("<button/>", {
                    class: "btn btn-danger",
                    style: "float: left; margin-left: 20px;",
                    title: "Metadaten über table, source, variable",
                    html: "Test Meta",
                    click: async function (evt) {
                        evt.preventDefault();
                        $("#kli1000metawrapper").remove();
                        $(".klicontainer")
                            .append($("<div/>", {
                                class: "row",
                                id: "kli1000metawrapper"
                            }));
                        let meta = kli1000A.SQLservices();
                        meta.prepareVariableMetadata("kli1000metawrapper");
                        await kli1000.calculateAutoHeight("#kli1000matrix");
                        let elmnt = document.getElementById("kli1000metawrapper");
                        $(elmnt).css({
                            border: "3px solid blue"
                        });
                        elmnt.scrollIntoView();
                    }
                }));
    };

    kli1000.initLocalization = async function (parms) {
        let localization = kli6900.getCookie("localization");
        if (localization === null) {
            localization = {
                source: "dialog",
                locname: "",
                latitude: 0,
                longitude: 0,
                accuracy: null
            }
        }
        $("body")
            .append($("<dialog/>", {
                id: "kli1000locdialog"
            })
                .append($("<form/>", {
                    id: "kli1000locformwrapper",
                    method: "dialog"
                })
                    .append($("<h3/>", {
                        html: "localization"
                    }))
                    .append($("<div/>", {
                        id: "kli1000locform",
                        class: "form-grid"
                    }))
                    .append($("<hr/>"))
                    // <div class="button-area">
                    .append($("<div/>", {
                        class: "form-buttons"
                    })
                        .append($("<fieldset/>", {
                            id: "kli1000locbuttons"
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

        $("#kli1000locform").children().remove();
        $("#kli1000locbuttons").children().remove();
        $("#kli1000locliste").children().remove();

        $("#kli1000locform")
            .append($("<label/>", {
                for: "",
                html: "Orts- oder Stationsbezeichnung"
            }))
            .append($("<input/>", {
                id: "kli1000_city",
                type: "text",
                maxLength: 50,
                // required: "required",
                value: localization.locname
            }));

        $("#kli1000locform")
            .append($("<label/>", {
                for: "",
                html: "latitude",
                title: "Breitengrad, -90 bis +90"
            }))
            .append($("<input/>", {
                id: "kli1000_latitude",
                type: "number",
                min: -90,
                max: 90,
                step: 0.00001,
                value: localization.latitude
            }));

        $("#kli1000locform")
            .append($("<label/>", {
                for: "",
                html: "longitude",
                title: "Längengrad, -180 bis +180"
            }))
            .append($("<input/>", {
                id: "kli1000_longitude",
                type: "number",
                min: -180,
                max: 180,
                step: 0.00001,
                value: localization.longitude
            }));

        $("#kli1000locbuttons")
            .append($("<button/>", {
                class: "btn btn-sm btn-primary kli1000sel",
                basefield: "kli1000_city",
                target: "GEONAMES",
                html: "Ortssuche mit Bezeichnung"
            }));

        $("#kli1000locbuttons")
            .append($("<button/>", {
                class: "btn btn-sm btn-primary  kli1000sel",
                basefield: "kli1000_lat,kli1000_lon",
                target: "GEONAMES",
                html: "Ortssuche mit latitude/longitude"
            }));

        $("#kli1000locbuttons")
            .append($("<button/>", {
                class: "btn btn-sm btn-primary kli1000sel",
                basefield: "kli1000_city",
                target: "KLISTATIONS",
                html: "Stationssuche mit Bezeichnung"
            }));

        $("#kli1000locbuttons")
            .append($("<button/>", {
                class: "btn btn-sm btn-primary kli1000sel",
                basefield: "kli1000_lat,kli1000_lon",
                target: "KLISTATIONS",
                html: "Stationssuche mit latitude/longitude"
            }));

        $("#kli1000locbuttons")
            .append($("<button/>", {
                class: "btn btn-sm btn-danger",
                html: "Abbruch",
                click: function (evt) {
                    evt.preventDefault();
                    dialog.close();
                    $("#kli1000locdialog").remove();
                }
            }));

        $(document).on("click", "button.kli1000sel", async function (evt) {
            evt.preventDefault();
            let basefield = $(this).attr("basefield");
            let target = $(this).attr("target");
            await kli1000.showCandidates("kli1000locliste", basefield, target);
        });

        $(document).on("click", "li.kli1000candidate", function (evt) {
            evt.preventDefault();
            let table = $(this).attr("table");
            let locname = $(this).attr("locname");
            let latitude = $(this).attr("latitude");
            let longitude = $(this).attr("longitude");
            if (table === "GEONAMES") {
                // {"error":false,"message":"found","source":"geolocation","latitude":50.7851,"longitude":6.9324,"accuracy":1500}
                let localization = {
                    error: false,
                    message: "found",
                    source: "GEONAMES",
                    locname: locname,
                    latitude: latitude,
                    longitude: longitude,
                    accuracy: 1
                }
                kli6900.setCookie("localization", JSON.stringify(localization));
                dialog.close();
                $("#kli1000app").trigger("click");
                $("#kli1000locdialog").remove();
                return;
            } else if (table === "KLISTATIONS") {
                // {"error":false,"message":"found","source":"geolocation","latitude":50.7851,"longitude":6.9324,"accuracy":1500}
                let localization = {
                    error: false,
                    message: "found",
                    source: "KLISTATIONS",
                    locname: locname,
                    latitude: latitude,
                    longitude: longitude,
                    accuracy: 1
                }
                kli6900.setCookie("localization", JSON.stringify(localization));
                dialog.close();
                $("#kli1000app").trigger("click");
                $("#kli1000locdialog").remove();
                return;
            }
        });
        const dialog = document.getElementById("kli1000locdialog");
        const form = document.getElementById("kli1000locform");
        dialog.showModal();
    };

    kli1000.showKLISTATIONS = async function (ulid, basefield, target) {
        let ret = {};
        if (target === "KLISTATIONS") {
            let sql = "";
            sql += " SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
            sql += " KLISTATIONS.latitude, KLISTATIONS.longitude,";
            sql += " KLISTATIONS.countryname"
            sql += " FROM KLISTATIONS";
            sql += " WHERE source IN('GHCND','DWDD','ICOSCO2H')";
            if (basefield === "kli1000_city") {
                let such = $("#" + basefield).val();
                let frags = such.split(" ");
                if (frags.length > 0) {
                    let ands = [];
                    for (let frag of frags) {
                        ands.push(" lower(KLISTATIONS.stationname) LIKE '%" + frag + "%'");
                    }
                    sql += " AND " + ands.join(" AND ");
                } else {
                    sql += " AND lower(KLISTATIONS.stationname) LIKE('" + frags[0] + "%'";
                }
            } else {
                // hier kli1000_latitude und kli1000_longitude
                //basefield: "kli1000_lat,kli1000_lon",
                let sellatitude = $("#kli1000_latitude").val();
                let sellongitude = $("#kli1000_longitude").val();
                let distance = 50;
                let coords = kli6900.lincoordinates(sellatitude, sellongitude, distance);
                if (coords.error === true) {
                    // und raus - später
                    ret.error = true;
                    ret.message += " Lokation nicht möglich";
                    return;
                }

                let latN = parseFloat(coords.latN);
                let latS = parseFloat(coords.latS);
                let lonW = parseFloat(coords.lonW);
                let lonE = parseFloat(coords.lonE);

                let where1 = "";
                if (latN > latS) {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(latitude as DECIMAL(4,5)) <= " + latN;
                    where1 += " AND CAST(latitude as DECIMAL(4,5)) >= " + latS;
                } else {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(latitude as DECIMAL(4,5)) >= " + latN;
                    where1 += " AND CAST(latitude as DECIMAL(4,5)) <= " + latS;
                }
                if (lonW > lonE) {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(longitude as DECIMAL(4,5)) <= " + lonW;
                    where1 += " AND CAST(longitude as DECIMAL(4,5)) >= " + lonE;
                } else {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(longitude as DECIMAL(4,5)) >= " + lonW;
                    where1 += " AND CAST(longitude as DECIMAL(4,5)) <= " + lonE;
                }
                sql += " AND " + where1;
            }
            sql += " ORDER BY source, stationid";  // GEONAMES.geonameid";
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
            let perf = kli6900.getPerformance(startTime);
            if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
                Array.isArray(ret1.records)) {
                if (basefield === "kli1000_lat,kli1000_lon") {
                    // Berechnung der Distanz zu sellatitude und sellongitude
                    let sellatitude = $("#kli1000_latitude").val();
                    let sellongitude = $("#kli1000_longitude").val();
                    let lat1 = parseFloat(sellatitude);
                    let lon1 = parseFloat(sellongitude);
                    for (let record of ret1.records) {
                        let lat2 = record.latitude;
                        let lon2 = record.longitude;
                        let distance = kli6900.lindistance(lat1, lon1, lat2, lon2);
                        record.distance = distance;
                    }
                    ret1.records = ret1.records.sort(function (a, b) {
                        if (a.distance > b.distance) {
                            return 1;
                        } else if (a.distance < b.distance) {
                            return - 1;
                        } else if (a.name > b.name) {
                            return 1;
                        } else if (a.name < b.name) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
                let icountry = 0;
                kli6900.putMessage("Treffer: " + ret1.records.length + " in: " + perf);
                $("#" + ulid).children().remove();
                for (let record of ret1.records) {
                    let t = record.distance;
                    if (typeof t === "undefined" || t === null) {
                        t = "";
                    } else {
                        t += " km"
                    }
                    $("#" + ulid)
                        .append($("<li/>", {
                            class: "kli1000candidate",
                            table: "KLISTATIONS",
                            source: record.source,
                            stationid: record.stationid,
                            locname: record.stationname,
                            latitude: record.latitude,
                            longitude: record.longitude,
                            html: record.stationname + " (" + record.countryname + ", " + record.source + ") " + t
                        }));
                }
            }
        }
    };

    kli1000.showCandidates = async function (ulid, basefield, target) {
        let ret = {};
        if (target !== "GEONAMES") {
            kli1000.showKLISTATIONS(ulid, basefield, target);
        } else {
            let sql = "";
            sql += " SELECT GEONAMES.geonameid, GEONAMES.name, GEONAMES.latitude, GEONAMES.longitude,";
            sql += " GEONAMES.admin1_code,";
            sql += " GEONAMES.country_code, KLICOUNTRYCODES.name as country,";
            sql += " KLISTATES.statename"
            sql += " FROM GEONAMES";
            sql += " LEFT JOIN KLICOUNTRYCODES";
            sql += " ON GEONAMES.country_code = KLICOUNTRYCODES.alpha2";
            sql += " LEFT JOIN KLISTATES";
            sql += " ON GEONAMES.country_code || '.' || GEONAMES.admin1_code = KLISTATES.statekey";
            if (basefield === "kli1000_city") {
                let such = $("#" + basefield).val();
                let frags = such.split(" ");
                if (frags.length > 0) {
                    let ands = [];
                    for (let frag of frags) {
                        ands.push(" lower(GEONAMES.name) LIKE '%" + frag + "%'");
                    }
                    sql += " WHERE " + ands.join(" AND ");
                } else {
                    sql += " WHERE lower(GEONAMES.name) LIKE('" + frags[0] + "%'";
                }
            } else {
                // hier kli1000_latitude und kli1000_longitude
                //basefield: "kli1000_lat,kli1000_lon",
                let sellatitude = $("#kli1000_latitude").val();
                let sellongitude = $("#kli1000_longitude").val();
                let distance = 50;
                let coords = kli6900.lincoordinates(sellatitude, sellongitude, distance);
                if (coords.error === true) {
                    // und raus - später
                    ret.error = true;
                    ret.message += " Lokation nicht möglich";
                    return;
                }

                let latN = parseFloat(coords.latN);
                let latS = parseFloat(coords.latS);
                let lonW = parseFloat(coords.lonW);
                let lonE = parseFloat(coords.lonE);

                let where1 = "";
                if (latN > latS) {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(latitude as DECIMAL(4,5)) <= " + latN;
                    where1 += " AND CAST(latitude as DECIMAL(4,5)) >= " + latS;
                } else {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(latitude as DECIMAL(4,5)) >= " + latN;
                    where1 += " AND CAST(latitude as DECIMAL(4,5)) <= " + latS;
                }
                if (lonW > lonE) {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(longitude as DECIMAL(4,5)) <= " + lonW;
                    where1 += " AND CAST(longitude as DECIMAL(4,5)) >= " + lonE;
                } else {
                    if (where1.length > 0) where1 += " AND ";
                    where1 += " CAST(longitude as DECIMAL(4,5)) >= " + lonW;
                    where1 += " AND CAST(longitude as DECIMAL(4,5)) <= " + lonE;
                }
                sql += " WHERE " + where1;
            }
            sql += " ORDER BY GEONAMES.name";  // GEONAMES.geonameid";
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
            let perf = kli6900.getPerformance(startTime);
            if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
                Array.isArray(ret1.records)) {
                if (basefield === "kli1000_lat,kli1000_lon") {
                    // Berechnung der Distanz zu sellatitude und sellongitude
                    let sellatitude = $("#kli1000_latitude").val();
                    let sellongitude = $("#kli1000_longitude").val();
                    let lat1 = parseFloat(sellatitude);
                    let lon1 = parseFloat(sellongitude);
                    for (let record of ret1.records) {
                        let lat2 = record.latitude;
                        let lon2 = record.longitude;
                        let distance = kli6900.lindistance(lat1, lon1, lat2, lon2);
                        record.distance = distance;
                    }
                    ret1.records = ret1.records.sort(function (a, b) {
                        if (a.distance > b.distance) {
                            return 1;
                        } else if (a.distance < b.distance) {
                            return - 1;
                        } else if (a.name > b.name) {
                            return 1;
                        } else if (a.name < b.name) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                }
                let icountry = 0;
                kli6900.putMessage("Treffer: " + ret1.records.length + " in: " + perf);
                $("#" + ulid).children().remove();
                for (let record of ret1.records) {
                    let t = record.distance;
                    if (typeof t === "undefined" || t === null) {
                        t = "";
                    } else {
                        t += " km";
                    }
                    $("#" + ulid)
                        .append($("<li/>", {
                            class: "kli1000candidate",
                            table: "GEONAMES",
                            source: "GEONAMES",
                            geonameid: record.geonameid,
                            locname: record.name,
                            latitude: record.latitude,
                            longitude: record.longitude,
                            html: record.name + " (" + record.country + ") " + t
                        }));
                }
            }
        }
    };

    /**
     * eigentliche Anwendung
     */
    kli1000.initApp = async function (parms) {
        $("#kli1000commands").children().remove();
        $(".kli1000matrix").children().remove();

        let lcookie = kli6900.getCookie("localization");
        if (lcookie !== null) {
            localization = lcookie;
        } else {
            localization = await kli1000.getLocalization();
        }
        console.log("localization", localization);
        kli6900.setCookie("localization", JSON.stringify(localization));

        let metadata = kli1000A.getMeta();
        parms.metadata = metadata;
        await kli1000.showMainButtons(parms);  //  ret.records);

        $(".kli1000matrix")
            .append($("<div/>", {
                class: "col col-11 kli1000projects",
                id: "kli1000projects",
            }));

        let h = $("#kli1000projects").parent().height();
        $("#kli1000projects").height(h + "px");

        await kli1000.calculateAutoHeight("#kli1000projects");

        maps = kli1000B.mapService();

        let containerid = "kli1000projects";

        // links navigation, rechts Arbeits- und Ergebnisbereich
        // ret.records hat die Staionen um localization, wenn localization nicht null ist
        let centerlocation = localization;

        let imagetype = "natural";
        let { worldmap, worldmapid, layerControl } = await maps.showWorldMap(containerid, imagetype);
        let toolbar0 = maps.createLeafletToolbar();


        $("button.kli1000selrange[varname=range][fromyear=1961]").find("span").first().html(oksign);
        $("button.kli1000selrange[varname=range][fromyear=1991]").find("span").first().html(oksign);
        $("button.kli1000selcategory[varname=category][varvalue=Temperature]").find("span").first().html(oksign);
        let locsource = localization.source;
        let targetsource = "GHCND";
        if (typeof locsource === "string") {
            if (locsource === "geolocation") {
                targetsource = "GHCND";
            } else if (locsource === "ip") {
                targetsource = "GHCND";
            } else if (locsource === "GEONAMES") {
                targetsource = "GHCND";
            } else {
                targetsource = locsource;
            }
        }
        $("button.kli1000kli1000selsource[varname=source][varvalue=" + targetsource + "]").find("span").first().html(oksign);
        await kli1000.updateLayers();
    };


    /**
     * kli1000.updateLayers - Buttons abfragen und countrypolygons für countrylayer bereitstellen
     * sowie für stationlayer
     */
    kli1000.updateLayers = async function () {
        let selparms = {};
        // Feststellen neuer Layer als source-Vorgabe
        let sourcebuttons = $("button.kli1000selsource").toArray();
        selparms.source = [];
        selparms.savesource = [];
        for (let button of sourcebuttons) {
            let status = $(button).find("span").first().text();
            if (status === okletter) {
                let thissource = $(button).attr("varvalue");
                selparms.source.push(thissource);
                selparms.savesource.push(thissource);
            }
        }
        let { worldmap, worldmapid, layerControl } = maps.getWorldmap();
        worldmap.eachLayer(function (layer) {
            if (layer.custom?.type === "stationlayer") {
                let layername = layer.custom.layername;
                let index = selparms.source.indexOf(layername);
                if (index >= 0) {
                    selparms.source.splice(index, 1);
                }
            }
        });

        if (selparms.source.length === 0) {
            return;
        } else {
            console.log("______________________________");
            console.log("new:", selparms.source);
        }

        if (geo === null) {
            let radiusKm = 50;
            geo = kli6900.lincoordinates(parseFloat(localization.latitude), parseFloat(localization.longitude), radiusKm);
        }

        selparms.fromyear = 9999;
        selparms.toyear = 0;
        let buttons = $("button.kli1000selbtn").toArray();
        for (let button of buttons) {
            let status = $(button).find("span").first().text();
            if (status !== okletter) {
                continue;
            }
            let varname = $(button).attr("varname");
            let varvalue = $(button).attr("varvalue");
            if (varname === "range") {
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
            } else if (varname === "category") {
                if (typeof selparms[varname] === "undefined") {
                    selparms[varname] = [];
                }
                selparms[varname].push(varvalue);
            }
        }
        // prepare for SQL-Generation
        // Zwischenschritt category-Aufbereitung => variables
        let categorycontrol = {};
        //let tables = [];
        let table = "";
        // varmeta
        let metadata = kli1000A.getMeta();
        for (let meta of metadata.varmeta) {
            let category = meta.category;
            //let table = meta.table;
            let variable = meta.variable;
            if (selparms.source.includes(meta.source) && selparms.category.includes(meta.category)) {
                let source = meta.source;
                if (typeof categorycontrol[source] === "undefined") {
                    categorycontrol[source] = {}
                    table = meta.table;
                    // if (!tables.includes(meta.table)) {
                    //     tables.push(meta.table)
                    // }
                }
                if (typeof categorycontrol[source][category] === "undefined") {
                    categorycontrol[source][category] = {
                        category: category,
                        table: table,
                        source: source,
                        variables: []
                    }
                }
                categorycontrol[source][category].variables.push(variable);
            }
        }
        /**
         * selparms.source [] - Vorgaben toplevel, erzeugt neue Layer - Loop-Steuerung
         * selparms.fromyear und selparms.toyear - Vorgaben für range-Prüfung
         * categorycontrol[source][category].variables [] - schon kompliziert für SUM etc.
         */
        console.log("***********************");
        console.log(selparms);
        console.log(categorycontrol);

        for (let source of selparms.source) {

            let sql = kli1000A.buildSQLfromButtons(localization, geo, source, selparms, categorycontrol);
            if (typeof sql === "undefined" || sql === null || sql === "") {
                kli6900.putMessage("no SQL build, check categories and ranges", 3);
                continue;
            }
            //let ghcnd = kli1000A.GHCNDservices();
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
            }

            let geopoints = ret.records;

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
            //parms.metadata = metadata;
            await maps.addMarkerLayer("stationlayer", source, localization, geopoints, {});
            // countrypolygons holen vom Server über alpha3s
            await maps.addCountryLayer(alpha3s);
        }
        // event für Änderungen in leaflet.control - reines Template ohne Funktion
        worldmap.on("overlayadd overlayremove", async function (e) {
            const visible = worldmap.hasLayer(e.layer);
            // console.log("Layer:", e.name);
            // e.layer hat custom mit layername als source und type=markerlayer
            // console.log("sichtbar:", visible);
            // console.log("Layerobjekt:", e.layer);
            //updateSomething(e.layer, visible);
            // es muss der button selbtn mit varname und varvalue 
            // im Status entsprechend aktualisiert werden
            // ohne dass dort ein event ausgelöst wird
            let varname = "source";
            let varvalue = e.layer.custom.layername;
            /*
            let button = $("button.kli1000selbtn[varname=" + varname + "][varvalue=" + varvalue + "]");
            if (visible === true) {
                $(button).find("span").first().html(oksign);
            } else {
                $(button).find("span").first().html(cancelsign);
            }
            */
            //let buttons = $("button.kli1000selbtn").toArray();
            //await kli1000.updateWorldmap(visible, varname, varvalue, buttons);
        });
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

    kli1000.showMainButtons = async function (parms, /*countrycontrol, countries, alpha3s, localization,*/ geopoints) {
        // kli1000commands als id und class sowie row
        // parms.metadata.sourcemeta und .varmeta
        $("#kli1000commands").children().remove();
        let thisyear = new Date().getFullYear();
        let fromyear = 9999;
        let toyear = 0;
        if (typeof geopoints !== "undefined" && Array.isArray(geopoints)) {
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
        } else {
            parms.fromyear = 1841;
            parms.toyear = thisyear;
        }
        // Eckjahr 1991
        parms.ranges = [];
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
                        "margin-bottom": "3px",
                        "margin-left": "5px"
                    },
                    html: "<span> " + cancelsign + "</span><span> " + range.fromyear + "-" + range.toyear + "</span>",
                    varname: "range",
                    fromyear: range.fromyear,
                    toyear: range.toyear
                }));
        }

        $("#kli1000commands")
            .append($("<button/>", {
                class: "btn btn-sm btn-secondary kli1000selbtn kli1000selprecision",
                css: {
                    "margin-bottom": "3px",
                    "margin-left": "5px"
                },
                html: "<span> " + oksign + "</span><span> sharp</span>",
                title: "sharp - full coverage of range or only partial coverage of range"
            }));

        let categories = ["Temperature", "Niederschlag", "Wind", "Sonne", "other"];
        for (let vardata of parms.metadata.varmeta) {
            let category = vardata.category;
            if (!categories.includes(category)) {
                categories.push(category)
            }
        }

        for (let category of categories) {
            $("#kli1000commands")
                .append($("<button/>", {
                    class: "btn btn-sm btn-primary kli1000selbtn kli1000selcategory",
                    css: {
                        "margin-bottom": "3px",
                        "margin-left": "5px"
                    },
                    html: "<span> " + cancelsign + "</span><span> " + category + "</span>",
                    varname: "category",
                    varvalue: category
                }));
        }


        let sources = Object.keys(parms.metadata.sourcemeta);
        for (let source of sources) {
            $("#kli1000commands")
                .append($("<button/>", {
                    class: "btn btn-sm btn-success kli1000selbtn kli1000selsource",
                    css: {
                        "margin-bottom": "3px",
                        "margin-left": "5px"
                    },
                    html: "<span> " + cancelsign + "</span><span> " + parms.metadata.sourcemeta[source] + "</span>",
                    varname: "source",
                    varvalue: source
                }));
        }

        // Defaults setzen
        $("button.kli1000selbtn[varname=category][varvalue=Temperature]").find("span").first().html(oksign);
        let sourcedefaultbutton = $("button.kli1000selbtn[varname=source][varvalue=GHCND]");
        $(sourcedefaultbutton).find("span").first().html(oksign);
        $(sourcedefaultbutton).prop("disabled", true);
        $(sourcedefaultbutton).removeClass("btn-success");
        $(sourcedefaultbutton).addClass("btn-secondary");

        $(document).on("click", ".kli1000selbtn", async function (evt) {
            evt.preventDefault();
            let status = $(this).find("span").first().text();
            let varname = $(this).attr("varname");
            let varvalue = $(this).attr("varvalue");

            if (status === okletter) {
                $(this).find("span").first().html(cancelsign);
                status = $(this).find("span").first().text();
                if (varname === "source") {
                    //return;
                }
            } else {
                $(this).find("span").first().html(oksign);
                status = $(this).find("span").first().text();
                if (varname === "source") {
                    $(this).prop("disabled", true);
                    $(this).removeClass("btn-success");
                    $(this).addClass("btn-secondary");

                    //await kli1000.addStationLayer(status, varname, varvalue, buttons);
                    //return;
                }
            }
            await kli1000.updateLayers();
        });

        $("#kli1000commands")
            .append($("<button/>", {
                class: "btn btn-sm btn-warning",
                css: {
                    "margin-bottom": "3px",
                    "margin-left": "5px"
                },
                html: "Bubble-Charts",
                title: "Auswertung statischer Attribute der Stationen",
                click: async function (evt) {
                    evt.preventDefault();
                    $("#kli1000bubblewrapper").remove();
                    $(".klicontainer")
                        .append($("<div/>", {
                            class: "row",
                            id: "kli1000bubblewrapper"
                        }));
                    // für alle sichtbaren layer, nicht nur für einen Layer
                    let { worldmap, worldmapid, layerControl } = maps.getWorldmap();
                    let worldlayers = [];
                    worldmap.eachLayer(function (layer) {
                        if (layer.custom?.type === "stationlayer") {
                            worldlayers.push(layer);
                        }
                    });
                    for (let layer of worldlayers) {
                        if (layer.custom?.type === "stationlayer") {
                            let layername = layer.custom.layername;
                            let geopoints = [];
                            debugger;
                            const markers = layer.getLayers();
                            for (const marker of markers) {
                                if (typeof marker.options.custom !== "undefined") {
                                    geopoints.push(marker.options.custom);
                                }
                            }
                            await kli1000.showBubbleHeightLat("kli1000bubblewrapper", geopoints, layername);
                            await kli1000.showBubblePopdUopp("kli1000bubblewrapper", geopoints, layername);
                            await kli1000.showBubblePopdZind("kli1000bubblewrapper", geopoints, layername);
                            debugger;  // xxxxx
                        }
                    }
                    await kli1000.calculateAutoHeight("#kli1000matrix");
                    let elmnt = document.getElementById("kli1000bubblewrapper");
                    $(elmnt).css({
                        border: "3px solid blue"
                    });
                    elmnt.scrollIntoView();
                }
            }));


        $("#kli1000commands")
            .append($("<button/>", {
                class: "btn btn-sm btn-warning",
                css: {
                    "margin-bottom": "3px",
                    "margin-left": "5px"
                },
                html: "Data-Charts",
                title: "Auswertung Jahres- und Periodendaten mit Bubble-Charts",
                click: async function (evt) {
                    evt.preventDefault();
                    $("#kli1000databubblewrapper").remove();
                    $(".klicontainer")
                        .append($("<div/>", {
                            class: "row",
                            id: "kli1000databubblewrapper"
                        }));
                    // für alle sichtbaren layer, nicht nur für einen Layer
                    let { worldmap, worldmapid, layerControl } = maps.getWorldmap();
                    let layercontrol = {};
                    let worldlayers = [];
                    worldmap.eachLayer(function (layer) {
                        if (layer.custom?.type === "stationlayer") {
                            worldlayers.push(layer);
                        }
                    });
                    for (let layer of worldlayers) {
                        if (layer.custom?.type === "stationlayer") {
                            let layername = layer.custom.layername;
                            let geopoints = [];
                            const markers = layer.getLayers();
                            for (const marker of markers) {
                                if (typeof marker.options.custom !== "undefined") {
                                    geopoints.push(marker.options.custom);
                                }
                            }
                            layercontrol[layername] = {
                                table: "",
                                source: layername,
                                geopoints: geopoints
                            };
                        }
                    }
                    //"kli1000databubblewrapper"
                    let metadata = kli1000A.getMeta();
                    for (let meta of metadata.varmeta) {
                        let layername = meta.source;
                        if (typeof layercontrol[layername] !== "undefined" && layercontrol[layername].table === "") {
                            layercontrol[layername].table = meta.table;
                        }
                    }
                    let selparms = {};
                    selparms.fromyear = 9999;
                    selparms.toyear = 0;
                    let buttons = $("button.kli1000selbtn").toArray();
                    for (let button of buttons) {
                        let status = $(button).find("span").first().text();
                        if (status !== okletter) {
                            continue;
                        }
                        let varname = $(button).attr("varname");
                        let varvalue = $(button).attr("varvalue");
                        if (varname === "range") {
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
                        } else if (varname === "category") {
                            if (typeof selparms[varname] === "undefined") {
                                selparms[varname] = [];
                            }
                            selparms[varname].push(varvalue);
                        }
                    }
                    let bubbles = kli1000D.createBubbleChart();  // factory
                    for (let source of Object.keys(layercontrol)) {
                        let wrapperid = "kli1000databubblewrapper";
                        let layerdata = layercontrol[source];
                        let title = source + " " + "Temperature";
                        let xlabel = "Celsius";
                        let ylabel = "Celsius";
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
                        await bubbles.showOneBubbleChart(wrapperid, layerdata, selparms, title, xlabel, ylabel, cbtitle, cblabel);
                    }

                    debugger;

                    await kli1000.calculateAutoHeight("#kli1000matrix");
                    let elmnt = document.getElementById("kli1000databubblewrapper");
                    $(elmnt).css({
                        border: "3px solid red"
                    });
                    elmnt.scrollIntoView();
                }
            }));


        $("#kli1000commands")
            .append($("<button/>", {
                class: "btn btn-sm btn-danger",
                css: {
                    "margin-bottom": "3px",
                    "margin-left": "5px"
                },
                html: "Variable-Metadata",
                click: async function (evt) {
                    evt.preventDefault();
                    $("#kli1000metawrapper").remove();
                    $(".klicontainer")
                        .append($("<div/>", {
                            class: "row",
                            id: "kli1000metawrapper"
                        }));

                    let meta = kli1000A.SQLservices();
                    meta.prepareVariableMetadata("kli1000metawrapper");

                    await kli1000.calculateAutoHeight("#kli1000matrix");
                    let elmnt = document.getElementById("kli1000metawrapper");
                    $(elmnt).css({
                        border: "3px solid blue"
                    });
                    elmnt.scrollIntoView();
                }
            }));
    };


    kli1000.showBubbleHeightLat = async function (wrapperid, geopoints, layername) {
        // Kandidaten für die Auswertungen:
        // parms.fromyear = fromyear; parms.toyear = toyear(Eckjahr 1991); parms.ranges = [];
        // records mit source, stationid, variable, fromyear, toyear sowie
        // latitude, longitude, height, alpha3, countryname, climatezone?
        // uopp HYDE Bebauung, popd HYDE Bevölkerungsdichte
        // uopp_1850(FLOAT), popd_1850(FLOAT), uopp_1950(FLOAT), popd_1950(FLOAT),uopp_2019(FLOAT), popd_2019(FLOAT)
        // zind_1950AD, zind_2019AD (coded) Zivilisationsindex
        let records = geopoints;
        /**
         * height / latitude
         */
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
        let title = layername + " : height / latitude";
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
        //let chartid = await kli1000.showOneBubbleStat(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let bubbles = kli1000C.createBubbleChart();
        let chartid = await bubbles.showOneBubbleChart(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let newcanvasid = chartid + "l";
        let newgraph = Chart.getChart(newcanvasid);
        // hier postprocessing möglich, z.B. Buttons zufügen
    }

    kli1000.showBubblePopdUopp = async function (wrapperid, geopoints, layername) {
        /**
         * popd / uopp genauer popd_1950 und popd2019
         */
        let datasets = [];
        let bubbledata = {
            "1950": [],
            "2019": []
        };

        for (let record of geopoints) {
            for (let year of ["1950", "2019"]) {
                let bubble = {
                    x: parseFloat(record["uopp_" + year]),
                    y: parseFloat(record["popd_" + year]),
                    r: 3,
                    raw: {
                        source: record.source,
                        stationid: record.stationid,
                        stationname: record.stationname,
                        year: year
                    }
                };
                if (bubble.y >= 6000) {
                    console.log(bubble);
                }
                bubbledata[year].push(bubble);
            }
        }

        let dataset1950 = {
            label: "Daten 1950",
            type: "bubble",
            data: bubbledata["1950"],
            backgroundColor: "rgba(54, 162, 235, 0.35)",
            borderColor: "rgba(54, 162, 235, 0.8)",
            borderWidth: 1
        };
        datasets.push(dataset1950);

        let dataset2019 = {
            label: "Daten 2019",
            type: "bubble",
            data: bubbledata["2019"],
            backgroundColor: "rgba(255, 0, 0, 0.35)",
            borderColor: "rgba(255, 0, 0, 0.8)",
            borderWidth: 1
        };
        datasets.push(dataset2019);

        let title = layername + " : uopp / popd";
        let xlabel = "artefacts";
        let ylabel = "population";
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
                //"stationid: " + row.stationid,
                "name: " + row.stationname
                //"Temperatur: " + point.x + " °C",
                //"CO₂: " + point.y + " ppm",
                //"Land: " + (row.country ?? ""),
                //"Höhe: " + (row.altitude ?? "") + " m",
                //"Wind: " + (row.windSpeed ?? "") + " m/s"
            ];
        };
        //let chartid = await kli1000.showOneBubbleStat(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let bubbles = kli1000C.createBubbleChart();
        let chartid = await bubbles.showOneBubbleChart(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let newcanvasid = chartid + "l";
        let newgraph = Chart.getChart(newcanvasid);

        requestAnimationFrame(async function () {
            // hier postprocessing möglich, z.B. Buttons zufügen
            await bubbles.addBubbleLineButton(chartid, newcanvasid);
        });
        /*   Template Code
        $(ccontainer).prepend($("<div/>", {
            class: "chart-toolbar",
            html: `
            <button data-action="table">▦</button>
            <button data-action="filter">⚙</button>
            <button data-action="copy">⧉</button>
            <button data-action="reset">↺</button>
        `
        }));
        */
    };


    kli1000.showBubblePopdZind = async function (wrapperid, geopoints, layername) {
        /**
         * popd / zind genauer popd_1950 und popd2019 gegen zind_1950AD und zind_2019AD
         * zind wird "untercodiert" von 1 bis n, da sonst die x-Skala nicht passt
         */
        let datasets = [];
        let bubbledata = {
            "1950": [],
            "2019": []
        };

        for (let record of geopoints) {
            for (let year of ["1950", "2019"]) {
                let bubble = {
                    x: parseFloat(record["zind_" + year + "AD"]),
                    y: parseFloat(record["popd_" + year]),
                    r: 3,
                    raw: {
                        source: record.source,
                        stationid: record.stationid,
                        stationname: record.stationname,
                        year: year
                    }
                };
                if (bubble.y >= 6000) {
                    console.log(bubble);
                }
                bubbledata[year].push(bubble);
            }
        }

        let dataset1950 = {
            label: "Daten 1950",
            type: "bubble",
            data: bubbledata["1950"],
            backgroundColor: "rgba(54, 162, 235, 0.35)",
            borderColor: "rgba(54, 162, 235, 0.8)",
            borderWidth: 1
        };
        datasets.push(dataset1950);

        let dataset2019 = {
            label: "Daten 2019",
            type: "bubble",
            data: bubbledata["2019"],
            backgroundColor: "rgba(255, 0, 0, 0.35)",
            borderColor: "rgba(255, 0, 0, 0.8)",
            borderWidth: 1
        };
        datasets.push(dataset2019);

        let title = layername + " : zind / popd";
        let xlabel = "land use";
        let ylabel = "population";
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
                //"stationid: " + row.stationid,
                "name: " + row.stationname,
                "zind: " + point.x + " " + kli6901.getZindText(point.x).text
                //"Temperatur: " + point.x + " °C",
                //"CO₂: " + point.y + " ppm",
                //"Land: " + (row.country ?? ""),
                //"Höhe: " + (row.altitude ?? "") + " m",
                //"Wind: " + (row.windSpeed ?? "") + " m/s"
            ];
        };
        let bubbles = kli1000C.createBubbleChart();
        let chartid = await bubbles.showOneBubbleChart(wrapperid, datasets, title, xlabel, ylabel, cbtitle, cblabel);
        let newcanvasid = chartid + "l";
        let newgraph = Chart.getChart(newcanvasid);

        let zinddata = kli6901.getAnthromesRAW();
        let zindlabels = [];
        for (let adata of zinddata) {
            let [zind, text, r, g, b] = adata.split(";");
            if (zind !== "Code") {
                zindlabels.push("" + zind);
            }
        }
        newgraph.options.scales.x = {
            type: 'category',
            labels: zindlabels
        };
        newgraph.update("none");
        requestAnimationFrame(async function () {
            // hier postprocessing möglich, z.B. Buttons zufügen
            await bubbles.addBubbleLineButton(chartid, newcanvasid);
        });
    };

    kli1000.getLocalization = async function () {
        localization = null;
        // lokation feststellen als Einstiegsoption
        if ("geolocation" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
            localization = await new Promise(function (resolve, reject) {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    console.log(pos.coords);
                    resolve({
                        error: false,
                        message: "found",
                        source: "geolocation",
                        locname: "unknown",
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
                    locname: data.city + " " + data.region + " " + data.country_code,
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