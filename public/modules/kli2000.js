//kli2000.js

const places = [
    "Bonn",
    "Bornheim",
    "Köln"
];

const topics = [
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

let locations = {};


const $main = $("#application");

let maps = null;

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




function show() {
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
        }
    });
    // es wird ernst, es sind die Orte bekannt (erst mal nur einer)
    // und es sind die Auswertungsmodule zu erstellen und zu integrieren

    if (1 === 1) return;
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
}

async function showCandidates(sectionid, searchstring) {
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
            conindex: colindex,
            location: location,
            geosets: geosets
        }
        let $statistics = $("#statistics");
        if (statistics.length === 0) {
            // komplette Initialisierung

        } else {
            // zufügen eine Spalte zu allen vorhandenen Auswertungen
        }
    }

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
*           addWordmapSlider stellt den leadfet-Container bereit
*            maps.showWorldMap führt die Anzeige durch 
* @param {any} $main - Vorgabe des Containers
* @param {any} location - Vorgabe des Ortes, hier nur administrativ im Header
*
* @returns {any} - maps als Object (factory-Instanz) für die worldmap-Bearbeitung
*/
async function showMap($main, location) {
    //await getScript("/js/kli1000B.js");
    //let maps = window.kli1000B.mapService();
    let pageid = await addWordmapSlider($main, location);
    let containerid = pageid + "content";
    $("#" + containerid).removeClass("myleaflet-map");
    $("#" + containerid).addClass("myleaflet-map");
    // pageid + "content" ist container für die Map
    let target = document.getElementById(pageid);
    target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });

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

    return {
        maps: maps,
        pageid: pageid
    };
}

async function addWordmapSlider($main, location) {
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
        $("<h2>").text(`locationmap: ${place}`)
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