const assetsFolder = "./AS_assets/";
const assetsSVGFolder = assetsFolder + "SVG/";
const classicExplosion = 'expl1.gif';
const strikeExplosion = 'expl_big.gif';
const mushroomExplosion = 'mushroom_1.gif';
const crashTimeout = 600;
const destroyedTargetStayConst = 20000;
var destroyedTargetStay = 20000;
const damagedTargetStay = 40000;
const itemStay = 15000;
var fireStay = itemStay;
const fadeAnimTime = 8000;
var lightID = 1;
// Everything the game schedules goes through setTimeout and setInterval, and from here those keep track of
// what's pending. That lets a new game cancel every timer the last one left running, whatever scheduled it
// (a tunnel's car production, a weapon still in flight, a flyover...), and lets the pause key freeze them
// all, then set them going again with the time they had left. This file loads first, so it's in place for
// everything.
class GameTimers {
    static native = {
        setTimeout: window.setTimeout.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        setInterval: window.setInterval.bind(window),
        clearInterval: window.clearInterval.bind(window),
    };
    static nextId = 1000000; // well clear of any real timer id, so the two can't be mixed up
    static timeouts = new Map();
    static intervals = new Map();
    static paused = false;
    static isPaused() {
        return GameTimers.paused;
    }
    static install() {
        const n = GameTimers.native;
        const win = window;
        win.setTimeout = (fn, ms = 0, ...args) => {
            const id = GameTimers.nextId++;
            const entry = { fn: fn, args: args, remaining: ms, due: 0, native: undefined };
            GameTimers.timeouts.set(id, entry);
            if (!GameTimers.paused)
                GameTimers.startTimeout(id, entry);
            return id;
        };
        win.clearTimeout = (id) => {
            const entry = GameTimers.timeouts.get(id);
            if (entry) {
                n.clearTimeout(entry.native);
                GameTimers.timeouts.delete(id);
            }
            else
                n.clearTimeout(id);
        };
        win.setInterval = (fn, ms = 0, ...args) => {
            const id = GameTimers.nextId++;
            const entry = { fn: fn, args: args, ms: ms, native: undefined };
            GameTimers.intervals.set(id, entry);
            if (!GameTimers.paused)
                GameTimers.startInterval(entry);
            return id;
        };
        win.clearInterval = (id) => {
            const entry = GameTimers.intervals.get(id);
            if (entry) {
                n.clearInterval(entry.native);
                GameTimers.intervals.delete(id);
            }
            else
                n.clearInterval(id);
        };
    }
    static startTimeout(id, entry) {
        entry.due = Date.now() + entry.remaining;
        entry.native = GameTimers.native.setTimeout(() => {
            GameTimers.timeouts.delete(id);
            entry.fn(...entry.args);
        }, entry.remaining);
    }
    static startInterval(entry) {
        entry.native = GameTimers.native.setInterval(() => entry.fn(...entry.args), entry.ms);
    }
    // Stops every timer where it is, remembering how long each had to go
    static pause() {
        if (GameTimers.paused)
            return;
        GameTimers.paused = true;
        GameTimers.timeouts.forEach(entry => {
            GameTimers.native.clearTimeout(entry.native);
            entry.remaining = Math.max(0, entry.due - Date.now());
            entry.native = undefined;
        });
        GameTimers.intervals.forEach(entry => {
            GameTimers.native.clearInterval(entry.native);
            entry.native = undefined;
        });
    }
    static resume() {
        if (!GameTimers.paused)
            return;
        GameTimers.paused = false;
        GameTimers.timeouts.forEach((entry, id) => GameTimers.startTimeout(id, entry));
        GameTimers.intervals.forEach(entry => GameTimers.startInterval(entry));
    }
    // Cancels everything still pending
    static clearAll() {
        GameTimers.timeouts.forEach(entry => GameTimers.native.clearTimeout(entry.native));
        GameTimers.intervals.forEach(entry => GameTimers.native.clearInterval(entry.native));
        GameTimers.timeouts.clear();
        GameTimers.intervals.clear();
        GameTimers.paused = false;
    }
}
GameTimers.install();
//# sourceMappingURL=const.js.map