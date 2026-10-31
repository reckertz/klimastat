// placeScroller.js

export function placeScroller(args = {}) {
    // args mit container, onChange
    // Konventionen!
    // "#place-container" => ".place-slider" => ".place-page"
    const container = document.querySelector(
        args.container || "#place-container"
    );
    if (!container) {
        throw new Error("place-container nicht gefunden");
    }
    let sliders = [];
    let currentSlider = 0;
    let currentPage = 0;
    let destroyed = false;
    const onChange = args.onChange || function () { };

    // --------------------------------------------------
    // Hilfsfunktionen
    // --------------------------------------------------

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getPages(slider) {
        if (!slider) return [];
        return Array.from(
            slider.querySelectorAll(":scope > .place-page")
        );
    }

    function getPageCount(islider) {
        return getPages(sliders[islider]).length;
    }

    function getCurrent() {
        return {
            islider: currentSlider,
            ipage: currentPage,
            sliderCount: sliders.length,
            pageCount: getPageCount(currentSlider)
        };
    }

    function notify() {
        onChange(getCurrent());
    }

    // --------------------------------------------------
    // Position eines Elements im Scrollcontainer
    // --------------------------------------------------
    function getScrollPosition(element, parent, axis) {
        const elementRect = element.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        if (axis === "x") {
            return elementRect.left
                - parentRect.left
                + parent.scrollLeft;
        }
        return elementRect.top
            - parentRect.top
            + parent.scrollTop;
    }

    // --------------------------------------------------
    // Nächstgelegenes Element ermitteln
    // --------------------------------------------------
    function nearestIndex(elements, parent, axis) {
        if (!elements.length) return 0;
        const position = axis === "x"
            ? parent.scrollLeft
            : parent.scrollTop;
        let result = 0;
        let distance = Infinity;
        elements.forEach((element, index) => {
            const offset = getScrollPosition(
                element, parent, axis
            );
            const delta = Math.abs(offset - position);
            if (delta < distance) {
                distance = delta;
                result = index;
            }
        });
        return result;
    }

    // --------------------------------------------------
    // Positionierung
    // --------------------------------------------------
    function positionPage(slider, ipage, smooth = false) {
        const pages = getPages(slider);
        if (!pages.length) return;
        ipage = clamp(ipage, 0, pages.length - 1);
        pages[ipage].scrollIntoView({
            behavior: smooth ? "smooth" : "instant",
            block: "nearest",
            inline: "start",
            container: "nearest"
        });
    }
    /*
    function positionPage(slider, ipage, smooth = false) {
        const pages = getPages(slider);
        if (!pages.length) return;
        ipage = clamp(ipage, 0, pages.length - 1);
        pages[ipage].scrollIntoView({
            behavior: smooth ? "smooth" : "instant",
            block: "start",
            inline: "nearest",
            container: "nearest"
        });
    }
    */

    function positionSlider(islider, smooth = false) {
        const slider = sliders[islider];
        if (!slider) return;
        slider.scrollIntoView({
            behavior: smooth ? "smooth" : "instant",
            block: "start",
            inline: "nearest",
            container: "nearest"
        });
    }
    /*
    function positionSlider(islider, smooth = false) {
        const slider = sliders[islider];
        if (!slider) return;
        slider.scrollIntoView({
            behavior: smooth ? "smooth" : "instant",
            block: "nearest",
            inline: "start",
            container: "nearest"
        });
    }
    */

    // --------------------------------------------------
    // Zentrale Navigation
    // --------------------------------------------------
    function show(islider, ipage = currentPage, smooth = true) {
        if (destroyed || !sliders.length) return;
        islider = clamp(islider, 0, sliders.length - 1);
        const pageCount = getPageCount(islider);
        if (!pageCount) return;
        ipage = clamp(ipage, 0, pageCount - 1);
        const changed =
            islider !== currentSlider ||
            ipage !== currentPage;
        currentSlider = islider;
        currentPage = ipage;
        // Alle Topics auf dieselbe Location ausrichten
        sliders.forEach(slider => {
            positionPage(slider, currentPage, false);
        });
        // Gewünschtes Topic anzeigen
        positionSlider(currentSlider, smooth);
        if (changed) {
            notify();
        }
    }

    // --------------------------------------------------
    // Nachträgliches Einfügen Slider
    // --------------------------------------------------

    function insertDrilldown(createPages) {
        const state = scroller.getCurrent();
        const currentSlider = $(".place-slider").eq(state.islider);
        const newSlider = $("<div>", {
            class: "place-slider"
        });
        for (let ipage = 0; ipage < state.pageCount; ipage++) {
            const page = $("<div>", {
                class: "place-page"
            });
            createPages(page, ipage);
            newSlider.append(page);
        }
        currentSlider.after(newSlider);
        scroller.refresh();
        scroller.show(state.islider + 1, state.ipage);
        return newSlider;
    }



    // --------------------------------------------------
    // Horizontales Scrollende
    // --------------------------------------------------
    function handleHorizontalScrollEnd(event) {
        //console.log("***handleHorizontalScrollEnd");
        if (destroyed) return;
        const slider = event.currentTarget;
        if (event.target !== slider) return;
        const islider = sliders.indexOf(slider);
        if (islider !== currentSlider) return;
        const pages = getPages(slider);
        const ipage = nearestIndex(
            pages,
            slider,
            "x"
        );
        if (ipage === currentPage) return;
        show(currentSlider, ipage, false);
    }
    /*
    function handleHorizontalScrollEnd(event) {
        console.log("***handleHorizontalScrollEnd");
        if (destroyed) return;
        if (event.target !== container) return;
        const islider = nearestIndex(
            sliders,
            container,
            "x"
        );
        if (islider !== currentSlider) {
            show(islider, currentPage, false);
        }
    }
    */
    // --------------------------------------------------
    // Vertikales Scrollende
    // --------------------------------------------------
    function handleVerticalScrollEnd(event) {
        //console.log("***handleVerticalScrollEnd");
        if (destroyed) return;
        if (event.target !== container) return;
        const islider = nearestIndex(
            sliders,
            container,
            "y"
        );
        if (islider === currentSlider) return;
        show(islider, currentPage, false);
    }

    /*
    function handleVerticalScrollEnd(event) {
        console.log("***handleVerticalScrollEnd");
        if (destroyed) return;
        const slider = event.currentTarget;
        // Nur Events des jeweiligen Sliders
        if (event.target !== slider) return;
        const islider = sliders.indexOf(slider);
        // Nur das sichtbare Topic berücksichtigen
        if (islider !== currentSlider) return;
        const pages = getPages(slider);
        const ipage = nearestIndex(
            pages,
            slider,
            "y"
        );
        if (ipage !== currentPage) {
            show(currentSlider, ipage, false);
        }
    }
    */
    // --------------------------------------------------
    // Navigation über Buttons
    // --------------------------------------------------

    function nextSlider() {
        show(currentSlider + 1, currentPage);
    }

    function previousSlider() {
        show(currentSlider - 1, currentPage);
    }

    function nextPage() {
        show(currentSlider, currentPage + 1);
    }

    function previousPage() {
        show(currentSlider, currentPage - 1);
    }

    // --------------------------------------------------
    // DOM-Struktur aktualisieren
    // --------------------------------------------------

    function refresh() {
        //console.log("***refresh");
        if (destroyed) return;
        // Alte Listener entfernen
        sliders.forEach(slider => {
            slider.removeEventListener(
                "scrollend",
                handleHorizontalScrollEnd
            );
        });
        // Slider neu einlesen
        sliders = Array.from(
            container.querySelectorAll(":scope > .place-slider")
        );

        sliders.forEach((slider, islider) => {
            slider.dataset.islider = islider;
            const pages = getPages(slider);
            pages.forEach((page, ipage) => {
                page.dataset.ipage = ipage;
            });
            // Listener registrieren
            slider.addEventListener(
                "scrollend",
                handleHorizontalScrollEnd
            );
        });
        currentSlider = clamp(
            currentSlider, 0, Math.max(0, sliders.length - 1)
        );
        currentPage = clamp(
            currentPage,
            0,
            Math.max(0, getPageCount(currentSlider) - 1)
        );
        show(currentSlider, currentPage, false);
    }

    // --------------------------------------------------
    // Destroy
    // --------------------------------------------------
    function destroy() {
        if (destroyed) return;
        destroyed = true;
        container.removeEventListener(
            "scrollend",
            handleVerticalScrollEnd
        );
        sliders.forEach(slider => {
            slider.removeEventListener(
                "scrollend",
                handleHorizontalScrollEnd
            );
        });
        sliders = [];
    }

    // --------------------------------------------------
    // Initialisierung
    // --------------------------------------------------
    container.addEventListener(
        "scrollend",
        handleVerticalScrollEnd
    );

    refresh();
    return {
        show,
        nextSlider,
        previousSlider,
        nextPage,
        previousPage,
        getCurrent,
        refresh,
        insertDrilldown,
        destroy
    };
}