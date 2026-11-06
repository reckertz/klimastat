/**
 * kli3020.js Module für die Topics einer location
 */

function createLocation() {

    //let parms = [title, function, datasource, variable, method, altmethod1, altmethod2, hydevar]
    let topicParms = [
        ["Zeitreihe", addStandardPage, "yeardata", "TMAX", "avg", "max", "min"],
        ["Zeitreihe", addStandardPage, "yeardata", "TMIN", "avg", "min", "max"],
        ["Zeitreihe", addStandardPage, "yeardata", "PRCP", "kum", "", ""],
        ["Zeitreihe", addStandardPage, "yeardata", "SNOW", "kum", "", ""],   // SNWD


        ["Trendanalyse", addStandardPage, "yeardata", "TMAX", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "TMIN", "avg_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "PRCP", "kum_reg", "", ""],
        ["Trendanalyse", addStandardPage, "yeardata", "SNOW", "kum_reg", "", ""],   // SNWD

        ["Höhenanalyse", addHydePage, "yeardata", "TMAX", "avg", "min", "max", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "TMIN", "avg", "min", "max", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "PRCP", "kum", "", "", "height"],
        ["Höhenanalyse", addHydePage, "yeardata", "SNOW", "kum", "", "", "height"],   // SNWD

        ["Bevölkerung", addHydePage, "yeardata", "TMAX", "avg_reg", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "TMIN", "avg_reg", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "PRCP", "kum_reg", "", "", "popd"],
        ["Bevölkerung", addHydePage, "yeardata", "SNOW", "kum_reg", "", "", "popd"],   // SNWD

        ["Bebauung", addHydePage, "yeardata", "TMAX", "avg_reg", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "TMIN", "avg_reg", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "PRCP", "kum_reg", "", "", "uopp"],
        ["Bebauung", addHydePage, "yeardata", "SNOW", "kum_reg", "", "", "uopp"],   // SNWD

        ["Urbanisierung", addHydePage, "yeardata", "TMAX", "avg_reg", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "TMIN", "avg_reg", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "PRCP", "kum_reg", "", "", "zind"],  // category!!!
        ["Urbanisierung", addHydePage, "yeardata", "SNOW", "kum_reg", "", "", "zind"],  // category!!!   // SNWD


        ["Hitzewellen", addExtremePage, "years", "TMAX", "ext", "", ""],
        ["Kältewellen", addExtremePage, "years", "TMIN", "ext", "", ""],
        ["Starkregen", addExtremePage, "years", "PRCP", "ext", "", ""],
        ["Schnee", addExtremePage, "years", "SNOW", "ext", "", ""]    // SNWD

        /*
         ["Korrelation", "yeardata", "TMAX-TMIN", "avg-korr", "", ""],
         ["Korrelation", "yeardata", "TMAX-PRCP", "avg-korr", "", ""],
         ["Korrelation", "yeardata", "PRCP-SNOW", "kum-korr", "", ""],
         ["Korrelation", "yeardata", "TMAX-EXT", "avg-cnt-korr", "", ""],
         */
    ];

    let detailtopics = [
        ["Tagesreihe", "years", "TMAX", "val", "", ""],
        ["Tagesreihe", "years", "TMIN", "val", "", ""],
        ["Tagesreihe", "years", "PRCP", "val", "", ""],
        ["Tagesreihe", "years", "SNOW", "val", "", ""]
    ]

    let containerid;
    let mode;
    let location;
    let locationkey;
    let geosets = [];
    //locationInstances.push(createLocation());
    //let locIndex = locationInstances.length - 1;

    async function addTopics(newcontainerid, colIndex, newmode, newlocation, newgeosets) {
        containerid = newcontainerid;
        mode = newmode;
        location = kli6900.cloneObject(newlocation);
        geosets = kli6900.cloneObject(newgeosets);
        locationkey = location.locname.replace(/[^\p{L}\p{N}]/gu, "");
        locationkey += " " + location.geonameid;
        for (let topicParm of topicParms) {
            let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
            if (mode === "mobile") {
                let $slider = null;
                let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
                $slider = $("<section>", {
                    id: "ds" + (Math.floor(Math.random() * 1000000) + 1000000),
                    class: "col col-12 slider mobile",  //  place-slider",
                    "data-topic": topicstring,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar,
                });
                $("#" + containerid).append($slider);
                let pageid = "dp" + (Math.floor(Math.random() * 1000000) + 1000000);
                let $page = $("<article>", {
                    id: pageid,
                    class: "col col-12 page mobile",  //  place-page",
                    "data-colindex": colIndex,
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar
                });
                $page.append(
                    $("<span style='font-weight: bold;margin:5px;'>").text(`${location.locname} ${variable} ${title}`),
                    // $("<span style='margin:5px'>").text(`(${locationkey})`)
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "chart",
                        class: "mychart",
                        css: {
                            backgroundColor: "lightyellow"
                        }
                    })
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "info",
                        class: "col col-12 myinfo",
                        css: {
                            "min-height": "50px",
                            backgroundColor: "pink"
                        }
                    })
                );
                $slider.append($page);
                let ret = await locfunction($page, mode, location, geosets, topicParm);
            } else if (mode === "desktop") {
                let $slider = null;
                let topicstring = title + "_" + datasource + "_" + variable + "_" + method;
                $slider = $("section[data-topic='" + topicstring + "']");
                if ($slider.length === 0) {
                    $slider = $("<section>", {
                        id: "ds" + (Math.floor(Math.random() * 1000000) + 1000000),
                        class: "slider desktop",
                        //class: "col col-12",  //  place-slider",
                        css: {
                            width: "100%",
                            display: "flex",
                            "flex-wrap": "wrap"
                        },
                        "data-topic": topicstring,
                        "data-title": title,
                        "data-datasource": datasource,
                        "data-variable": variable,
                        "data-method": method,
                        "data-altmethod1": altmethod1,
                        "data-altmethod2": altmethod2,
                        "data-hydevar": hydevar,
                    });
                    $("#" + containerid).append($slider);
                }
                let pageid = "dp" + (Math.floor(Math.random() * 1000000) + 1000000);
                let $page = $("<article>", {
                    id: pageid,
                    class: "page desktop",
                    //class: "col col-4",  //  place-page",
                    css: {
                        flex: "0 0 33.3333%",
                        "box-sizing": "border-box"
                    },
                    "data-colindex": colIndex,
                    "data-topic": topicstring,
                    "data-place": locationkey,
                    "data-title": title,
                    "data-datasource": datasource,
                    "data-variable": variable,
                    "data-method": method,
                    "data-altmethod1": altmethod1,
                    "data-altmethod2": altmethod2,
                    "data-hydevar": hydevar
                });
                $page.append(
                    $("<span style='font-weight: bold;margin:5px;'>").text(`${location.locname} ${variable} ${title}`),
                    // $("<span style='margin:5px'>").text(`(${locationkey})`)
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "chart",
                        class: "mychart",
                        css: {
                            backgroundColor: "lightyellow"
                        }
                    })
                );
                $page.append(
                    $("<div>", {
                        id: pageid + "info",
                        class: "col col-12 myinfo",
                        css: {
                            "min-height": "50px",
                            backgroundColor: "pink"
                        }
                    })
                );
                $slider.append($page);
                let ret = await locfunction($page, mode, location, geosets, topicParm);
            }

        }
    }

    async function addStandardPage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min"],
    }


    async function addHydePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min"],
    }

    async function addExtremePage($page, mode, location, geosets, topicParm) {
        let [title, dummy, datasource, variable, method, altmethod1, altmethod2, hydevar] = topicParm;
        //["Zeitreihe", dummy, "yeardata", "TMAX", "avg", "max", "min"],
    }
    return {
        addTopics
    };
}

export {
    createLocation
}