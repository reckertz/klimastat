/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000A = {};

    let oksign = "&#10003;"; // Haken "?" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

    let rawvariables = `
DWDD	ACSC	1012	Bewölkung
DWDD	AHPA	1008	Luftdruck
DWDD	HSUN	1013	Sonnenschein
DWDD	HUMA	1017	rel Luftfeuchte
DWDD	PRCP	1099	Niederschlag
DWDD	SNWD	1101	Snow depth
DWDD	TMAX	1121	Tageshöchsttemp.
DWDD	TMIN	1121	Tagesmintemp.
GHCND	PRCP	122287
GHCND	PSUN	380 daily percent of possible sunshine 
GHCND	SNOW	75660 snowfall
GHCND	SNWD	64413
GHCND	TMAX	40418
GHCND	TMIN	40311
GHCND	TSUN	927 daily total sunshine
DWDD10	TT10	122	Lufttemperatur 2m Höhew
DWDD10	TM510	122	Temperatur in 5cm Höhe
DWDD10	TD10	116	Taupunkttemperatur
DWDD10	RF10	116	relative Luftfeuchte
DWDD10	PP10	116	Luftdruck
DWDW10	DD10	71	Windrichtung in Grad
DWDW10	FF10	71	Windgeschwindigkeit m/sec
ICOSCO2H	CO2H	95	CO2 in ppm, verschiedene Höhen
ICOSMETH	TT60	107	Temperatur
ICOSMETH	RF60	105	Relative Luftfeuchte
ICOSMETH	PP60	48	Luftdruck
ICOSMETH	DD60	89	Windrichtung in Grad
ICOSMETH	FF60	90	Windgeschwindigkeit m/sec
DWD10M	DD10	7960    mittlere Windrichtung Grad
DWD10M	DS10	2309    diffuse Himmelsstrahlung 
DWD10M	FF10	7961    mittlere Windgeschwindigkeit m/s
DWD10M	GS10	2613    Globalstrahlung
DWD10M	LS10	278 langwellige Strahlung
DWD10M	PP10	5688    Luftdruck 2m Höhe
DWD10M	PRS10	29454   kumulierter Regen   
DWD10M	RF10	12344   Relative Luftfeuchte
DWD10M	SD10	7526    Sonnenscheindauer
DWD10M	TT10	12347   Lufttemperatur
NOAACO2H	CO2H	56
NOAAMETH	DD60	7
NOAAMETH	FF60	7
NOAAMETH	PP60	7
NOAAMETH	PR60	6   precipitation intensity
NOAAMETH	RF60	7
NOAAMETH	TT60	17
GHCNMETH	DD60	341
GHCNMETH	FF60	340
GHCNMETH	PP60	490
GHCNMETH	PR60	214
GHCNMETH	RF60	866
GHCNMETH	TT60	895
`;

    let sourcemeta = {
        GHCND: "GHCN-daily",
        DWDD: "DWD-daily",
        DWDD10: "DWD-hourly",  // impliziert DWDW10 DWD-Wind-Hourly
        ICOSCO2H: "ICOS CO2 und Meteo-hourly",
        NOAACO2H: "NOAA CO2 und Meteo-hourly",
        DWD10M: "DWD 10Minutes"
    };
    let varmeta = [
        { "table": "KLIDATA", "source": "DWDD", "category": "Niederschlag", "variable": "PRCP", "description": "Niederschlag" }, { "table": "KLIDATA", "source": "DWDD", "category": "Niederschlag", "variable": "SNWD", "description": "Snow depth" }, { "table": "KLIDATA", "source": "DWDD", "category": "Sonne", "variable": "HSUN", "description": "Sonnenschein" }, { "table": "KLIDATA", "source": "DWDD", "category": "Temperature", "variable": "TMAX", "description": "Tageshöchsttemp." }, { "table": "KLIDATA", "source": "DWDD", "category": "Temperature", "variable": "TMIN", "description": "Tagesmintemp." }, { "table": "KLIDATA", "source": "DWDD", "category": "other", "variable": "ACSC", "description": "Bewölkung" }, { "table": "KLIDATA", "source": "DWDD", "category": "other", "variable": "AHPA", "description": "Luftdruck" }, { "table": "KLIDATA", "source": "DWDD", "category": "other", "variable": "HUMA", "description": "rel Luftfeuchte" }, { "table": "KLIDATA", "source": "GHCND", "category": "Niederschlag", "variable": "PRCP", "description": "Niederschlag" }, { "table": "KLIDATA", "source": "GHCND", "category": "Niederschlag", "variable": "SNOW", "description": "snowfall" }, { "table": "KLIDATA", "source": "GHCND", "category": "Niederschlag", "variable": "SNWD", "description": "Snow depth" }, { "table": "KLIDATA", "source": "GHCND", "category": "Sonne", "variable": "PSUN", "description": "daily percent of possible sunshine " }, { "table": "KLIDATA", "source": "GHCND", "category": "Sonne", "variable": "TSUN", "description": "daily total sunshine" }, { "table": "KLIDATA", "source": "GHCND", "category": "Temperature", "variable": "TMAX", "description": "Tageshöchsttemp." }, { "table": "KLIDATA", "source": "GHCND", "category": "Temperature", "variable": "TMIN", "description": "Tagesmintemp." }, { "table": "KLIDATA10", "source": "DWDD10", "category": "Temperature", "variable": "TD10", "description": "Taupunkttemperatur" }, { "table": "KLIDATA10", "source": "DWDD10", "category": "Temperature", "variable": "TM510", "description": "Temperatur in 5cm Höhe" }, { "table": "KLIDATA10", "source": "DWDD10", "category": "Temperature", "variable": "TT10", "description": "Lufttemperatur 2m Höhew" }, { "table": "KLIDATA10", "source": "DWDD10", "category": "other", "variable": "PP10", "description": "Luftdruck" }, { "table": "KLIDATA10", "source": "DWDD10", "category": "other", "variable": "RF10", "description": "relative Luftfeuchte" }, { "table": "KLIDATA10", "source": "DWDW10", "category": "Wind", "variable": "DD10", "description": "Windrichtung in Grad" }, { "table": "KLIDATA10", "source": "DWDW10", "category": "Wind", "variable": "FF10", "description": "Windgeschwindigkeit m/sec" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "Niederschlag", "variable": "PR60", "description": "precipitation intensity" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "Temperature", "variable": "TT60", "description": "Temperatur" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "Wind", "variable": "DD60", "description": "Windrichtung in Grad" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "Wind", "variable": "FF60", "description": "Windgeschwindigkeit m/sec" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "other", "variable": "PP60", "description": "Luftdruck" }, { "table": "KLIDATA10", "source": "GHCNMETH", "category": "other", "variable": "RF60", "description": "Relative Luftfeuchte" }, { "table": "KLIDATA10", "source": "ICOSCO2H", "category": "CO2", "variable": "CO2H", "description": "CO2 in ppm, verschiedene Höhen" }, { "table": "KLIDATA10", "source": "ICOSMETH", "category": "Temperature", "variable": "TT60", "description": "Temperatur" }, { "table": "KLIDATA10", "source": "ICOSMETH", "category": "Wind", "variable": "DD60", "description": "Windrichtung in Grad" }, { "table": "KLIDATA10", "source": "ICOSMETH", "category": "Wind", "variable": "FF60", "description": "Windgeschwindigkeit m/sec" }, { "table": "KLIDATA10", "source": "ICOSMETH", "category": "other", "variable": "PP60", "description": "Luftdruck" }, { "table": "KLIDATA10", "source": "ICOSMETH", "category": "other", "variable": "RF60", "description": "Relative Luftfeuchte" }, { "table": "KLIDATA10", "source": "NOAACO2H", "category": "CO2", "variable": "CO2H", "description": "CO2 in ppm, verschiedene Höhen" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "Niederschlag", "variable": "PR60", "description": "precipitation intensity" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "Temperature", "variable": "TT60", "description": "Temperatur" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "Wind", "variable": "DD60", "description": "Windrichtung in Grad" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "Wind", "variable": "FF60", "description": "Windgeschwindigkeit m/sec" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "other", "variable": "PP60", "description": "Luftdruck" }, { "table": "KLIDATA10", "source": "NOAAMETH", "category": "other", "variable": "RF60", "description": "Relative Luftfeuchte" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Niederschlag", "variable": "PRS10", "description": "kumulierter Regen " }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Sonne", "variable": "GS10", "description": "Globalstrahlung" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Sonne", "variable": "LS10", "description": "langwellige Strahlung" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Sonne", "variable": "SD10", "description": "Sonnenscheindauer" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Temperature", "variable": "TT10", "description": "Lufttemperatur" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Wind", "variable": "DD10", "description": "mittlere Windrichtung Grad" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "Wind", "variable": "FF10", "description": "mittlere Windgeschwindigkeit m/s" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "other", "variable": "DS10", "description": "diffuse Himmelsstrahlung " }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "other", "variable": "PP10", "description": "Luftdruck 2m Höhe" }, { "table": "KLIDATA10M", "source": "DWD10M", "category": "other", "variable": "RF10", "description": "Relative Luftfeuchte" }
    ];

    let geo = null;

    kli1000A.getMeta = function () {
        return {
            sourcemeta: sourcemeta,
            varmeta: varmeta
        };
    };


    // .kli1000selbtn => array => check status => attr: varname, varvalue
    // varname-Spezialitäten sind zulässig
    // source, category
    // spezielle Abdeckung von varname "range" mit fromyear, toyear



    /**
    * kli1000A.buildSQLfromButtons - SQL generien und return, kein execute
    *
    * @param {any} buttons - nur varname = range und varname = variable sind relevant
    * @param {any} source - Vorgabe des varvalue für varname = source
    * eine source bedeutet implizit eine table, vereinfacht also das ganze
    * @returns {any} - ret mit error, message, sql
    */
    kli1000A.buildSQLfromButtons = function (localization, geo, source, selparms, categorycontrol) {


        // 1. es kann nur eine source geben!!!
        // 2. es mehrere categories geben, die nach variable IN umzusetzen sind mit counter
        let sourcedata = categorycontrol[source];
        let catkeys = Object.keys(sourcedata);
        let table = categorycontrol[source][catkeys[0]].table;

        let sql = "";
        sql += "SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
        sql += " KLISTATIONS.latitude, KLISTATIONS.longitude, KLISTATIONS.height,";
        sql += " KLISTATIONS.alpha3, KLISTATIONS.countryname, KLISTATIONS.region, KLISTATIONS.continent,";
        sql += " KLISTATIONS.uopp_1850, KLISTATIONS.popd_1850, KLISTATIONS.uopp_1950, KLISTATIONS.popd_1950,";
        sql += " KLISTATIONS.uopp_2019, KLISTATIONS.popd_2019,";
        sql += " KLISTATIONS.zind_1950AD, KLISTATIONS.zind_2019AD,";
        // source => table abhängige Felder
        if (table === "KLIDATA" || table === "KLIDATA10") {
            for (let category of Object.keys(categorycontrol[source])) {
                //sql += " SUM(CASE WHEN " + sourceparm.data + ".variable IN ('TMAX','TMIN','TT10','TM510')  THEN 1 ELSE 0 END) AS temperature,";
                sql += " SUM(CASE WHEN " + table + ".variable IN ('" + categorycontrol[source][category].variables.join("', '") + "')";
                sql += " THEN 1 ELSE 0 END) AS " + "sum_" + category + ",";
            }
            sql += " GROUP_CONCAT(" + table + ".variable) AS variables,";
            sql += " GROUP_CONCAT(" + table + ".fromyear) AS fromyears,";
            sql += " GROUP_CONCAT(" + table + ".toyear) AS toyears";
        }

        sql += " FROM KLISTATIONS";

        if (table === "KLIDATA") {
            sql += " JOIN KLIDATA";
            sql += " ON KLISTATIONS.source = KLIDATA.source";
            sql += " AND KLISTATIONS.stationid = KLIDATA.stationid";
        } else if (table === "KLIDATA10") {
            sql += " JOIN KLIDATA10";
            sql += " ON KLISTATIONS.source = KLIDATA10.source";
            sql += " AND KLISTATIONS.stationid = KLIDATA10.stationid";
        }

        sql += " WHERE KLISTATIONS.source = '" + source + "'";
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
        sql += " GROUP BY KLISTATIONS.source, KLISTATIONS.stationid";
        // HAVING-Klausel
        let ors = [];

        for (let category of Object.keys(categorycontrol[source])) {
            ors.push(" sum_" + category + " > 0");
        }
        if (ors.length === 1) {
            sql += " HAVING " + ors[0];
        } else if (ors.length > 1) {
            sql += " HAVING " + ors.join(" OR ");
        }
        sql += " ORDER BY KLISTATIONS.source, KLISTATIONS.stationid";
        // jetzt der eigentliche Zugriff mit fetch
        console.log(sql);
        return sql;

    };


    kli1000A.SQLservices = function (buttons) {

        function prepareVariableMetadata(containerid) {
            let varcontrol = {};
            let lines = rawvariables.split(/\r\n|\r|\n/);
            let count = 0;
            let records = [];
            for (let line of lines) {
                count++;
                const match = line.match(
                    /^(\S+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/
                );
                if (match === null) {
                    continue;
                }
                let [text, source, variable, counter, description] = match;
                if (count > 0 && count < 2) {
                    debugger;
                }
                let record = {};
                if (["DWDD", "GHCND"].includes(source)) {
                    record.table = "KLIDATA";
                } else if (["DWDD10", "DWDW10", "ICOSCO2H", "ICOSMETH", "NOAACO2H", "NOAAMETH", "GHCNMETH"].includes(source)) {
                    record.table = "KLIDATA10";
                } else if (["DWD10M"].includes(source)) {
                    record.table = "KLIDATA10M";
                } else {
                    record.table = "undefined";
                }
                record.source = source;
                let category = "";
                if (["TMAX", "TMIN", "TT60", "TT10", "TM510", "TD10"].includes(variable)) {
                    category = "Temperature";
                }
                if (category === "") {
                    if (variable.startsWith("CO2")) {
                        category = "CO2";
                    }
                }
                if (category === "") {
                    if (variable.startsWith("DD") || variable.startsWith("FF")) {
                        category = "Wind";
                    }
                }
                if (category === "") {
                    if (variable.startsWith("PR") || ["SNOW", "SNWD"].includes(variable)) {
                        category = "Niederschlag";
                    }
                }
                if (category === "") {
                    if (variable.startsWith("LS") || variable.startsWith("GS") || variable.startsWith("SD") ||
                        ["HSUN", "PSUN", "TSUN"].includes(variable)) {
                        category = "Sonne";
                    }
                }
                if (category === "") {
                    category = "other";
                }
                record.category = category;
                record.variable = variable;
                if (typeof description !== "undefined") {
                    record.description = description;
                    if (typeof varcontrol[variable] === "undefined") {
                        varcontrol[variable] = description;
                    }
                } else if (typeof varcontrol[variable] !== "undefined") {
                    record.description = varcontrol[variable];
                }
                records.push(record);
            }
            console.log(records);
            // Sortieren nach Variable
            let records1 = records.sort(function (a, b) {
                if (a.table > b.table) {
                    return 1;
                } else if (a.table < b.table) {
                    return -1;
                } else if (a.source > b.source) {
                    return 1;
                } else if (a.source < b.source) {
                    return -1;
                } else if (a.category > b.category) {
                    return 1;
                } else if (a.category < b.category) {
                    return -1;
                } else if (a.variable > b.variable) {
                    return 1;
                } else if (a.variable < b.variable) {
                    return -1;
                } else {
                    return 0;
                }
            });
            console.log(records);
            // Bereitstellung im Clipboard als source
            let str = JSON.stringify(records1, "\n");
            kli6900.copyHtml2Clipboard(str);
        }
        return {
            getMeta,
            buildSQLfromButtons,
            prepareVariableMetadata
        };
    }


    kli1000A.GHCNDservices = function () {

        async function getGHCNDStationsByLocationTMAX(latitude, longitude, radiusKm) {
            geo = kli6900.lincoordinates(latitude, longitude, radiusKm);
            // geos: Koordinaten für eine BoundingBox latN, lonW, latS, lonE
            let sql = "";
            sql += "SELECT KLISTATIONS.source, KLISTATIONS.stationid, KLISTATIONS.stationname,";
            sql += " KLISTATIONS.latitude, KLISTATIONS.longitude, KLISTATIONS.height,";
            sql += " KLISTATIONS.alpha3, KLISTATIONS.countryname, KLISTATIONS.region, KLISTATIONS.continent,";
            sql += " KLISTATIONS.uopp_1850, KLISTATIONS.popd_1850, KLISTATIONS.uopp_1950, KLISTATIONS.popd_1950,";
            sql += " KLISTATIONS.uopp_2019, KLISTATIONS.popd_2019,";
            sql += " KLISTATIONS.zind_1950AD, KLISTATIONS.zind_2019AD,";
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