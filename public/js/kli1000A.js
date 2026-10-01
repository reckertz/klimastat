/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000A = {};


    kli1000A.GHCNDservices = function () {

        async function getGHCNDStationsByLocationTMAX(latitude, longitude, radiusKm) {
            let geo = kli6900.lincoordinates(latitude, longitude, radiusKm);
            // geos: Koordinaten für eine BoundingBox latN, lonW, latS, lonE
            let sql = "";
            sql += "SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
            sql += " KLISTATIONS.latitude, KLISTATIONS.longitude, KLISTATIONS.height,";
            sql += " KLISTATIONS.alpha3, KLISTATIONS.countryname, KLISTATIONS.region, KLISTATIONS.continent,";
            sql += " KLIDATA.variable, KLIDATA.fromyear, KLIDATA.toyear";
            sql += " FROM KLISTATIONS";
            sql += " LEFT JOIN KLIDATA";
            sql += " ON KLISTATIONS.source = KLIDATA.source";
            sql += " AND KLISTATIONS.stationid = KLIDATA.stationid";
            sql += " AND KLIDATA.variable = 'TMAX'";
            sql += " WHERE KLISTATIONS.source = 'GHCND'";
            let ands = [];
            if (geo.latN > geo.latS) {
                let cond = " CAST(KLISTATIONS.latitude as DECIMAL(4,5)) <= " + geo.latN;
                cond += " AND CAST(KLISTATIONS.latitude as DECIMAL(4,5)) >= " + geo.latS;
                ands.push(cond);
            } else {
                let cond = " CAST(KLISTATIONS.latitude as DECIMAL(4,5)) >= " + geo.latN;
                cond += " AND CAST(KLISTATIONS.latitude as DECIMAL(4,5)) <= " + geo.latS;
                ands.push(cond);
            }
            if (geo.lonW > geo.lonE) {
                let cond = " CAST(KLISTATIONS.longitude as DECIMAL(4,5)) <= " + geo.lonW;
                cond += " AND CAST(KLISTATIONS.longitude as DECIMAL(4,5)) >= " + geo.lonE;
                ands.push(cond);
            } else {
                let cond = " CAST(KLISTATIONS.longitude as DECIMAL(4,5)) >= " + geo.lonW;
                cond += " AND CAST(KLISTATIONS.longitude as DECIMAL(4,5)) <= " + geo.lonE;
                ands.push(cond);
            }
            if (ands.length > 0) {
                sql += " AND " + ands.join(" AND ");
            }
            sql += " ORDER BY KLISTATIONS.source, KLISTATIONS.stationid";
            // jetzt der eigentliche Zugriff mit fetch
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
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                //make sure to serialize your JSON body bei POST, dann einfache url
                body: JSON.stringify({
                    sel: sql,
                    timeout: 10 * 60 * 1000,
                    skip: 0,
                    limit: 0
                })
            });
            let ret1 = await response.json();
            if (ret1.error === true || ret1.records === "undefined" || ret1.records === null) {
                console.log(ret1.message);  // big problem
            } else if (Array.isArray(ret1.records) && ret1.records.length === 0) {
                console.log(ret1.message);  // no data
            } else {
                // brauchbare Daten zurückgeben
                console.log(ret1.records.length + " found");
            }
            return ret1;
        }
        // Factory-Public Functions
        return {
            getGHCNDStationsByLocationTMAX
        };
    };

    // --- Weitere Modul-API ---
    kli1000A.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000A = kli1000A;
})(window);