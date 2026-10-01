/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000B = {};

    /**
     * Landkartenbezogene Funktionen mit leaflet
     * ACHTUNG: gilt nur für EINE map und EINE mapid!!!
     * also: entweder worldmap oder countrymap oder bboxmap abrufen!!!
     * ein Wechsel ist nicht möglich,
     * es muss also ein neuer container für eine neue map vorgegeben werden
     */
    kli1000B.mapService = function () {
        let map = null;
        let mapid = null;
        let layerControl = {};
        let overlayLayers = new Map();  // gezielt redundant zu layerControl
        let countryLayer;  // ist undefined
        let cb = null;     // Callback
        /**
        * showWorldMap - Weltkarte anzeigen
        *
        * @param {any} containerid - div für die leaflet map
        * @param {any} centerlocation - geopoint, der das Zentrum darstellt
        * @param {any} geopoints - Array von geopoints
        * @param {any} imagetype - natural oder nasa
        * 
        * ein geopoint muss mindestens haben: latitude, longitude, geoname, source, stationid
        * zusätzlich optional: layername, symboltype, symbolvalue
        *
        * @returns {any} - { worldmap, worldmapid }
        * Ausgabe leaflet in containerid mit mapid und map
        * image ist hier ein Symbol: natural oder nasa
        */
        async function showWorldMap(containerid, imagetype) {

            let data1 = {
                timeout: 10 * 60 * 1000,
            };
            let searchParms = new URLSearchParams(data1);
            let startTime = new Date();
            let response = await fetch("/checkNaturalTiles", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                //make sure to serialize your JSON body bei POST, dann einfache url
                body: JSON.stringify(data1)
            });
            let ret1 = await response.json();
            if (ret1.error === false) {
                kli6900.putMessage(ret1.message, 1);
            } else {
                kli6900.putMessage(ret1.message, 3);
            }
            layerControl = {};
            if (map !== null) {
                map.remove();
            }
            if (mapid !== null) {
                $("#" + mapid).children().remove();
            }

            mapid = containerid;
            let pw = $("#" + mapid).parent().width();
            $("#" + mapid).width(pw * 0.9);
            let h = $("#" + mapid).height();
            if (h === null) {
                let navh = $("nav.header").height();
                let scrh = $("body").height();
                h = scrh - navh * 3.5;
                $("#" + mapid).height(h + "px");
            }

            let maxZoom = 10;
            map = L.map(mapid, {
                //crs: EquirectangularCRS,
                crs: L.CRS.EPSG4326,
                preferCanvas: true,  // ists im Test, mal sehen
                minZoom: 0,
                maxZoom: maxZoom,
                zoomSnap: 0.1,
                zoomDelta: 0.1
            });

            //let imageUrl = "/img/Blue_Marble_2002_1x.jpg"
            let southWestLat = -90;
            let southWestLng = -180;
            let northEastLat = 90;
            let northEastLng = 180;
            let imageBounds = [
                [southWestLat, southWestLng],
                [northEastLat, northEastLng]
            ];

            let naturalUrl = "/" + ["img", "natural", "natural.jpg"].join("/");
            //let natural = L.imageOverlay(naturalUrl, imageBounds);

            let naturalDir = "/" + ["img", "natural", "tiles", "{z}", "{x}", "{y}.jpg"].join("/");
            let natural = null;
            try {
                natural = L.tileLayer(
                    //"/naturalearth/{z}/{x}/{y}.jpg",
                    naturalDir,
                    {
                        minZoom: 0,
                        maxNativeZoom: 5, // das entspricht der tile-Auflösung
                        maxZoom: maxZoom,      // klassische Vergrößerung ab Level 6, hier: 10
                        tileSize: 256,
                        noWrap: true,
                        attribution: "Natural Earth"
                    }
                );
            } catch (err) {
                console.log(err.stack);
            }
            let nasaUrl = "/" + ["img", "nasa", "blue_marble.jpg"].join("/");
            let nasa = L.imageOverlay(nasaUrl, imageBounds);

            natural.addTo(map);

            layerControl = L.control.layers({
                Natural: natural,
                Nasa: nasa
            }).addTo(map);

            map.invalidateSize(false);
            // View auf das Bild setzen
            map.fitBounds(imageBounds, { animate: false });
            let worldmap = map;
            let worldmapid = mapid;
            return { worldmap, worldmapid, layerControl };
        }


        let onMarkerClickDefault = async function (e) {
            console.log("onMarkerClick");
            let stationcore = this.options;
            console.log("onMarkerClick:" + JSON.stringify(stationcore));
            if (cb !== null) {
                await cb(stationcore, e);
            }
            // es sind hier alle Attribute von station über this.options zugreifbar	
            //let tooltip = this.getTooltip();
            //if (tooltip) {
            //    let el = tooltip.getElement(); 
            //}
        };



        async function addMarkerLayer(layername, centerlocation, geopoints, parms) {
            let onMarkerClick;
            if (typeof parms.onMarkerClick !== "undefined") {
                onMarkerClick = parms.onMarkerClick;
            } else {
                onMarkerClick = onMarkerClickDefault;
            }
            let newlayer = L.layerGroup();
            // centerlocation - spezieller Marker, wenn vorhanden
            if (typeof centerlocation !== "undefined" && centerlocation !== null) {
                let geoparms = {
                    id: "Bezugspunkt",
                    latitude: centerlocation.latitude,
                    longitude: centerlocation.longitude,
                    //height: geopoint.height,
                    stationname: "your location"
                };
                // radius, color, fill: true berechnen aus source, variable
                geoparms.radius = 7;
                geoparms.fill = true;
                geoparms.color = "pink";
                geoparms.fillColor = "red";
                geoparms.fillOpacity = 1;
                //L.circleMarker([geopoint.latitude, geopoint.longitude]).addTo(newlayer);
                let marker2 = L.circleMarker([centerlocation.latitude, centerlocation.longitude], geoparms);
                marker2.addTo(newlayer);
            }

            for (let geopoint of geopoints) {
                let geoparms = {
                    id: geopoint.source + "_" + geopoint.stationid + "_" + geopoint.variable,
                    latitude: geopoint.latitude,
                    longitude: geopoint.longitude,
                    height: geopoint.height,
                    stationname: geopoint.stationname,
                    source: geopoint.source,
                    stationid: geopoint.stationid,
                    variable: geopoint.variable
                };
                // radius, color, fill: true berechnen aus source, variable
                geoparms.radius = 3;
                geoparms.fill = true;
                //L.circleMarker([geopoint.latitude, geopoint.longitude]).addTo(newlayer);
                let marker2 = L.circleMarker([geopoint.latitude, geopoint.longitude], geoparms);

                let geopointtitle = geopoint.stationname;
                if (typeof geopoint.variable !== "undefined") {
                    geopointtitle += " (" + geopoint.variable + ")";
                }
                let html = '<div class="kli1000Btip" style="font-size:8px;padding:1px !important;">' + geopointtitle + '</div>';
                marker2.bindTooltip(html, {
                    interactive: true,
                    background: "green",
                    permanent: true,
                    direction: 'bottom'
                });
                if (typeof onMarkerClick === "function") {
                    marker2.on('click', onMarkerClick);
                }
                marker2.addTo(newlayer);
            }
            layerControl.addOverlay(newlayer, layername);
            overlayLayers.set(layername, newlayer);
            newlayer.addTo(map);
            //$(".kli1000Btip").parent().css({
            //    padding: "0 !important"
            //});
            let tips = $(".kli1000Btip").toArray();
            for (let tip of tips) {
                $(tip).parent().css({
                    padding: "0 !important"
                });
            }
        }

        async function addCountryLayer(alpha3) {
            //async function showCountryByAlpha3(alpha3, countryname) {
            let sql = "SELECT adm0_a3, name, entity_type, geometry_type, geometry ";
            sql += " FROM KLIGEOCOUNTRIES";
            if (alpha3 === null) {

            } else if (typeof alpha3 === "string") {
                sql += " WHERE adm0_a3 = '" + alpha3 + "'";
            } else if (typeof alpha3 === "object" && Array.isArray(alpha3) && alpha3.length > 0) {
                sql += " WHERE adm0_a3 IN ('" + alpha3.join("', '") + "')";
            }
            sql += " ORDER BY adm0_a3";
            console.log(sql);
            let data1 = {
                timeout: 10 * 60 * 1000,
                sel: sql,
                skip: 0,
                limit: 0
            }
            let searchParms = new URLSearchParams(data1);
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
            // map steht zur Verfügung
            // const imageLayer = L.imageOverlay(imageUrl, bounds).addTo(map);
            if (ret1.error === false && ret1.records !== "undefined" && ret1.records !== null &&
                Array.isArray(ret1.records)) {
                let icountry = 0;
                countryLayer = null;  // global hier im Kontext
                for (let record of ret1.records) {
                    icountry++;
                    const countryGeoJSON = {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: record.geometry_type,          // "Polygon" oder "MultiPolygon"
                            coordinates: JSON.parse(record.geometry)
                        }
                    };
                    //let mainland = ghd3003A.checkCountryMainland(countryname, countryGeoJSON);
                    if (icountry === 1) {
                        countryLayer = L.geoJSON(countryGeoJSON, {
                            style: {
                                color: "black",   // "#ff0000",
                                weight: 2,
                                fill: false
                            }
                        }).addTo(map);
                    } else {
                        countryLayer.addData(countryGeoJSON);
                    }
                }
                return {
                    error: false,
                    message: "countryShape vorhanden für " + alpha3
                };
            } else {
                if (alpha3 !== "*none") {
                    kla6900.putMessage("countryShape fehlt für " + alpha3, 3);
                }
                return {
                    error: true,
                    message: "countryShape fehlt für " + alpha3
                };
            }

        }


        function createLeafletToolbar() {
            // map, overlayLayers, countryLayer
            const Toolbar = L.Control.extend({
                options: {
                    position: "topleft"
                },
                onAdd: function () {
                    const container = L.DomUtil.create(
                        "div",
                        "leaflet-bar leaflet-toolbar"
                    );
                    addButton(container, "M", "Fokus auf Marker", focusMarkers);
                    addButton(container, "C", "Fokus auf Länder", focusCountries);
                    addButton(container, "R", "Gesamtdarstellung", resetMap);
                    addButton(container, "T+", "Tooltips ein", showTooltips);
                    addButton(container, "T−", "Tooltips aus", hideTooltips);
                    // Klicks auf Toolbar nicht an Map weitergeben
                    L.DomEvent.disableClickPropagation(container);
                    L.DomEvent.disableScrollPropagation(container);
                    hideTooltips();
                    return container;
                }
            });
            // ---------------------------------------------------------
            // Button erzeugen
            // ---------------------------------------------------------
            function addButton(container, text, title, fn) {
                const button = L.DomUtil.create("a", "", container);
                button.href = "#";
                button.innerHTML = text;
                button.title = title;
                L.DomEvent.on(button, "click", function (e) {
                    L.DomEvent.stop(e);
                    fn();
                });
            }
            // ---------------------------------------------------------
            // 1. BoundingBox aller Marker
            // ---------------------------------------------------------
            function focusMarkers() {
                const bounds = L.latLngBounds();
                for (const layer of overlayLayers.values()) {
                    if (!map.hasLayer(layer)) {
                        continue;
                    }
                    layer.eachLayer(function (item) {
                        if (item instanceof L.Marker ||
                            item instanceof L.CircleMarker) {
                            bounds.extend(item.getLatLng());
                        }
                    });
                }
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [20, 20]
                    });
                }
            }
            // ---------------------------------------------------------
            // 2. BoundingBox Country-Polygons
            // ---------------------------------------------------------
            function focusCountries() {
                if (!countryLayer) {
                    return;
                }
                const bounds = countryLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: [20, 20]
                    });
                }
            }
            // ---------------------------------------------------------
            // ursprüngliche Gesamtdarstellung merken
            // ---------------------------------------------------------
            const initialBounds = map.getBounds();
            function resetMap() {
                map.fitBounds(initialBounds);
            }
            // ---------------------------------------------------------
            // Tooltips
            // ---------------------------------------------------------
            function showTooltips() {
                setPermanentTooltips(true);
            }
            function hideTooltips() {
                setPermanentTooltips(false);
            }
            // ---------------------------------------------------------
            // gemeinsame Marker-Iteration
            // ---------------------------------------------------------
            function setPermanentTooltips(permanent) {
                map.eachLayer(layer => {
                    const tooltip = layer.getTooltip?.();
                    if (tooltip) {
                        tooltip.options.permanent = permanent;
                        if (permanent) {
                            layer.openTooltip();
                        } else {
                            layer.closeTooltip();
                        }
                    }
                });
                let tips = $(".kli1000Btip").toArray();
                for (let tip of tips) {
                    $(tip).parent()[0].style.setProperty("padding", "0", "important");
                }
            }
            const toolbar = new Toolbar();
            toolbar.addTo(map);
            return toolbar;
        } // Toolbar


        return {
            showWorldMap,
            addMarkerLayer,
            addCountryLayer,
            createLeafletToolbar
        };

    };


    // --- Weitere Modul-API ---
    kli1000B.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000B = kli1000B;
})(window);