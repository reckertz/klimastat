//kli3000.js - Mobile und Desktop Klimaanalyse zu places
// Steuerprogramm für das Layout und das UI

import * as kli3010 from "/modules/kli3010.js";
import * as kli3020 from "/modules/kli3020.js";

let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
let cancelsign = "&#10005;"; // x oder &#x25CF;
let okletter = "✓";
let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

let $main = $("#application");

let $stat = [];

let screenConfig = null;
let locationInstances = [];
let destroyer = null;

async function show() {
    screenConfig = getDisplayInfo();
    console.log(screenConfig);
    debugger;
    kli3010.show(structuredClone(screenConfig), addLocation);
}

async function addLocation(newlocation, geosets) {
    console.log(newlocation);
    alert(newlocation.locname);
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
                        "touch-action": "pan-y",
                        width: "100%"
                    }
                }));
            let container = document.getElementById(containerid);
            destroyer = swipeFactory(container, onSwipe);
        } else {
            containerid = $("div.row.maincontainer").attr("id");
        }
        locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets);
    } else if (screenConfig.mode == "desktop") {
        let locIndex = locationInstances.length;
        locationInstances[locIndex] = kli3020.createLocation();
        let containerid = "cont" + (Math.floor(Math.random() * 1000000) + 1000000);
        if ($("div.maincontainer").length === 0) {
            $("body")
                .append($("<div/>", {
                    id: containerid,
                    //class: "row maincontainer"
                    css: {
                        "touch-action": "pan-y",
                        width: "100%"
                    }
                }));
        }
        locationInstances[locIndex].addTopics(containerid, locIndex, screenConfig.mode, newlocation, geosets);
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
    // 0: id, 1: class, 2: data-topic, 3: data-title, 4: data-datasource
    // 5: data-variable, 6: data-method, 7: data-altmethod1, 8: data-altmethod2

    //altmethod1: "" altmethod2: "" datasource: "yeardata" method:  "kum" 
    //title: "Zeitreihe" topic: "Zeitreihe_yeardata_PRCP_kum" variable: "PRCP"
    // es fehlt die location, die hängt auf der page
    // <article id="dp1082323" class="col col-12  slider desktop" 
    // data-colindex="0" data-topic="Zeitreihe_yeardata_PRCP_kum" data-place="Trippelsdorf 2821102" 
    // data-title="Zeitreihe" data-datasource="yeardata" data-variable="PRCP" 
    // data-method="kum" data-altmethod1="" data-altmethod2=""></article>
    // navigation mit direction, colindex und data-topic
    debugger;
    let $currentPage = $(currentSlider).find(".page.mobile");
    let currentPageId = $currentPage.attr("id");
    let pageElement = document.getElementById(currentPageId);
    let dataset = pageElement.dataset;
    let colIndex = parseInt(dataset.colindex);
    if (direction === 1) {
        colIndex = colIndex - 1;
        if (colIndex >= 0) {
            let topic = dataset.topic;
            let target = $("article.page.mobile[data-topic='" + topic + "'][data-colindex=" + colIndex + "]");
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });
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
            debugger;
            let target = $("article.page.mobile[data-topic='" + topic + "'][data-colindex='" + colIndex + "']");
            if ($(target).length > 0) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
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