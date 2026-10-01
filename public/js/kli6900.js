/*jshint sub:true,laxbreak:true,evil:true,esversion:8 */
/*global $,window,module,define,root,global,async,self,this,document,alert */
/*global sysbase,kli6900 */
(function () {
    "use strict";
    var kli6900 = {};
    // test
    var root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;
    /**
     * kli6900 - Systemmoduln für die Klima-App
     */
    kli6900.initUI = function (mode) {
        // config = kli6900.getConfig();
        /**
         * Icons für die Navigation und die Bedienung
         *
         */
        $("nav")
            .append($("<div/>", {
                css: {
                    float: "left"
                }
            })
                .append($("<button/>", {
                    class: "btn btn-danger klirestart",
                    html: "&#x1F680;",
                    title: "Zurück zum Hauptmenue",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let gurl = "index.html?target=kli1000";
                        window.open(gurl, "_self");
                        /*
                          let gurl = "index.html?target=kla1000";
                          let restartWindow = window.open("", "kla1000");
                          console.log("restarted");
                        */
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-danger newmessages",
                    title: "Nachrichten",
                    html: "0",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        kli6900.showMessages();
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info",
                    title: "SQL Kontrolle",
                    html: "SQL",
                    css: {
                        "font-weight": "bolder",
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let h = $(".klicontainerrowwrapper").height();
                        let w = $(".klicontainerrowwrapper").width();
                        let gurl = "index.html?target=kla1100";
                        $('<a href="' + gurl + '" target="_blank">SQL</a>')[0].click();
                        return;
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info klistorage",
                    html: "&#x1F50D;", // U+1F50D
                    title: "Storage",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: async function (evt) {
                        evt.preventDefault();
                        async function hello() {
                            // https://web.dev/storage-for-the-web/
                            if (navigator.storage && navigator.storage.estimate) {
                                const quota = await navigator.storage.estimate();
                                // quota.usage -> Number of bytes used.
                                // quota.quota -> Maximum number of bytes available.
                                let smsg = "Available Storage for IndexedDB etc.";
                                let percentageUsed = (quota.usage / quota.quota) * 100;
                                percentageUsed = percentageUsed.toLocaleString('de-DE', {
                                    minimumFractionDigits: 2
                                });
                                smsg += "\nYou've used " + percentageUsed + "% of the available storage.";
                                let remaining = quota.quota - quota.usage;
                                remaining = remaining.toLocaleString('de-DE', {
                                    minimumFractionDigits: 0
                                });
                                smsg += "\nYou can write up to " + remaining + " more bytes.";
                                smsg += "\nFor technical reasons this information may be unsecure";
                                alert(smsg);
                            } else {
                                alert("Storage Management not available");
                            }
                        }
                        await hello();
                        return;
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info",
                    html: "&#x1F3A8;", // U+1F50D
                    title: "Color-Palette",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        //navigateTo kla1005
                        let gurl = "index.html?target=kla1005";
                        let wname = "_blank";
                        let kla1005handle2 = window.open(gurl, wname); // , wparms
                        kla1005handle2.focus();
                    }
                }))


                .append($("<button/>", {
                    class: "btn btn-info kliprintcontext",
                    html: "PDF", // "&#x1F5A8;",
                    title: "Drucken",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let targetmodule = $(".klicontainer").attr("pageid");
                        let targetfunction = "printDiv";
                        /*
                        let parameters = $(".klicontainer").html();
                        try {
                            window[targetmodule][targetfunction](parameters);
                        } catch (err) {
                            alert(err);
                        }
                        */
                        if (typeof window[targetmodule] !== "undefined" && typeof window[targetmodule][targetfunction] !== "undefined") {
                            let parameters = {
                                html: $(".klicontainer").html(),
                                output: "print",
                            };
                            try {
                                window[targetmodule][targetfunction](parameters);
                            } catch (err) {
                                alert(err);
                            }
                        }
                        return;
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info kliprintcontext",
                    html: "&#x1F5A8;",
                    title: "HTML-Ausgabe",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let targetmodule = $(".klicontainer").attr("pageid");
                        let targetfunction = "printDiv";
                        let parameters = $(".klicontainer").html();
                        try {
                            window[targetmodule][targetfunction](parameters);
                        } catch (err) {
                            alert(err);
                        }
                        //kla7100.printDiv($(".klicontainer").html());
                        return;
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info klisavecontext",
                    html: "&#x1F4BE;", // FLOPPY DISK  U+1F4BE  FLOPPY DISK &#x1F4BE
                    title: "Sichern HTML und Editieren",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let targetmodule = $(".klicontainer").attr("pageid");
                        let targetfunction = "printDiv";
                        if (typeof window[targetmodule] !== "undefined" && typeof window[targetmodule][targetfunction] !== "undefined") {
                            let parameters = {
                                html: $(".klicontainer").html(),
                                output: "file",
                                save: true
                            };
                            try {
                                window[targetmodule][targetfunction](parameters);
                            } catch (err) {
                                alert(err);
                            }
                        }
                        //kla7100.printDiv($(".klicontainer").html());
                        return;
                    }
                }))
                /*
                .append($("<button/>", {
                    class: "btn btn-warning",
                    style: "float: left; margin-left: 20px;",
                    html: "C",
                    title: "Analyse des Source mit Graphischer Aufbereitung der Calls",
                    click: async function (evt) {
                        evt.preventDefault();
                        let list = $(document.querySelectorAll('div[pageid]')).toArray();
                        let pageid = $(list[0]).attr("pageid");
                        if (typeof pageid === "string" && pageid !== "undefined") {
                            let gurl = "index.html?target=ghd6010";
                            gurl += "&caller=" + pageid;
                            gurl += "&modus=old";
                            //let link = "<a href='" + gurl + "' target=_blank>" + stationid + "</a>";
                            let wname = "_blank";
                            let ghd6010handle1 = window.open(gurl, wname);
                            ghd6010handle1.focus();
                        }
                    }
                }))
                */
                .append($("<button/>", {
                    class: "btn btn-warning",
                    style: "float: left; margin-left: 20px;",
                    html: "C*",
                    title: "Test neue Analyse des Source", // mit Graphischer Aufbereitung der Calls",
                    click: async function (evt) {
                        evt.preventDefault();
                        alert("wird ergänzt");
                        /*
                        let list = $(document.querySelectorAll('div[pageid]')).toArray();
                        let pageid = $(list[0]).attr("pageid");
                        if (typeof pageid === "string" && pageid !== "undefined") {
                            let gurl = "index.html?target=ghd6010";
                            gurl += "&caller=" + pageid;
                            gurl += "&modus=new";
                            //let link = "<a href='" + gurl + "' target=_blank>" + stationid + "</a>";
                            let wname = "_blank";
                            let ghd6010handle1 = window.open(gurl, wname);
                            ghd6010handle1.focus();
                        }
                        */
                    }
                }))

                // CAT FACE WITH WRY SMILE	U+1F63C	CAT FACE WITH WRY SMILE	ð¼
                .append($("<span/>", {
                    class: "klishorttitle",
                    css: {
                        "margin-left": "10px",
                        "font-weight": "bold"
                    },
                    html: "&nbsp;",
                }))
                .append($("<span/>", {
                    class: "klimessage",
                    css: {
                        "margin-left": "10px",
                        //display: "inline-block",
                        display: "grid",   // "table-cell",
                        width: "100%",
                        /*-ms-word-wrap: normal;*/
                        "word-wrap": "break-word"
                    },
                    html: "&nbsp;",
                }))
            );
        // $(".newmessages").hide();

    };

    let msgcount = 0;
    let messages = [];
    kli6900.putMessage = function (message, severity, protocol) {
        if (typeof severity === "boolean" && typeof protocol === "undefined") {
            protocol = severity;
            severity = 3;
        }
        console.log("MSG:" + message);
        if (message.indexOf("SQLITE_ERROR") >= 0) {
            console.trace();
        }
        msgcount++;
        if (typeof severity === "undefined") {
            severity = 1;
        }
        messages.unshift({
            message: message,
            severity: severity
        });
        if (messages.length > 50) {
            messages.pop();
        }
        // einen roten Punkt setzen für neue Nachrichten
        // $(".newmessages").show();
        $(".newmessages").css("background-color", "pink");
        $(".newmessages").html(msgcount);

        //if ($(".klimessage").text().trim().length > 0 && message.length > 0) {
        if ($(".klimessage").length > 0 && message.length > 0) {
            $(".klimessage").html(message);
        }

        if (typeof severity !== "undefined" && severity > 1) {
            $(".klimessage").css("background-color", "pink");
        } else {
            $(".klimessage").css("background-color", "white");
        }
        /*
        if (typeof severity !== "undefined" && severity > 3) {
            let splay = [100, 200, 300, 200, 100];
            let a = dtm.data(splay);
            dtm.music().note(a.range(60, 90)).play().for(3);
        }
        */
        if (typeof protocol !== "undefined" && protocol === true) {
            console.log(message);
        }
    };

    kli6900.showMessages = function () {
        let html = "";
        //html += '<div class="modal-dialog modal-dialog-scrollable">';
        html += "<div>Meldungen</div>";
        if (messages.length > 0) {
            html += "<ul>";
            for (let imsg = 0; imsg < messages.length; imsg++) {
                html += "<li";
                if (messages[imsg].severity > 2) {
                    html += " style='background-color:pink;font-weight: bold;'";
                } else if (messages[imsg].severity > 1) {
                    html += " style='font-weight: bold;'";
                }
                html += ">";
                html += messages[imsg].message;
                html += "</li>";
            }
            html += "</ul>";
        }
        //html += "</div>";
        let sm = bootstrap.showAlert({
            modalDialogClass: "modal-dialog modal-dialog-centered modal-dialog-scrollable",
            backdrop: true,
            keyboard: true,
            show: true,
            title: "Meldungen",
            body: html
        });
        $(".newmessages").css("background-color", "grey");
        msgcount = 0;
    };


    kli6900.calculateAutoHeight = function () {
        const element = document.querySelector('.overflow-auto');
        const viewportHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        element.style.maxHeight = `${viewportHeight - elementTop - 20}px`;
    };

    /**
     * Berechnet die Scrollbar-Width eines DOM-Elementes
     * @param {*} el
     */
    kli6900.getScrollbarWidth = function (el) {
        // https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes;
        var parent, child, width;
        if (width === undefined) {
            parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
            child = parent.children();
            width = child.innerWidth() - child.height(99).innerWidth();
            parent.remove();
        }
        return width;
    };


    /**
    * kli6900.lincoordinates
    *
    * @param {any} lat - latitude, wird zu float
    * @param {any} lon - longitude, wird zu float
    * @param {any} radiusKm - int (muss)
    *
    * @returns {any} - Koordinaten für eine BoundingBox latN, lonW, latS, lonE
    */
    kli6900.lincoordinates = function (lat, lon, radiusKm) {
        lat = parseFloat(lat);
        lon = parseFloat(lon);
        const earthRadiusKmPerDeg = 111.32;
        // Umrechnung in Radiant
        const latRad = lat * Math.PI / 180;
        const deltaLat = radiusKm / earthRadiusKmPerDeg;
        const deltaLon = radiusKm / (earthRadiusKmPerDeg * Math.cos(latRad));
        let minLat = lat - deltaLat;
        let maxLat = lat + deltaLat;
        let minLon = lon - deltaLon;
        let maxLon = lon + deltaLon;
        // Clamp Latitude auf gültigen Bereich [-90, 90]
        minLat = Math.max(-90, minLat);
        maxLat = Math.min(90, maxLat);
        // Longitude korrekt normalisieren auf [-180, 180]
        minLon = ((minLon + 180) % 360 + 360) % 360 - 180;
        maxLon = ((maxLon + 180) % 360 + 360) % 360 - 180;
        return {
            //minLat,
            //maxLat,
            //minLon,
            //maxLon
            error: false,
            message: "calculated",
            latN: maxLat,
            lonW: minLon,
            latS: minLat,
            lonE: maxLon
        };
    };



    /**
    * kli6900.getScriptA - Prüfen, ob das Modul schon geladen ist nachladen, wenn erforderlich
    * simuliert in eta require mit dedizierten Regeln
    *
    * @param {any} target - Vorgabe: moduleName, prefix/moduleName, moduleName.js, prefix/moduleName.suffix
    * prefix können lib/ und js/ sind, js/ ist der Default für das Prefix und .js für das Suffix
    *
    * @returns {any} - das Modul wird geladen und window[moduleName] steht zur Verfügung, 
    * usage danach z.B. window[modulName].show(parms);
    */
    kli6900.getScriptA = async function (target) {

        function splitName(value) {


            let prefix = "";
            let suffix = "";
            let name = value;

            if (name.startsWith("lib/")) {
                prefix = "lib/";
                name = name.slice(4);
            } else if (name.startsWith("js/")) {
                prefix = "js/";
                name = name.slice(3);
            }

            if (name.endsWith(".js")) {
                suffix = ".js";
                name = name.slice(0, -3);
            }
            let modulename = name;
            return { prefix, modulename, suffix };
        }

        if (typeof target === "undefined" || target === null || typeof target === "string" && target.length === 0) {
            return ({
                error: true,
                message: target + " no definition"
            });
        }

        let { prefix, modulename, suffix } = splitName(target);

        if (typeof window[modulename] !== "undefined") {
            return ({
                error: false,
                message: modulename + " already loaded"
            });
        }

        let url = "";
        if (prefix === "") {
            url += "js/";
        } else {
            url += prefix;
        }
        url += modulename;
        if (suffix === "") {
            url += ".js";
        } else {
            url += suffix;
        }

        let ret = await new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = url;
            script.onload = function () {
                resolve({
                    error: false,
                    message: modulename + " loaded"
                });
            };
            script.onerror = function () {
                // reject(new Error(`Fehler beim Laden: ${url}`));
                resolve({
                    error: true,
                    message: modulename + " not loaded from " + url
                });
            };
            document.head.appendChild(script);
        });
        return ret;
    };







    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = kli6900;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return kli6900;
        });
    } else {
        // included directly via <script> tag
        root.kli6900 = kli6900;
    }
}());