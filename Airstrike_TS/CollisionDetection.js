class CollisionDetection {
    static checkPos(blastRadiusEl, targetEl) {
        let blastPos = this.getXYfromPoint(blastRadiusEl);
        let trgtPos = this.getXYfromPoint(targetEl);
        let radius = parseInt(blastRadiusEl.style.width) / 2;
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
            return false;
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
            var mult = (500 / radius) - 3;
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
        // let randomLeftRight = RandomNumberGen.randomNumBetween(0, 1)
        let height = 20; //RandomNumberGen.randomNumBetween(20, 80)
        let distance = 30; //RandomNumberGen.randomNumBetween(20, 80)
        const maxProgress = 1000;
        var start = null;
        function step(timestamp) {
            if (!start)
                start = timestamp;
            var progress = timestamp - start;
            var x, y;
            if (progress < 600) {
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