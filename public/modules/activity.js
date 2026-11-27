const css = `
   .activity-dialog {
    width: min(340px, 85vw);
    box-sizing: border-box;
    padding: 24px;
    border: 1px solid #b0c4c4;
    border-radius: 14px;
    background: #ffffff;
    color: #29464c;
    text-align: center;
    box-shadow: 0 8px 30px #0003;
}

.activity-dialog::backdrop {
    background: rgba(0, 0, 0, 0.35);
}

.activity-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 20px;
}

.activity-clock {
    position: relative;
    width: 110px;
    height: 110px;
    margin: 0 auto;
    border: 2px solid #376b70;
    border-radius: 50%;
    background: #f3f8f8;
}

.activity-tick {
    position: absolute;
    left: calc(50% - 1px);
    top: 4px;
    width: 2px;
    height: 5px;
    background: #376b70;
    transform-origin: 1px 51px;
}

.activity-tick.major {
    height: 10px;
}

.activity-hand {
    position: absolute;
    left: calc(50% - 1px);
    bottom: 50%;
    width: 2px;
    height: 43px;
    background: #bc5140;
    transform-origin: bottom center;
    border-radius: 2px;
}

.activity-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: #376b70;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}

.activity-elapsed {
    margin: 12px 0;
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
}

.activity-message {
    min-height: 3em;
    margin: 16px 0;
    line-height: 1.5;
}

.activity-abort {
    padding: 8px 24px;
    border: 1px solid #789498;
    border-radius: 6px;
    background: white;
    color: #376b70;
    font-size: 1rem;
    cursor: pointer;
}
`;
/*
function installCSS() {
    if (document.getElementById("activity-css")) {
        return;
    }
    $("<style>", {
        id: "activity-css",
        text: css
    }).appendTo("head");
    console.log("CSS loaded");
}
*/

function installCSS() {

    console.log("installCSS aufgerufen");

    if (document.getElementById("activity-css")) {
        console.log("CSS bereits vorhanden");
        return;
    }

    const style = document.createElement("style");

    style.id = "activity-css";
    style.textContent = css;

    document.head.appendChild(style);

    console.log("CSS installiert", style);
}


export function createActivity() {

    installCSS();

    let startTime = 0;
    let animationId = null;
    let controller = null;

    const dialog = $("<dialog>", {
        class: "activity-dialog"
    }).appendTo("body");

    const title = $("<div>", {
        class: "activity-title",
        text: "Daten werden geladen"
    }).appendTo(dialog);

    const clock = $("<div>", {
        class: "activity-clock"
    }).appendTo(dialog);

    // Zifferblatt aufbauen
    for (let i = 0; i < 60; i++) {

        $("<div>", {
            class: "activity-tick" +
                (i % 5 === 0 ? " major" : "")
        }).css({
            transform: `rotate(${i * 6}deg)`
        }).appendTo(clock);
    }

    const hand = $("<div>", {
        class: "activity-hand"
    }).appendTo(clock);

    $("<div>", {
        class: "activity-center"
    }).appendTo(clock);

    const elapsed = $("<div>", {
        class: "activity-elapsed",
        text: "00:00"
    }).appendTo(dialog);

    const messageField = $("<div>", {
        class: "activity-message",
        "aria-live": "polite"
    }).appendTo(dialog);

    const abortButton = $("<button>", {
        class: "activity-abort",
        type: "button",
        text: "Abbrechen"
    }).appendTo(dialog);

    abortButton.on("click", abort);

    dialog.on("cancel", function (event) {
        event.preventDefault();
        abort();
    });

    function updateClock() {

        let seconds =
            (performance.now() - startTime) / 1000;

        let minutes = Math.floor(seconds / 60);
        let remainder = Math.floor(seconds % 60);

        hand.css({
            transform: `rotate(${seconds * 6}deg)`
        });

        elapsed.text(
            String(minutes).padStart(2, "0") + ":" +
            String(remainder).padStart(2, "0")
        );

        animationId =
            requestAnimationFrame(updateClock);
    }

    function show(text = "Bitte warten …") {

        if (dialog[0].open) {
            throw new Error("Activity bereits aktiv");
        }

        controller = new AbortController();

        message(text);
        startTime = performance.now();

        dialog[0].showModal();

        updateClock();

        return controller.signal;
    }

    function message(text) {
        messageField.text(text);
    }

    function close() {

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (dialog[0].open) {
            dialog[0].close();
        }
    }

    function abort() {

        if (controller) {
            controller.abort();
        }

        close();
    }

    function destroy() {
        abort();
        dialog.remove();
    }

    return {
        show,
        message,
        close,
        abort,
        destroy
    };
}