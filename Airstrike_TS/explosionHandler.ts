enum screenShakeTimeouts {
    "shake_1" = 200,
    "shake_2" = 300,
    "shake_3" = 400,
}
type light = {
    pos: position,
    opac: number,
    size: ExplSizes,
    fading: boolean
}
var lights: Array<light> = [];
var flares: Array<light> = [];

const flareFade = 10000;

class ExplosionHandler {
    private static craterDecalStay: number = 15000;
    private static craterFadingTillRemoval: number = fadeAnimTime;

    public static createFlare(blastCenter: position, size: ExplSizes) {
        this.pushLight(flares, blastCenter, size);
        let fallingFlare = ContentElHandler.returnNewEl(ContentElHandler.returnContentEl(), 'flare');
        fallingFlare.style.left = blastCenter.X + 'px';
        fallingFlare.style.top = blastCenter.Y + 'px';
        ContentElHandler.fadeRemoveItem(fallingFlare, flareFade, 1);

    }
    public static basicExplosion(blastCenter: position, size: ExplSizes, explSrc: string, weaponName: weaponNames) {
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
        this.checkForTargets(blastCenter, size, weaponName)
    }
    private static checkForTargets(blastCenter: position, size: ExplSizes, weaponName: weaponNames) {
        let rad = size / 2;
        for (let target of allTargets) {
            let targetEl = target.getTargetEl();
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, targetEl, rad)) {
                let collisionInfo: vectorMoveObj = CollisionDetection.getVectorMove(blastCenter, targetEl, rad)
                this.targetStrike(target, weaponName, collisionInfo)
            }
        }
        for (let item of allObjects) {
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, item, rad)) {
                let collisionInfo: vectorMoveObj = CollisionDetection.getVectorMove(blastCenter, item, rad)
                this.itemStrike(item, collisionInfo)
            }
        }
    }
    private static itemStrike(item, collisionInfo: vectorMoveObj) {
        let direc: direction = ThrowHandler.determineDirectionForFlip(collisionInfo);
        ThrowHandler.flip(item, direc);
    }

    private static targetStrike(target, weaponName: weaponNames, collisionInfo: vectorMoveObj) {
        let fraction = collisionInfo.dist / collisionInfo.radius;
        let severity: strikeSeverity = this.determineSeverity(fraction);

        if (target.damage != Damage.destroyed) {
            target.hit(severity, weaponName, collisionInfo); // TARGET - Main hit function
        }
    }

    private static determineSeverity(fraction: number) {
        let severity: strikeSeverity;
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
        return severity
    }

    private static flash() {
        let overlay = document.getElementById("overlay");
        overlay.classList.add("flash");
        setTimeout(() => { overlay.classList.remove("flash"); }, 2000)
    }
    private static pushLight(lightArr: Array<light>, blastCenter: position, explSize: ExplSizes) {
        let light: light = { pos: blastCenter, opac: 1, size: explSize, fading: false }
        lightArr.push(light);
    }

    private static shake(shakeTimeout: screenShakeTimeouts) {
        let content = document.getElementById("content");
        content.classList.add(screenShakeTimeouts[shakeTimeout]);
        setTimeout(() => { content.classList.remove(screenShakeTimeouts[shakeTimeout]); }, shakeTimeout)
    }

    private static returnNewImageEl(classname: string, src?: string) {
        let el = document.createElement('img');
        if (src) el.src = src;
        el.className = classname;
        ContentElHandler.addToContentEl(el);
        return el;
    }
    private static explode(explosion: HTMLImageElement, crater: HTMLImageElement) {
        explosion.style.visibility = "visible";
        crater.style.visibility = "visible";
        ContentElHandler.fadeRemoveItem(crater, this.craterDecalStay, this.craterFadingTillRemoval);
        ContentElHandler.fadeRemoveItem(explosion, 4000, 100);
    }
    private static setAndReturnExplosion(blastCenter, size, explSrc) {
        let explosion = this.returnNewImageEl("explosion");
        explosion.src = explSrc + loadNewImage();
        explosion.style.width = size + 'px';
        explosion.style.height = size + 'px';
        explosion.style.left = blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';
        return explosion
    }
    private static setAndReturnCrater(blastCenter, size) {
        let craterSrc = assetsFolder + "crater.png"
        let crater = this.returnNewImageEl("crater", craterSrc);
        crater.id = "crater";
        crater.style.width = size / 1.5 + 'px';
        crater.style.height = size / 3 + 'px';
        crater.style.left = blastCenter.X - crater.clientWidth / 2 + 'px';
        crater.style.top = blastCenter.Y - crater.clientHeight / 2 + 'px';
        return crater;
    }
}