/*jshint laxbreak:true,evil:true, sub:true */
/*global module,process,require,define,root,global,self,this,console,alert */
/*global sysbase,__dirname,window */
"use strict";
console.log("START");
let express = require('express');
let fs = require("fs");
let path = require("path");
let bodyParser = require('body-parser');

let http = require("http");
let https = require("https");

let kli6190s = require("./kli6190s.js");

let httpsoptions = {};
if (fs.existsSync("C:/Tools/mkcert/example.com+5-key.pem")) {
    httpsoptions = {
        key: fs.readFileSync("C:/Tools/mkcert/example.com+5-key.pem", "utf8"),
        cert: fs.readFileSync("C:/Tools/mkcert/example.com+5.pem", "utf8")
        //ca: fs.readFileSync("C:\OpenSSL-Win64\bin\PEM\chain.pem", "utf8")
    };
}

let app = express();

//app.use(compression({
//    threshold: 64
//}));

app.use(express.json({
    limit: '50mb'
}));  // for JSON bodies

app.use(express.urlencoded({
    limit: '50mb', extended: true
})); // for forms

app.use(bodyParser.json({
    limit: '150mb',
    parameterLimit: 100000,
    extended: true
}));

app.use(bodyParser.urlencoded({
    limit: '150mb',
    extended: true,
    parameterLimit: 100000
}));


let sqlite3 = require('sqlite3');
let db = null;
let dbdir = path.join(__dirname, '..', '..', 'projekte', 're-klima');
if (!fs.existsSync(dbdir)) {
    fs.mkdirSync(dbdir, { recursive: true });
}
let dbfilename = path.join(dbdir, 'klidata.db3');
db = new sqlite3.Database(dbfilename);

console.log(dbfilename);

app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res, next) {
    console.log("REQUEST: " + req.clientIp + "=>" + req.protocol + "://" + req.headers.host + " path: " + req.path);
    if (req.path.startsWith("/images")) {
        let imagefilename = path.basename(req.path);
        let imagepath = path.join(__dirname, "public", "css", "images", imagefilename);
        console.log("1-" + imagepath);
        res.sendFile(path.resolve(imagepath));
        return;
    }
    if (req.path.startsWith("/node_modules")) {
        console.log("1-" + path.resolve(__dirname + req.path));
        res.sendFile(path.resolve(__dirname + req.path));
        return;
    }
    next();
});

// registrierung der express-Event-Handler - module - command Mimik
app.post('/checkNaturalTiles', async function (req, res) {
    let ret = await kli6190s.createImageTiles();
    let smsg = JSON.stringify(ret);
    res.writeHead(200, {
        'Content-Type': 'application/text',
        "Access-Control-Allow-Origin": "*"
    });
    res.end(smsg);
    return;
});
/**
 * getallrecordsx - eingeschränkt generischer SQL-SELECT mit POST
 * sel: SELECT, skip, limit
 * deprecated: projection, sort, table, firma
 */
app.post('/getallrecordsx', async function (req, res) {
    let timeout = 10 * 60 * 1000; // hier: gesetzter Default
    if (req.body && typeof req.body.timeout !== "undefined" && req.body.timeout.length > 0) {
        timeout = req.body.timeout;
        req.setTimeout(parseInt(timeout));
    }

    let reqparm = {};
    if (req.body.sel !== "undefined") {
        reqparm.sel = req.body.sel;
    }
    if (req.body.skip !== "undefined") {
        reqparm.skip = req.body.skip;
    }
    if (req.body.limit !== "undefined") {
        reqparm.limit = req.body.limit;
    }
    let sql = reqparm.sel;
    // var rootdir = path.dirname(require.main.filename);
    let startTime = new Date();
    let ret = await new Promise(function (resolve, reject) {
        db.all(sql, function (err, records) {
            if (err) {
                console.log(err.stack);
                resolve({
                    error: true,
                    message: err.message,
                    records: null
                });
            } else {
                resolve({
                    error: false,
                    message: "read",
                    records: records
                });
            }
        });
    });
    let smsg = JSON.stringify(ret);
    res.writeHead(200, {
        'Content-Type': 'application/text',
        "Access-Control-Allow-Origin": "*"
    });
    res.end(smsg);
    return;
});



let httpsServer;
async function startServer() {
    await kli6190s.prepareDB(db);

    if (Object.keys(httpsoptions).length > 0) {
        http.createServer(app).listen(3034);
        console.log("http an 3034 gestartet");
        httpsServer = https.createServer(httpsoptions, app).listen(3035);
        console.log("https an 3035 gestartet");
    } else {
        httpsServer = app.listen(3000, function () {
            console.log('Example app listening on port: 3000');
        });
    }
}
startServer();