//kli2000.js

let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
let cancelsign = "&#10005;"; // x oder &#x25CF;
let okletter = "✓";
let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

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

    ["Trendanalyse", "yeardata", "TMAX", "avg_reg", "", ""],
    ["Trendanalyse", "yeardata", "TMIN", "avg_reg", "", ""],
    ["Trendanalyse", "yeardata", "PRCP", "kum_reg", "", ""],
    ["Trendanalyse", "yeardata", "SNOW", "kum_reg", "", ""],

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
let $statistics = $("#statistics");



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




async function show() {
    let html = `
    <p class="eyebrow">Dein Klima. Deine Umgebung.</p>
    <h1>Wie hat sich das Klima bei dir verändert?</h1>
    <p>Vergleiche historische Temperaturen von Wetterstationen in deiner Nähe – verständlich und auf Grundlage von Messdaten.</p>
    <button type="button" class="primary" data-action="location">Klima hier entdecken</button>
    <br><br>
    <details>
      <summary>Lieber einen Ort eingeben?</summary>
      <form class="place-form">
        <label for="place">Ortsname</label>
        <input id="place" name="place" required autocomplete="address-level2" placeholder="z.B. Bonn">
        <button class="primary" data-action="searchlocation">Ort auswählen</button>
      </form>
    </details>
    <p class="hint">Keine Anmeldung nötig. Dein Standort wird nur nach deiner Zustimmung abgefragt.</p>`;
    let sectionid = "sec" + (Math.floor(Math.random() * 1000000) + 1000000);
    $main.append($("<section/>", {
        id: sectionid,
        class: "welcome",
        html: html
    }));


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
    // es wird ernst, es sind die Orte bekannt (erst mal nur einer)
    // und es sind die Auswertungsmodule zu erstellen und zu integrieren

    if (1 === 1) return;
    /*
    for (const [topicIndex, topic] of topics.entries()) {
        const $slider = $("<section>", {
            class: "place-slider",
            "data-topic": topic
        });
        for (const [placeIndex, place] of places.entries()) {
            const $page = $("<article>", {
                class: "place-page",
                "data-place": place,
                "data-topic": topic
            });
            $page.append(
                $("<h2>").text(`${topic} – ${place}`)
            );
            $page.append(
                $("<div>", {
                    class: "test-content",
                    html: `
                        <p>Thema: ${topicIndex + 1} / 10</p>
                        <p>Standort: ${placeIndex + 1} / 3</p>
                        <p>Hier erscheint später die Auswertung.</p>
                    `
                })
            );
            $slider.append($page);
        }
        $main.append($slider);
    }
    document.querySelectorAll(".place-page")
        .forEach(page => observer.observe(page));
    */
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


async function showCandidates(sectionid, searchstring, latitude, longitude, distance) {
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
    $("#" + sectionid).off("click", "a.kli2000name");
    $("#" + sectionid).on("click", "a.kli2000name", async function (evt) {
        evt.preventDefault();
        // auswahl des Ortes, Anzeigen in Map mit Stationen
        let li = $(this).closest("li");
        let location = $(li)[0].dataset;
        // Anzeige der Worldmap geordnet in slider
        let { maps, pageid } = await showMap($main, location);
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
        await maps.addMarkerLayer("stationlayer", "Good,far", location, geosets[1], {});
        await maps.addMarkerLayer("stationlayer", "Bad Data", location, geosets[2], {});
        // countrypolygons holen vom Server über alpha3s
        await maps.addCountryLayer(alpha3s);
        // jetzt wird es ernst, der User wird gefragt, ob er die Daten analysieren möchte
        $("#" + pageid)
            .append($("<button/>", {
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

    let key = location.geonameid;
    let colindex = 0;
    if (typeof locations[key] === "undefined") {
        let keys = Object.keys(locations);
        if (keys.length >= 3) {
            alert("es gibt bereits zu viele Orte in der Auswertung");
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
        // komplette Initialisierung
        for (let topic of topics) {
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
            await showStatisticPage($page, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar);
        }
    } else {
        // Auswertung ist bereits vorhanden
        return;
    }
    let target = document.getElementById("statistics");
    target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });
    document.querySelectorAll(".place-page")
        .forEach(page => observer.observe(page));
}

async function showStatisticPage($page, key, locations, title, datasource, variable, method, altmethod1, altmethod2, hydevar) {
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
    let datasets = [];
    if (datasource === "yeardata" && ["TMAX", "TMIN"].includes(variable) && method === "avg" && hydevar === "") {
        let stations = locations[key].geosets[0];
        // Loop über die Stations
        for (let station of stations) {
            // mehrere method denkbar
            for (let setmethod of [method, altmethod1, altmethod2]) {
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
                                dataset.data.push(record.yeardata["" + iyear].min); // evtl. runden
                                continue
                            }
                        }
                    }
                }
                datasets.push(dataset);
            }
        }
        // hier sind xlabels und datasets bekannt
        let thistitle = title + " " + variable + " " + locations[key].location.locname;
        let xtitle = "years";
        let ytitle = "Temperature";
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

function showChartButtons($page, canvasid) {
    let containerid = $page.attr("id") + "buttons";
    $page.append($("<div/>", {
        id: containerid,
        class: "chartbuttons",
        css: {
            width: "100%",
            backgroundColor: "lime"
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
            vcontrol.stations[skey] = {
                source: dataset.source,
                stationid: dataset.stationid,
                locname: dataset.locname,
                count: 0
            };
        }
        vcontrol.stations[skey].count += 1;
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
                    class: "datasetfilter",
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
            $("#" + containerid)
                .append($("<button/>", {
                    class: "datasetfilter",
                    css: {
                        margin: "5px",
                        padding: "0px"
                    },
                    canvasid: canvasid,
                    varname: "stationkey",
                    varvalue: value,
                    html: "<span>" + sign + "</span><span> " + vcontrol["stations"][value].locname + "</span>",
                    title: "Station " + value + " " + vcontrol["stations"][value].locname
                }));
        }
    }
    updateChart(canvasid);
};

$(".statistics").on("click", ".datasetfilter", function (evt) {
    evt.preventDefault();
    let status = $(this).find("span").first().text();
    if (status === okletter) {
        $(this).find("span").first().html(cancelsign);
        status = "";
    } else {
        $(this).find("span").first().html(oksign);
        status = "ok";
    }
    let canvasid = $(this).attr("canvasid");
    let varname = $(this).attr("varname");
    let varvalue = $(this).attr("varvalue");
    updateChart(canvasid);
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
                    enabled: true
                }
            },
            elements: {
                line: {
                    tension: 0.2,
                    borderWidth: 2
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

    let target = document.getElementById(pageid);
    target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });

    return {
        maps: maps,
        pageid: pageid
    };
}

async function addWorldmapSlider($main, location) {
    let $slider = null;
    if ($(".place-slider.locationmap").length === 0) {
        $slider = $("<section>", {
            class: "place-slider locationmap",
            "data-topic": "locationmap"
        });
        $main.append($slider);
    } else {
        $slider = $(".place-slider.locationmap");
    }
    let place = location.locname + " " + location.geonameid;
    let $page = null;
    let pageid = null;
    if ($(".place-page.locationmap[data-place='" + place + "']").length === 0) {
        pageid = "p" + (Math.floor(Math.random() * 1000000) + 1000000);
        $page = $("<article>", {
            id: pageid,
            class: "place-page locationmap",
            "data-place": place,
            "data-topic": "locationmap"
        });
        $slider.append($page);
    } else {
        $(".place-page.locationmap[data-place='" + place + "']").children().remove();
        pageid = $(".place-page.locationmap[data-place='" + place + "']").attr("pageid");
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
    document.querySelectorAll(".place-page")
        .forEach(page => observer.observe(page));
    return pageid;
}

//$main.append($slider);
//}
//document.querySelectorAll(".place-page")
//    .forEach(page => observer.observe(page));




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