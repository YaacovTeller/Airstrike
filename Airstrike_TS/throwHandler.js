"use strict";
class ThrowHandler {
    static flip(elem, direc, impactSounds, parentElem, angle, onLanded) {
        let thrownElem = parentElem ? parentElem : elem;
        this.throwArc(thrownElem, direc, onLanded); // ARC
        let deg = this.rotate(elem, direc, angle); // ROTATION
        if (impactSounds && impactSounds.length) {
            this.crashSound(impactSounds);
        }
        return deg;
    }
    // A lobbed piece of debris: up in a slow, high arc and down some way off, turning over as it goes (the picture inside
    // it, if it has one). It keeps still while the game is paused, and lands with a sound if it's given any.
    static lob(elem, direc, impactSounds, onLanded) {
        const startX = parseFloat(elem.style.left) || 0;
        const startY = parseFloat(elem.style.top) || 0;
        const distance = RandomNumberGen.randomNumBetween(50, 130) * (direc == direction.forward ? 1 : -1);
        const apex = RandomNumberGen.randomNumBetween(80, 150); // how high above where it started
        const drop = RandomNumberGen.randomNumBetween(-10, 20); // and it comes down a little above or below that
        const duration = RandomNumberGen.randomNumBetween(1500, 2200); // ms: slower than a quick toss
        const spin = RandomNumberGen.randomNumBetween(1, 3) * 360 * (RandomNumberGen.randomNumBetween(0, 1) ? 1 : -1);
        const spinEl = elem.querySelector("img") || elem;
        let last = null;
        let elapsed = 0;
        const step = (timestamp) => {
            if (last === null)
                last = timestamp;
            if (!document.body.classList.contains("gamePaused"))
                elapsed += timestamp - last;
            last = timestamp;
            const u = Math.min(1, elapsed / duration);
            elem.style.left = startX + distance * u + "px";
            elem.style.top = startY - 4 * apex * u * (1 - u) + drop * u + "px";
            spinEl.style.transform = "rotate(" + spin * (1 - (1 - u) * (1 - u)) + "deg)"; // the turning slows as it comes down
            if (u < 1) {
                requestAnimationFrame(step);
            }
            else {
                if (impactSounds && impactSounds.length)
                    SoundPlayer.playRandomSound(impactSounds);
                if (onLanded)
                    onLanded(elem);
            }
        };
        requestAnimationFrame(step);
    }
    static crashSound(sounds) {
        setTimeout(() => {
            SoundPlayer.playRandomSound(sounds);
        }, crashTimeout);
    }
    // Pass as flip()'s onLanded for throwaway debris (wheels/bits/etc, tracked in allObjects) so
    // it splashes and vanishes instead of sitting on top of the water. Not for actual targets.
    static removeIfLandedInWater(landedElem) {
        let water = document.getElementById("water");
        if (!water)
            return;
        let pos = CollisionDetection.getXYfromPoint(landedElem);
        if (CollisionDetection.checkCollisionFromPosition(pos, water)) {
            ExplosionHandler.createSplash(pos);
            ContentElHandler.removeFromContentEl(landedElem);
            let index = allObjects.indexOf(landedElem);
            if (index >= 0) {
                allObjects.splice(index, 1);
            }
        }
    }
    static determineDirectionForFlip(vectorMove) {
        let angle = vectorMove.angle;
        let direc = null;
        if (angle > 300 && angle <= 360 || angle > 0 && angle <= 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle <= 210) {
            direc = direction.backward;
        }
        return direc;
    }
    static moveAtAngle(vectorMove) {
        let elem = vectorMove.elem;
        let angle = vectorMove.angle;
        let dist = vectorMove.dist;
        let radius = vectorMove.radius;
        var currentLeft = parseInt(elem.style.left) || 0;
        var currentTop = parseInt(elem.style.top) || 0;
        var angleRad = angle * (Math.PI / 180);
        var deltaX = Math.cos(angleRad) * 1;
        var deltaY = Math.sin(angleRad) * 1;
        var start = null;
        function step(timestamp) {
            if (!start)
                start = timestamp;
            var progress = timestamp - start;
            var mult = (500 / radius) - 3; // MESSY?
            //            console.log("radius: " + radius + " - mult: " + mult)
            elem.style.left = (currentLeft + progress / mult * deltaX) + "px";
            elem.style.top = (currentTop + progress / mult * deltaY) + "px";
            if (progress < 200) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }
    static throwArc(elem, direc, onLanded) {
        var currentLeft = parseInt(elem.style.left) || 0;
        var currentTop = parseInt(elem.style.top) || 0;
        let distance = RandomNumberGen.randomNumBetween(10, 40); //20
        let height = 50 - distance; //RandomNumberGen.randomNumBetween(20, 80) //30
        const maxProgress = RandomNumberGen.randomNumBetween(crashTimeout, 1100); //1000;
        var start = null;
        function step(timestamp) {
            if (!start)
                start = timestamp;
            var progress = timestamp - start;
            var x, y;
            if (progress < crashTimeout) {
                var a = progress / 200;
                if (direc == direction.forward) {
                    x = currentLeft + distance - Math.cos(a) * distance;
                }
                else if (direc == direction.backward) {
                    x = currentLeft - distance + Math.cos(a) * distance;
                }
                y = currentTop - Math.sin(a) * height;
                elem.style.left = x + "px";
                elem.style.top = y + "px";
            }
            else {
                let left = parseInt(elem.style.left);
                if (direc == direction.forward) {
                    x = left + 2;
                }
                else if (direc == direction.backward) {
                    x = left - 2;
                }
                elem.style.left = x + "px";
            }
            if (progress < maxProgress) {
                requestAnimationFrame(step);
            }
            else if (onLanded) {
                onLanded(elem);
            }
        }
        requestAnimationFrame(step);
    }
    //private static throwArc(elem: HTMLElement, direc: direction) {
    //    const startX = parseFloat(elem.style.left) || 0;
    //    const startY = parseFloat(elem.style.top) || 0;
    //    const dir = direc === direction.forward ? 1 : -1;
    //    // Main throw distance
    //    const throwDistance = RandomNumberGen.randomNumBetween(40, 120);
    //    // Small vertical deviation from origin
    //    const driftY = RandomNumberGen.randomNumBetween(-12, 12);
    //    // Visual arc height only
    //    const arcHeight = RandomNumberGen.randomNumBetween(20, 60);
    //    // Arc duration
    //    const arcDuration = RandomNumberGen.randomNumBetween(400, 850);
    //    // Optional slide after landing
    //    const slideDistance = throwDistance > 45
    //        ? RandomNumberGen.randomNumBetween(40, 60)
    //        : RandomNumberGen.randomNumBetween(10, 25);
    //    const slideDuration = 250;
    //    let startTime: number | null = null;
    //    function step(timestamp: number) {
    //        if (startTime === null) {
    //            startTime = timestamp;
    //        }
    //        const elapsed = timestamp - startTime;
    //        // ---------- ARC PHASE ----------
    //        if (elapsed <= arcDuration) {
    //            const t = elapsed / arcDuration;
    //            // Smooth horizontal movement
    //            const x =
    //                startX +
    //                throwDistance * t * dir;
    //            // Slight drift only
    //            const baseY =
    //                startY +
    //                driftY * t;
    //            // Fake "hop" arc
    //            const physicsT = t * 2;
    //            const arc =
    //                (-arcHeight * physicsT) +
    //                (arcHeight * physicsT * physicsT * 0.5);
    //            const y = baseY + arc;
    //            //const arc =
    //            //    Math.sin(t * Math.PI) * arcHeight;
    //            //const y = baseY - arc;
    //            elem.style.left = `${x}px`;
    //            elem.style.top = `${y}px`;
    //        }
    //        // ---------- SLIDE PHASE ----------
    //        else {
    //            const slideElapsed = elapsed - arcDuration;
    //            if (slideElapsed <= slideDuration && slideDistance > 0) {
    //                const t = slideElapsed / slideDuration;
    //                // Ease out slide
    //                const ease = 1 - Math.pow(1 - t, 3);
    //                const landingX =
    //                    startX +
    //                    throwDistance * dir;
    //                const x =
    //                    landingX +
    //                    (slideDistance * ease) * dir;
    //                //const x =
    //                //    startX +
    //                //    (throwDistance + slideDistance * ease) * dir;
    //                const y =
    //                    startY + driftY;
    //                elem.style.left = `${x}px`;
    //                elem.style.top = `${y}px`;
    //            }
    //        }
    //        if (elapsed < arcDuration + slideDuration) {
    //            requestAnimationFrame(step);
    //        }
    //    }
    //    requestAnimationFrame(step);
    //}
    static rotate(elem, direc, angle, iterations = 0, maxIterations = 1) {
        if (iterations >= maxIterations)
            return; // Termination condition
        const angles = [-720, -560, -360, -200, 0, 160, 360, 520, 720];
        const index = angles.indexOf(angle);
        let rand = RandomNumberGen.randomNumBetween(0, 20);
        let increment = rand > 18 ? 2 : 1;
        let deg = direc == direction.forward ? angles[index + increment] : angles[index - increment];
        if (deg == undefined) {
            deg = 0;
            elem.classList.remove('flip');
            requestAnimationFrame(() => {
                this.cssRotateAngle(elem, deg);
                this.rotate(elem, direc, iterations + 1, maxIterations);
            });
            return deg;
        }
        else {
            elem.classList.add('flip');
            this.cssRotateAngle(elem, deg);
            return deg;
        }
    }
    static cssRotateAngle(elem, deg) {
        elem.style.transform = `rotate(${deg}deg)`;
    }
}
//# sourceMappingURL=throwHandler.js.map