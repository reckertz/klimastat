//kli2000.js

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
}

const places = [
    "Bonn",
    "Bornheim",
    "Köln"
];
// für startStatistics
const oldtopics = [
    "Temperatur",
    "Niederschlag",
    "Tagesmaximum",
    "Tagesminimum",
    "Hitzetage",
    "Frosttage",
    "Tropennächte",
    "Starkregen",
    "Schneehöhe",
    "Klimatrend"
];

//let parms = [title, datasource, variable, method, altmethod1, altmethod2, hydevar]
let topics = [
    ["Zeitreihe", "yeardata", "TMAX", "avg", "max", "min"],
    ["Zeitreihe", "yeardata", "TMIN", "avg", "min", "max"],
    ["Zeitreihe", "yeardata", "PRCP", "kum", "", ""],
    ["Zeitreihe", "yeardata", "SNOW", "kum", "", ""],
    ["Zeitreihe", "yeardata", "SNWD", "kum", "", ""],

    ["Trendanalyse", "yeardata", "TMAX", "avg_reg", "", ""],
    ["Trendanalyse", "yeardata", "TMIN", "avg_reg", "", ""],
    ["Trendanalyse", "yeardata", "PRCP", "kum_reg", "", ""],
    ["Trendanalyse", "yeardata", "SNOW", "kum_reg", "", ""],
    ["Trendanalyse", "yeardata", "SNWD", "kum_reg", "", ""],

    ["Höhenanalyse", "yeardata", "TMAX", "avg", "min", "max", "height"],
    ["Höhenanalyse", "yeardata", "TMIN", "avg", "min", "max", "height"],
    ["Höhenanalyse", "yeardata", "PRCP", "kum", "", "", "height"],
    ["Höhenanalyse", "yeardata", "SNOW", "kum", "", "", "height"],

    ["Bevölkerung", "yeardata", "TMAX", "avg_reg", "", "", "popd"],
    ["Bevölkerung", "yeardata", "TMIN", "avg_reg", "", "", "popd"],
    ["Bevölkerung", "yeardata", "PRCP", "kum_reg", "", "", "popd"],
    ["Bevölkerung", "yeardata", "SNOW", "kum_reg", "", "", "popd"],

    ["Bebauung", "yeardata", "TMAX", "avg_reg", "", "", "uopp"],
    ["Bebauung", "yeardata", "TMIN", "avg_reg", "", "", "uopp"],
    ["Bebauung", "yeardata", "PRCP", "kum_reg", "", "", "uopp"],
    ["Bebauung", "yeardata", "SNOW", "kum_reg", "", "", "uopp"],

    ["Urbanisierung", "yeardata", "TMAX", "avg_reg", "", "", "zind"],
    ["Urbanisierung", "yeardata", "TMIN", "avg_reg", "", "", "zind"],
    ["Urbanisierung", "yeardata", "PRCP", "kum_reg", "", "", "zind"],
    ["Urbanisierung", "yeardata", "SNOW", "kum_reg", "", "", "zind"],

    ["Tagesreihe", "years", "TMAX", "val", "", ""],
    ["Tagesreihe", "years", "TMIN", "val", "", ""],
    ["Tagesreihe", "years", "PRCP", "val", "", ""],
    ["Tagesreihe", "years", "SNOW", "val", "", ""],

    ["Hitzewellen", "years", "TMAX", "ext", "", ""],
    ["Kältewellen", "years", "TMIN", "ext", "", ""],
    ["Starkregen", "years", "PRCP", "ext", "", ""],
    ["Schnee", "years", "SNOW", "ext", "", ""],

    ["Korrelation", "yeardata", "TMAX-TMIN", "avg-korr", "", ""],
    ["Korrelation", "yeardata", "TMAX-PRCP", "avg-korr", "", ""],
    ["Korrelation", "yeardata", "PRCP-SNOW", "kum-korr", "", ""],
    ["Korrelation", "yeardata", "TMAX-EXT", "avg-cnt-korr", "", ""],

];

let locations = {};
let maps = null;

let $main = $("#application");
let $statistics = $("#place-container");

let currentPlace = 0;
let syncing = false;
let sliders;

import { placeScroller } from "./placeScroller.js";

let scroller;


/*
const observer = new IntersectionObserver(
    function (entries) {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const page = entry.target;
            $("#headertext").html(page.dataset.place + " " + page.dataset.topic);
            console.log(
                "Sichtbar:",
                page.dataset.topic,
                page.dataset.place
            );
        }
    },
    {
        threshold: 0.6
    }
);
*/


async function show() {
    // starten des scroller
    scroller = placeScroller({
        container: "#place-container",
        onChange: function (state) {
            console.log(
                "Topic:", state.islider,
                "Location:", state.ipage
            );
        }
    });

    $("#navigation")
        .append($("<button/>", {
            class: "btn btn-sm btn-primary",
            style: "margin-left:auto;",
            html: "+Location",
            click: async function (evt) {
                evt.preventDefault();
                let target = document.getElementById("application");
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                });
            }
        }));


    let html = `
    <p class="eyebrow">Dein Klima. Deine Umgebung.</p>
    <h1>Wie hat sich das Klima bei dir verändert?</h1>
    <p>Vergleiche historische Temperaturen von Wetterstationen in deiner Nähe – verständlich und auf Grundlage von Messdaten.</p>
    <button type="button" class="btn btn-primary btn-sm primary" data-action="location">Klima hier entdecken</button>
    <br><br>
    <details>
      <summary>Lieber einen Ort eingeben und dann auswählen?</summary>
      <form class="place-form">
        <label for="place">Ortsname</label>
        <input id="place" name="place" required autocomplete="address-level2" placeholder="z.B. Bonn">
        <button class="btn btn-primary btn-sm primary" data-action="searchlocation">Ort auswählen</button>
      </form>
    </details>
    <p class="hint">Keine Anmeldung nötig. Dein Standort wird nur nach deiner Zustimmung abgefragt.</p>`;
    let sectionid = "sec" + (Math.floor(Math.random() * 1000000) + 1000000);
    $main.append($("<section/>", {
        id: sectionid,
        class: "welcome",
        html: html
    }));
    let target = document.getElementById("application");
    target.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
    });

    let oldlocations = await getOldLocations(sectionid);
    // cookie für frühere Auswahl

    $("#" + sectionid).on("click", "button.primary", async function (evt) {
        evt.preventDefault();

        let action = $(this)[0].dataset.action;
        if (action === "searchlocation") {
            //alert(sectionid);
            let searchstring = $("#" + sectionid).find("input[name=place]").first().val();
            if (searchstring.trim().length === 0) {
                alert("Bitte Ortsname eingeben");
                return;
            }
            let ret = await showCandidates(sectionid, searchstring);
        } else if (action === "location") {
            let geolocation = null;
            let geopermission = await getGeoPermission();
            if (geopermission === "granted") {
                for (let i = 0; i < 3; i++) {
                    geolocation = await getgeoLocation();
                    if (geolocation !== null) {
                        break;
                    }
                }
            }
            if (geolocation === null) {
                geolocation = await getgeoLocationByIP();
            }
            console.log(geolocation);
            await showCandidates(sectionid, "", geolocation.lat, geolocation.lon, 10);
        }
    });
}


async function getgeoLocationByIP() {
    let response = await fetch("https://ipwho.is/");
    let data = await response.json();
    return {
        lat: data.latitude,
        lon: data.longitude,
        city: data.city,
        country: data.country
    };
}


async function getgeoLocation() {
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            pos => resolve({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy
            }),
            () => resolve(null),
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000
            }
        );
    });
}


async function getGeoPermission() {
    if (typeof navigator.permissions?.query !== "function") {
        return "unsupported";
    }
    try {
        let status = await navigator.permissions.query({
            name: "geolocation"
        });
        return status.state; // granted, prompt, denied
    } catch (err) {
        return "unsupported";
    }
}



/**
* getOldLocations - vereinfachte showCandidantes Lösung aus cookie
* @param {any} sectionid - Container mit der Liste
*
* @returns {any} - This function does not return a value but performs assertions on the input data.
*/
async function getOldLocations(sectionid) {
    let oldlocations = kli6900.getCookie("oldlocations");
    if (oldlocations !== null) {
        // popup zur Bestätigung
        // {"2821102":{"locname":"Trippelsdorf","latitude":"50.7806","longitude":"6.91505","tsupd":"2026-10-28T19:52:26.798Z"}}
        let ulid = "kli2000locliste";
        $("#" + ulid).remove();
        $("#" + sectionid)
            .append($("<ul/>", {
                id: "kli2000locliste",
            }));
        let $liste = $("#kli2000locliste");
        for (let geonameid of Object.keys(oldlocations)) {
            let oldlocation = oldlocations[geonameid];
            let html = "<span><a href='#' class='kli2000sel kli2000name'>";
            html += oldlocation.locname + " (" + oldlocation.country_code + ")";
            html += "</a></span>";
            $liste.append($("<li/>", {
                html: html,
                origin: "dialog",
                "data-geonameid": oldlocation.geonameid,
                "data-locname": oldlocation.locname,
                "data-latitude": oldlocation.latitude,
                "data-longitude": oldlocation.longitude,
                "data-country_code": oldlocation.country_code,
                "data-tsupd": oldlocation.tsupd
            }));
        }
        await showCandidates(sectionid, "*cookie");
    }
}


async function showCandidates(sectionid, searchstring, latitude, longitude, distance) {
    if (!(typeof searchstring === "string" && searchstring === "*cookie")) {
        let ret = {};
        let sql = "";
        sql += " SELECT GEONAMES.geonameid, GEONAMES.name, GEONAMES.latitude, GEONAMES.longitude,";
        sql += " GEONAMES.population, GEONAMES.elevation,";
        sql += " GEONAMES.admin1_code,";
        sql += " GEONAMES.country_code, KLICOUNTRYCODES.name as country,";
        sql += " KLISTATES.statename"
        sql += " FROM GEONAMES";
        sql += " LEFT JOIN KLICOUNTRYCODES";
        sql += " ON GEONAMES.country_code = KLICOUNTRYCODES.alpha2";
        sql += " LEFT JOIN KLISTATES";
        sql += " ON GEONAMES.country_code || '.' || GEONAMES.admin1_code = KLISTATES.statekey";

        if (typeof searchstring === "string" && searchstring.trim().length > 0) {
            let such = searchstring;
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
        } else if (typeof latitude !== "undefined" && latitude !== null &&
            typeof longitude !== "undefined" && longitude !== null) {
            if (typeof distance === "undefined") {
                distance = 50;
            }

            let sellatitude = latitude;
            let sellongitude = longitude;

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
        sql += " ORDER BY GEONAMES.name, GEONAMES.latitude DESC";  // GEONAMES.geonameid";
        // Zugriff auf SQL
        console.log(sql);
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
        //let perf = kli6900.getPerformance(startTime);
        if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
            Array.isArray(ret1.records)) {

            if (typeof latitude !== "undefined" && latitude !== null &&
                typeof longitude !== "undefined" && longitude !== null) {
                // Distanz berechnen, Sortieren, Ausgabezahl begrenzen
                let lat1 = latitude;
                let lon1 = longitude;
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
            let ulid = "kli2000locliste";
            $("#" + ulid).remove();
            $("#" + sectionid)
                .append($("<ul/>", {
                    id: "kli2000locliste",
                }));
            let oldname = "";
            let count = 0;
            for (let record of ret1.records) {
                count++;
                // population und elevation als weitere Kriterien
                let html = "<span>";
                html += "<a href='#' class='kli2000sel kli2000name'>" + record.name + "</a>";
                html += " (" + "<a href='#' class='kli2000sel kli2000country_code'>" + record.country_code + "</a>";
                html += "; " + record.statename + ") ";
                // zusatzinfos falls Duplette
                html += "<details class='inline-details'>";
                html += "<summary></summary>";
                html += " population: " + record.population;
                html += " height:" + record.elevation;
                html += "<br> lat/lon" + record.latitude + "/" + record.longitude;
                html += "</details> ";
                html += "</span>";
                $("#" + ulid)
                    .append($("<li/>", {
                        id: ulid + "_" + count,
                        class: "kli2000candidate",
                        "data-table": "GEONAMES",
                        "data-source": "GEONAMES",
                        "data-geonameid": record.geonameid,
                        "data-locname": record.name,
                        "data-latitude": record.latitude,
                        "data-longitude": record.longitude,
                        "data-country_code": record.country_code, // entspricht "ISO_A2" in GEOJSON
                        html: html
                    }));
            }
        }
    }
    $("#" + sectionid).off("click", "a.kli2000name");
    $("#" + sectionid).on("click", "a.kli2000name", async function (evt) {
        evt.preventDefault();
        // auswahl des Ortes, Anzeigen in Map mit Stationen
        let li = $(this).closest("li");
        let location = $(li)[0].dataset;
        // Anzeige der Worldmap geordnet in slider
        let { maps, pageid, toolbar0 } = await showMap($main, location);
        // Aufbringen der Marker für DWD-Layer und für GHCND-Layer
        let distancekm = 50;
        let geopoints = await searchStations(location, distancekm);
        // jetzt die geopoints in den layer bringen
        // Klassifizierung der Stationen mit Zeitbezug 1952 - 2017
        let inLimit = 0;
        let geosets = new Array(3);
        geosets[0] = [];
        geosets[1] = [];
        geosets[2] = [];
        let alpha3s = [];
        for (let station of geopoints) {
            station.stationkey = station.source + "_" + station.stationid;
            console.log(station.locname, station.fromyear, station.toyear);
            if (!alpha3s.includes(station.alpha3)) {
                alpha3s.push(station.alpha3)
            }
            if (station.fromyear <= "1952" && station.toyear >= "2017") {
                inLimit++;
                if (inLimit <= 5) {
                    station.type = "Good Data-near";
                    station.tcode = 0;
                    geosets[0].push(station);
                } else {
                    station.type = "Good Data-far";
                    station.tcode = 1;
                    geosets[1].push(station);
                }
            } else {
                station.type = "Bad Data";
                geosets[2].push(station);
                station.tcode = 2;
            }
        }
        //await maps.addMarkerLayer("stationlayer", "GHCND", location, geopoints, {});
        await maps.addMarkerLayer("stationlayer", "Good,near", location, geosets[0], {});
        await maps.addMarkerLayer("stationlayer", "Good,far", location, geosets[1], { hide: true });
        await maps.addMarkerLayer("stationlayer", "Bad Data", location, geosets[2], { hide: true });
        // countrypolygons holen vom Server über alpha3s
        await maps.addCountryLayer(alpha3s);
        // jetzt wird es ernst, der User wird gefragt, ob er die Daten analysieren möchte
        toolbar0.focusMarkers();
        $("#" + pageid)
            .append($("<button/>", {
                class: "btn btn-sm btn-primary",
                css: {
                    margin: "10px"
                },
                html: location.locname + " Auswerten",
                click: async function (evt) {
                    evt.preventDefault();
                    await startStatistics(location, geosets);
                }
            }));

        $("#" + pageid)
            .append($("<button/>", {
                class: "btn btn-sm btn-primary",
                css: {
                    margin: "10px"
                },
                html: "Zurück",
                click: function (evt) {
                    evt.preventDefault();
                    let targetid = $(".welcome").attr("id");
                    let target = document.getElementById(targetid);
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "start"
                    });
                }
            }));
    });
}



async function startStatistics(location, geosets) {
    // startStatistics muss die erste Einrichtung vornehmen mit sliders und jeweils erster page
    // und das Zufügen einer Spalte für eine location mit allen pages
    let key = location.geonameid;
    let colindex = 0;
    if (typeof locations[key] === "undefined") {
        let keys = Object.keys(locations);
        if (keys.length >= 3) {
            alert("es gibt bereits zu viele Orte in der Auswertung");
            return;
        }
        colindex = keys.length;
        locations[key] = {
            key: key,
            colindex: colindex,
            location: location,
            geosets: geosets
        }
        // Daten holen aus KLIDATA
        let ret = await getKLIDATA(key, locations); // key, colindex, location, geosets
        let doslider = false;
        if ($statistics.children().length === 0) {
            doslider = true;
        }
        // komplette Initialisierung - vertikale logik
        let itopic = -1;
        for (let topic of topics) {
            itopic++;
            for (let i = 0; i < 7; i++) {
                if (typeof topic[i] === "undefined") {
                    topic[i] = "";
                }
            }
            let [title, datasource, variable, method, altmethod1, altmethod2, hydevar] = topic;
            let $slider = null;
            let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
            if (doslider === true) {
                $slider = $("<section>", {
                    class: "place-slider",
                    "data-topic": topicstring,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar,
                });
                $statistics.append($slider);
            } else {
                $slider = $("section.place-slider[data-topic='" + topicstring + "']");
            }
            // jetzt das eigentliche Element bzw die Spalte zufügen
            const $page = $("<article>", {
                id: "dp" + (Math.floor(Math.random() * 1000000) + 1000000),
                class: "place-page",
                "data-colindex": colindex,
                "data-topic": topicstring,
                "data-place": key,
                "data-title": title,
                "data-datasource": datasource,
                "data-variable": variable,
                "data-method": method,
                "data-altmethod1": altmethod1,
                "data-altmethod2": altmethod2,
                "data-hydevar": hydevar
            });
            $page.append(
                $("<h2>").text(`${location.locname} (${key})`)
            );
            $page.append(
                $("<div>", {
                    class: "mychart",
                    css: {
                        backgroundColor: "lightyellow"
                    }
                })
            );
            $slider.append($page);
            // $page ist definiert, das ist der Container, dazu kommt
            // title, datasource, variable, method, altmethod1, altmethod2, hydevar
            // und in locations[key] = {} stehen key, colindex, location, geosets bereit
            await showStatisticPage($page, itopic, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar);
        }
    } else {
        // Auswertung ist bereits vorhanden
        return;
    }

    scroller.refresh();
    let target = document.getElementById($statistics.attr("id"));
    target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });

    //TODO: neue Lösung
    /*
    document.querySelectorAll(".place-page")
        .forEach(page => observer.observe(page));
    document.querySelectorAll(".place-slider")
        .forEach(slider => {
            slider.addEventListener("scroll", function () {
                const index = Math.round(
                    slider.scrollLeft / slider.clientWidth
                );
                console.log("Standortindex:", index);
            }, { passive: true });
        });
    */
}

async function showStatisticPage($page, itopic, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar) {
    // in locations[key] = {} stehen key, colindex, location, geosets bereit
    // topics
    let xlabels = [];
    for (let iyear = 1950; iyear <= 2019; iyear++) {
        xlabels.push("" + iyear);
    }
    let anz = xlabels.length;
    // title, datasource, variable, method, altmethod1, altmethod2, hydevar
    let gbldatasets = {};
    // ["Zeitreihe", "yeardata", "TMAX", "avg", "max", "min",""],  // fehlende Werte sind durch "" ersetzt
    // ["Zeitreihe", "yeardata", "PRCP", "kum", "", ""],
    // ["Trendanalyse", "yeardata", "TMAX", "avg_reg", "", ""],
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
    if (datasource === "yeardata" && ["TMAX", "TMIN", "PRCP", "SNOW", "SNWD"].includes(variable) && ["avg", "kum"].includes(method) && hydevar === "") {
        let stations = locations[key].geosets[0];
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
                    fromyear: 1950,
                    toyear: 2019,
                    data: []
                }
                for (let record of locations[key].records) {
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
        // hier sind xlabels und datasets bekannt
        let thistitle = title + " " + variable + " " + locations[key].location.locname;
        let xtitle = "years";
        let ytitle = "Temperature";
        if (variable === "PRCP") {
            ytitle = "Niederschlag kumuliert";
        } else if (["SNOW", "SNWD"].includes(variable)) {
            ytitle = "Schnee kumuliert";
        }
        let config = getConfig4lineChart(thistitle, xlabels, datasets, xtitle, ytitle);
        let pageid = $page.attr("id");
        let container = $page.find("div.mychart");  // ist bereits definiert als container!!!
        $(container)
            .append($("<canvas/>", {
                id: pageid + "canvas"
            }));
        requestAnimationFrame(async function () {
            let canvasid = pageid + "canvas";
            let canvas = document.getElementById(canvasid);
            let ctx = canvas.getContext("2d");
            let chart = new Chart(ctx, config);
            chart.options.responsive = false;
            chart.update("none");
            showChartButtons($page, canvasid);
        });
    }
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
};


function showChartButtons($page, canvasid) {
    let containerid = $page.attr("id") + "buttons";
    $page.append($("<div/>", {
        id: containerid,
        class: "chartbuttons",
        css: {
            width: "100%"
        }
    }));
    let graph = Chart.getChart(canvasid);
    let vcontrol = {
        variables: {},
        methods: {},
        hydes: {},
        stations: {}
    };
    for (let dataset of graph.data.datasets) {
        if (typeof vcontrol.variables[dataset.variable] === "undefined") {
            vcontrol.variables[dataset.variable] = 0;
        }
        vcontrol.variables[dataset.variable] += 1;

        if (typeof vcontrol.methods[dataset.method] === "undefined") {
            vcontrol.methods[dataset.method] = 0;
        }
        vcontrol.methods[dataset.method] += 1;

        if (typeof dataset.hyde !== "undefined") {
            if (typeof vcontrol.hydes[dataset.hyde] === "undefined") {
                vcontrol.hydes[dataset.hyde] = 0;
            }
            vcontrol.hydes[dataset.hyde] += 1;
        }

        let skey = dataset.source + "_" + dataset.stationid;
        if (typeof vcontrol.stations[skey] === "undefined") {
            //let borderDash = dashPatterns[count - 1];
            //let dashImg = getBorderDashThumb(borderDash);
            vcontrol.stations[skey] = {
                source: dataset.source,
                stationid: dataset.stationid,
                locname: dataset.locname,
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

    // Buttons erzeugen
    for (let crit of ["variables", "methods", "hydes"]) {
        let values = Object.keys(vcontrol[crit])
        if (values.length <= 1) {
            continue;
        }
        let count = 0;
        for (let value of values) {
            let sign = oksign;
            count++;
            if (count > 1) {
                sign = cancelsign;
            }

            $("#" + containerid)
                .append($("<button/>", {
                    class: "btn btn-sm btn-success datasetfilter",
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
            let dashPatternsIndex = vcontrol.stations[value].dashPatternsIndex;
            let borderDash = dashPatterns[dashPatternsIndex];
            let color = kli6900.getOneOf20ColorShades(dashPatternsIndex, 1).color
            let dashImg = getBorderDashThumb(borderDash, 3, color); // , borderWidth, borderColor) {
            let html = dashImg;
            html += "<span>" + sign + "</span><span> " + vcontrol["stations"][value].locname + "</span>"
            $("#" + containerid)
                .append($("<button/>", {
                    class: "datasetfilter",
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
        if (dataset.method === "avg_reg" || dataset.method.indexOf("reg") >= 0) {
            //debugger;
        }
        let key = dataset.source + "_" + dataset.stationid;
        let dashPatternsIndex = vcontrol["stations"][key].dashPatternsIndex;
        dataset.borderDash = dashPatterns[dashPatternsIndex];
        dataset.borderWidth = 3;  // 1, 2, 3 kann genutzt werden
        let colorIndex = dashPatternsIndex;
        //methodShades = { avg: 0, min: 1, max: 2, kum: 0, "avg_reg": 3, "kum_reg": 3, val: 0, ext: 0 };
        // 0.7 – 1.4 (hell ↔ dunkel)
        let methodShadeFactors = { avg: 1, min: 0.7, max: 1.4, kum: 1, "avg_reg": 1.2, "kum_reg": 1.2, val: 1, ext: 1 };
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
    updateChart(canvasid);
};

$statistics.on("click", ".datasetfilter", function (evt) {
    evt.preventDefault();
    let that = this;
    let status = $(this).find("span").first().text();
    if (status === okletter) {
        $(this).find("span").first().html(cancelsign);
        status = "";
    } else {
        $(this).find("span").first().html(oksign);
        status = "ok";
    }
    requestAnimationFrame(function () {
        let canvasid = $(that).attr("canvasid");
        let varname = $(that).attr("varname");
        let varvalue = $(that).attr("varvalue");
        updateChart(canvasid);
    });
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
        },
        {
            label: "TMIN",
            data: [-1, 0, 3, 6, 10, 13, 15, 14, 11, 7, 3, 0],
            borderColor: "#337ab7"
        }
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
                    title: {
                        display: true,
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




// key, colindex, location, geosets in locations[key]
// Querzugriff notwendig, um die x/y scales zu Harmonisieren
async function getKLIDATA(key, locations) {

    let sels = {};
    for (let record of locations[key].geosets[0]) {
        if (typeof sels[record.source] === "undefined") {
            sels[record.source] = [];
        }
        sels[record.source].push(record.stationid);
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
    sql += " ORDER BY KLISTATIONS.source, KLISTATIONS.stationid";  // GEONAMES.geonameid";
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
    let geopoints = [];
    //let perf = kli6900.getPerformance(startTime);
    if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
        Array.isArray(ret1.records)) {
        for (let record of ret1.records) {
            record.key = record.source + "_" + record.stationid + "_" + record.variable;
            if (typeof record.years === "string") {
                record.years = JSON.parse(record.years);
            }
            let fromyear = 1950;
            let toyear = 2019;
            record.yeardata = {};
            for (let iyear = fromyear; iyear <= toyear; iyear++) {
                let yeardata = record.years["" + iyear];
                if (typeof yeardata !== "undefined") {
                    let result = kli6900.getTrivial(yeardata, false, false);   // doround, korr)
                    result.year = "" + iyear;
                    record.yeardata[result.year] = result;
                }
            }
        }
        locations[key].records = structuredClone(ret1.records);
        return {
            error: false,
            message: "records:" + ret1.records.length
        };
    } else {
        return {
            error: true,
            message: ret1.message
        };
    }
}

async function searchStations(location, distancekm) {
    let ret = {};
    let sql = "";
    sql += " SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
    sql += " KLISTATIONS.latitude, KLISTATIONS.longitude,";
    sql += " KLISTATIONS.countryname,KLISTATIONS.alpha3,";
    sql += " KLISTATIONS.height, ";
    sql += " KLISTATIONS.uopp_1850,KLISTATIONS.uopp_1950,KLISTATIONS.uopp_2019,";
    sql += " KLISTATIONS.popd_1850,KLISTATIONS.popd_1950,KLISTATIONS.popd_2019,";
    sql += " KLISTATIONS.zind_1950AD, KLISTATIONS.zind_2019AD,";
    sql += " KLIDATA.latitude AS dlatitude, KLIDATA.longitude AS dlongitude,";
    sql += " KLIDATA.fromyear, KLIDATA.toyear";
    sql += " FROM KLISTATIONS";
    sql += " LEFT JOIN KLIDATA";
    sql += " ON KLISTATIONS.source = KLIDATA.source";
    sql += " AND KLISTATIONS.stationid = KLIDATA.stationid";
    sql += " AND KLIDATA.variable = 'TMAX'";
    //sql += " WHERE source IN('GHCND','DWDD','ICOSCO2H')";
    sql += " WHERE KLISTATIONS.source = 'GHCND'";
    // hier kli1000_latitude und kli1000_longitude
    //basefield: "kli1000_lat,kli1000_lon",
    let sellatitude = location.latitude;
    let sellongitude = location.longitude;
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
        where1 += " CAST(KLISTATIONS.latitude as DECIMAL(4,5)) <= " + latN;
        where1 += " AND CAST(KLISTATIONS.latitude as DECIMAL(4,5)) >= " + latS;
    } else {
        if (where1.length > 0) where1 += " AND ";
        where1 += " CAST(KLISTATIONS.latitude as DECIMAL(4,5)) >= " + latN;
        where1 += " AND CAST(KLISTATIONS.latitude as DECIMAL(4,5)) <= " + latS;
    }
    if (lonW > lonE) {
        if (where1.length > 0) where1 += " AND ";
        where1 += " CAST(KLISTATIONS.longitude as DECIMAL(4,5)) <= " + lonW;
        where1 += " AND CAST(KLISTATIONS.longitude as DECIMAL(4,5)) >= " + lonE;
    } else {
        if (where1.length > 0) where1 += " AND ";
        where1 += " CAST(KLISTATIONS.longitude as DECIMAL(4,5)) >= " + lonW;
        where1 += " AND CAST(KLISTATIONS.longitude as DECIMAL(4,5)) <= " + lonE;
    }
    sql += " AND " + where1;

    sql += " ORDER BY KLISTATIONS.source, KLISTATIONS.stationid";  // GEONAMES.geonameid";
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
    let geopoints = [];
    //let perf = kli6900.getPerformance(startTime);
    if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
        Array.isArray(ret1.records)) {
        // Berechnung der Distanz zu sellatitude und sellongitude
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
            } else if (a.stationname > b.stationname) {
                return 1;
            } else if (a.stationname < b.stationname) {
                return -1;
            } else {
                return 0;
            }
        });
        let icountry = 0;
        kli6900.putMessage("Treffer: " + ret1.records.length);  // + " in: " + perf);

        for (let record of ret1.records) {
            geopoints.push({
                table: "KLISTATIONS",
                source: record.source,
                stationid: record.stationid,
                locname: record.stationname,
                alpha3: record.alpha3,
                latitude: record.latitude,
                longitude: record.longitude,
                distancekm: record.distance,
                fromyear: record.fromyear,
                toyear: record.toyear
            });
        }
    }
    return geopoints;
}


/**
* showMap - Anzeige der Weltkarte, noch ohne Marker
*           addWorldmapSlider stellt den leadfet-Container bereit
*            maps.showWorldMap führt die Anzeige durch 
* @param {any} $main - Vorgabe des Containers
* @param {any} location - Vorgabe des Ortes, hier nur administrativ im Header
*
* @returns {any} - maps als Object (factory-Instanz) für die worldmap-Bearbeitung
*/
async function showMap($main, location) {
    //await getScript("/js/kli1000B.js");
    //let maps = window.kli1000B.mapService();
    let pageid = await addWorldmapSlider($main, location);
    let containerid = pageid + "content";
    $("#" + containerid).removeClass("myleaflet-map");
    $("#" + containerid).addClass("myleaflet-map");
    // pageid + "content" ist container für die Map

    // Berechnete Abmessungen ermitteln
    let width = $("#" + containerid).width();
    let height = $("#" + containerid).height();

    // Explizit zuweisen
    $("#" + containerid).css({
        width: width + "px",
        height: height + "px"
    });

    let { mapService } = await import("/modules/kli2000B.js");
    console.log(typeof mapService); // "function"
    console.log(mapService.length);  // 0
    let maps = mapService({});
    // links navigation, rechts Arbeits- und Ergebnisbereich
    // ret.records hat die Staionen um localization, wenn localization nicht null ist
    // let centerlocation = localization;
    let imagetype = "natural";
    let { worldmap, worldmapid, layerControl } = await maps.showWorldMap(containerid, imagetype);

    let toolbar0 = maps.createLeafletToolbar();
    toolbar0.focusMarkers();
    let target = document.getElementById(pageid);
    target.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
    });

    return {
        maps: maps,
        pageid: pageid,
        toolbar0: toolbar0
    };
}

async function addWorldmapSlider($main, location) {
    let $slider = null;
    if ($(".place-slider.locationmap").length === 0) {
        $slider = $("<section>", {
            class: "app-slider locationmap",
            "data-topic": "locationmap"
        });
        $main.append($slider);
        let oldlocations = kli6900.getCookie("oldlocations");
        if (oldlocations === null) {
            oldlocations = {};
        }
        oldlocations[location.geonameid] = {
            geonameid: location.geonameid,
            locname: location.locname,
            latitude: location.latitude,
            longitude: location.longitude,
            country_code: location.country_code,
            tsupd: new Date().toISOString()
        }
        kli6900.setCookie("oldlocations", JSON.stringify(oldlocations));
    } else {
        $slider = $(".app-slider.locationmap");
    }
    let place = location.locname + " " + location.geonameid;
    let $page = null;
    let pageid = null;
    if ($(".app-page.locationmap[data-place='" + place + "']").length === 0) {
        pageid = "p" + (Math.floor(Math.random() * 1000000) + 1000000);
        $page = $("<article>", {
            id: pageid,
            class: "app-page locationmap",
            "data-place": place,
            "data-topic": "locationmap"
        });
        $slider.append($page);
    } else {
        $(".app-page.locationmap[data-place='" + place + "']").children().remove();
        pageid = $(".app-page.locationmap[data-place='" + place + "']").attr("pageid");
        $page = $("#" + pageid);
    }
    $page.append(
        $("<h2>").text(`${place}`)
    );
    $page.append(
        $("<div>", {
            id: pageid + "content",
            class: "content",
            css: {
                width: "100%"
            }
        }));
    //document.querySelectorAll(".place-page")
    //    .forEach(page => observer.observe(page));
    return pageid;
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



function getScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Fehler beim Laden: ${url}`));
        document.head.appendChild(script);
    });
}


export {
    show
}