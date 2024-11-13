type vectorMoveObj = {
    elem: HTMLElement,
    angle: number,
    dist: number,
    radius: number
}
class CollisionDetection {
    public static checkCollisionFromPosition(mousePos: position, targetEl: HTMLElement): boolean {
        //let trgtPos: position = this.getXYfromPoint(targetEl);
        let targetRect = targetEl.getBoundingClientRect();
        if (mousePos.X >= targetRect.left &&
            mousePos.X <= targetRect.left + targetRect.width &&
            mousePos.Y >= targetRect.top &&
            mousePos.Y <= targetRect.top + targetRect.height) {

            return true
        }
        else return false
    }
    public static checkCollisionWithElement(element: HTMLElement, targetEl: HTMLElement): boolean {
        let targetRect = targetEl.getBoundingClientRect();
        let elementRect = element.getBoundingClientRect();
        if (elementRect.left >= targetRect.left &&
            elementRect.left <= targetRect.left + targetRect.width &&
            elementRect.top >= targetRect.top &&
            elementRect.top <= targetRect.top + targetRect.height) {

            return true
        }
        else return false
    }
    public static checkCollisionWithCircle(circleEl: HTMLElement, targetEl: HTMLElement): boolean {
        const targetRect = targetEl.getBoundingClientRect();
        const circleRect = circleEl.getBoundingClientRect();

        const circleCenterX = circleRect.left + circleRect.width / 2;
        const circleCenterY = circleRect.top + circleRect.height / 2;
        const circleRadius = circleRect.width / 2;

        //const closestX = Math.max(targetRect.left, Math.min(circleCenterX, targetRect.right));
        //const closestY = Math.max(targetRect.top, Math.min(circleCenterY, targetRect.bottom));
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        const distanceX = circleCenterX - targetCenterX;
        const distanceY = circleCenterY - targetCenterY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        return distanceSquared <= (circleRadius * circleRadius);
    }

    public static checkCollisionFromPositionWithBlast(blastPos: position, targetEl: HTMLElement, radius: number): vectorMoveObj {
        let trgtPos: position = this.getXYfromPoint(targetEl);
        if (trgtPos.X >= blastPos.X - radius &&
            trgtPos.X <= blastPos.X + radius &&
            trgtPos.Y >= blastPos.Y - radius &&
            trgtPos.Y <= blastPos.Y + radius) {

            let dist = this.distanceBetweenPoints(blastPos.X, blastPos.Y, trgtPos.X, trgtPos.Y);
            let angle = this.angleBetweenPoints(blastPos.X, blastPos.Y, trgtPos.X, trgtPos.Y);
            let obj: vectorMoveObj = {
                elem: targetEl,
                angle: angle,
                dist: dist,
                radius: radius
            }
            return obj;
        }
        else
            return null;
    }

    public static getXYfromPoint(elem: HTMLElement): position {
        let rect = elem.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        return { X: centerX, Y: centerY } as position;
    }

    private static distanceBetweenPoints(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    private static angleBetweenPoints(x1, y1, x2, y2) {
        var deltaX = x2 - x1;
        var deltaY = y2 - y1;

        var angleRadians = Math.atan2(deltaY, deltaX);
        var angleDegrees = angleRadians * (180 / Math.PI);
        angleDegrees < 0 ? angleDegrees += 360 : "";
        return angleDegrees;
    }

    public static moveAtAngle(vectorMove: vectorMoveObj) {
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
    static throw(elem: HTMLElement, direc: direction) { // Handles the arc travelled NOT rotation, see CSS
        var currentLeft = parseInt(elem.style.left) || 0;
        var currentTop = parseInt(elem.style.top) || 0;

        let distance = RandomNumberGen.randomNumBetween(10, 40) //20
        let height = 50 - distance //RandomNumberGen.randomNumBetween(20, 80) //30
        const maxProgress = RandomNumberGen.randomNumBetween(crashTimeout, 1100)//1000;

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
