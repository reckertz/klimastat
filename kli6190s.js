/*jshint sub:true,laxbreak:true,evil:true,esversion:8 */
/*global $,window,module,define,root,global,async,self,this,document,alert */
/*global sysbase,kli6190s */
(function () {
    "use strict";
    let kli6190s = {};
    // test
    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;
    /**
     * kli6190s - node.js Systemmoduln für die Klima-App 
     */
    let sharp = require("sharp");
    let fs = require("fs");
    let path = require("path");
    /**
     * Datenbank-Support SQLite3 mit promisify
     */

    function dbGet(db, sql, params = [], prot = false) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (prot === true) {
                    console.log(sql, err);
                }
                if (err) {
                    resolve({ err: err, row: null });
                } else {
                    resolve({ err: err, row: row });
                }
            });
        });
    }

    function dbRun(db, sql, params = [], prot = false) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (prot === true) {
                    console.log(sql, err);
                }
                if (err) {
                    resolve({ err, this: null });
                } else {
                    resolve({ err: null, this: this });
                }
                // z.B. this.lastID, this.changes
            });
        });
    }

    function dbAll(db, sql, params = [], prot = false) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (prot === true) {
                    console.log(sql, err);
                }
                if (err) {
                    resolve({ err: err, rows: null });
                } else {
                    resolve({ err: err, rows: rows });
                }
            });
        });
    }

    async function listTableIndexes(db, tablename) {
        // Kontrolle von Index-Definitionen und Ergänzung von Index-Definitionen
        console.log("***", tablename, "*****");
        let { err, rows } = await dbAll(db, "PRAGMA index_list('" + tablename + "')");
        // rows[] mit: name = 'indT4741_KLISTATIONS'; origin = 'c'; partial = 0; seq = 0; unique = 1
        if (err || rows.length === 0) {
            console.log(tablename, "no indexdata");
        }
        for (let row of rows) {
            let indexname = row.name;
            console.log("***", indexname, row.origin, row.partial, row.seq, "unique:" + row.unique);
            let indexinfos = await dbAll(db, "PRAGMA index_info('" + indexname + "')");
            // err und rows[] mit: { seqno: 0,  cid: 0,  name: "source" };
            for (let info of indexinfos.rows) {
                console.log("*", info.seqno, info.cid, info.name);
            }
        }
    }

    kli6190s.prepareDB = async function (db) {
        let dbret1 = await dbRun(db, "PRAGMA auto_vacuum = FULL;", [], true);
        let dbret2 = await dbRun(db, "PRAGMA case_sensitive_like = false;", [], true);
        let dbret3 = await dbRun(db, "PRAGMA journal_mode = TRUNCATE", [], true);
        let dbret4 = await dbRun(db, "PRAGMA encoding", [], true);
        await listTableIndexes(db, "KLISTATIONS");
        await listTableIndexes(db, "KLIDATA");
        await listTableIndexes(db, "KLIDATA10");
        await listTableIndexes(db, "KLIDATA10M");
        await listTableIndexes(db, "KLIMETAP2K");
        await listTableIndexes(db, "statdb.KLIGEONAMES");
    };



    kli6190s.createImageTiles = async function () {
        let originalimage = "NE1_HR_LC_SR_W_DR.tif";
        let imgfullpath = path.join(__dirname, 'public', 'img', 'natural', originalimage);
        let tilepath = path.join(__dirname, 'public', 'img', 'natural', 'tiles');
        //let target = "./naturalearth";
        let target = tilepath;
        if (fs.existsSync(tilepath)) {
            return ({
                error: false,
                message: "tiles exist already"
            });
        }
        fs.mkdirSync(tilepath, { recursive: true });

        let SOURCE_WIDTH = 21600;
        let SOURCE_HEIGHT = 10800;

        let TILE_SIZE = 256;
        let MAX_ZOOM = 5;

        for (let z = 0; z <= MAX_ZOOM; z++) {

            const cols = 2 ** (z + 1);
            const rows = 2 ** z;

            console.log(
                `Zoom ${z}: ${cols} × ${rows} = ${cols * rows} Tiles`
            );

            for (let y = 0; y < rows; y++) {

                /*
                 * Pixelgrenzen im Originalbild.
                 *
                 * Math.round verhindert, dass durch die
                 * nicht ganzzahligen Tilegrößen Lücken entstehen.
                 */

                const top =
                    Math.round(y * SOURCE_HEIGHT / rows);

                const bottom =
                    Math.round((y + 1) * SOURCE_HEIGHT / rows);

                for (let x = 0; x < cols; x++) {

                    const left =
                        Math.round(x * SOURCE_WIDTH / cols);

                    const right =
                        Math.round((x + 1) * SOURCE_WIDTH / cols);

                    const width = right - left;
                    const height = bottom - top;

                    const dir = path.join(
                        target,
                        String(z),
                        String(x)
                    );

                    fs.mkdirSync(dir, {
                        recursive: true
                    });

                    const filename = path.join(
                        dir,
                        `${y}.jpg`
                    );

                    await sharp(imgfullpath)
                        .extract({
                            left,
                            top,
                            width,
                            height
                        })
                        .resize(
                            TILE_SIZE,
                            TILE_SIZE
                        )
                        .jpeg({
                            quality: 90,
                            chromaSubsampling: "4:4:4"
                        })
                        .toFile(filename);
                }
            }
        }
        console.log("Fertig.");
        return ({
            error: false,
            message: "tiles created"
        });
    };

    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = kli6190s;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return kli6190s;
        });
    } else {
        // included directly via <script> tag
        root.kli6190s = kli6190s;
    }
}());