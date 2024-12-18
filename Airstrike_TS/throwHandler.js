class ThrowHandler {
    static flip(elem, direc, parentElem, angle) {
        let thrownElem = parentElem ? parentElem : elem;
        this.throwArc(thrownElem, direc); // ARC
        let deg = this.rotate(elem, direc, angle); // ROTATION
        this.carCrashSound();
        return deg;
    }
    static carCrashSound() {
        setTimeout(() => {
            RandomSoundGen.playRandomSound(crashes);
        }, crashTimeout);
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
    static throwArc(elem, direc) {
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
        }
        requestAnimationFrame(step);
    }
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