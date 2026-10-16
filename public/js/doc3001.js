/*jshint laxbreak:true,evil:true */
/*global $:false, intel:false, cordova:false, device:false */
/*global $,window,module,define,root,global,self,this,document,alert */
/*global ghd3031, console, kli6900,kla6950,kla6960 */
(function (global) {
    "use strict";
    let doc3001 = {};
    /**
    * doc3001.createTabs - Factory Function Eröffnung
    *
    * @param {any} container - extern vorgegebenes div als Container
    *  für addTab, removeTab und selectTab
    *
    * @returns {any} - This function does not return a value but performs assertions on the input data.
    */
    doc3001.createTabs = function (container) {

        // ---------- Styles einmalig erzeugen ----------
        if (!document.getElementById("tabs-factory-style")) {
            let style = document.createElement("style");
            style.id = "tabs-factory-style";
            style.textContent = `
        .tf-tabs { font-family: sans-serif; border:1px solid #bbb; }
        .tf-header { display:flex; background:#eee; border-bottom:1px solid #bbb; }
        .tf-tab-btn {
            padding:6px 12px;
            cursor:pointer;
            border-right:1px solid #bbb;
            user-select:none;
        }
        .tf-tab-btn.active {
            background:white;
            font-weight:bold;
        }
        .tf-body { padding:10px; }
        .tf-panel { display:none; }
        .tf-panel.active { display:block; }
        `;
            document.head.appendChild(style);
        }

        // ---------- DOM Grundstruktur ----------
        let root = document.createElement("div");
        root.className = "tf-tabs";

        let header = document.createElement("div");
        header.className = "tf-header";

        let body = document.createElement("div");
        body.className = "tf-body";

        root.appendChild(header);
        root.appendChild(body);
        container.appendChild(root);

        // ---------- interner Zustand ----------
        let tabs = new Map();
        let activeId = null;

        // ---------- Tab aktivieren ----------
        function selectTab(id) {

            if (!tabs.has(id)) return;

            tabs.forEach((t) => {
                t.button.classList.remove("active");
                t.panel.classList.remove("active");
            });

            let tab = tabs.get(id);

            tab.button.classList.add("active");
            tab.panel.classList.add("active");

            activeId = id;
        }

        // ---------- Tab hinzufügen ----------
        function addTab(id, title, content) {

            if (tabs.has(id)) return;

            let button = document.createElement("div");
            button.className = "tf-tab-btn";
            button.textContent = title;

            let panel = document.createElement("div");
            panel.className = "tf-panel";

            if (content instanceof HTMLElement) {
                panel.appendChild(content);
            } else {
                panel.innerHTML = content;
            }

            header.appendChild(button);
            body.appendChild(panel);

            button.addEventListener("click", () => selectTab(id));

            tabs.set(id, { button, panel });

            if (activeId === null) selectTab(id);
        }

        // ---------- Tab entfernen ----------
        function removeTab(id) {

            let tab = tabs.get(id);
            if (!tab) return;

            tab.button.remove();
            tab.panel.remove();

            tabs.delete(id);

            if (activeId === id) {
                let first = tabs.keys().next().value;
                if (first) selectTab(first);
                else activeId = null;
            }
        }

        // ---------- Public API ----------
        return {
            addTab,
            removeTab,
            selectTab,
            getActive: () => activeId,
            destroy: () => root.remove()
        };
    };

    // --- Weitere Modul-API ---
    doc3001.VERSION = "1.0.0";
    // Export nur EIN Objekt
    global.doc3001 = doc3001;
})(window);
