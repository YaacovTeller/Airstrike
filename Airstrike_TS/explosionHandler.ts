enum screenShakeTimeouts {
    "shake_1" = 200,
    "shake_2" = 300,
    "shake_3" = 400,
}
type light = {
    id: number,
    pos: position,
    opac: number,
    size: ExplSizes,
    fading: boolean,
    parent?: HTMLElement
}
var lights: Array<light> = [];
var flares: Array<light> = [];
var fires: Array<light> = [];

const flareFade = 15000;

class ExplosionHandler {
    private static craterDecalStay: number = 15000;
    private static craterFadingTillRemoval: number = fadeAnimTime;
    private static craterSources: string[] = ["crater_1.png", "crater_2.png", "crater_3.png"];

    public static createFlare(blastCenter: position, size: ExplSizes) {
        this.pushLight(flares, blastCenter, size);
        let fallingFlare = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), 'flare');
        fallingFlare.style.left = blastCenter.X + 'px';
        fallingFlare.style.top = blastCenter.Y + 'px';
        ContentElHandler.fadeRemoveItem(fallingFlare, flareFade, 1);

    }
    public static basicExplosion(blastCenter: position, size: ExplSizes, explFrames: Array<HTMLImageElement>, weaponName: weaponNames) {
        let water = document.getElementById("water")
        if (water) {
            if (CollisionDetection.checkCollisionFromPosition(blastCenter, water)) {
                if (this.checkForAnyDirectTargetHit(blastCenter, size)) {
                    this.waterHit(blastCenter, size, explFrames, weaponName);
                }
                this.waterMiss(blastCenter, size);
            }
            else {
                this.landHit(blastCenter, size, explFrames, weaponName);
            }
        }
        else {
            this.landHit(blastCenter, size, explFrames, weaponName);
        }
    }

    private static waterHit(blastCenter: position, size: ExplSizes, explSrc: Array<HTMLImageElement>, weaponName: weaponNames) {
        this.setAndReturnExplosion(blastCenter, size, HitSurface.land);

        this.shake_Light_Targets(blastCenter, size, weaponName);
    }

    private static waterMiss(blastCenter, size) {
        let splash = this.setAndReturnExplosion(blastCenter, size, HitSurface.water)
        //let splash = this.setAndReturnSplash(blastCenter, size);
        this.presentAndFadeout(splash, 4000, 100);
    }

    // Small splash for a piece of thrown debris (wheel/bit/etc) landing in water -- see
    // ThrowHandler.removeIfLandedInWater.
    public static createSplash(position: position) {
        let splash = this.setAndReturnExplosion(position, ExplSizes.XXS, HitSurface.water);
        this.presentAndFadeout(splash, 2000, 100);
    }

    private static landHit(blastCenter: position, size: ExplSizes, explFrames: Array<HTMLImageElement>, weaponName: weaponNames) {
        let explosion = this.setAndReturnExplosion(blastCenter, size, HitSurface.land);

        let crater = this.setAndReturnCrater(blastCenter, size);
        this.handleExplosionCrater(explosion, crater);

        this.shake_Light_Targets(blastCenter, size, weaponName);
    }
    private static shake_Light_Targets(blastCenter: position, size: ExplSizes, weaponName: weaponNames) {
        this.setScreenShake(size)
        this.pushLight(lights, blastCenter, size);
        this.checkForTargets(blastCenter, size, weaponName)
    }
    private static setScreenShake(size: ExplSizes) {
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
    }
    // Walks allTargets and allObjects, invoking the callback for every element within the blast radius.
    // A target is hit when the blast's area reaches its hit box (just its middle, unless it says
    // otherwise -- see MapEntity.hitBox). That only decides whether it's hit at all: how hard is
    // still down to how far the blast is from the target's middle (collisionInfo.dist), as a share of
    // the blast's radius. collisionInfo.hitDist is the distance to the nearest point of the hit box,
    // 0 for a blast that landed on it.
    private static forEachBlastCollision(blastCenter: position, rad: number, onTarget: (target, collisionInfo: vectorMoveObj) => void, onItem: (item, collisionInfo: vectorMoveObj) => void) {
        for (let target of allTargets) {
            let nearest = CollisionDetection.nearestPointInBox(blastCenter, target.hitBox());
            if (Math.abs(nearest.X - blastCenter.X) <= rad && Math.abs(nearest.Y - blastCenter.Y) <= rad) {
                let collisionInfo: vectorMoveObj = CollisionDetection.getVectorMove(blastCenter, target.getTargetEl(), rad)
                collisionInfo.hitDist = Math.hypot(nearest.X - blastCenter.X, nearest.Y - blastCenter.Y);
                onTarget(target, collisionInfo);
            }
        }
        for (let item of allObjects) {
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, item, rad)) {
                let collisionInfo: vectorMoveObj = CollisionDetection.getVectorMove(blastCenter, item, rad)
                onItem(item, collisionInfo);
            }
        }
    }

    private static checkForAnyDirectTargetHit(blastCenter: position, size: ExplSizes) {
        let directHit = false;
        let minDist = 20
        let flagIfDirect = (elem, collisionInfo: vectorMoveObj) => {
            let dist = collisionInfo.hitDist !== undefined ? collisionInfo.hitDist : collisionInfo.dist;
            if (dist < minDist) directHit = true
        };
        this.forEachBlastCollision(blastCenter, size / 2, flagIfDirect, flagIfDirect);
        return directHit;
    }

    private static checkForTargets(blastCenter: position, size: ExplSizes, weaponName: weaponNames) {
        this.forEachBlastCollision(blastCenter, size / 2,
            (target, collisionInfo) => this.targetStrike(target, weaponName, collisionInfo),
            (item, collisionInfo) => this.itemStrike(item, collisionInfo));
    }
    private static itemStrike(item, collisionInfo: vectorMoveObj) {
        let direc: direction = ThrowHandler.determineDirectionForFlip(collisionInfo);
        ThrowHandler.flip(item, direc, crashes);
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
        lightID++
        let light: light = { id: lightID, pos: blastCenter, opac: 1, size: explSize, fading: false }
        lightArr.push(light);
    }

    private static shake(shakeTimeout: screenShakeTimeouts) {
        let contentParent = ContentElHandler.returnContentEl().parentElement;
        contentParent.classList.add(screenShakeTimeouts[shakeTimeout]);
        setTimeout(() => { contentParent.classList.remove(screenShakeTimeouts[shakeTimeout]); }, shakeTimeout)
    }

    private static presentAndFadeout(item: HTMLImageElement| HTMLCanvasElement, decalStay: number, fadingTillRemoval: number) {
        item.style.visibility = "visible";
        ContentElHandler.fadeRemoveItem(item, decalStay, fadingTillRemoval);
    }

    private static handleExplosionCrater(explosion: HTMLCanvasElement, crater: HTMLImageElement) {
        this.presentAndFadeout(explosion, 4000, 100);
        this.presentAndFadeout(crater, this.craterDecalStay, this.craterFadingTillRemoval)
    }

    private static setAndReturnExplosion(blastCenter, size: ExplSizes, surface: HitSurface) {
        let explosion = ElementCreator.returnNewCanvas(ContentElHandler.returnContentEl(), "explosion") as HTMLCanvasElement;
        let explosionImgs;
        if (surface == HitSurface.land) {
            switch (size) {
                case ExplSizes.tiny:
                case ExplSizes.small:
                case ExplSizes.large:
                    explosionImgs = expl_small_imgs;
                    break;
                case ExplSizes.XL:
                    explosionImgs = expl_med_imgs;
                    break;

                case ExplSizes.XXL:
                    explosionImgs = expl_big_imgs;
                    break;

                default:
                    explosionImgs = expl_small_imgs;
                    break;
            }
        }
        else {
            explosionImgs = splash_imgs;
        }
        const player = new CanvasGifPlayer(explosion, size);
        player.play(explosionImgs, false);
        this.setSizeAndPos(explosion, size, size, blastCenter.X - (size / 2), blastCenter.Y - (size * 0.9));
        return explosion
    }

    private static setAndReturnCrater(blastCenter, size) {
        let craterSrc = assetsFolder + RandomNumberGen.returnRandomFromArray(this.craterSources);
        let crater = ElementCreator.returnNewImageEl(ContentElHandler.returnContentEl(), "crater", craterSrc);
        crater.id = "crater";

        let width = size / 1.5;
        let height = size / 3;

        this.setSizeAndPos(crater, width, height, blastCenter.X - width / 2, blastCenter.Y - height / 2);
        return crater;
    }
    private static setAndReturnSplash(blastCenter, size) {
        let src = assetsFolder + "splash.gif"
        let item = ElementCreator.returnNewImageEl(ContentElHandler.returnContentEl(), "splash", src);
        item.className = "splash";

        this.setSizeAndPos(item, size, size, blastCenter.X - size / 2, blastCenter.Y - size / 1.5);
        return item;
    }
    private static setSizeAndPos(item, width: number, height: number, left: number, top: number) {
        item.style.width = width + 'px';
        item.style.height = height + 'px';
        item.style.left = left + 'px';
        item.style.top = top + 'px';
    }
}