class CollisionDetection {
    static checkCollisionFromPosition(mousePos, targetEl) {
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
    static checkCollisionWithElement(element, targetEl) {
        let targetRect = targetEl.getBoundingClientRect();
        let elementRect = element.getBoundingClientRect();
        if (elementRect.left >= targetRect.left &&
            elementRect.left <= targetRect.left + targetRect.width &&
            elementRect.top >= targetRect.top &&
            elementRect.top <= targetRect.top + targetRect.height) {
            return true;
        }
        else
            return false;
    }
    static checkCollisionWithCircle(circleEl, targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        const circleRect = circleEl.getBoundingClientRect();
        const circleCenterX = circleRect.left + circleRect.width / 2;
        const circleCenterY = circleRect.top + circleRect.height / 2;
        const circleRadius = circleRect.width / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const distanceX = circleCenterX - targetCenterX;
        const distanceY = circleCenterY - targetCenterY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
        return distanceSquared <= (circleRadius * circleRadius);
    }
    static checkCollisionFromPositionWithBlast(blastPos, targetEl, radius) {
        let trgtPos = this.getXYfromPoint(targetEl);
        if (trgtPos.X >= blastPos.X - radius &&
            trgtPos.X <= blastPos.X + radius &&
            trgtPos.Y >= blastPos.Y - radius &&
            trgtPos.Y <= blastPos.Y + radius) {
            return true;
        }
    }
    static getVectorMove(blastPos, targetEl, radius) {
        let trgtPos = this.getXYfromPoint(targetEl);
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
}
