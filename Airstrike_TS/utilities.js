"use strict";
class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static returnRandomFromArray(array) {
        return array[RandomNumberGen.randomNumBetween(0, array.length - 1)];
    }
}
class ElementCreator {
    static returnNewImageEl(parent, classname, src, append) {
        let el = this.returnNewEl(parent, 'img', classname, append);
        if (src)
            el.src = src;
        //    if (src) el.src = src + loadNewImage();
        return el;
    }
    static returnNewEl(parent, divType, classname, append) {
        let el = document.createElement(divType);
        el.className = classname;
        append ? parent.appendChild(el) : parent.prepend(el);
        return el;
    }
    static returnNewDiv(parent, classname) {
        return this.returnNewEl(parent, 'div', classname);
    }
    static returnNewCanvas(parent, classname, append) {
        return this.returnNewEl(parent, 'canvas', classname, append);
    }
    // Freezes targetEl's absolute page position to match sourceEl's current on-screen rect,
    // so it can be detached/reparented without visually jumping.
    static positionAbsoluteAtElementRect(sourceEl, targetEl) {
        const rect = sourceEl.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        targetEl.style.position = "absolute";
        targetEl.style.left = `${x}px`;
        targetEl.style.top = `${y}px`;
    }
}
class ContentElHandler {
    static returnContentWrapper() {
        return document.getElementById("contentWrapper");
    }
    static returnbackground() {
        return document.getElementById("background");
    }
    static addToContentWrapper(elem) {
        this.returnContentWrapper().appendChild(elem);
    }
    static addToBackground(elem) {
        this.returnbackground().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content");
    }
    static addToContentEl(elem) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem) {
        let contentEl = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
        elem = null;
    }
    static contentElWidth() {
        return this.returnContentEl().clientWidth;
    }
    static clearContent() {
        this.returnContentEl().innerHTML = "";
    }
    static fadeRemoveItem(item, stayTime, fadeTime, array) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime);
        setTimeout(() => {
            if (item) {
                if (array) {
                    let index = array.indexOf(item);
                    if (index >= 0) {
                        array.splice(index, 1);
                    }
                }
                ContentElHandler.removeFromContentEl(item);
            }
        }, stayTime + fadeTime);
    }
}
// Between one stage and the next: the ground rushes past empty, then the new stage slides in with it and
// the lot comes to a stop. It's all CSS animation (so pausing freezes it), driven by the numbers set here:
// the ground and the sea scroll a whole number of their tiles, so when the animation lets go they're exactly
// where they were, and the new stage rides in on the same curve, so it moves with the ground it stands on.
class StageTransition {
    static active = false;
    static duration = 3200; // ms
    static distance = 4200; // px the ground runs past, or near it
    static streaks;
    static rush() {
        this.cancel();
        const root = document.documentElement;
        const ground = ContentElHandler.returnbackground();
        const water = document.getElementById("water");
        const groundRun = this.wholeTiles(this.groundTileHeight(ground));
        const waterRun = water ? this.wholeTiles(this.naturalHeight(water)) : groundRun;
        root.style.setProperty("--rushDuration", this.duration + "ms");
        root.style.setProperty("--rushGround", groundRun + "px");
        root.style.setProperty("--rushWater", waterRun + "px");
        root.style.setProperty("--rushContent", -groundRun + "px");
        this.streaks = document.createElement("div");
        this.streaks.className = "rushStreaks";
        this.streaks.innerHTML = "<span></span><span></span>"; // two layers of streaks, going at different speeds
        ContentElHandler.addToContentWrapper(this.streaks);
        document.body.classList.add("stageRushing");
        this.active = true;
        SoundPlayer.playWithVolumeSet(jet_pass);
        setTimeout(() => this.cancel(), this.duration);
    }
    // Ends it, wherever it's got to: the ground and the stage are where they'd be at the end anyway
    static cancel() {
        this.active = false;
        document.body.classList.remove("stageRushing");
        if (this.streaks) {
            this.streaks.remove();
            this.streaks = undefined;
        }
    }
    static wholeTiles(tile) {
        return tile > 0 ? Math.max(1, Math.round(this.distance / tile)) * tile : this.distance;
    }
    // The ground repeats with 'round', so its tile is stretched to fit a whole number into its height
    static groundTileHeight(ground) {
        const natural = this.naturalHeight(ground);
        if (!natural)
            return 0;
        return ground.clientHeight / Math.max(1, Math.round(ground.clientHeight / natural));
    }
    // The height of the picture an element tiles as its background
    static naturalHeight(el) {
        const url = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(el).backgroundImage);
        if (!url)
            return 0;
        const img = new Image();
        img.src = url[1];
        return img.complete ? img.naturalHeight : 0;
    }
}
function loadNewImage() {
    return '?' + new Date().getTime();
}
class MouseHandler {
    static mousePos = { X: '', Y: '' };
    static updateMousePos(event) {
        if (event) {
            this.mousePos.X = event.clientX;
            this.mousePos.Y = event.clientY;
        }
        return this.mousePos;
    }
}
//# sourceMappingURL=utilities.js.map