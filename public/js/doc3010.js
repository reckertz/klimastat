/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3031, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let doc3010 = {};

    /**
     * doc3010 - Berechnen und Anzeigen Call-Graph für eine JavaScript-Source
     * Aufruf aus der Klimaanwendung 
     */
    let oksign = "&#10003;"; // Haken "✓" oder &#x25CB;
    let cancelsign = "&#10005;"; // x oder &#x25CF;
    let okletter = "✓";
    let cancelletter = "✕"; // soll font-abhängig sein, also Vorsicht

    let totaledges = [];
    let relationcontrol = {};

    let mermaidcontrols = {};
    let namecontrols = {};

    doc3010.convert2mermaid = function (name) {
        let mermaidname = name;

        mermaidname = mermaidname.replace(/\./g, "_");
        mermaidname = mermaidname.replace(/\$/g, "_");
        mermaidname = mermaidname.replace(/\(/g, "_");
        mermaidname = mermaidname.replace(/\)/g, "_");
        mermaidname = mermaidname.replace(/\[/g, "_");
        mermaidname = mermaidname.replace(/\]/g, "_");
        mermaidname = mermaidname.replace(/__/g, "_");
        mermaidname = mermaidname.replace(/__/g, "_");
        mermaidname = mermaidname.replace(/__/g, "_");
        mermaidcontrols[mermaidname] = name;
        namecontrols[name] = mermaidname;

        return mermaidname;
    };

    doc3010.show = async function (args) {
        debugger;
        // einbinden externe Module, die nicht in index.html sind
        let ret00 = await kli6900.getScriptA("doc3001");
        let url = "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js";
        let ret01 = await new Promise((resolve, reject) => {
            $.getScript(url)
                .done(resolve)
                .fail((jqxhr, settings, err) => reject(err));

        });
        mermaid.run();
        let ui = doc3010.create();
        let payload = await ui.getPayload(args);

        // payload.structures vorbereiten für mermaid-Regeln
        // mermaidcontrols = {}; und  let namecontrols = {};
        for (let structure of payload.structures) {
            if (typeof structure.name === "undefined") {
                debugger;
            }
            structure.mermaid = doc3010.convert2mermaid(structure.name);
            mermaidcontrols[structure.mermaid] = structure.name;
            namecontrols[structure.name] = structure.mermaid;
        }

        let containerid = await ui.showUI(payload);

        $(".kli6010buttons")
            .append($("<button/>", {
                html: "<b><span>" + oksign + "</span><span> functions </span></b>",
                class: "btn btn-sm btn-primary doc3010selvar",
                varname: "type",
                varvalue: "function",
                css: {
                    margin: "5px"
                }
            }));

        $(".kli6010buttons")
            .append($("<button/>", {
                html: "<b><span>" + oksign + "</span><span> events </span></b>",
                class: "btn btn-sm btn-primary doc3010selvar",
                varname: "type",
                varvalue: "events",
                css: {
                    margin: "5px"
                }
            }));

        let container = document.getElementById(containerid);
        const tabs = doc3001.createTabs(container);

        let emptydiv = "";
        emptydiv = "<div id='" + payload.filename + "_cmds'>"
        emptydiv += "</div>";
        emptydiv += "<div id='" + payload.filename + "_div'></div>";
        emptydiv += "<div id='" + payload.filename + "_prot'></div>"
        tabs.addTab(payload.filename, payload.filename, emptydiv);

        // Aufbau der steuerdatei für mermaid
        let graphdef = "";
        graphdef += "graph TD \n";
        let structures = payload.structures;
        payload.structurecontrol = {};
        let istruct = -1;
        for (let structure of structures) {
            istruct++;
            structure.index = istruct;
            payload.structurecontrol[structure.name] = istruct;
        }
        relationcontrol = {};
        for (let structure of structures) {
            /*
            Strukturbeispiel
            name: "ghd3031.pause"
            type: "function" oder "event" - tolerant abfragen
            calledby: ['ghd3031.createChart', 'ghd3031.calculateAutoHeight']
            calling: ['ghd3031.createChart', 'ghd3031.calculateAutoHeight']
            */
            let von = structure;
            if (von.type === "function") {
                if (typeof von.calling !== "undefined" && von.calling.length > 0) {
                    for (let bis of von.calling) {
                        //let bisindex = payload.structurecontrol[bisname];
                        //let bis = structures[bisindex];
                        if (bis.type === "function") {
                            //mermaidcontrols[structure.mermaid] = structure.name;
                            //namecontrols[structure.name] = structure.mermaid;
                            if (doc3010.relationCheck(relationcontrol, von.name, bis.name)) {
                                graphdef += namecontrols[von.name] + "-->" + namecontrols[bis.name] + "\n";
                            }
                        }
                    }
                }
            }
        }
        let mermaidid = await ui.renderMermaid(payload.filename + "_div", graphdef);

        let cmdsel = document.getElementById(payload.filename + "_cmds");
        $(cmdsel)
            .append($("<button/>", {
                mermaidid: mermaidid,
                mainfunctionname: payload.filename, // mainfunctionname,
                graphdefinition: graphdef,
                orientation: "TD",
                html: "Top-Down",
                click: async function (evt) {
                    evt.preventDefault();
                    let mermaidid = $(this).attr("mermaidid");
                    let mainfunctionname = $(this).attr("mainfunctionname");
                    let orientation = $(this).attr("orientation");
                    let graphdefinition = $(this).attr("graphdefinition");
                    let newgraph = graphdefinition.replace("graph LR", "graph TD");
                    $("#" + mainfunctionname + "_div").children().remove();
                    let newmermaidid = await ui.renderMermaid(mainfunctionname + "_div", newgraph);
                }
            }));

        $(cmdsel)
            .append($("<button/>", {
                mermaidid: mermaidid,
                mainfunctionname: payload.filename,
                graphdefinition: graphdef,
                orientation: "LR",
                html: "Left-Right",
                click: async function (evt) {
                    evt.preventDefault();
                    let mermaidid = $(this).attr("mermaidid");
                    let mainfunctionname = $(this).attr("mainfunctionname");
                    let orientation = $(this).attr("orientation");
                    let graphdefinition = $(this).attr("graphdefinition");
                    let newgraph = graphdefinition.replace("graph TD", "graph LR");
                    $("#" + mainfunctionname + "_div").children().remove();
                    let newmermaidid = await ui.renderMermaid(mainfunctionname + "_div", newgraph);
                }
            }));


        $(cmdsel)
            .append($("<button/>", {
                mermaidid: mermaidid,
                html: "Clipboard",
                click: async function (evt) {
                    evt.preventDefault();
                    let mermaidid = $(this).attr("mermaidid");
                    let graphcontainerid = $("#" + mermaidid).parent().attr("id");
                    let that = this;
                    doc3010.saveMermaidGraph("clipboard", mermaidid, that);   //  graphcontainerid
                }
            }));


        $(document).on("click", ".nodeLabel", async function (evt) {
            let mermaidnodename = $(this).text();
            let nodename = mermaidcontrols[mermaidnodename];
            //let graphdefinition = ui.calcGraph(nodename, "TD", totaledges);
            let graphdefinition = await doc3010.getSubgraph(nodename, ui, payload);

            let emptydiv = "";
            emptydiv = "<div id='" + nodename + "_cmds'>";
            //emptydiv += "<button class='btn btn-sm btn-primary doc3010toggle' orientation='TD'>TD</button>";
            emptydiv += "</div>";
            emptydiv += "<div id='" + nodename + "_div'></div>";
            emptydiv += "<div id='" + nodename + "_prot'></div>"
            tabs.addTab(nodename, nodename, emptydiv);
            tabs.selectTab(nodename);
            await doc3010.pause(100);
            let html = "";
            html += "<span>";
            html += graphdefinition.replace(/\n/g, "<br>"); // LR oder TD
            html += "</span>";
            let protel = document.getElementById(nodename + "_prot");
            $(protel).html(html);

            let mermaidid = await ui.renderMermaid(nodename + "_div", graphdefinition);
            let cmdsel = document.getElementById(nodename + "_cmds");
            $(cmdsel).children().remove();
            $(cmdsel)
                .append($("<button/>", {
                    mermaidid: mermaidid,
                    mainfunctionname: nodename,
                    graphdefinition: graphdefinition,
                    orientation: "TD",
                    html: "Top-Down",
                    click: async function (evt) {
                        evt.preventDefault();
                        let mermaidid = $(this).attr("mermaidid");
                        let mainfunctionname = $(this).attr("mainfunctionname");
                        let orientation = $(this).attr("orientation");
                        let graphdefinition = $(this).attr("graphdefinition");
                        let newgraph = graphdefinition.replace("graph LR", "graph TD");
                        $("#" + mainfunctionname + "_div").children().remove();
                        let newmermaidid = await ui.renderMermaid(mainfunctionname + "_div", newgraph);
                    }
                }));

            $(cmdsel)
                .append($("<button/>", {
                    mermaidid: mermaidid,
                    mainfunctionname: nodename,
                    graphdefinition: graphdefinition,
                    orientation: "LR",
                    html: "Left-Right",
                    click: async function (evt) {
                        evt.preventDefault();
                        let mermaidid = $(this).attr("mermaidid");
                        let mainfunctionname = $(this).attr("mainfunctionname");
                        let orientation = $(this).attr("orientation");
                        let graphdefinition = $(this).attr("graphdefinition");
                        let newgraph = graphdefinition.replace("graph TD", "graph LR");
                        $("#" + mainfunctionname + "_div").children().remove();
                        let newmermaidid = await ui.renderMermaid(mainfunctionname + "_div", newgraph);
                    }
                }));

            $(cmdsel)
                .append($("<button/>", {
                    mermaidid: mermaidid,
                    html: "Clipboard",
                    click: async function (evt) {
                        evt.preventDefault();
                        let mermaidid = $(this).attr("mermaidid");
                        let graphcontainerid = $("#" + mermaidid).parent().attr("id");
                        let that = this;
                        doc3010.saveMermaidGraph("clipboard", mermaidid, that);   //  graphcontainerid
                    }
                }));
        });
    };

    doc3010.getSubgraph = async function (nodename, ui, payload) {
        // Aufbau der steuerdatei für mermaid
        // payload mit payload.structures und structurecontrol für reverse index
        // Verhindern doppelte Relationen
        relationcontrol = {};
        let graphdef = "";
        graphdef += "graph TD \n";
        let nodebuffer = [];
        nodebuffer.push(nodename);  // nur die knotennamen!!! 
        let isave = 0;
        // Nachfolger finden
        for (let i = 0; i < 10000; i++) {
            if (i >= nodebuffer.length) {
                isave = i;
                break;
            }
            // Nachfolger mit Pseudo-Rekursion bestimmen
            let actnodename = nodebuffer[i]; // von-node
            let actnodeindex = payload.structurecontrol[actnodename];
            let structure = payload.structures[actnodeindex];
            if (typeof structure.calling !== "undefined" && structure.calling.length > 0) {
                for (let calling of structure.calling) {
                    let callingindex = payload.structurecontrol[calling.name];
                    let calledstructure = payload.structures[callingindex];
                    let calledname = calledstructure.name;
                    if (calledstructure.type === "function") {
                        if (nodebuffer.indexOf(calledname) >= 0) {
                            // bereits vorhanden
                            // graphdef += actnodename + "-->" + calledname + "\n";
                            //mermaidcontrols[structure.mermaid] = structure.name;
                            //namecontrols[structure.name] = structure.mermaid;
                            if (doc3010.relationCheck(relationcontrol, actnodename, calledname)) {
                                graphdef += namecontrols[actnodename] + "-->" + namecontrols[calledname] + "\n";
                            }
                        } else {
                            nodebuffer.push(calledname);
                            //graphdef += actnodename + "-->" + calledname + "\n";
                            if (doc3010.relationCheck(relationcontrol, actnodename, calledname)) {
                                graphdef += namecontrols[actnodename] + "-->" + namecontrols[calledname] + "\n";
                            }
                        }
                    }
                }
            }
        }
        // Vorgänger finden, Loops werden toleriert
        nodebuffer.length = 0;
        nodebuffer.push(nodename);  // nur die knotennamen!!! 
        for (let i = 0; i < 10000; i++) {
            if (i >= nodebuffer.length) {
                isave = i;
                break;
            }
            // Vorgänger mit Pseudo-Rekursion bestimmen
            let actnodename = nodebuffer[i]; // von-node
            let actnodeindex = payload.structurecontrol[actnodename];
            let structure = payload.structures[actnodeindex];
            // feststellen, ob Vorgänger vorhanden ist
            if (structure.type === "function") {
                if (typeof structure.calledby !== "undefined" && structure.calledby.length > 0) {
                    for (let calledby of structure.calledby) {
                        let calledbyindex = payload.structurecontrol[calledby.name];
                        let calledbystructure = payload.structures[calledbyindex];
                        let calledbyname = calledbystructure.name;
                        if (calledbystructure.type === "function") {
                            if (nodebuffer.indexOf(calledbyname) >= 0) {
                                // bereits vorhanden
                                // graphdef += calledbyname + "-->" + actnodename + "\n";
                                if (doc3010.relationCheck(relationcontrol, calledbyname, actnodename)) {
                                    graphdef += namecontrols[calledbyname] + "-->" + namecontrols[actnodename] + "\n";
                                }
                            } else {
                                nodebuffer.push(calledbyname);
                                //graphdef += calledbyname + "-->" + actnodename + "\n";
                                if (doc3010.relationCheck(relationcontrol, calledbyname, actnodename)) {
                                    graphdef += namecontrols[calledbyname] + "-->" + namecontrols[actnodename] + "\n";
                                }
                            }
                        } else {
                            let estatus = $("button.doc3010selvar[varvalue=events]").find("span").first().text();
                            // event ausgeben ohne nodebuffer!!!
                            //graphdef += calledbyname + "-->" + actnodename + "\n";
                            if (estatus === okletter) {
                                if (doc3010.relationCheck(relationcontrol, calledbyname, actnodename)) {
                                    graphdef += namecontrols[calledbyname] + "-->" + namecontrols[actnodename] + "\n";
                                }
                            }
                        }
                    }
                }
            }
        }
        return graphdef;
    };

    doc3010.relationCheck = function (relationcontrol, von, nach) {
        let relation = von + "_" + nach;
        if (typeof relationcontrol[relation] === "undefined") {
            relationcontrol[relation] = 1;
            return true;
        } else {
            relationcontrol[relation]++;
            return false;
        }
    };

    $(document).on("click", ".doc3010selvar", function (evt) {
        evt.preventDefault();
        let estatus = $(this).find("span").first().text();
        if (estatus === okletter) {
            $(this).find("span").first().html(cancelsign);
        } else {
            $(this).find("span").first().html(oksign);
        }

    });

    doc3010.saveMermaidGraph = function (cmd, graphcontainerid, that) {
        // sichern von svg nach img jpg und export ins Clipboard oder auf den Server

        //let svgContainer = $("#" + graphcontainerid)[0];
        //let svgElement = svgContainer.querySelector('svg');

        let svgElement = document.getElementById(graphcontainerid);
        if (svgElement === null) {
            let container = $(that).closest("div.tf-panel.active");
            graphcontainerid = $(container).find("svg").first().attr("id");
            svgElement = document.getElementById(graphcontainerid);
        }
        // viewBox auslesen
        const viewBox = svgElement.viewBox.baseVal;
        // wichtig: volle Größe setzen
        svgElement.setAttribute("width", viewBox.width);
        svgElement.setAttribute("height", viewBox.height);
        // Convert the SVG element to a data URL
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
        // Create a new Image element and set the src to the SVG data URL
        const jpgImage = new Image();
        jpgImage.src = svgDataUrl;

        // Convert the Image element to a JPG image
        jpgImage.onload = function () {
            /*
            const canvas = document.createElement('canvas');
            canvas.width = jpgImage.width;
            canvas.height = jpgImage.height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(jpgImage, 0, 0);
            let dataURL = "";
            if (cmd === "clipboard") {
                dataURL = canvas.toDataURL('image/png');
            } else {
                dataURL = canvas.toDataURL('image/png');
            }
            */
            const scale = 3; // höhere Auflösung
            const canvas = document.createElement('canvas');
            canvas.width = jpgImage.width * scale;
            canvas.height = jpgImage.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.drawImage(jpgImage, 0, 0);

            const dataURL = canvas.toDataURL('image/png');

            const parts = dataURL.split(';base64,');
            const byteString = atob(parts[1]);
            const mimeType = parts[0].split(':')[1];
            let byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }
            let newBlob = new Blob([byteArray], {
                type: mimeType
            });

            if (cmd === "download") {
                // Download the Graph as JPG image 
                // Create a link element
                const link = document.createElement('a');
                //link.href = URL.createObjectURL(newBlob);
                link.href = dataURL;
                link.download = 'image.png'; // Set the file name
                // Append the link to the body
                document.body.appendChild(link);
                // Trigger the download
                link.click();
                // Remove the link from the document
                document.body.removeChild(link);
            }


            if (cmd === "clipboard") {
                // Copy the Graph as PNG image to the clipboard
                try {
                    // Create a ClipboardItem for the image Blob
                    const item = new ClipboardItem({
                        "image/png": newBlob
                    });
                    // Write the image to the clipboard
                    navigator.clipboard.write([item])
                        .then(() => {
                            kli6900.putMessage("Copy to clipboard successfull");
                            console.log("Content copied to clipboard successfully!");
                        })
                        .catch((error) => {
                            kli6900.putMessage("Copy to clipboard Error:" + error, 3);
                            console.error("Error copying content to clipboard:", error);
                        });
                } catch (err) {
                    kli6900.putMessage("Failed to copy image: " + err, 3);
                }
            }
        };

    };



    doc3010.pause = async function (ms = 50) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    };



    /**
    * doc3010.createTabs - Factory Function Eröffnung
    *
    * @param {any} container - extern vorgegebenes div als Container
    *  für addTab, removeTab und selectTab; benötigt caller im Aufrufparameter
    *  getsourceanalysis ist der Server-API zur Vorbereitung: holen source, 
    *  strip-comments und strip-literals sowie Hauptfunktionen <modulename>.<functionname> = function (...) {. . .};
    *  es werden dann die Unterfunktionen der Hauptfunktionen dokumentiert als call-graph
    * @returns {any} - This function does not return a value but performs assertions on the input data.
    */
    doc3010.create = function (container) {

        async function getPayload(args) {
            let pkeys = Object.keys(args);
            let caller = args.caller;
            let modus = args.modus;
            let data1 = {
                timeout: 10 * 60 * 1000,
                filename: caller + ".js",
                modus: modus,
                skip: 0,
                limit: 0
            };
            let searchParms = new URLSearchParams(data1);
            let startTime = new Date();
            let response = await fetch(`/getsourceanalysis?${searchParms.toString()}`, {
                method: "get",
                headers: {
                    'Accept': 'application/text',
                    'Content-Type': 'application/text'
                },
                //make sure to serialize your JSON body - nur bei POST, dann einfache url
                // body: JSON.stringify({ ... })
            });
            let retstring = await response.text();
            let ret = JSON.parse(retstring);
            //let ret = JSON.parse(retstring);
            let performance = kli6900.getPerformance(startTime);
            console.log(performance);
            // analog zu doc1000
            return ret;
        }

        async function showUI(payload) {
            console.log("doc3010 - Doc-Graph");
            // document.title
            $('meta[name="description"]').attr("content", "Graph " + payload.filename);
            $("nav").children().remove();
            kli6900.initUI("online");
            $(".subtitletext").text("");
            $(".titletext").text("Graph " + payload.filename);
            if (document.title != "Graph " + payload.filename) {
                document.title = "Graph " + payload.filename;
            }
            $(".klimobile").remove();
            $("body").removeClass("overflow-hidden");
            $("body").addClass("overflow-hidden");
            $("body").css("height", "100vh");
            let navh = $("nav.header").height();
            //let scrh = screen.height;
            let scrh = $("body").height();
            payload.h = scrh - navh * 2.5;
            let scrollbarwidth = kli6900.getScrollbarWidth("body");
            payload.w = screen.width - scrollbarwidth;
            let containerid = "div" + Math.floor(Math.random() * 100000) + 1;
            if ($(".klicontainer").length <= 0) {
                $("body")
                    .append($("<div/>", {
                        class: "container-fluid klicontainer overflow-auto",
                        id: containerid,
                        pageid: "doc3010",
                        css: {
                            "background-color": "navyblue",
                            height: payload.h
                        }
                    })
                        .append($("<div/>", {
                            class: "row"
                        })
                            .append($("<div/>", {
                                class: "col-10 col-sm-10 col-md-10 col-lg-10 kli6010buttons overflow-auto"
                            }))
                        )
                        .append($("<div/>", {
                            class: "row"
                        })
                            .append($("<div/>", {
                                class: "col-12 col-sm-12 col-md-12 col-lg-12 kli6010grid overflow-auto",
                                css: {
                                    overflow: "auto"
                                }
                            }))
                        )
                    );
            }
            return containerid;
        }

        function subFunctionsAnalysis(mainfunctionname, lines) {
            let regex = /\b(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
            let match;
            // TODO: später einmal auch events auflösen
            //let eventRegex = /\$\(document\)\.on\("([^"]+)",\s*"([^"]+)",\s*function\s*\(/;
            //let eventRegex = /\$\(document\)\.on\("([^"]+)",\s*"([^"]+)",\s*(?:async\s*)?function\s*\(/;
            //let eventMatch;
            let ret = {};
            ret.functions = {};
            lines.forEach(function (line, iline) {
                // search module-functions
                let match = regex.exec(line);
                if (match !== null) {
                    let moduleName = "";
                    let functionName = match[1];
                    // key, moduleName, functionName, defstring, firstline, lastline
                    ret.functions[functionName] = {
                        key: functionName,
                        functionName: functionName,
                        calleds: [],
                        callings: [],
                        defstring: "",
                        firstline: iline,
                        lastline: 0
                    };
                    // Look-Ahead für die Definitionen
                    let defstring = "";
                    for (let i = iline; i < lines.length; i++) {
                        defstring += line;
                        if (defstring.indexOf(")") >= 0) {
                            break;
                        }
                    }
                    ret.functions[functionName].defstring = defstring;
                    console.log(functionName);
                }
                //TODO: search event-functions, später vielleicht einmal
                /*
                if ((eventMatch = eventRegex.exec(line)) !== null) {
                    let moduleName = ret.moduleName; //"kla4744";
                    let functionName = eventMatch[1] + "." + eventMatch[2];
                    //console.log(`Found function: ${moduleName}.${functionName}`);
                    // key, moduleName, functionName, defstring, firstline, lastline
                    ret.functions[moduleName + "." + functionName] = {
                        key: moduleName + "." + functionName,
                        moduleName: moduleName,
                        functionName: functionName,
                        defstring: line,
                        firstline: iline,
                        lastline: 0
                    };
                    console.log(moduleName + "." + functionName);
                }
                */
            });
            console.log(ret.functions);
            // ret.functions {} mit
            // key, moduleName, functionName, defstring, firstline, lastline
            let controlarray = [];
            ret.controlarray = controlarray;
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
            // Source-Abschnitte zuordnen mit Look-Ahead
            let lastind = controlarray.length - 1;
            controlarray.forEach(function (controldata, idata) {
                // look-Ahead
                let fromind = parseInt(controldata[0]);
                let toind = fromind;
                let ahead = idata + 1;
                if (ahead < lastind) {   // von <=, hier nur kleiner, sonst letzter
                    // triviales Ende
                    toind = parseInt(controlarray[ahead][0]) - 1;
                } else {
                    // letzte Funktion, daher bis Ende gehen
                    //toind = lastind;
                    toind = lines.length - 1;
                }
                let srcstring = "";
                let srchtml = "";
                for (let j = fromind; j <= toind; j++) {
                    srcstring += lines[j] + "\r\n";
                    //srchtml += "<br>" + doc1000.escapeHtml(ret.lines[j]);
                }
                ret.functions[controldata[1]].srcstring = srcstring;
                ret.functions[controldata[1]].srchtml = srchtml;
                ret.functions[controldata[1]].lastline = ("00000" + toind).slice(-5);
            });
            let functionnames = Object.keys(ret.functions);
            for (let functionname of functionnames) {
                let msg = functionname;
                msg += " " + ret.functions[functionname].firstline;
                msg += " " + ret.functions[functionname].lastline;
                console.log(msg);
            }
            console.log(ret.functions);
            return ret.functions;
        }

        /**
        * getSubRelations
        *
        * @param {any} functionname - Vorgabe des functionname innerhalb einer Hauptfunktion (Factory Function)
        * @param {any} functions - Struktur der Funktionene der Hauptfunktion, wichtig: srcstring der Funktion
        *
        * @returns {any} - This function does not return a value but performs assertions on the input data.
        */
        function getSubRelations(functionname, functions) {
            let subfunctions = {};
            let edges = {};
            let regexR = /(\w+)\s*\(/g;  // aufrufname mit evtl. Blanks und Klammer auf
            let lines = functions[functionname].srcstring.split(/\r\n|\r|\n/);
            let targetnames = Object.keys(functions);
            // gezielte Analyse des vorhandenen Codes
            lines.forEach(function (line, iline) {
                if (iline < 1) {
                    return;
                }
                line = line.trim();
                let hitarray = line.match(regexR) || [];
                hitarray.forEach(function (hit) {
                    hit = hit.replace("(", "");
                    hit = hit.trim();
                    if (targetnames.indexOf(hit) >= 0) {
                        functions[functionname].callings.push(hit);
                        functions[hit].calleds.push(functionname);
                        let edgekey = functionname + "|" + hit;
                        if (typeof edges[edgekey] === "undefined") {
                            edges[edgekey] = 0;
                        }
                        edges[edgekey]++;
                    }
                });
            });
            return {
                edges
            };
        };

        /**
        * calcGraph - Berechnung und Anzeige des Graphen
        *
        * @param {any} key -
        * @param {any} orientation -
        * @param {any} alledges - array von {edges: {<von|nach>:<count>,<von|nach>:<count>,. . . }}
        *
        * @returns {any} - string als graph-Definition
        */
        function calcGraph(key, orientation, alledges) {
            if (typeof orientation === "undefined") {
                orientation = "TD";   // oder LR
            }
            let tdata = "";  // von --> bis aus edge von|bis
            // alledges, z.B. 2: edges: {getFromDB|putDTR: 1, getFromDB|setdatastats: 1}
            for (let element of alledges) {
                let edgeelements = element.edges;
                let edges = Object.keys(edgeelements);
                for (let edge of edges) {
                    let [von, bis] = edge.split("|");
                    tdata += von + "-->" + bis + "\n";
                }
            }
            let graphdefinition = "graph " + orientation + "\n" + tdata;
            mermaid.initialize({
                startOnLoad: true,
                securityLevel: "loose"
            });
            mermaid.init({
                noteMargin: 10,
                securityLevel: "loose"
            }, ".mermaid");
            return graphdefinition;
        };

        function renderMermaid(containerId, graph) {
            const el = document.getElementById(containerId);
            const id = "m" + Math.random().toString(36).slice(2);
            return mermaid.render(id, graph).then(({ svg }) => {
                el.innerHTML = svg;
                return id;
            });
        }

        // ---------- Public API ----------
        return {
            getPayload,
            showUI,
            subFunctionsAnalysis,
            getSubRelations,
            calcGraph,
            renderMermaid
        };
    };

    // --- Weitere Modul-API ---
    doc3010.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.doc3010 = doc3010;
})(window);
