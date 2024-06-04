class WeaponType {
    name;
    cursor;
    sound;
    imageSource;
    speed;
    cooldown;
    craterDecalStay = 10000;
    craterFadingTillRemoval = fadeAnimTime;
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
        let el = this.returnBlastRadiusDiv(10);
        let inst = {
            ready: true,
            blastRadElement: el,
        };
        this.instances.push(inst);
        game.redrawHudWithWepSelectionChecked();
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
            if (_this !== game.weapon) {
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
        if (this.name === weaponNames.tunnelcharge) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }
    bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
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
        RandomSoundGen.playSequentialSound(this.sound);
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
                    if (target.status == Status.active) {
                        this.bonusHitSound();
                    }
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
    pushNewWeaponInstance() {
        pickup.play();
        let el = this.returnBlastRadiusDiv(this.blastRadius);
        this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";
        let explosion = this.returnNewImageEl("explosion");
        let inst = {
            ready: true,
            blastRadElement: el,
            explosion
        };
        this.instances.push(inst);
        game.redrawHudWithWepSelectionChecked();
    }
    getAvailableInstance() {
        let nextReady = null;
        nextReady = this.searchInstances(nextReady);
        this.setBlastRadVisible(nextReady);
        return nextReady;
    }
    fireFunc(targets) {
        if (this.ammoCheck() === false) {
            return;
        }
        RandomSoundGen.playSequentialSound(this.sound);
        this.shotCounter();
        let inst = this.activeInstance;
        inst.ready = false;
        this.rippleEffect(inst);
        this.switchBlastIndicatorStyle(true, inst);
        this.setExplosionPos(inst);
        if (this.explosionInfo.sound.length) {
            setTimeout(() => RandomSoundGen.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
        }
        let crater = this.setAndReturnCrater(inst);
        setTimeout(() => {
            this.explosion(inst, crater);
            this.checkForTargets(inst.blastRadElement, targets);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    setExplosionPos(inst) {
        let blastRadiusEl = inst.blastRadElement;
        let explosion = inst.explosion;
        let blastRect = blastRadiusEl.getBoundingClientRect();
        explosion.style.width = blastRect.width + 'px';
        explosion.style.height = blastRect.height + 'px';
        let blastCenter = CollisionDetection.getXYfromPoint(blastRadiusEl);
        explosion.style.left = blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';
    }
    setAndReturnCrater(inst) {
        let blastRadiusEl = inst.blastRadElement;
        let blastRect = blastRadiusEl.getBoundingClientRect();
        let crater = this.returnNewImageEl("crater", this.explosionInfo.craterSource);
        crater.id = "crater";
        crater.style.width = blastRect.width / 2 + 'px';
        crater.style.height = blastRect.height / 4 + 'px';
        let blastCenter = CollisionDetection.getXYfromPoint(blastRadiusEl);
        crater.style.left = blastCenter.X - crater.clientWidth / 2 + 'px';
        crater.style.top = blastCenter.Y - crater.clientHeight / 2 + 'px';
        return crater;
    }
    returnNewImageEl(classname, src) {
        let el = document.createElement('img');
        if (src)
            el.src = src;
        el.className = classname;
        ContentElHandler.addToContentEl(el);
        return el;
    }
    explosion(inst, crater) {
        let explosion = inst.explosion;
        explosion.src = this.explosionInfo.imageSource + loadNewImage();
        crater.style.visibility = "visible";
        ContentElHandler.fadeRemoveItem(crater, this.craterDecalStay, this.craterFadingTillRemoval);
    }
    checkForTargets(elem, targets) {
        for (let target of targets) {
            let collisionInfo = CollisionDetection.checkCollisionFromElement(elem, target.getTargetEl());
            if (collisionInfo) {
                let fraction = collisionInfo.dist / collisionInfo.radius;
                let severity = this.determineSeverity(fraction);
                if (this.determineExceptionsForArmour(target, severity)) {
                    continue;
                }
                ;
                if (target.movesAtBlast) {
                    severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";
                }
                let direc = this.determineDirectionForFlip(collisionInfo);
                if (target.damage != Damage.destroyed) {
                    target.hit(severity, this.name, direc);
                    if (target.status == Status.active) {
                        this.bonusHitSound();
                    }
                }
            }
        }
    }
    ricochetChance() {
        RandomNumberGen.randomNumBetween(1, 10) > 6 ? RandomSoundGen.playRandomSound(ricochet) : "";
    }
    determineExceptionsForArmour(target, severity) {
        let exception = false;
        if (target.armour == Armour.moderate) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                this.name < weaponNames.nuke && severity <= strikeSeverity.light) {
                this.ricochetChance();
                exception = true;
            }
        }
        if (target.armour >= Armour.heavy) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                this.name < weaponNames.nuke && severity <= strikeSeverity.medium) {
                this.ricochetChance();
                exception = true;
            }
        }
        if (target.movesAtBlast === false) {
            if (this.name < weaponNames.airstrike) {
                exception = true;
            }
        }
        return exception;
    }
    determineDirectionForFlip(collisionInfo) {
        let angle = collisionInfo.angle;
        let direc;
        if (angle > 300 && angle < 360 || angle > 0 && angle < 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle < 210) {
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
                hit = true;
                inst.ready = false;
                this.shotCounter();
                this.cooldownTimeout(inst);
                RandomSoundGen.playSequentialSound(beeps);
                RandomSoundGen.playSequentialSound(ticks);
                setTimeout(() => {
                    let severity = this.determineSeverity();
                    tunnel.hit(severity);
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed);
            }
            ;
        }
        hit === false ? bleep_neg.play() : "";
        this.setActiveInstance();
    }
}
