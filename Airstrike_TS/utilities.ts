class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static returnRandomFromArray(array) {
        return array[RandomNumberGen.randomNumBetween(0, array.length - 1)];
    }
}

class ElementCreator {
    public static returnNewImageEl(parent: HTMLElement, classname: string, src?: string, append?: boolean) {
        let el: HTMLImageElement = this.returnNewEl(parent, 'img', classname, append) as HTMLImageElement;
        if (src) el.src = src;
    //    if (src) el.src = src + loadNewImage();

        return el;
    }
    private static returnNewEl(parent: HTMLElement, divType: string, classname: string, append?: boolean) {
        let el = document.createElement(divType);
        el.className = classname;
        append ? parent.appendChild(el) : parent.prepend(el);
        return el;
    }
    public static returnNewDiv(parent: HTMLElement, classname: string) {
        return this.returnNewEl(parent, 'div', classname);
    }
    public static returnNewCanvas(parent: HTMLElement, classname: string, append?: boolean) {
        return this.returnNewEl(parent, 'canvas', classname, append) as HTMLCanvasElement;
    }

    // Freezes targetEl's absolute page position to match sourceEl's current on-screen rect,
    // so it can be detached/reparented without visually jumping.
    public static positionAbsoluteAtElementRect(sourceEl: HTMLElement, targetEl: HTMLElement) {
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
        return document.getElementById("contentWrapper")!;
    }
    static returnbackground() {
        return document.getElementById("background")!;
    }
    static addToContentWrapper(elem: HTMLElement) {
        this.returnContentWrapper().appendChild(elem);
    }
    static addToBackground(elem: HTMLElement) {
        this.returnbackground().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content")!;
    }
    static addToContentEl(elem: HTMLElement) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
        elem = null
    }

    static contentElWidth() {
        return this.returnContentEl().clientWidth;
    }
    static clearContent() {
        this.returnContentEl().innerHTML = "";
    }
    static fadeRemoveItem(item: HTMLElement, stayTime, fadeTime, array?) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime)
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
        }, stayTime + fadeTime)
    }
}

// Between one stage and the next: the ground rushes past empty, then the new stage slides in with it and
// the lot comes to a stop. It's all CSS animation (so pausing freezes it), driven by the numbers set here:
// the ground and the sea scroll a whole number of their tiles, so when the animation lets go they're exactly
// where they were, and the new stage rides in on the same curve, so it moves with the ground it stands on.
class StageTransition {
    public static active: boolean = false;
    private static duration: number = 3200;  // ms
    private static distance: number = 4200;  // px the ground runs past, or near it
    private static streaks: HTMLElement;

    // direction is the way the ground goes: down (the new stage comes in from the top), up (from the bottom)
    // or right (from the left)
    public static exiting: HTMLElement; // the old stage's layer, which rides off with the ground and is thrown away at the end
    public static oldSea: HTMLElement;  // the old stage's sea, which washes away to the left and is thrown away at the end
    public static rush(direction: RushDirection = "down") {
        const exiting = this.exiting, oldSea = this.oldSea; // (cancel() would throw them away)
        this.exiting = undefined;
        this.oldSea = undefined;
        this.cancel();
        this.exiting = exiting;
        this.oldSea = oldSea;
        const root = document.documentElement;
        const ground = ContentElHandler.returnbackground();
        const water = document.getElementById("water");
        const sideways = direction == "right";
        const sign = direction == "up" ? -1 : 1;
        const run = (el: HTMLElement) => sign * this.wholeTiles(this.tileLength(el, sideways, el === ground));
        const groundRun = run(ground);
        const waterRun = water ? run(water) : groundRun;
        const set = (name: string, px: number, along: boolean) => { // along: on the axis it's moving on, else nothing
            root.style.setProperty(name, (along ? px : 0) + "px");
        };
        root.style.setProperty("--rushDuration", this.duration + "ms");
        set("--rushGroundX", groundRun, sideways); set("--rushGroundY", groundRun, !sideways);
        set("--rushWaterX", waterRun, sideways); set("--rushWaterY", waterRun, !sideways);
        set("--rushContentX", -groundRun, sideways); set("--rushContentY", -groundRun, !sideways);
        root.style.setProperty("--waterOutX", -(2 * window.innerWidth + window.innerHeight) + "px"); // the sea washes off to the left, far enough to be right off the screen, and comes back from there
        set("--streakX", 6000, sideways); set("--streakY", 6000 * sign, !sideways);

        this.streaks = document.createElement("div");
        this.streaks.className = "rushStreaks" + (sideways ? " sideways" : "");
        this.streaks.innerHTML = "<span></span><span></span>"; // two layers of streaks, going at different speeds
        ContentElHandler.addToContentWrapper(this.streaks);
        document.body.classList.add("stageRushing");
        this.active = true;
        SoundPlayer.playWithVolumeSet(jet_pass);
        game.trackGlowsDuringRush(); // (the glows after dark ride in with the buildings)
        setTimeout(() => this.cancel(), this.duration);
    }

    // Ends it, wherever it's got to: the ground and the stage are where they'd be at the end anyway
    public static cancel() {
        this.active = false;
        document.body.classList.remove("stageRushing");
        if (this.exiting) {
            this.exiting.remove();
            this.exiting = undefined;
        }
        if (this.oldSea) {
            this.oldSea.remove();
            this.oldSea = undefined;
        }
        if (this.streaks) {
            this.streaks.remove();
            this.streaks = undefined;
        }
    }

    private static wholeTiles(tile: number): number {
        return tile > 0 ? Math.max(1, Math.round(this.distance / tile)) * tile : this.distance;
    }
    // How far the ground has to go to be where it was: the length of its tile in the direction it's moving.
    // The ground repeats with 'round', so its tile is stretched to fit a whole number into the element.
    private static tileLength(el: HTMLElement, sideways: boolean, rounded: boolean): number {
        const natural = this.naturalSize(el);
        const natLength = sideways ? natural.width : natural.height;
        if (!natLength) return 0;
        if (!rounded) return natLength;
        const room = sideways ? el.clientWidth : el.clientHeight;
        return room / Math.max(1, Math.round(room / natLength));
    }
    // The size of the picture an element tiles as its background
    private static naturalSize(el: HTMLElement): { width: number, height: number } {
        const url = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(el).backgroundImage);
        if (!url) return { width: 0, height: 0 };
        const img = new Image();
        img.src = url[1];
        return img.complete ? { width: img.naturalWidth, height: img.naturalHeight } : { width: 0, height: 0 };
    }
}
type RushDirection = "down" | "up" | "right";

function loadNewImage() {
    return '?' + new Date().getTime();
}

class MouseHandler {
    static mousePos: position = { X: '', Y: '' };

    static updateMousePos(event?: MouseEvent) {
        if (event) {
            this.mousePos.X = event.clientX
            this.mousePos.Y = event.clientY
        }
        return this.mousePos
    }
}