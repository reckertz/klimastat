/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3003A, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let kli1000C = {};
    /**
     * factory-module für ChartJS Ausgaben 
     * Übergabe recordset (record-array) und folgende Funktionen
     * Generierung Filterbuttons
     * Aufbereitung filterconfig aus den Filterbuttons
     * Anwendung filterconfig auf den recordset mit filter-function
     * Ausgabe der gefilterten Daten nach Konfigurationsvorgabe
     * Initial werden alle Daten ausgegeben???
     */

    kli1000C.createBubbleChart = function () {
        function showBubbleChart(container, records, filterconfig) {


        }


        return {

        }
    }


    // --- Weitere Modul-API ---
    kli1000C.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.kli1000C = kli1000C;
})(window);