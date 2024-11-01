class WeaponType {
    name;
    cursor;
    sound;
    imageSource;
    speed;
    cooldown;
    noAmmo;
    select;
    activeInstance;
    instances = [];
    constructor(info) {
        this.name = info.name;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
        this.noAmmo = info.noAmmo;
        this.select = info.select;
        allWeaponTypes[this.name - 1] = this;
    }
    switchFrom() {
        if (this.instances.length && this.activeInstance && this.activeInstance.blastRadElement) {
            if (this.activeInstance.ready == true) {
                this.activeInstance.blastRadElement.style.visibility = "hidden";
            }
        }
    }
    playSound() {
        RandomSoundGen.playSequentialSound(this.sound);
    }
    playSelectSound() {
        RandomSoundGen.playSequentialSound(this.select);
    }
    switchTo() {
        this.playSelectSound();
        this.setActiveInstance();
        this.additionalSwitchFunc();
    }
    additionalSwitchFunc() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    setActiveInstance() {
        this.activeInstance = this.getAvailableInstance();
        game.updateCursorPosition();
    }
    getAvailableInstance() {
        let nextReady = null;
        nextReady = this.searchInstances(nextReady);
        return nextReady;
    }
    searchInstances(nextReady) {
        for (let i in this.instances) {
            game.hud.deselectInst(parseInt(i), this.name);
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    game.hud.selectInst(parseInt(i), this.name);
                }
            }
        }
        return nextReady;
    }
    setBlastRadVisible(nextReady) {
        if (nextReady != null) {
            nextReady.blastRadElement.style.visibility = "visible";
        }
    }
    pushNewWeaponInstance() {
        pickup.play();
        let inst = {
            ready: true,
        };
        if (this.blastRadNum()) {
            let el = this.returnBlastRadiusDiv(this.blastRadNum());
            this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";
            inst.blastRadElement = el;
        }
        this.instances.push(inst);
        game.redrawHudWithWepSelectionChecked();
    }
    blastRadNum() {
        return 0;
    }
    shotCounter() {
        game.shotCount++;
        game.updateShotCounter();
    }
    returnBlastRadiusDiv(radius) {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        el.style.width = el.style.height = radius * 2 + 'px';
        el.style.visibility = "hidden";
        el.id = weaponNames[this.name] + "_" + this.instances.length + 1 + "";
        ContentElHandler.addToContentEl(el);
        return el;
    }
    fireFunc(targets) {
    }
    cooldownTimeout(inst) {
        let instances = this.instances;
        let name = this.name;
        let index = instances.indexOf(inst);
        game.hud.unavailInst(index, name);
        let _this = this;
        setTimeout(() => {
            inst.ready = true;
            game.hud.availInst(index, name);
            _this.activeInstance = _this.activeInstance == null ? _this.getAvailableInstance() : _this.activeInstance;
            if (_this !== game.weapon && _this.activeInstance.blastRadElement) {
                _this.activeInstance.blastRadElement.style.visibility = 'hidden';
            }
            game.updateCursorPosition();
        }, _this.cooldown);
    }
    ammoCheck() {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            this.noAmmo.play();
            return false;
        }
        else
            return true;
    }
    determineSeverity(fraction) {
        let severity;
        if (this.name === weaponNames.tunnelcharge || this.name === weaponNames.drone) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }
}
class BulletWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    fireFunc(targets) {
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        let inst = this.activeInstance;
        inst.ready = false;
        this.shotCounter();
        setTimeout(() => {
            this.checkForTargets(inst.blastRadElement, targets);
        }, this.speed);
        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    determineSeverity() {
        let severity = strikeSeverity.light;
        return severity;
    }
    checkForTargets(elem, targets) {
        for (let target of targets) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, target.getPicEl())) {
                let severity = this.determineSeverity();
                if (this.determineExceptionsForArmour(target, severity)) {
                    continue;
                }
                ;
                if (target.damage != Damage.destroyed) {
                    target.hit(severity, this.name, direction.forward);
                }
            }
        }
    }
    determineExceptionsForArmour(target, severity) {
        let exception = false;
        if (target.armour >= Armour.moderate) {
            RandomSoundGen.playRandomSound(ricochet);
            exception = true;
        }
        return exception;
    }
}
class ExplosiveWeaponType extends WeaponType {
    blastRadius;
    explosionInfo;
    constructor(info) {
        super(info);
        this.explosionInfo = info.explosionInfo;
        this.blastRadius = info.blastRadius;
        this.pushNewWeaponInstance();
    }
    additionalSwitchFunc() {
        let inst = this.activeInstance;
        if (inst) {
            this.switchBlastIndicatorStyle(false, inst);
        }
    }
    blastRadNum() {
        return this.blastRadius;
    }
    getAvailableInstance() {
        let nextReady = null;
        nextReady = this.searchInstances(nextReady);
        if (this.blastRadNum()) {
            this.setBlastRadVisible(nextReady);
        }
        return nextReady;
    }
    fireFunc(targets) {
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        this.shotCounter();
        let inst = this.activeInstance;
        inst.ready = false;
        this.rippleEffect(inst);
        this.switchBlastIndicatorStyle(true, inst);
        if (this.explosionInfo.sound.length) {
            setTimeout(() => RandomSoundGen.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
        }
        setTimeout(() => {
            let blastCenter = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource);
            let blastPos = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            this.checkForTargets(blastPos, targets);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    checkForTargets(blastPos, targets) {
        for (let target of targets) {
            let collisionInfo = CollisionDetection.checkCollisionFromPositionWithBlast(blastPos, target.getTargetEl(), this.explosionInfo.size / 2);
            if (collisionInfo) {
                this.targetStrike(target, collisionInfo);
            }
        }
    }
    targetStrike(target, collisionInfo) {
        let fraction = collisionInfo.dist / collisionInfo.radius;
        let severity = this.determineSeverity(fraction);
        if (target.movesAtBlast) {
            if (target.armour >= Armour.moderate) {
                collisionInfo.radius /= 2;
            }
            severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";
        }
        let direc = this.determineDirectionForFlip(collisionInfo);
        if (target.damage != Damage.destroyed) {
            target.hit(severity, this.name, direc);
        }
    }
    determineDirectionForFlip(collisionInfo) {
        let angle = collisionInfo.angle;
        let direc = null;
        if (angle > 300 && angle <= 360 || angle > 0 && angle <= 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle <= 210) {
            direc = direction.backward;
        }
        return direc;
    }
    determineSeverity(fraction) {
        let severity;
        if (this.name === weaponNames.gun) {
            severity = strikeSeverity.light;
        }
        else {
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
        }
        return severity;
    }
    switchBlastIndicatorStyle(bool, inst) {
        if (inst == null)
            return;
        let blastRadEl = inst.blastRadElement;
        if (bool) {
            blastRadEl.classList.remove("preFire");
            blastRadEl.classList.add("firing");
        }
        else {
            blastRadEl.classList.add("preFire");
            blastRadEl.classList.remove("firing");
        }
    }
    rippleEffect(inst) {
        let blastRadiusEl = inst.blastRadElement;
        const circle = document.createElement("span");
        const diameter = blastRadiusEl.clientWidth;
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = blastRadiusEl.clientLeft + 'px';
        circle.style.top = blastRadiusEl.clientTop + 'px';
        circle.classList.add("ripple");
        const ripple = blastRadiusEl.getElementsByClassName("ripple")[0];
        ripple ? ripple.remove() : () => { };
        blastRadiusEl.appendChild(circle);
    }
}
class ChargeWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    switchFrom() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    additionalSwitchFunc() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'visible');
    }
    fireFunc(targets) {
        if (this.ammoCheck() === false) {
            return;
        }
        let inst = this.activeInstance;
        let tunnels = targets.filter((element) => {
            return element.constructor.name === TunnelTarget.name;
        });
        let hit = false;
        for (let tunnel of tunnels) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, tunnel.getTargetEl())) {
                tunnel.toggleLockOn(true);
                tunnel.toggleLockOnStrike(true);
                hit = true;
                inst.ready = false;
                this.shotCounter();
                this.cooldownTimeout(inst);
                RandomSoundGen.playSequentialSound(beeps);
                RandomSoundGen.playSequentialSound(ticks);
                setTimeout(() => {
                    let severity = this.determineSeverity();
                    tunnel.hit(severity, this.name);
                    tunnel.toggleLockOn(false);
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed);
            }
            ;
        }
        hit === false ? bleep_neg.play() : "";
        this.setActiveInstance();
    }
}
class DroneWeaponType extends ExplosiveWeaponType {
    attackLimit = 3;
    lockedTargets = [];
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    clearTargets() {
        this.lockedTargets.forEach((trgt) => {
            trgt.toggleLockOn(false);
        });
        this.lockedTargets = [];
    }
    switchFrom() {
        this.clearTargets();
    }
    additionalSwitchFunc() {
        this.findTargets();
    }
    findTargets() {
        bleep_pos.play();
        this.clearTargets();
        let activeTargets = game.level.targets.filter(t => t.status == Status.active && t.getLockOnStatus() == false && t.movesAtBlast);
        let sortedByArmour = activeTargets.sort((a, b) => b.armour - a.armour);
        let chosenTargets = sortedByArmour.slice(0, this.attackLimit);
        chosenTargets = chosenTargets.sort((a, b) => b.getTargetEl().getBoundingClientRect().x - a.getTargetEl().getBoundingClientRect().x);
        chosenTargets.forEach((trgt) => {
            trgt.toggleLockOn(true);
        });
        this.lockedTargets = chosenTargets;
    }
    playSound() {
        bleepbleep.play();
        let snd = this.sound;
        setTimeout(() => {
            RandomSoundGen.playSequentialSound(strikePrep);
            setTimeout(() => { RandomSoundGen.playRandomSound(snd); }, 300);
        }, 300);
    }
    fireFunc(targets) {
        if (this.lockedTargets.length < this.attackLimit) {
            this.findTargets();
            return;
        }
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        let inst = this.activeInstance;
        inst.ready = false;
        this.cooldownTimeout(inst);
        let speedInc = 150;
        let currentSpeedBuffer = 0;
        let strikingTargets = this.lockedTargets;
        this.lockedTargets = [];
        strikingTargets.forEach((trgt) => {
            trgt.toggleLockOnStrike(true);
            currentSpeedBuffer += speedInc;
            setTimeout(() => {
                trgt.toggleLockOn(false);
                trgt.toggleLockOnStrike(false);
                RandomSoundGen.playSequentialSound(multiExplosions);
                let deviation = 10;
                let deviationX = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let deviationY = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let blastCenter = CollisionDetection.getXYfromPoint(trgt.getTargetEl());
                blastCenter.X += deviationX;
                blastCenter.Y += deviationY;
                ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource);
                this.checkForTargets(blastCenter, allTargets);
            }, this.speed + currentSpeedBuffer);
        });
        this.setActiveInstance();
    }
}
class ExplosionHandler {
    static craterDecalStay = 15000;
    static craterFadingTillRemoval = fadeAnimTime;
    static basicExplosion(blastCenter, size, explSrc) {
        let explosion = this.setAndReturnExplosion(blastCenter, size, explSrc);
        let crater = this.setAndReturnCrater(blastCenter, size);
        this.explode(explosion, crater);
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
        ContentElHandler.fadeRemoveItem(explosion, 2000, 100);
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
