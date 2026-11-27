//kli3000.js - Mobile und Desktop Klimaanalyse zu places
// Steuerprogramm für das Layout und das UI

import * as kli3010 from "/modules/kli3010.js";
import * as kli3020 from "/modules/kli3020.js";
import { createHelp } from "/modules/help.js";

import { createActivity } from "/modules/activity.js";

globalThis.activity = createActivity();

let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
let cancelsign = "&#10005;"; // x oder &#x25CF;
let okletter = "✓";
let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

let $main = $("#application");
let $stat = [];

let screenConfig = null;
globalThis.locationInstances = [];

let destroyer = null;

let activeTheme = null;

globalThis.themeControl = [];  // Kontrolle der bereits aktiven themes = climateThemes.Auswahl
let themePromise;

// addQualityPage ist noch ein Thema
let climateThemes = [
    ["Temperatur", "temperatur.png", ["ZR_TMAX_avg", "ZR_TMAX_avg_reg", "ZR_TMIN_avg", "ZR_TMIN_avg_reg", "CP_TMAXTMIN_avg_reg", "ZR_DTR_avg", "ZR_DTR_avg_reg"]],
    ["Regen", "niederschlag.png", ["ZR_PRCP_kum", "ZR_PRCP_kum_reg"]],
    ["Schnee", "schnee.png", ["ZR_SNOW_kum", "ZR_SNOW_kum_reg", "ZR_SNWD_kum", "ZR_SNWD_kum_reg"]],
    ["Hitze", "hitzewellen.png", ["ZX_TMAX_ext"]],
    ["Kälte", "kaeltewellen.png", ["ZX_TMIN_ext"]],
    ["Dauerregen", "dauerregen.png", ["ZX_PRCP_ext"]],
    ["Starkregen", "starkregen.png", ["ZX_PRCP_ext"]],
    ["Schneechaos", "schneechaos.png", ["ZX_SNOW_ext", "ZX_SNWD_ext"]],
    ["Glatteis", "glatteisgefahr.png", ["ZX_SNOW_ext", "ZX_SNWD_ext"]],
    ["Höhe", "hoehe.png", ["HY_TMAX_height", "HY_TMIN_height", "ZR_PRPC_kum_height", "ZR_SNOW_kum_height", "ZR_SNWD_kum_height"]],
    ["Bevölkerung", "bevoelkerung.png", ["ZR_TMAX_avg_popd", "ZR_TMIN_avg_popd", "ZR_PRCP_avg_popd", "ZR_SNOW_avg_popd", "ZR_SNWD_avg_popd"]],
    ["Landnutzung", "landnutzung.png", ["ZR_TMAX_avg_zind", "ZR_TMIN_avg_zind", "ZR_PRCP_avg_zind", "ZR_SNOW_avg_zind", "ZR_SNWD_avg_zind"]],
];


async function show() {
    screenConfig = getDisplayInfo();
    console.log(screenConfig);
    debugger;
    // addLocation ist ein Hook - hier kommt als Zwischenschritt die Themenauswahl
    // beim Zufügen von Locations zu einer vorhandenen Location wird das nicht 
    // angeboten, zum Wechsel muss der User zurück in die Themenauswahl
    await kli3010.show(structuredClone(screenConfig), addLocation);
    globalThis.help = createHelp({
        url: "/help/klima-help-de.html"
    });
}

/**
 * follow-up events auf Theme-Kachel, ergänzen von Auswertungen zu bestehenden pages
 */
$(document).on("click", "button.topicselectiondone", async function (evt) {
    evt.preventDefault();
    let topicindex = $(this).attr("topicindex");
    let topic = JSON.parse($(this).attr("topic"));
    let theme = topic;
    let themename = topic[0];
    let ifound = false;

    for (let oldtheme of themeControl) {
        if (themename === oldtheme[0]) {
            ifound = true;
            break;
        }
    }
    if (ifound === false) {
        themeControl.push(topic);
    } else {
        // Thema ist bereit ausgegeben, daher nur Positionierung
        let helpkey = topic[2][0];
        let target = $("article[data-theme='" + topic[0] + "'][data-helpkey='" + helpkey + "']").first()[0];
        kli6900.scrollTop(target);
        return;
    }
    // neues Topic = Theme für alle vorhandenen Locations
    let index = -1;
    for (let locationInstance of locationInstances) {
        index++;
        //let firstpage = await locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets, theme);
        let coredata = locationInstance.getCoreData();
        /* criticalDays, topicParms, containerid, mode, location, locationkey, 
        geosets, extdays, records, recindex */
        let containerid = coredata.containerid;
        let colIndex = index;
        let newmode = coredata.mode;
        let newlocation = coredata.location;
        let newgeosets = coredata.geosets;
        // Prüfen, ob das theme bereits angezeigt wird
        await locationInstance.addTopics(containerid, colIndex, newmode, newlocation, newgeosets, theme);
    }
    // hier fehlt noch die Positionierung
    let helpkey = topic[2][0];
    let target = $("article[data-theme='" + topic[0] + "'][data-helpkey='" + helpkey + "']").first()[0];
    kli6900.scrollTop(target);
});




async function showThemeSelection() {
    return new Promise(function (resolve, reject) {
        let containerid = "themes" + (Math.floor(Math.random() * 1000000) + 1000000);
        if ($("div.row.themescontainer").length === 0) {
            $("body")
                .append($("<div/>", {
                    id: containerid,
                    class: "row themescontainer",
                    css: {
                        "backgroundColor": "#dceef9;",
                        "touch-action": "pan-y",
                        width: "100%"
                    }
                }));
        } else {
            containerid = $("div.row.themescontainer").attr("id");
        }
        let container = document.getElementById(containerid);

        const section = $("<section>", {
            class: "topic-selection"
        }).appendTo(container);
        const header = $("<h2>", {
            text: "Mit welchem Thema möchtest Du beginnen?"
        }).appendTo(section);
        const grid = $("<div>", {
            class: "topic-grid"
        }).appendTo(section);
        let topicindex = -1;
        climateThemes.forEach(function (topic) {
            let themeimg = topic[1];
            topicindex++;
            $(grid)
                .append($("<button>", {
                    class: "topic topicselection",
                    topicindex: topicindex,
                    topic: JSON.stringify(topic),
                    /*
                    click: function (evt) {
                        evt.preventDefault();
                        if (typeof resolve === "undefined") {
                            alert("schön wärs");
                        }
                        resolve(topic);
                    }
                    */
                })
                    .append($("<img/>", {
                        class: "topic-icon",
                        src: "img/climatethemes/" + themeimg,
                    }))
                    .append($("<span/>", {
                        class: "topic-title",
                        html: topic[0]
                    }))
                );
            /*    
            button.on("click", function () {
                        // Auswahl bestätigen
                        resolve(topic);
                    });
                */
        });
        let target = $("div.row.themescontainer")[0];
        kli6900.scrollTop(target);
        $("div.row.themescontainer").on("click", ".topicselection", async function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
            let topicindex = $(this).attr("topicindex");
            let topic = JSON.parse($(this).attr("topic"));
            if ($(this).hasClass("topicselectiondone")) {
                // hier für alle locations neue article einfügen,
                // wenn diese noch nicht vorhanden sind
                // addTopics
                alert("sollte nicht passieren");
            } else {
                $("div.row.themescontainer").off("click", ".topicselection");
                let buttons = $("div.row.themescontainer").find("button.topicselection").toArray();
                for (let button of buttons) {
                    $(button).removeClass("topicselectiondone");
                    $(button).addClass("topicselectiondone");
                    $(button).removeClass("topicselection");
                }
                // Prüfen, ob topic in themeControl steht und ergänzen, wenn erforderlich
                let themename = topic[0];
                let ifound = false;
                for (let oldtheme of themeControl) {
                    if (themename === oldtheme[0]) {
                        ifound = true;
                        break;
                    }
                }
                if (ifound === false) {
                    themeControl.push(topic);
                }
                resolve(topic);
            }
        });
    });
}



// Dies ist der Hook
async function addLocation(newlocation, geosets, locationtype) {

    let visiblelocations = $("#activelocations").find("a").toArray();
    if (visiblelocations.length >= 3) {
        alert("not more than 3 locations allowed in one Analysis");
        return;
    }

    // check if already in analysis
    let found = false;
    for (let visiblelocation of visiblelocations) {
        let locname = $(visiblelocation).attr("locname");
        let geonameid = $(visiblelocation).attr("geonameid");
        if (locname === newlocation.locname && geonameid === newlocation.geonameid) {
            found = true;
            break;
        }
    }
    if (found === true) {
        alert("location already in use");
        return;
    }

    // Zufügen zu activelocations
    $("#activelocations")
        .append($("<a/>", {
            css: {
                "margin-right": "10px"
            },
            href: "",
            html: newlocation.locname + " (" + newlocation.geonameid + ")",
            locname: newlocation.locname,
            geonameid: newlocation.geonameid
        }));

    let oldlocations = kli6900.getCookie("oldlocations");
    if (oldlocations === null) {
        oldlocations = {};
    }
    oldlocations[newlocation.geonameid] = {
        geonameid: newlocation.geonameid,
        locname: newlocation.locname,
        latitude: newlocation.latitude,
        longitude: newlocation.longitude,
        country_code: newlocation.country_code,
        tsupd: new Date().toISOString()
    }
    kli6900.setCookie("oldlocations", JSON.stringify(oldlocations));

    console.log(newlocation);
    // hier ist der Punkt: wenn locationInstances === 0, dann Anzeige Themenauswahl
    // sonst verbleibt die Themenauswahl
    let theme = null;
    if (locationInstances.length === 0) {
        theme = await showThemeSelection();
        // nur zufügen, wenn noch nicht vorhanden
        let found = false;
        for (let thistheme of themeControl) {
            if (thistheme[0] === theme[0]) {
                found = true;
                break;
            }
        }
        if (found = false) {
            themeControl.push(theme);
        }
    } else {
        // hier muss themeControl genutzt werden, um die bestehenden themes abzuarbeiten!!!
    }
    if (screenConfig.mode === "mobile") {
        let locIndex = locationInstances.length;
        locationInstances[locIndex] = kli3020.createLocation();
        let containerid = "cont" + (Math.floor(Math.random() * 1000000) + 1000000);
        if ($("div.row.maincontainer").length === 0) {
            $("body")
                .append($("<div/>", {
                    id: containerid,
                    class: "row maincontainer",
                    css: {
                        "backgroundColor": "#dceef9;",
                        "touch-action": "pan-y",
                        width: "100%"
                    }
                }));
            let container = document.getElementById(containerid);
            destroyer = swipeFactory(container, onSwipe);
        } else {
            containerid = $("div.row.maincontainer").attr("id");
        }
        let firstpage = null;
        for (theme of themeControl) {
            let thispage = await locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets, theme);
            if (firstpage === null) {
                firstpage = structuredClone(thispage);
            }
        }
        //let firstpage = await locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets, theme);
        //  firstpage.topicstring = topicstring; firstpage.type = "page";
        //  firstpage.colIndex = colIndex; firstpage.locationkey = locationkey; firstpage.locname = location.locname;
        if (typeof firstpage.topicstring !== "undefined") {
            let firsttopic = firstpage.topicstring;
            let colindex = firstpage.colIndex;
            let target = $("article.page.mobile[data-topic='" + firsttopic + "'][data-colindex='" + colindex + "']");
            if ($(target).length > 0) {
                let targetid = $(target).attr("id");
                let targetSlider = document.getElementById(targetid);
                let navHeight = document.querySelector("nav").offsetHeight;
                let rect = targetSlider.getBoundingClientRect();
                let top = window.scrollY + rect.top - navHeight;
                window.scrollTo({
                    top,
                    behavior: "instant"
                });
            }
        }
    } else if (screenConfig.mode == "desktop") {
        let locIndex = locationInstances.length;
        locationInstances[locIndex] = kli3020.createLocation();
        let containerid = "cont" + (Math.floor(Math.random() * 1000000) + 1000000);
        if ($("div.maincontainer").length === 0) {
            $("body")
                .append($("<div/>", {
                    id: containerid,
                    class: "row maincontainer",
                    css: {
                        "backgroundColor": "#dceef9;",
                        "touch-action": "pan-y",
                        width: "100%"
                    }
                }));
        }
        let firstpage = null;
        for (theme of themeControl) {
            let thispage = await locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets, theme);
            if (firstpage === null) {
                firstpage = structuredClone(thispage);
            }
        }
        //  firstpage.topicstring = topicstring; firstpage.type = "page";
        //  firstpage.colIndex = colIndex; firstpage.locationkey = locationkey; firstpage.locname = location.locname;
        if (typeof firstpage.topicstring !== "undefined") {
            let firsttopic = firstpage.topicstring;
            let target = $("article.page.desktop[data-topic='" + firsttopic + "']");
            if ($(target).length > 0) {
                let targetid = $(target).attr("id");
                let targetSlider = document.getElementById(targetid);
                let navHeight = document.querySelector("nav").offsetHeight;
                let rect = targetSlider.getBoundingClientRect();
                let top = window.scrollY + rect.top - navHeight;
                window.scrollTo({
                    top,
                    behavior: "instant"
                });
            }
        }
    }
}

function swipeFactory(container, onSwipe) {

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let currentSlider = null;

    function pointerDown(event) {
        console.log("pointerDown");
        if (event.pointerType !== "touch") return;

        currentSlider = event.target.closest(".slider.mobile");

        startX = event.clientX;
        startY = event.clientY;
        tracking = true;
    }

    function pointerUp(event) {
        console.log("pointerUp");
        if (!tracking) return;
        tracking = false;
        let dx = event.clientX - startX;
        let dy = event.clientY - startY;
        // Mindestbewegung 50 Pixel
        if (Math.abs(dx) < 50) return;
        // Horizontale Bewegung muss dominieren
        if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
        let direction = dx < 0 ? 1 : -1;
        onSwipe(direction, container, currentSlider);
    }

    function pointerCancel() {
        console.log("pointerCancel");
        tracking = false;
    }

    container.addEventListener("pointerdown", pointerDown);
    container.addEventListener("pointerup", pointerUp);
    container.addEventListener("pointercancel", pointerCancel);

    function destroy() {
        container.removeEventListener("pointerdown", pointerDown);
        container.removeEventListener("pointerup", pointerUp);
        container.removeEventListener("pointercancel", pointerCancel);
    }
    return { destroy };
}


function onSwipe(direction, container, currentSlider) {
    // direction 1 = nach links; -1 = nach rechts
    console.log("onSwipe");
    console.log(currentSlider.dataset); // "42"
    // <article id="dp1082323" class="col col-12  slider desktop" 
    // data-colindex="0" data-topic="Zeitreihe_yeardata_PRCP_kum" data-place="Trippelsdorf 2821102" 
    // data-title="Zeitreihe" data-datasource="yeardata" data-variable="PRCP" 
    // data-method="kum" data-altmethod1="" data-altmethod2=""></article>
    // navigation mit direction, colindex und data-topic

    let $currentPage = $(currentSlider).find(".page.mobile");
    let currentPageId = $currentPage.attr("id");
    let pageElement = document.getElementById(currentPageId);
    let dataset = pageElement.dataset;
    let colIndex = parseInt(dataset.colindex);
    if (direction === 1) {
        colIndex = colIndex - 1;
        if (colIndex >= 0) {
            let topic = dataset.topic;
            let topics = $("article.page.mobile[data-topic='" + topic + "']").toArray();
            for (let t of topics) {
                let tid = $(t).attr("id");
                let dataelement = document.getElementById(tid);
                let dataset = dataelement.dataset;
                console.log(dataset);
            }
            let target = $("article.page.mobile[data-topic='" + topic + "'][data-colindex='" + colIndex + "']");
            if ($(target).length > 0) {
                let targetid = $(target).attr("id");
                let targetSlider = document.getElementById(targetid);
                let navHeight = document.querySelector("nav").offsetHeight;
                let rect = targetSlider.getBoundingClientRect();
                let top = window.scrollY + rect.top - navHeight;
                window.scrollTo({
                    top,
                    behavior: "instant"
                });
            }
        }
    } else if (direction === -1) {
        colIndex = colIndex + 1;
        if (colIndex >= 0) {
            let topic = dataset.topic;
            let topics = $("article.page.mobile[data-topic='" + topic + "']").toArray();
            for (let t of topics) {
                let tid = $(t).attr("id");
                let dataelement = document.getElementById(tid);
                let dataset = dataelement.dataset;
                console.log(dataset);
            }
            let target = $("article.page.mobile[data-topic='" + topic + "'][data-colindex='" + colIndex + "']");
            if ($(target).length > 0) {
                let targetid = $(target).attr("id");
                let targetSlider = document.getElementById(targetid);
                let navHeight = document.querySelector("nav").offsetHeight;
                let rect = targetSlider.getBoundingClientRect();
                let top = window.scrollY + rect.top - navHeight;
                window.scrollTo({
                    top,
                    behavior: "instant"
                });
            }
        }
    }

    //let currentSlider = getCurrentSlider(container);
    //handleSwipe(direction)

}

function handleSwipe(direction) {

    let currentContainer = locations[currentIndex];

    let currentSlider = getCurrentSlider(
        currentContainer
    );

    if (!currentSlider) return;

    let islider = [...currentContainer.children]
        .indexOf(currentSlider);

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= locations.length) {
        return;
    }

    let targetContainer = locations[nextIndex];
    let targetSlider = targetContainer.children[islider];

    if (!targetSlider) return;

    currentIndex = nextIndex;

    // Standort wechseln und zur ersten Page
    // des entsprechenden Sliders navigieren
}

function getCurrentSlider(container) {

    let sliders = [...container.querySelectorAll(
        ":scope > .place-slider"
    )];

    let containerTop = container.getBoundingClientRect().top;

    let current = null;

    for (let slider of sliders) {
        let rect = slider.getBoundingClientRect();

        if (rect.top <= containerTop + 10 &&
            rect.bottom > containerTop + 10) {

            current = slider;
            break;
        }
    }

    return current;
}


function getDisplayInfo() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let portrait = window.matchMedia(
        "(orientation: portrait)"
    ).matches;
    let touch = window.matchMedia(
        "(pointer: coarse)"
    ).matches;
    let columns = width >= 1100 ? 3
        : width >= 700 ? 2
            : 1;
    const mode = window.matchMedia("(min-width: 1100px)")
        .matches ? "desktop" : "mobile";
    const sliderMode = mode === "mobile"
        ? "isolated"
        : "shared";
    let result = {
        mode: mode,   // desktop oder mobile
        sliderMode: sliderMode,   // isolated oder shared
        width,
        height,
        orientation: portrait ? "portrait" : "landscape",
        touch,
        columns
    };
    return result;
}


export {
    show
}