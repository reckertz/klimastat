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
    const $main = $("#application");

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
        debugger;
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
        /*
        $("#" + sectionid).find("div.form-list").remove();
        $("#" + sectionid)
            .append($("<div/>", {
                //class: "form-list overflow-auto",
                //"max-height": "50vh",
                //"overflow-y": "auto"
                "max-height": "calc((100dvh - 50px) * 0.5)",
                "overflow-y": "auto"
            })
                .append($("<ul/>", {
                    id: "kli2000locliste"
                }))
            )
        */
        let ulid = "kli2000locliste";
        $("#" + ulid).remove();
        $("#" + sectionid)
            .append($("<ul/>", {
                id: "kli2000locliste"
            }));
        let oldname = "";
        let oldcountry_code = "";
        let oldstatename = "";
        for (let record of ret1.records) {
            // population und elevation als weitere Kriterien
            let html = "<span>" + record.name + " (" + record.country_code + "; " + record.statename + ") ";
            if (oldname === record.name && oldcountry_code === record.country_code &&
                oldstatename === record.statename) {
                // Duplette
                html += "<details class='inline-details'>";
                html += "<summary></summary>";
                html += " " + record.population + " " + record.elevation;
                html += "<br> " + record.latitude + " " + record.longitude;
                html += "</details> ";
            } else {
                oldname = record.name;
                oldcountry_code = record.country_code;
                oldstatename = record.statename;
            }
            html += "</span>";
            $("#" + ulid)
                .append($("<li/>", {
                    class: "kli2000candidate",
                    table: "GEONAMES",
                    source: "GEONAMES",
                    geonameid: record.geonameid,
                    locname: record.name,
                    latitude: record.latitude,
                    longitude: record.longitude,
                    html: html
                }));
        }
    }
}



export {
    show
}