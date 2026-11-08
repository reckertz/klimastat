/**
 * kli3010.js - Module for prepage
 * select locations and provide  locations
 */

let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
let cancelsign = "&#10005;"; // x oder &#x25CF;
let okletter = "✓";
let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

let $main = $("#application");

let addbutton = false;
let locationhook = null;

async function show(screenConfig, hook) {
    locationhook = hook;
    // screenConfig mit: columns : 1,height: 667, width: 375
    // mode: "mobile", orientation: "portrait", sliderMode: "isolated", touch: true
    if (addbutton === false) {
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
        addbutton = true;
    }

    let html = `
    <p class="eyebrow">Dein Klima. Deine Umgebung.</p>
    <h1>Wie hat sich das Klima bei dir verändert?</h1>
    <p>Vergleiche historische Temperaturen von Wetterstationen in deiner Nähe – verständlich und auf Grundlage von Messdaten.</p>
    <button type="button" class="btn btn-primary btn-sm primary" data-action="location">Klima hier entdecken</button>
    &nbsp;&nbsp;
    <button type="button" class="btn btn-primary btn-sm primary" data-action="oldlocations">alte Orte</button>
    <br><br>
    <details>
      <summary>Lieber einen Ort eingeben und dann auswählen?</summary>
      <form class="place-form">
        <label for="place">Ortsname</label>
        <input id="place" name="place" required autocomplete="address-level2" placeholder="z.B. Bonn">
        <label for="countrycode">Ländername</label>
        <input id="countrycode" name="countrycode" required  placeholder="z.B. DE">
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
            let country_code = $("#" + sectionid).find("input[name=countrycode]").first().val();
            //if (country_code.trim().length === 0) {
            //    alert("Bitte Ländername eingeben");
            //    return;
            //}
            let ret = await showCandidates(sectionid, searchstring, country_code);
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
            await showCandidates(sectionid, "", "", geolocation.lat, geolocation.lon, 10);
        } else if (action === "oldlocations") {
            let oldlocations = await getOldLocations(sectionid);
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
        let ulid = "kli3010locliste";
        $("#" + ulid).remove();
        $("#" + sectionid)
            .append($("<ul/>", {
                id: "kli3010locliste",
            }));
        let $liste = $("#kli3010locliste");
        for (let geonameid of Object.keys(oldlocations)) {
            let oldlocation = oldlocations[geonameid];
            let html = "<span><a href='#' class='kli3010sel kli3010name'>";
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


async function showCandidates(sectionid, searchstring, country_code, latitude, longitude, distance) {
    if (!(typeof searchstring === "string" && searchstring === "*cookie")) {
        let ret = {};
        let sql = "";
        sql += " SELECT KLIGEONAMES.geonameid, KLIGEONAMES.name, KLIGEONAMES.latitude, KLIGEONAMES.longitude,";
        sql += " KLIGEONAMES.population, KLIGEONAMES.elevation,";
        sql += " KLIGEONAMES.admin1_code,";
        sql += " KLIGEONAMES.country_code, KLICOUNTRYCODES.name as country,";
        sql += " KLISTATES.statename"
        sql += " FROM KLIGEONAMES";
        sql += " LEFT JOIN KLICOUNTRYCODES";
        sql += " ON KLIGEONAMES.country_code = KLICOUNTRYCODES.alpha2";
        sql += " LEFT JOIN KLISTATES";
        sql += " ON KLIGEONAMES.country_code || '.' || KLIGEONAMES.admin1_code = KLISTATES.statekey";

        if (typeof searchstring === "string" && searchstring.trim().length > 0) {
            let ands = [];
            let such = searchstring;
            let frags = such.split(" ");
            if (frags.length > 0) {
                for (let frag of frags) {
                    ands.push(" lower(KLIGEONAMES.name) LIKE '%" + frag + "%'");
                }
                //sql += " WHERE " + ands.join(" AND ");
            } else {
                //sql += " WHERE lower(KLIGEONAMES.name) LIKE('" + frags[0] + "%'";
                ands.push(" lower(KLIGEONAMES.name) LIKE('" + frags[0] + "%'");
            }
            if (typeof country_code === "string" && country_code.trim().length > 0) {
                ands.push(" KLIGEONAMES.country_code = '" + country_code + "'");
            }
            if (ands.length > 0) {
                sql += " WHERE  " + ands.join(" AND ");
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
        sql += " ORDER BY KLIGEONAMES.name, KLIGEONAMES.latitude DESC";  // KLIGEONAMES.geonameid";
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
        console.log(ret1.message);
        if (ret1.error === true) {
            alert(ret1.message);
            return;
        }
        if (ret1.records === "undefined" || ret1.records === null) {
            alert(ret1.message + "\n keine Daten gefunden");
            return;
        }
        if (Array.isArray(ret1.records) && ret1.records.length === 0) {
            alert("keine Daten gefunden");
            return;
        }
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
            let ulid = "kli3010locliste";
            $("#" + ulid).remove();
            $("#" + sectionid)
                .append($("<ul/>", {
                    id: "kli3010locliste",
                }));
            let oldname = "";
            let count = 0;
            for (let record of ret1.records) {
                count++;
                // population und elevation als weitere Kriterien
                let html = "<span>";
                html += "<a href='#' class='kli3010sel kli3010name'>" + record.name + "</a>";
                html += " (" + "<a href='#' class='kli3010sel kli3010country_code'>" + record.country_code + "</a>";
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
                        class: "kli3010candidate",
                        "data-table": "KLIGEONAMES",
                        "data-source": "KLIGEONAMES",
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
    $("#" + sectionid).off("click", "a.kli3010name");
    $("#" + sectionid).on("click", "a.kli3010name", async function (evt) {
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
                    await locationhook(location, geosets);
                    //await startStatistics(location, geosets);
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


async function searchStations(location, distancekm) {
    let ret = {};
    let ret1 = {};
    let geopoints = [];
    for (let distance of [50, 100, 250]) {
        ret = {};
        geopoints = [];
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
        sql += " JOIN KLIDATA";
        sql += " ON KLISTATIONS.source = KLIDATA.source";
        sql += " AND KLISTATIONS.stationid = KLIDATA.stationid";
        sql += " AND KLIDATA.variable = 'TMAX'";
        //sql += " WHERE source IN('GHCND','DWDD','ICOSCO2H')";
        sql += " WHERE KLISTATIONS.source = 'GHCND'";
        sql += " AND KLIDATA.fromyear <= 1952";
        sql += " AND KLIDATA.toyear >= 2017";
        // hier kli1000_latitude und kli1000_longitude
        //basefield: "kli1000_lat,kli1000_lon",
        let sellatitude = location.latitude;
        let sellongitude = location.longitude;
        //let distance = 50;
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
        ret1 = await response.json();
        console.log(ret1.message);
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
            if (ret1.records.length >= 5) {
                break;
            }
        }
    }
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

    return geopoints;
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

export {
    show
}