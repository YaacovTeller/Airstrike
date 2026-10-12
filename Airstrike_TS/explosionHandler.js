"use strict";
var screenShakeTimeouts;
(function (screenShakeTimeouts) {
    screenShakeTimeouts[screenShakeTimeouts["shake_1"] = 200] = "shake_1";
    screenShakeTimeouts[screenShakeTimeouts["shake_2"] = 300] = "shake_2";
    screenShakeTimeouts[screenShakeTimeouts["shake_3"] = 400] = "shake_3";
})(screenShakeTimeouts || (screenShakeTimeouts = {}));
// The splash pictures (AS_assets/splash) are on a canvas bigger than the original 351x248, with the ripple rings completed
// out to the sides and bottom. padSides is the extra width on each of the left and right.
const splashPicture = { width: 501, height: 309, originalWidth: 351, originalHeight: 248, padSides: 75 };
var lights = [];
var flares = [];
var fires = [];
const flareFade = 15000;
const flareReach = 550;
const strikeLightReachFactor = 4; // a strike lights up this many times its own size
class ExplosionHandler {
    static craterDecalStay = 20000;
    static craterFadingTillRemoval = fadeAnimTime;
    static craterSources = ["crater_1.png", "crater_2.png", "crater_3.png"];
    static createFlare(blastCenter, size) {
        this.pushLight(flares, blastCenter, size, flareReach);
        let fallingFlare = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), 'flare');
        fallingFlare.style.left = blastCenter.X + 'px';
        fallingFlare.style.top = blastCenter.Y + 'px';
        ContentElHandler.fadeRemoveItem(fallingFlare, flareFade, 1);
    }
    // Just a crater, with no explosion over it
    static createCrater(blastCenter, size) {
        this.presentAndFadeout(this.setAndReturnCrater(blastCenter, size), this.craterDecalStay, this.craterFadingTillRemoval);
    }
    // The biggest shake there is, as the largest bomb gives
    static bigShake() {
        this.shake(screenShakeTimeouts.shake_3);
    }
    static basicExplosion(blastCenter, size, explFrames, weaponName) {
        if (game.level)
            game.level.noteExplosion(); // the first one starts the clock on a special enemy's escape
        game.lastStrike = blastCenter;
        let water = document.getElementById("water");
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
    static waterHit(blastCenter, size, explSrc, weaponName) {
        this.setAndReturnExplosion(blastCenter, size, HitSurface.land);
        this.shake_Light_Targets(blastCenter, size, weaponName);
    }
    static waterMiss(blastCenter, size) {
        let splash = this.setAndReturnExplosion(blastCenter, size, HitSurface.water);
        //let splash = this.setAndReturnSplash(blastCenter, size);
        this.presentAndFadeout(splash, 4000, 100);
    }
    // Small splash for a piece of thrown debris (wheel/bit/etc) landing in water -- see
    // ThrowHandler.removeIfLandedInWater.
    static createSplash(position) {
        let splash = this.setAndReturnExplosion(position, ExplSizes.XXS, HitSurface.water);
        this.presentAndFadeout(splash, 2000, 100);
    }
    static landHit(blastCenter, size, explFrames, weaponName) {
        let explosion = this.setAndReturnExplosion(blastCenter, size, HitSurface.land);
        let crater = this.setAndReturnCrater(blastCenter, size);
        this.handleExplosionCrater(explosion, crater);
        this.shake_Light_Targets(blastCenter, size, weaponName);
    }
    static shake_Light_Targets(blastCenter, size, weaponName) {
        this.setScreenShake(size);
        this.pushLight(lights, blastCenter, size, size * strikeLightReachFactor);
        this.checkForTargets(blastCenter, size, weaponName);
    }
    static setScreenShake(size) {
        if (size == ExplSizes.large) {
            this.shake(screenShakeTimeouts.shake_1);
        }
        else if (size == ExplSizes.XL) {
            this.shake(screenShakeTimeouts.shake_2);
        }
        else if (size > ExplSizes.XL && size < ExplSizes.XXL) { // the bigger explosions between: a heavy shake, but no flash
            this.shake(screenShakeTimeouts.shake_3);
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
    // (It walks copies of the lists: a building brought down by the blast takes itself out of allTargets as it goes,
    // and walking the list itself would then skip whichever one came next, leaving it untouched in the middle of the blast.)
    static forEachBlastCollision(blastCenter, rad, onTarget, onItem) {
        for (let target of allTargets.slice()) {
            // something long and thin (a tunnel) is measured from the nearest part of it, not from its middle
            const focus = target.blastFocus ? target.blastFocus(blastCenter) : null;
            if (focus) {
                const dist = Math.hypot(focus.X - blastCenter.X, focus.Y - blastCenter.Y);
                if (dist <= rad) {
                    onTarget(target, {
                        elem: target.getTargetEl(),
                        angle: Math.atan2(focus.Y - blastCenter.Y, focus.X - blastCenter.X) * 180 / Math.PI,
                        dist: dist,
                        radius: rad,
                        hitDist: dist,
                    });
                }
                continue;
            }
            let nearest = CollisionDetection.nearestPointInBox(blastCenter, target.hitBox());
            if (Math.abs(nearest.X - blastCenter.X) <= rad && Math.abs(nearest.Y - blastCenter.Y) <= rad) {
                let collisionInfo = CollisionDetection.getVectorMove(blastCenter, target.getTargetEl(), rad);
                collisionInfo.hitDist = Math.hypot(nearest.X - blastCenter.X, nearest.Y - blastCenter.Y);
                onTarget(target, collisionInfo);
            }
        }
        for (let item of allObjects.slice()) {
            if (CollisionDetection.checkCollisionFromPositionWithBlast(blastCenter, item, rad)) {
                let collisionInfo = CollisionDetection.getVectorMove(blastCenter, item, rad);
                onItem(item, collisionInfo);
            }
        }
    }
    static checkForAnyDirectTargetHit(blastCenter, size) {
        let directHit = false;
        let minDist = 20;
        let flagIfDirect = (elem, collisionInfo) => {
            let dist = collisionInfo.hitDist !== undefined ? collisionInfo.hitDist : collisionInfo.dist;
            if (dist < minDist)
                directHit = true;
        };
        this.forEachBlastCollision(blastCenter, size / 2, flagIfDirect, flagIfDirect);
        return directHit;
    }
    static checkForTargets(blastCenter, size, weaponName) {
        this.forEachBlastCollision(blastCenter, size / 2, (target, collisionInfo) => this.targetStrike(target, weaponName, collisionInfo), (item, collisionInfo) => this.itemStrike(item, collisionInfo));
    }
    static itemStrike(item, collisionInfo) {
        let direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
        ThrowHandler.flip(item, direc, crashes);
    }
    static targetStrike(target, weaponName, collisionInfo) {
        let fraction = collisionInfo.dist / collisionInfo.radius;
        let severity = this.determineSeverity(fraction);
        // a destroyed target is left alone, except rubble that's still got something left to be knocked down
        if (target.damage != Damage.destroyed || (target.hitWhenDestroyed && target.hitWhenDestroyed())) {
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
    static pushLight(lightArr, blastCenter, explSize, reach) {
        lightID++;
        let light = { id: lightID, pos: blastCenter, opac: 1, size: explSize, fading: false, reach: reach };
        lightArr.push(light);
    }
    static shake(shakeTimeout) {
        let contentParent = ContentElHandler.returnContentEl().parentElement;
        contentParent.classList.add(screenShakeTimeouts[shakeTimeout]);
        setTimeout(() => { contentParent.classList.remove(screenShakeTimeouts[shakeTimeout]); }, shakeTimeout);
    }
    static presentAndFadeout(item, decalStay, fadingTillRemoval) {
        item.style.visibility = "visible";
        ContentElHandler.fadeRemoveItem(item, decalStay, fadingTillRemoval);
    }
    static handleExplosionCrater(explosion, crater) {
        this.presentAndFadeout(explosion, 4000, 100);
        this.presentAndFadeout(crater, this.craterDecalStay, this.craterFadingTillRemoval);
    }
    static setAndReturnExplosion(blastCenter, size, surface) {
        let explosion = ElementCreator.returnNewCanvas(ContentElHandler.returnContentEl(), "explosion");
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
                case ExplSizes.huge:
                case ExplSizes.massive:
                case ExplSizes.colossal:
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
        let width = size, height = size;
        let left = blastCenter.X - (size / 2);
        if (surface == HitSurface.water) {
            // the splash pictures have room round the original ones for the ripples to finish, so the canvas grows to match, the
            // original part staying exactly where and as big as it was
            width = size * splashPicture.width / splashPicture.originalWidth;
            height = size * splashPicture.height / splashPicture.originalHeight;
            left -= size * splashPicture.padSides / splashPicture.originalWidth;
            explosion.width = width;
            explosion.height = height;
        }
        player.play(explosionImgs, false);
        this.setSizeAndPos(explosion, width, height, left, blastCenter.Y - (size * 0.9));
        return explosion;
    }
    // Every crater there is, with where it is, how big it is and how old: what vehicles driving over it feel (see
    // VehicleTarget.craterEffects) and what the rain fills
    static craters = [];
    // How much of its effect a crater still has on what drives over it: all of it while its picture is there, and once that starts to
    // fade it goes the same way, over a few seconds, instead of all at once (which would drop a vehicle sitting in it back up with a hop)
    static fadeOutMs = 4000;
    static strengthOf(c) {
        if (c.el.isConnected && !c.el.classList.contains("hide"))
            return 1;
        if (c.fadeStart === undefined)
            c.fadeStart = performance.now();
        return Math.max(0, 1 - (performance.now() - c.fadeStart) / this.fadeOutMs);
    }
    static liveCraters() {
        this.craters = this.craters.filter(c => this.strengthOf(c) > 0);
        return this.craters;
    }
    // After a few seconds of hard rain the craters that have had time to settle fade into the picture of one full of water
    static fillCratersWithRain() {
        const now = performance.now();
        for (const crater of this.liveCraters()) {
            if (crater.wet || !crater.el.isConnected || now - crater.born < 1500)
                continue;
            crater.wet = true;
            const water = document.createElement("img");
            water.className = crater.el.className;
            water.style.cssText = crater.el.style.cssText;
            water.style.opacity = "0";
            water.style.transition = "opacity 3s ease-in";
            water.src = assetsFolder + "crater_rain.png";
            crater.el.parentElement.appendChild(water);
            requestAnimationFrame(() => requestAnimationFrame(() => water.style.opacity = crater.el.style.opacity || "1"));
            setTimeout(() => {
                crater.el.src = assetsFolder + "crater_rain.png";
                water.remove();
            }, 3100);
        }
    }
    static setAndReturnCrater(blastCenter, size) {
        let craterSrc = assetsFolder + RandomNumberGen.returnRandomFromArray(this.craterSources);
        let crater = ElementCreator.returnNewImageEl(ContentElHandler.returnContentEl(), "crater", craterSrc);
        crater.id = "crater";
        let width = size / 1.5;
        let height = size / 3;
        this.setSizeAndPos(crater, width, height, blastCenter.X - width / 2, blastCenter.Y - height / 2);
        this.craters.push({ el: crater, x: blastCenter.X, y: blastCenter.Y, rx: width / 2, ry: height / 2, size: size, born: performance.now(), wet: false });
        return crater;
    }
    static setAndReturnSplash(blastCenter, size) {
        let src = assetsFolder + "splash.gif";
        let item = ElementCreator.returnNewImageEl(ContentElHandler.returnContentEl(), "splash", src);
        item.className = "splash";
        this.setSizeAndPos(item, size, size, blastCenter.X - size / 2, blastCenter.Y - size / 1.5);
        return item;
    }
    static setSizeAndPos(item, width, height, left, top) {
        item.style.width = width + 'px';
        item.style.height = height + 'px';
        item.style.left = left + 'px';
        item.style.top = top + 'px';
    }
}
//# sourceMappingURL=explosionHandler.js.map