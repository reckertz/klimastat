
function createHelp(args = {}) {

    const url = args.url || "/help/klima-help-de.html";

    let helpDocument = null;
    let loading = null;
    let dialog = null;

    // Hilfedatei einmalig laden
    async function load() {

        if (helpDocument) return helpDocument;
        if (loading) return loading;

        loading = (async function () {

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Help HTTP ${response.status}`);
            }

            const html = await response.text();

            helpDocument = new DOMParser()
                .parseFromString(html, "text/html");

            return helpDocument;

        })();

        try {
            return await loading;
        } finally {
            loading = null;
        }
    }

    // Einzelne Section als DOM-Kopie bereitstellen
    async function get(topicid) {

        const doc = await load();
        const section = doc.getElementById(topicid);

        if (!section) {
            console.warn("Help topic not found:", topicid);
            return null;
        }

        const copy = section.cloneNode(true);
        const html = resolveReferences(copy, doc, new Set([topicid]));
        return html;
    }

    // HTML-Gerüste erzeugen und ins Clipboard kopieren
    // let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topicParm;
    async function generate(topics) {

        const html = topics.map(function (topic) {
            let [title, locfunction, datasource, variable, method, altmethod1, altmethod2, hydevar, helpkey] = topic;
            //const id = escapeHTML(helpkey);
            title = escapeHTML(title);

            return `
<section id="${helpkey}">
    <h3>${title}</h3>
    <p>Kurzbeschreibung ...</p>

    <details>
        <summary>Weitere Erläuterungen</summary>
        <p>Ergänzender Text ...</p>
        ${helpkey}
        ${locfunction.name}
        ${datasource}
        ${variable} ${method}
        ${hydevar} 
    </details>
    <details>
        <summary>Wissenschaftliche Vertiefung</summary>
        <p>Vertiefender Text ...</p>
    </details>
</section>`;

        }).join("\n\n");
        try {
        await navigator.clipboard.writeText(html);
        } catch(err) {};
        return html;
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (c) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c];
        });
    }

    // Zentralen Dialog bei Bedarf erzeugen
    function getDialog() {

        if (dialog) return dialog;

        dialog = document.createElement("dialog");
        dialog.className = "help-dialog";

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "✕";
        close.className = "help-close";
        close.setAttribute("aria-label", "Schließen");
        close.addEventListener("click", () => dialog.close());

        const content = document.createElement("div");
        content.className = "help-content";

        dialog.append(close, content);
        document.body.append(dialog);

        return dialog;
    }

    // Hilfe anzeigen, mode: dialog, window, embedded
    async function show(topicid, mode = "dialog", target = null) {

        if (mode === "window") {
            const helpUrl = new URL(url, location.href);
            helpUrl.hash = topicid;
            window.open(helpUrl.href, "_blank");
            return;
        }

        const section = await get(topicid);
        if (!section) return;

        if (mode === "embedded") {
            const container = typeof target === "string"
                ? document.querySelector(target)
                : target?.jquery ? target[0] : target;

            if (!container) {
                throw new Error("Embedded target fehlt");
            }
            container.replaceChildren(section);
            return;
        }

        if (mode === "dialog") {
            const dlg = getDialog();
            const content = dlg.querySelector(".help-content");
            content.replaceChildren(section);
            if (!dlg.open) dlg.showModal();
            return;
        }

        throw new Error(`Unbekannter Help-Modus: ${mode}`);
    }

    function resolveReferences(element, doc, visited = new Set()) {

        const references = element.querySelectorAll("[data-help-ref]");

        for (const placeholder of references) {

            const key = placeholder.dataset.helpRef;

            // Schutz gegen zirkuläre Referenzen
            if (visited.has(key)) {
                console.warn("Zirkuläre Help-Referenz:", key);
                placeholder.remove();
                continue;
            }

            const source = doc.getElementById(key);

            if (!source) {
                console.warn("Help-Referenz fehlt:", key);
                placeholder.remove();
                continue;
            }

            const copy = source.cloneNode(true);

            resolveReferences(
                copy,
                doc,
                new Set([...visited, key])
            );

            // Nur Inhalt übernehmen, nicht die Section selbst
            placeholder.replaceWith(...copy.childNodes);
        }

        return element;
    }


    return { load, generate, get, show };
}

export { createHelp };
