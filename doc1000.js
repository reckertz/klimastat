/*jslint white:true */
/*jslint devel:true */
/*jshint evil: true, sub: true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global sysbase,doc1000,kla6190 */
(function () {
    "use strict";
    let doc1000 = {};
    // Statistik mit Animation
    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;

    let path = require("path");
    let fs = require("fs");
    let strip = require("strip-comments");
    let acorn = require("acorn");
    let config;

    /**
     * getsourceanalysis
     * @param {*} db 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm 
     * @param {*} res 
     * @param {*} cd1000 
     * @returns 
     */
    // let { res1, ret } = await doc1000.getsourceanalysis(req, null, res); 
    doc1000.getsourceanalysis = function (req, reqparm, res) {
        return new Promise(async function (resolve, reject) {
            res.ret = {};
            let ret = res.ret;
            ret.filename = req.query.filename;
            ret.srcpath = req.query.srcpath;
            ret.modus = req.query.modus;
            if (typeof ret.filename === "undefined" || ret.filename == null) {
                ret.filename = "doc6010.js";
            }
            if (typeof ret.srcpath === "undefined" || ret.srcpath == null) {
                ret.srcpath = path.join(__dirname, "public", "js");
                ret.fullfilename = path.join(ret.srcpath, ret.filename);
                if (!fs.existsSync(ret.fullfilename)) {
                    ret.srcpath = __dirname;
                    ret.fullfilename = path.join(ret.srcpath, ret.filename);
                    if (!fs.existsSync(ret.fullfilename)) {
                        // source nicht gefunden
                        resolve(res, {
                            error: true,
                            message: "Source nicht gefunden"
                        });
                    }
                }
            }
            let ret1 = {
                srcpath: ret.srcpath,
                filename: ret.filename,
                fullfilename: ret.fullfilename
            };
            // TODO: Fehler wenn ret.fullfilename === null abfangen
            if (ret1.error === true || typeof ret1.fullfilename === "undefined") {
                resolve(res, {
                    error: true,
                    message: ret1.message
                });
            } else {
                ret.fullfilename = ret1.fullfilename;
            }
            ret.moduleName = ret.filename.substring(0, ret.filename.indexOf(".js"));
            // ret mit filename, moduleName, fullfilename
            if (ret.modus === "new") {
                let ergs = await doc1000.prepareSource2(ret);
                ret.structures = ergs.structures;
                ret.structurecontrol = {};
                for (let fname of Object.keys(ergs.structurecontrol)) {
                    ret.structurecontrol[fname] = {
                        name: fname,
                        type: "function",
                        index: ergs.structurecontrol[fname]
                    };
                }
                doc1000.analysisReport(ret);
                resolve(res, {
                    error: false,
                    message: "OK",
                    results: ret
                });
            }
        });
    };


    /**
    * prepareSource2 - neue, vereinfachte Source-Analyse Schritt für Schritt
    *
    * @param {any} ret -
    * @returns {any} structures - This function does not return a value but performs assertions on the input data.
    */
    doc1000.prepareSource2 = function (ret) {

        let moduleName = ret.moduleName;
        let data = fs.readFileSync(ret.fullfilename, 'utf8');
        // jetzt kommentare, literale, regex und templates neutralisieren
        let { literals, source } = doc1000.getLiterals(data, moduleName);
        // Sonderzeichen eliminieren bzw. neutralisieren => "full string"-Analyse
        source = doc1000.normalizeSource(source);
        let fullfilepure2 = path.join(__dirname, "public", "temp", moduleName + "_newpure2.js");
        fs.writeFileSync(fullfilepure2, source); // OK!!!

        // neuer Ansatz
        let names = doc1000.collectModuleNames(source, moduleName);
        // names mit name, fullname und occurences
        let definitions = doc1000.collectDefinitions(source, moduleName);
        // erste Plausibilitätsprüfungen mit Protokoll
        let result = doc1000.checkFunctions(moduleName, names, definitions);
        let fullfilepure3 = path.join(__dirname, "public", "temp", moduleName + "_errors.js");
        fs.writeFileSync(fullfilepure3, result.html); // OK!!!

        let fromPos = 0;
        let reference = {};
        let erg = doc1000.checkFunctionBodies(moduleName, source, fromPos, reference);
        let fullfilepure4 = path.join(__dirname, "public", "temp", moduleName + "_structures.js");
        fs.writeFileSync(fullfilepure4, JSON.stringify(erg.structures)); // OK!!!

        return ({
            error: false,
            message: moduleName,
            structures: erg.structures,
            structurecontrol: erg.structurecontrol
        });
    };

    doc1000.checkFunctionBodies = function (moduleName, source, fromPos, reference) {
        let moduleNameLength = moduleName.length + 1;
        let checkName = moduleName + ".";
        // finde nächste Funktion
        let savesource = source;
        let defs = doc1000.getAllDefinitions(source, moduleName);

        // MAP mit 0 = {name: 'initTreeview', pos: 1632}, name = 'initTreeview', pos = 1632
        let functioncontrol = {};
        let functionnames = [];
        for (let def of defs) {
            functionnames.push(moduleName + "." + def.name);
            functioncontrol[moduleName + "." + def.name] = {
                stmt: def.stmt,
                name: def.name,
                fullname: moduleName + "." + def.name,
                position: def.pos
            };
        }
        //for (let functionname of functionnames) {
        for (let ifunc = 0; ifunc < functionnames.length; ifunc++) {
            let functionname = functionnames[ifunc];
            let thisfunction = functioncontrol[functionname];
            thisfunction.hasinnerfunction = false;
            let position = thisfunction.position;
            let depth = 0;
            let ihit = 0;
            let lastcontainer = -1;
            let test = "";
            for (let i = position; i < source.length; i++) {
                test += source.substring(i, i + 1);
                if (source.substring(i, i + 1) === "{") {
                    depth++;
                    ihit++;
                } else if (source.substring(i, i + 1) === "}") {
                    depth--;
                }
                if (ihit >= 1 && depth === 0) {
                    // Ende der Funktion, kann innere Funktionen enthalten
                    thisfunction.lastposition = i;
                    if (ifunc > 0) {
                        for (let jfunc = ifunc - 1; jfunc >= 0; jfunc--) {
                            let lastfunctionname = functionnames[jfunc];
                            let lastfunction = functioncontrol[lastfunctionname];
                            if (thisfunction.position >= lastfunction.position &&
                                thisfunction.position <= lastfunction.lastposition) {
                                thisfunction.parent = lastfunction.fullname;
                                lastfunction.hasinnerfunction = true;
                                if (typeof lastfunction.children === "undefined") {
                                    lastfunction.children = [];
                                }
                                lastfunction.children.push(thisfunction.fullname);
                                lastcontainer = jfunc;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        for (let ifunc = 0; ifunc < functionnames.length; ifunc++) {
            let functionname = functionnames[ifunc];
            let thisfunction = functioncontrol[functionname];
            thisfunction.isresolved = false;
            console.log(functionname, thisfunction.hasinnerfunction, thisfunction.position, thisfunction.lastposition);
        }
        // Auflösung mit lastfunction.hasinnerfunction === false;
        for (let iround = 0; iround < 10; iround++) {
            for (let ifunc = 0; ifunc < functionnames.length; ifunc++) {
                let functionname = functionnames[ifunc];
                let thisfunction = functioncontrol[functionname];
                if (thisfunction.isresolved === false) {
                    if (thisfunction.hasinnerfunction === true) {
                        if (iround > 0) {
                            // check, ob das noch stimmt
                            let fsource = source.substring(thisfunction.position, thisfunction.lastposition + 1);
                            let thisothers = doc1000.getAllDefinitions(fsource, moduleName);
                            if (thisothers.length <= 1) {
                                thisfunction.hasinnerfunction = false;
                            }
                        }
                    }
                    if (thisfunction.hasinnerfunction === false) {
                        let fsource = source.substring(thisfunction.position, thisfunction.lastposition + 1);
                        let calleds = doc1000.collectModuleNames(fsource, moduleName);
                        thisfunction.calleds = [];
                        for (let called of calleds.keys()) {
                            let data = calleds.get(called);
                            thisfunction.calleds.push(data.fullname);
                        }
                        thisfunction.isresolved = true;
                        let len = thisfunction.lastposition - thisfunction.position + 1;
                        let spaces = " ".repeat(len);
                        source = source.substring(0, thisfunction.position) +
                            spaces +
                            source.substring(thisfunction.lastposition);
                    }
                }
            }
        }

        for (let ifunc = 0; ifunc < functionnames.length; ifunc++) {
            let functionname = functionnames[ifunc];
            let thisfunction = functioncontrol[functionname];
            console.log(functionname, thisfunction.hasinnerfunction, thisfunction.position, thisfunction.lastposition, thisfunction.calleds);
        }
        source = savesource;

        // functioncontrol[functionname];
        let fileFunctions = path.join(__dirname, "public", "temp", moduleName + "_functions" + ".js");
        fs.writeFileSync(fileFunctions, JSON.stringify(functioncontrol)); // OK!!!



        let structures = [];
        let structurecontrol = {};
        for (let ifunc = 0; ifunc < functionnames.length; ifunc++) {
            let functionname = functionnames[ifunc];
            let thisfunction = functioncontrol[functionname];
            if (typeof thisfunction.parent === "undefined") {
                thisfunction.parent = "";
            }
            if (typeof thisfunction.children === "undefined") {
                thisfunction.children = [];
            }
            console.log(functionname, thisfunction.hasinnerfunction, thisfunction.position, thisfunction.lastposition, thisfunction.calleds);
            let fdata = {};
            fdata.idis = thisfunction.position;
            fdata.type = "function";
            fdata.name = thisfunction.fullname;
            fdata.parent = thisfunction.parent;
            fdata.children = thisfunction.children;  // innerfunctions 
            fdata.startname = 0;
            fdata.startParms = 0;
            fdata.endParms = 0;
            fdata.startBody = 0;
            fdata.endBody = 0;
            fdata.index = ifunc;
            fdata.calling = [];
            if (typeof thisfunction.calleds === "undefined") {
                thisfunction.calleds = [];
            }
            for (let called of thisfunction.calleds) {
                if (called !== fdata.name) {
                    fdata.calling.push({
                        name: called,
                        type: "function",
                        index: 0  //TODO: ergänzen? - 2. Durchgang
                    });
                }
            }
            fdata.calledby = [];
            structures.push(fdata);
            structurecontrol[fdata.name] = ifunc;
        }
        // Post-Processing
        for (let structure of structures) {
            let fullname = structure.name;
            let callings = structure.calling;
            for (let calling of callings) {
                let cname = calling.name;
                let ctype = calling.type;
                let ind = structurecontrol[cname];
                calling.index = ind;
                if (typeof structures[ind] === "undefined") {
                    debugger;   // preprocessJS
                }
                if (typeof fullname === "undefined") {
                    debugger;
                }
                if (typeof structures[ind].calledby === "undefined") {
                    structures[ind].calledby = [];
                }
                if (!structures[ind].calledby.includes(fullname)) {
                    structures[ind].calledby.push({
                        name: fullname,
                        type: "function",
                        index: structure.index
                    });
                }
            }
        }
        return {
            structures,
            structurecontrol
        };
        /*
        const part = source.slice(fromPos);
        // nächstes Auftreten von ghd3102.<name>
        const reName = new RegExp(
            "\\b" + moduleName + "\\.([A-Za-z_$][\\w$]*)",
            ""
        );
        // nächste klassische Funktionsdefinition ghd3102.<name> =
        const reDefinition = new RegExp(
            "\\b" + moduleName +
            "\\.([A-Za-z_$][\\w$]*)\\s*=\\s*" +
            "(?:async\\s+)?function\\b",
            ""
        );
        // Loop bis schluss ist

        const mName = reName.exec(part);
        const mDef = reDefinition.exec(part);
        const regex = /\bghd3102\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\s*\(/g;
        const definitions = [...source.matchAll(regex)].map(m => ({
            name: m[1],
            pos: m.index
        }));
        debugger;
        let fromName = fromPos + mName.index;   // name: mName[1],
        let fromDef = fromPos + mDef.index;  // name: mDef[1]
        if (fromDef <= fromName) {
            // das muss die erste Funktion sein
            // doc1000.getFunctionBody(moduleName, source, fromPos, fromDef, reference);

        }
        */
    };

    doc1000.getAllDefinitions = function (source, moduleName) {
        const regex = new RegExp(
            "\\b" + moduleName +
            "\\.([A-Za-z_$][\\w$]*)\\s*=\\s*" +
            "(?:async\\s+)?function\\b",
            "g"
        );
        /*
        const regex = new RegExp(
            "\\b" + moduleName +
            "\\.([A-Za-z_$][\\w$]*)\\s*=\\s*" +
            "(?:async\\s+)?function\\s*\\(",
            "g"
        );
        */
        const definitions = [...source.matchAll(regex)].map(m => ({
            stmt: m[0],
            name: m[1],
            pos: m.index
        }));
        let fileDefinitions = path.join(__dirname, "public", "temp", moduleName + "_definitions" + ".js");
        fs.writeFileSync(fileDefinitions, JSON.stringify(definitions)); // OK!!!
        return [...source.matchAll(regex)].map(m => ({
            stmt: m[0],
            name: m[1],
            pos: m.index
        }));
    }



    doc1000.getFunctionBody = function (moduleName, source, fromPos, fromDef, reference) {
        let depth = 0;
        let ihit = 0;
        let test = "";
        for (let i = position + 1; i < source.length; i++) {
            test += source.substring(i, i + 1);
            if (source.substring(i, i + 1) === "{") {
                depth++;
                ihit++;
            } else if (source.substring(i, i + 1) === "}") {
                depth--;
            }
            if (ihit >= 1 && depth >= 1) {
                // Mögliche innere Funktion

            }
            if (ihit >= 1 && depth === 0) {

            }
        }
    };


    /*
    for (const name of defined) {
        let definition = definitions.get(name);
        let position = definition[0].position;
        let depth = 0;
        let ihit = 0;
        let test = "";
        for (let i = position + 1; i < source.length; i++) {
            test += source.substring(i, i + 1);
            if (source.substring(i, i + 1) === "{") {
                depth++;
                ihit++;
            } else if (source.substring(i, i + 1) === "}") {
                depth--;
            }
            if (ihit >= 1 && depth === 0) {
                definition[0].lastposition = i;
                let functionsource = source.substring(position, i + 1);
                definition[0].fullname = moduleName + "." + name;
                definition[0].source = functionsource;
                // darf nicht in anderer Modul-Funktion liegen
                // console.log(test);
                let callings = doc1000.collectModuleNames(functionsource, moduleName);
                definition[0].calling = callings;
                // callings als MAP mit {  name: "show",  fullname: "ghd3102.show",  occurrences: [ 0,],}  
                // jetzt ist der Check der Defintions trivial aus calling heraus,
                // darf nicht zwischen position und lastposition sein
                for (const name of callings.keys()) {
                    let refdefinition = definitions.get(name);
                    let refposition = refdefinition[0].position;
                    if (refposition > definition[0].position && refposition <= definition[0].lastposition) {
                        // Kandidat für innere Funktion
                        console.log("*************** " + name + " IN " + definition[0].fullname + " *************")
                    }
                }
                break;
            }
        }
    }
    };
    */

    doc1000.getBraceDepthAt = function (source, position) {
        let depth = 0;
        for (let i = 0; i < position; i++) {
            if (source[i] === "{") depth++;
            else if (source[i] === "}") depth--;
        }
        return depth;
    };


    doc1000.checkFunctions = function (moduleName, allNames, definitions) {
        const result = {
            defined: [],
            missing: [],
            duplicate: []
        };
        let duphtml = "";
        duphtml += "<h3>Doppelte Definitionen</h3>";
        let misshtml = "";
        misshtml += "<h3>Fehlende Definitionen</h3>";

        for (const name of allNames.keys()) {
            const defs = definitions.get(name) || [];
            if (defs.length === 0) {
                result.missing.push(name);
                misshtml += "<br>" + moduleName + "." + name;
            } else {
                result.defined.push(name);
            }

            if (defs.length > 1) {
                result.duplicate.push({
                    name,
                    count: defs.length,
                    definitions: defs
                });
                duphtml += "<br>" + moduleName + "." + name + " " + defs.length;
            }
        }
        result.html = misshtml + "<br>" + duphtml;
        return result;
    };



    doc1000.collectDefinitions = function (source, moduleName) {
        //const source = lines.join("\n");
        const re = new RegExp(
            "\\b" + moduleName +
            "\\.([A-Za-z_$][\\w$]*)\\s*=\\s*" +
            "(?:async\\s+)?function\\b",
            "g"
        );
        const definitions = new Map();
        let match;
        while ((match = re.exec(source)) !== null) {
            const name = match[1];
            if (!definitions.has(name))
                definitions.set(name, []);
            definitions.get(name).push({
                name,
                position: match.index
            });
        }
        return definitions;
    };


    doc1000.collectModuleNames = function (source, moduleName) {
        //const source = lines.join("\n");
        const re = new RegExp(
            "\\b" + moduleName + "\\.([A-Za-z_$][\\w$]*)",
            "g"
        );
        const names = new Map();
        let match;
        while ((match = re.exec(source)) !== null) {
            const name = match[1];
            if (!names.has(name)) {
                names.set(name, {
                    name,
                    fullname: moduleName + "." + name,
                    occurrences: []
                });
            }
            names.get(name).occurrences.push(match.index);
        }
        return names;
    };


    doc1000.extractModuleFunctionCalls = function (body, moduleNames) {
        const modules = moduleNames
            .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|");

        const re = new RegExp(
            `\\b(${modules})\\s*\\.\\s*([A-Za-z_$][\\w$]*)\\s*(?=\\()`,
            "g"
        );

        const calls = [];
        let match;

        while ((match = re.exec(body)) !== null) {
            calls.push({
                module: match[1],
                functionName: match[2],
                fullName: `${match[1]}.${match[2]}`,
                pos: match.index
            });
        }
        return calls;
    };


    doc1000.readParametersRightOfEquals = function (source, eqPos) {
        let s = source.slice(eqPos - 50, eqPos + 50);
        let s0 = source.slice(eqPos, eqPos + 1);
        let ifirstbracket = source.indexOf("(", eqPos);
        let ilastbracket = -1;
        if (ifirstbracket >= 0) {
            let depth = 0;
            for (let i = ifirstbracket; i < source.length; i++) {
                if (source[i] === "(") {
                    depth++;
                } else if (source[i] === ")") {
                    depth--;
                    if (depth === 0) {
                        ilastbracket = i;
                        break;
                    }
                }
            }
            console.log("Parameters:" + source.slice(ifirstbracket, ilastbracket + 1));
        } else {
            console.log(s);
            debugger; // Mist, sollte nicht sein
        }
        return {
            ifirstbracket,
            ilastbracket
        };
    };

    doc1000.readNameLeftOfEquals = function (src, eqPos) {
        let s = src.slice(eqPos - 50, eqPos + 50);
        //console.log(s);
        let i = eqPos - 1;
        while (/\s/.test(src[i])) i--;
        let end = i + 1;
        while (i >= 0 && /[A-Za-z0-9_$.\[\]'"]/.test(src[i])) {
            i--;
        }
        const name = src.slice(i + 1, end).trim();
        if (!name) return null;
        return name;
    }


    doc1000.readExtendedNameLeftOfEquals = function (src, eqPos) {
        let s = src.slice(eqPos - 50, eqPos + 50);
        //console.log(s);
        let i = eqPos - 1;
        while (/\s/.test(src[i])) i--;
        let end = i + 1;
        while (i >= 0 && /[A-Za-z0-9_$.\[\]()'"]/.test(src[i])) {
            i--;
        }
        const name = src.slice(i + 1, end).trim();
        if (!name) return null;
        return name;
    }

    doc1000.getStringBefore = function (source, start, von) {
        // rechts nach links Suche String, Skip leading spaces
        let string = [];
        let hasblanks = false;
        for (let i = start; i >= von; i--) {
            if (i === start && source[i] === " ") {
                hasblanks = true;
                continue;
            } else {
                string.unshift(source[i]);
                continue;
            }
            if (i < start) {
                if (source[i] === " " && hasblanks === true) {
                    continue;
                } else {
                    hasblanks = false;
                    string.unshift(source[i]);
                }
            }
        }
    }

    doc1000.normalizeSource = function (source) {
        return source
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\t/g, " ")
            .replace(/[\u00A0\u2000-\u200B]/g, " ");
    };


    doc1000.getComments = function (source) {
        const placeholders = {};
        let result = "";
        let i = 0;
        let id = 0;
        while (i < source.length) {
            const c = source[i];
            const n = source[i + 1];
            // line comment
            if (c === "/" && n === "/") {
                while (i < source.length && source[i] !== "\n") {
                    result += " ";
                    i++;
                }
                continue;
            }
            // block comment
            if (c === "/" && n === "*") {
                const start = i;
                i += 2;
                while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
                    i++;
                }
                i += 2;
                result += " ".repeat(i - start);
                continue;
            }
            result += c;
            i++;
        }
        return { source: result };
    }


    doc1000.getLiterals = function (source, moduleName) {

        let comments = [];
        const tokenizer = acorn.tokenizer(source, {
            ecmaVersion: "latest",
            onComment: (isBlock, text, start, end) => {
                comments.push({
                    type: isBlock ? "commentBlock" : "commentLine",
                    start,
                    end,
                    value: source.slice(start, end)
                });
                let oldlength = source.length;
                let len = end - start;
                let spaces = " ".repeat(len);
                source = source.substring(0, start) +
                    spaces +
                    source.substring(end);
                let newlength = source.length;
                if (oldlength !== newlength) {
                    debugger;
                }
            }
        });

        let fullfilepure1 = path.join(__dirname, "public", "temp", moduleName + "_newpure1.js");
        fs.writeFileSync(fullfilepure1, source); // OK!!!

        const literals = [];

        while (true) {
            const token = tokenizer.getToken();
            if (token.type.label === "eof") {
                break;
            }
            if (token.type.label === "string" ||
                token.type.label === "regexp" ||
                token.type.label === "template"
            ) {
                literals.push({
                    type: token.type.label,
                    start: token.start,   // 0-based
                    end: token.end,       // 1-based, also +1  
                    value: source.slice(token.start, token.end)
                });
                let oldlength = source.length;
                let len = token.end - token.start;
                let spaces = " ".repeat(len);
                source = source.substring(0, token.start) +
                    spaces +
                    source.substring(token.end);
                let newlength = source.length;
                if (oldlength !== newlength) {
                    debugger;
                }
            }
        }
        return {
            literals,
            source
        };
    };


    doc1000.preprocessJS = function (source) {
        const placeholders = {};
        let result = "";
        let i = 0;
        let id = 0;
        function addPlaceholder(type, value, start, end) {
            const key = `§${type}_${++id}§`;
            placeholders[key] = { type, value, start, end };
            return key;
        }
        while (i < source.length) {
            const c = source[i];
            const n = source[i + 1];
            // line comment
            if (c === "/" && n === "/") {
                while (i < source.length && source[i] !== "\n") {
                    result += " ";
                    i++;
                }
                continue;
            }
            // block comment
            if (c === "/" && n === "*") {
                const start = i;
                i += 2;
                while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
                    i++;
                }
                i += 2;
                result += " ".repeat(i - start);
                continue;
            }
            // string
            if (c === "'" || c === '"') {
                const quote = c;
                const start = i;
                i++;
                let escape = false;
                while (i < source.length) {
                    const ch = source[i];
                    if (escape) {
                        escape = false;
                    } else if (ch === "\\") {
                        escape = true;
                    } else if (ch === quote) {
                        i++;
                        break;
                    }
                    i++;
                }
                const value = source.slice(start, i);
                result += addPlaceholder("STR", value, start, i);
                continue;
            }
            result += c;
            i++;
        }
        return { source: result, placeholders };
    }




    /**
     * analysisReport
     * ret.functions hat nun functionname key, firstline, lastline, defstring, srcstring, htmlstring
     * callings und called
     * @param {*} ret - ret.functions[] mit {} key, callings, calleds
     * @returns html
     */
    doc1000.analysisReport = function (ret) {
        console.log(ret.structures[0]);
        console.log(ret.structures[1]);
        let htmlisolated = "<b>Isolierte Funktionen</b>";
        let htmlstarters = "<b>Startfunktionen</b>";
        let htmlfinalizers = "<b>Endefunktionen</b>";
        let htmlsubs = "<b>Sub-Funktionen</b>";
        //Object.keys(ret.structures).forEach(function (key, ikey) {
        for (let knode of ret.structures) {
            //let knode = ret.functions[key];
            knode.isub = 0;
            knode.mark = 0;
            knode.typ = 2;
            if (typeof knode.calling === "undefined") {
                knode.calling = [];
            }
            if (typeof knode.called === "undefined") {
                knode.called = [];
            }
            if (knode.calling.length > 0) {
                if (knode.calling[0].name === knode.name) {
                    knode.calling.splice(0, 1);
                }
            }
            if (knode.calling.length === 0 && knode.calledby.length === 0) {
                htmlisolated += "<br>" + knode.name;
                knode.typ = 0;
            } else if (knode.calling.length >= 0 && knode.calledby.length === 0) {
                htmlstarters += "<br>" + knode.name;
                knode.typ = 1;
            } else if (knode.calling.length === 0 && knode.calledby.length >= 0) {
                htmlfinalizers += "<br>" + knode.name;
                knode.typ = 3;
            } else {
                htmlsubs += "<br>" + knode.name;
                knode.typ = 4;
            }
            //console.log(knode.name);
        }
        /*
        let keys = Object.keys(ret.functions);
        let mark = 0;
        for (let isub = 1; isub < keys.length; isub++) {
            let found = false;
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                let relation = ret.functions[key];
                // start suchen
                if (relation.typ === 1 && relation.isub === 0 && relation.callings.length > 0) {
                    relation.isub = isub;
                    mark++;
                    relation.mark = mark;
                    // nachfolger aufbereiten und markieren
                    let nachfolgers = [];
                    relation.callings.forEach(function (calling, icalling) {
                        nachfolgers.push(calling);
                    });
                    for (let j = 0; j < keys.length; j++) {
                        if (typeof nachfolgers[j] === "undefined") {
                            break;
                        }
                        let nachfolger = nachfolgers[j];
                        if (ret.functions[nachfolger].isub > 0) {
                            // bereits bearbeitet
                            continue;
                        }
                        ret.functions[nachfolger].isub = isub;
                        mark++;
                        ret.functions[nachfolger].mark = mark;
                        ret.functions[nachfolger].callings.forEach(function (calling, icalling) {
                            if (nachfolgers.indexOf(calling) < 0) {
                                nachfolgers.push(calling);
                            }
                        });
                    }
                }
            }
        }
        // vereinfachte Aufbereitung Subsysteme
        let knodes = [];
        keys.forEach(function (key, ikey) {
            let relation = ret.functions[key]
            knodes.push({
                key: relation.key,
                typ: relation.typ,
                isub: relation.isub,
                mark: relation.mark,
                vorg: relation.calleds.length,
                nach: relation.callings.length
            });
        });
        knodes.sort(function (a, b) {
            if (a.isub < b.isub) {
                return -1;
            } else if (a.isub > b.isub) {
                return 1;
            } else if (a.mark < b.mark) {
                return -1;
            } else if (a.mark > b.mark) {
                return 1;
            }
            return 0
        });
        let htmlsubs = "<b>Subsysteme</b>";
        knodes.forEach(function (knode, iknode) {
            htmlsubs += "<br>" + iknode + " " + knode.key;
            htmlsubs += " typ:" + knode.typ;
            htmlsubs += " isub:" + knode.isub;
            htmlsubs += " mark:" + knode.mark;
            htmlsubs += " vorg:" + knode.vorg;
            htmlsubs += " nach:" + knode.nach;
        });
        */
        let html = "";
        html += "<br>" + htmlisolated;
        html += "<br>" + htmlstarters;
        html += "<br>" + htmlfinalizers;
        html += "<br>" + htmlsubs;
        //console.log(html);
        // Ausgabe error-file
        let htmlfile = path.join(__dirname, "public", "temp", ret.filename + "_report" + ".html");
        fs.writeFileSync(htmlfile, html);
    };

    /**
     * getRelations - prüft die Aufrufe und setzt callings und calleds
     * @param {*} ret 
     */
    doc1000.getRelations = function (ret) {
        let regexF = /(\w+)\.(\w+)\s*=\s*function\s*\(/g;
        let matchF;
        let knodes = {};
        let edges = {};
        let relations = [];
        Object.keys(ret.functions).forEach(function (key, ikey) {
            ret.functions[key].key = key;
            ret.functions[key].isub = 0;
            ret.functions[key].mark = 0;
            ret.functions[key].callings = [];
            ret.functions[key].calleds = [];
        });

        //let regexR = /(\w+)\.(\w+)\s*\(?/g;
        let regexR = /(\w+)\.(\w+)/g;
        // gezielte Analyse des vorhandenen Codes
        Object.keys(ret.functions).forEach(function (key, ikey) {
            let knode = ret.functions[key];
            let srcstring = ret.functions[key].srcstring;
            let srclines = srcstring.split(/\r\n|\r|\n/);
            srclines.forEach(function (line, iline) {
                if (iline < 1) {
                    return;
                }
                line = line.trim();
                let pattern = '\\b[a-zA-Z0-9_]+\\.[a-zA-Z0-9_]+\\b';
                let regex = new RegExp(pattern, 'gi');
                let hitarray = line.match(regex) || [];
                hitarray.forEach(function (hit) {
                    let matchR = hit.split(".");
                    let moduleName = matchR[0];
                    if (moduleName !== ret.moduleName) {
                        return;
                    }
                    let functionName = matchR[1];
                    let calledFunctionName = moduleName + "." + functionName;
                    if (typeof ret.functions[calledFunctionName] !== "undefined") {
                        ret.functions[key].callings.push(calledFunctionName);
                        ret.functions[calledFunctionName].calleds.push(key);
                        let edgekey = key + "|" + calledFunctionName;
                        if (typeof edges[edgekey] === "undefined") {
                            edges[edgekey] = 0;
                        }
                        edges[edgekey]++;
                    } else { }
                });
            });
        });
        // Ausgabe html-Kontrolldatei der Relationen
        let html = "";
        let txt = "";
        Object.keys(edges).forEach(function (key, ikey) {
            html += "<br>";
            html += key;
            html += " ";
            html += edges[key];
            txt += key.replace("|", "-->");
            txt += "\r\n";
        });
        // Ausgabe error-file
        let htmlfile = path.join(__dirname, "public", "temp", ret.filename + "_relations" + ".html");
        fs.writeFileSync(htmlfile, html);
        let txtfile = path.join(__dirname, "public", "temp", ret.filename + "_relations" + ".txt");
        fs.writeFileSync(txtfile, txt);
    };

    doc1000.checkSpecialLine = function (line) {
        let tests = ["initUI", "showCanvasUI", "restoreSavedOptions", "prepare4get", "saveConfig"];
        let erg = false;
        for (let i = 0; i < tests.length; i++) {
            let test = tests[i];
            if (line.indexOf(test) >= 0) {
                erg = true;
                break;
            }
        };
        return erg;
    };


    /**
     * getCheckFunctions - Syntax-Check und Ausgabe error-File, Fortschreigung ret.functions[i].checkerror und checkresult
     * ret mitfunctions {}:  key, moduleName, functionName, defstring, firstline, lastline, srcstring, srchtml
     * @param {*} ret 
     */
    doc1000.getCheckFunctions = function (ret) {
        let html = "";
        let controlarray = ret.controlarray;
        ret.errorcount = 0;
        controlarray.forEach(function (controldata, idata) {
            let functiondata = ret.functions[controldata[1]];
            let srcstring = ret.functions[controldata[1]].srcstring;
            let checkresult = "";
            let checkerror = "unclear";
            let key = ret.functions[controldata[1]].key;
            if (typeof srcstring === "string") {
                try {
                    // Attempt to parse the code
                    new Function(srcstring);
                    console.log(key + ' Syntax is valid.');
                    checkresult = 'Syntax is valid.';
                    checkerror = false;
                } catch (error) {
                    console.error(key + ' Syntax error:', error.message);
                    console.error(srcstring);
                    checkresult = 'Syntax error:' + error.message;
                    checkerror = true;
                    ret.errorcount++;
                }
            } else {
                console.error(key + ' Input is not a valid string.');
                checkresult = 'Input is not a valid string.';
                checkerror = true;
                ret.errorcount++;
            }
            ret.functions[controldata[1]].checkresult = checkresult;
            ret.functions[controldata[1]].checkerror = checkerror;

            if (checkerror === true) {
                let functiondata = ret.functions[controldata[1]];
                html += "<br>";
                html += "<b>";
                html += ("00000" + functiondata.firstline).slice(-5);
                html += " ";
                html += ("00000" + functiondata.lastline).slice(-5);
                html += " ";
                html += functiondata.key;
                html += "</b>";
                html += " ";
                html += "<br>";
                html += "<b><span tyle='color:red;'>" + functiondata.checkerror + " " + functiondata.checkresult + "</span></b>";
                html += "<br>";
                html += functiondata.srchtml;
                html += "<br>";
            }
        });
        // Ausgabe error-file
        let htmlfile = path.join(__dirname, "public", "temp", ret.filename + "_errors" + ".html");
        fs.writeFileSync(htmlfile, html);
    };


    doc1000.escapeHtml = function (htmlstring) {
        return htmlstring
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    };


    doc1000.getHtml = function (ret) {
        // ret.functions {} mit
        // key, moduleName, functionName, defstring, firstline, lastline
        let controlarray = [];
        Object.keys(ret.functions).forEach(function (key, ikey) {
            let functiondata = ret.functions[key];
            controlarray.push([functiondata.firstline, functiondata.key]);
        });
        controlarray.sort(function (a, b) {
            if (a[0] < b[0]) {
                return -1;
            } else if (a[0] > b[0]) {
                return 1;
            } else if (a[1] < b[1]) {
                return -1;
            } else if (a[1] > b[1]) {
                return 1;
            }
            return 0;
        });
        let html = "";
        controlarray.forEach(function (controldata, idata) {
            let functiondata = ret.functions[controldata[1]];
            html += "<br>";
            html += "<b>";
            html += ("00000" + functiondata.firstline).slice(-5);
            html += " ";
            html += ("00000" + functiondata.lastline).slice(-5);
            html += " ";
            html += functiondata.key;
            html += "</b>";
            html += " ";
            html += "<br>";
            if (functiondata.checkerror === true) {
                html += "<b><red>" + functiondata.checkerror + " " + functiondata.checkresult + "</red></b>";
            } else {
                html += functiondata.checkerror + " " + functiondata.checkresult;
            }
            html += "<br>";
            html += functiondata.defstring;
            html += "<br>";
            html += functiondata.srchtml;
        });
        ret.html = html;
        let htmlfile = path.join(__dirname, "public", "temp", ret.filename + ".html");
        fs.writeFileSync(htmlfile, html);
    };




    doc1000.prepareSource = async function (ret) {

        let { stripLiteral } = await import("strip-literal");

        let data = fs.readFileSync(ret.fullfilename, 'utf8');

        let puredata1 = strip(data);
        let fullfilepure1 = path.join(__dirname, "public", "temp", "pure1_" + ret.filename);
        fs.writeFileSync(fullfilepure1, puredata1); // OK!!!
        let puredata = stripLiteral(puredata1);
        let fullfilepure2 = path.join(__dirname, "public", "temp", "pure2_" + ret.filename);
        fs.writeFileSync(fullfilepure2, puredata); // OK!!!
        // prüfen puredata, es kann Fehler geben!!!
        for (let j = 1; j < 100; j++) {
            let found = false;
            for (let i = 1; i < 10; i++) {
                let i1 = puredata.indexOf("/**");
                let i2 = -1;
                if (i1 >= 0) {
                    i2 = puredata.indexOf("*/");
                    if (i2 > i1) {
                        console.log(puredata.substring(i1, i2 + 2));
                        let tstring = puredata.substring(0, i1) + " " + puredata.substring(i2 + 2);
                        puredata = tstring;
                        found = true;
                    }
                }
            }
            if (found === false) {
                break;
            }
        }
        // Sichern puredata zum Test
        let fullfilepure = path.join(__dirname, "public", "temp", "pure_" + ret.filename);
        fs.writeFileSync(fullfilepure, puredata); // OK!!!
        // Ersetzen String-Konstante durch Dummy-Platzhalter => evtl. später mal, jetzt nicht notwendig
        // Umsetzen in array of lines
        ret.lines = puredata.split(/\r\n|\r|\n/);
        return;
    };


    doc1000.setConfig = function (config) {
        doc1000.checkDirectories();
        let configData = JSON.stringify(config);
        let configFile = path.join(__dirname, "public", "config", "config.txt");
        fs.writeFileSync(configFile, 'utf8');
    };

    doc1000.getConfig = function () {
        doc1000.checkDirectories();
        let configFile = path.join(__dirname, "public", "config", "config.txt");
        let configData = fs.readFileSync(configFile, 'utf8');
        if (configData !== null) {
            if (typeof configData === "object") {
                return configData;
            } else if (typeof configData === "string") {
                let config = JSON.parse(configData);
                return config;
            }
        } else {
            return {};
        }
    };

    doc1000.checkDirectories = function () {
        let targetpath;
        targetpath = path.join(__dirname, "public", "data");
        if (!fs.existsSync(targetpath)) {
            fs.mkdirSync(targetpath);
        }
        targetpath = path.join(__dirname, "public", "temp");
        if (!fs.existsSync(targetpath)) {
            fs.mkdirSync(targetpath);
        }
        targetpath = path.join(__dirname, "public", "config");
        if (!fs.existsSync(targetpath)) {
            fs.mkdirSync(targetpath);
        }
    };


    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = doc1000;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return doc1000;
        });
    } else {
        // included directly via <script> tag
        root.doc1000 = doc1000;
    }
}());