var screenShakeTimeouts;
(function (screenShakeTimeouts) {
    screenShakeTimeouts[screenShakeTimeouts["shake_1"] = 200] = "shake_1";
    screenShakeTimeouts[screenShakeTimeouts["shake_2"] = 300] = "shake_2";
    screenShakeTimeouts[screenShakeTimeouts["shake_3"] = 400] = "shake_3";
})(screenShakeTimeouts || (screenShakeTimeouts = {}));
var lights = [];
var flares = [];
const flareFade = 10000;
class ExplosionHandler {
    static craterDecalStay = 15000;
    static craterFadingTillRemoval = fadeAnimTime;
    static createFlare(blastCenter, size) {
        this.pushLight(flares, blastCenter, size);
        let fallingFlare = ContentElHandler.returnNewEl(ContentElHandler.returnContentEl(), 'flare');
        fallingFlare.style.left = blastCenter.X + 'px';
        fallingFlare.style.top = blastCenter.Y + 'px';
        ContentElHandler.fadeRemoveItem(fallingFlare, flareFade, 1);
    }
    static basicExplosion(blastCenter, size, explSrc, weaponName) {
        let explosion = this.setAndReturnExplosion(blastCenter, size, explSrc);
        let crater = this.setAndReturnCrater(blastCenter, size);
        this.explode(explosion, crater);
        if (size == ExplSizes.large) {
            this.shake(screenShakeTimeouts.shake_1);
        }
        else if (size == ExplSizes.XL) {
            this.shake(screenShakeTimeouts.shake_2);
        }
        if (size >= ExplSizes.XXL) {
            this.flash();
            this.shake(screenShakeTimeouts.shake_3);
        }
        this.pushLight(lights, blastCenter, size);
        this.checkForTargets(blastCenter, size, weaponName);
    }
    static checkForTargets(blastCenter, size, weaponName) {
        let rad = size / 2;
        for (let target of allTargets) {
            let targetEl = target.getTargetEl();
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, targetEl, rad)) {
                let collisionInfo = CollisionDetection.getVectorMove(blastCenter, targetEl, rad);
                this.targetStrike(target, weaponName, collisionInfo);
            }
        }
        for (let item of allObjects) {
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, item, rad)) {
                let collisionInfo = CollisionDetection.getVectorMove(blastCenter, item, rad);
                this.itemStrike(item, collisionInfo);
            }
        }
    }
    static itemStrike(item, collisionInfo) {
        let direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
        ThrowHandler.flip(item, direc);
    }
    static targetStrike(target, weaponName, collisionInfo) {
        let fraction = collisionInfo.dist / collisionInfo.radius;
        let severity = this.determineSeverity(fraction);
        if (target.damage != Damage.destroyed) {
            target.hit(severity, weaponName, collisionInfo); // TARGET - Main hit function
        }
    }
    static determineSeverity(fraction) {
        let severity;
        switch (true) {
            case (fraction > 0.9):
                severity = strikeSeverity.light;
                break;
            case (fraction <= 0.9 && fraction >= 0.6):
                severity = strikeSeverity.medium;
                break;
            case (fraction < 0.6 && fraction >= 0.3):
                severity = strikeSeverity.heavy;
                break;
            case (fraction < 0.3):
                severity = strikeSeverity.catastrophic;
                break;
            default:
                severity = strikeSeverity.light;
        }
        return severity;
    }
    static flash() {
        let overlay = document.getElementById("overlay");
        overlay.classList.add("flash");
        setTimeout(() => { overlay.classList.remove("flash"); }, 2000);
    }
    static pushLight(lightArr, blastCenter, explSize) {
        let light = { pos: blastCenter, opac: 1, size: explSize, fading: false };
        lightArr.push(light);
    }
    static shake(shakeTimeout) {
        let content = document.getElementById("content");
        content.classList.add(screenShakeTimeouts[shakeTimeout]);
        setTimeout(() => { content.classList.remove(screenShakeTimeouts[shakeTimeout]); }, shakeTimeout);
    }
    static returnNewImageEl(classname, src) {
        let el = document.createElement('img');
        if (src)
            el.src = src;
        el.className = classname;
        ContentElHandler.addToContentEl(el);
        return el;
    }
    static explode(explosion, crater) {
        explosion.style.visibility = "visible";
        crater.style.visibility = "visible";
        ContentElHandler.fadeRemoveItem(crater, this.craterDecalStay, this.craterFadingTillRemoval);
        ContentElHandler.fadeRemoveItem(explosion, 4000, 100);
    }
    static setAndReturnExplosion(blastCenter, size, explSrc) {
        let explosion = this.returnNewImageEl("explosion");
        explosion.src = explSrc + loadNewImage();
        explosion.style.width = size + 'px';
        explosion.style.height = size + 'px';
        explosion.style.left = blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';
        return explosion;
    }
    static setAndReturnCrater(blastCenter, size) {
        let craterSrc = assetsFolder + "crater.png";
        let crater = this.returnNewImageEl("crater", craterSrc);
        crater.id = "crater";
        crater.style.width = size / 1.5 + 'px';
        crater.style.height = size / 3 + 'px';
        crater.style.left = blastCenter.X - crater.clientWidth / 2 + 'px';
        crater.style.top = blastCenter.Y - crater.clientHeight / 2 + 'px';
        return crater;
    }
}
//# sourceMappingURL=explosionHandler.js.map