class CollisionDetection {
    static checkCollisionFromPosition(mousePos, targetEl) {
        //let trgtPos: position = this.getXYfromPoint(targetEl);
        let targetRect = targetEl.getBoundingClientRect();
        if (mousePos.X >= targetRect.left &&
            mousePos.X <= targetRect.left + targetRect.width &&
            mousePos.Y >= targetRect.top &&
            mousePos.Y <= targetRect.top + targetRect.height) {
            return true;
        }
        else
            return false;
    }
    static checkCollisionFromElement(blastRadiusEl, targetEl) {
        let blastPos = this.getXYfromPoint(blastRadiusEl);
        let trgtPos = this.getXYfromPoint(targetEl);
        let radius = blastRadiusEl.getBoundingClientRect().width / 2; //parseInt(blastRadiusEl.style.width) / 2;
        if (trgtPos.X >= blastPos.X - radius &&
            trgtPos.X <= blastPos.X + radius &&
            trgtPos.Y >= blastPos.Y - radius &&
            trgtPos.Y <= blastPos.Y + radius) {
            let dist = this.distanceBetweenPoints(blastPos.X, blastPos.Y, trgtPos.X, trgtPos.Y);
            let angle = this.angleBetweenPoints(blastPos.X, blastPos.Y, trgtPos.X, trgtPos.Y);
            let obj = {
                elem: targetEl,
                angle: angle,
                dist: dist,
                radius: radius
            };
            return obj;
        }
        else
            return null;
    }
    static getXYfromPoint(elem) {
        let rect = elem.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        return { X: centerX, Y: centerY };
    }
    static distanceBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    static angleBetweenPoints(x1, y1, x2, y2) {
        var deltaX = x2 - x1;
        var deltaY = y2 - y1;
        var angleRadians = Math.atan2(deltaY, deltaX);
        var angleDegrees = angleRadians * (180 / Math.PI);
        angleDegrees < 0 ? angleDegrees += 360 : "";
        return angleDegrees;
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
    static throw(elem, direc) {
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
}
//# sourceMappingURL=collisionDetection.js.map