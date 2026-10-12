"use strict";
class CollisionDetection {
    // The point of the box closest to pos -- pos itself if it's inside.
    static nearestPointInBox(pos, box) {
        return { X: Math.min(Math.max(pos.X, box.left), box.right), Y: Math.min(Math.max(pos.Y, box.top), box.bottom) };
    }
    static checkCollisionFromPosition(mousePos, targetEl) {
        let elems = document.elementsFromPoint(mousePos.X, mousePos.Y);
        return elems.some(el => el === targetEl);
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
        //const closestX = Math.max(targetRect.left, Math.min(circleCenterX, targetRect.right));
        //const closestY = Math.max(targetRect.top, Math.min(circleCenterY, targetRect.bottom));
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
// Works out where the water actually is, so things can be kept clear of it. The .water div is a
// skewed rectangle (see cssMenus.css), so its shore slants, and its right edge fades out rather
// than stopping -- a single point hit test against the element can't tell either of those apart.
class Shoreline {
    static fadePx = 90; // how wide the faded shallows at the shore are: matches where .water's mask-image starts fading out
    // Where the water is across the rows from topY to bottomY, or null if no water is showing.
    // Because the shore slants, a box covering several rows has to respect its most restrictive row.
    static waterSpan(topY, bottomY) {
        const water = document.getElementById("water");
        if (!water)
            return null;
        const rect = water.getBoundingClientRect();
        if (!rect.width)
            return null;
        const skew = new DOMMatrix(getComputedStyle(water).transform).c; // sideways shift per row
        const width = rect.width - Math.abs(skew) * rect.height; // bounding box minus the skew
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;
        const edge = (fraction, y) => centreX + (fraction - 0.5) * width + skew * (y - centreY);
        return {
            left: Math.max(edge(0, topY), edge(0, bottomY)),
            openRight: Math.min(edge(1 - this.fadePx / width, topY), edge(1 - this.fadePx / width, bottomY)),
            shoreRight: Math.max(edge(1, topY), edge(1, bottomY)),
        };
    }
}
//# sourceMappingURL=collisionDetection.js.map