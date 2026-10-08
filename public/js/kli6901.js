(function (global) {
    "use strict";
    let kli6901 = {};

    /**
     * kli6901 - Container für non-UI Funktionen und Metadaten
     */
    // Update auf 3.3 von Hyde erfolgt
    let anthromesRAW = [
        "Code;Bezeichnung;R;G;B",
        "11;Urban;168;0;0",
        "12;Dense settlements;255;0;0",
        "21;Village, Rice;0;112;255",
        "22;Village, Irrigated;0;169;230",
        "23;Village, Rainfed;169;0;230",
        "24;Village, Pastoral;255;115;223",
        "31;Croplands, residential irrigated;178;142;23",
        "32;Croplands, residential rainfed;230;230;0",
        "33;Croplands, populated;255;255;115",
        "34;Croplands, pastoral;255;255;190",
        "41;Rangeland, residential;230;152;0",
        "42;Rangeland, populated;255;211;127",
        "43;Rangeland, remote;255;235;175",
        "51;Semi-natural woodlands, residential;56;168;0",
        "52;Semi-natural woodlands, populated;165;245;122",
        "53;Semi-natural woodlands, remote;211;255;178",
        "54;Mimese-natural treeless and barren lands;229;238;217",
        "61;Wild, remote - woodlands;218;242;234",
        "62;Wild, remote - treeless & barren;225;225;225",
        "63;Wild, remote - ice;255;255;255",
        "70;No definition;237;246;254"
    ];

    let zindcontrol = {};

    kli6901.getAnthromesRAW = function () {
        return anthromesRAW;
    };

    kli6901.getZindText = function (code) {
        if (typeof zindcontrol["61"] === "undefined") {
            for (let adata of anthromesRAW) {
                let [zind, text, r, g, b] = adata.split(";");
                zindcontrol[zind] = {
                    text: text,
                    color: "rgba(r, g, b, 0.8)"
                };
            }
        }
        if (typeof zindcontrol[code] !== "undefined") {
            return {
                zind: code,
                text: zindcontrol[code].text,
                color: zindcontrol[code].color
            };
        } else {
            return {
                zind: code,
                text: "unknown",
                color: "black"
            };
        }
    }

    // --- Weitere Modul-API ---
    kli6901.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli6901 = kli6901;
})(window);
