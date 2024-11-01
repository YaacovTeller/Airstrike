﻿
class WeaponType {
    public name: weaponNames;
    public cursor: string;
    public sound: Array<Sound>;
    public imageSource: string;
    public speed: number;
    public cooldown: number;
    public noAmmo: Sound;
    public select: Array<Sound>;

    public activeInstance: weaponInstance;
    public instances: Array<weaponInstance> = [];

    constructor(info: weaponInfo) {
        this.name = info.name;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
        this.noAmmo = info.noAmmo;
        this.select = info.select;

        allWeaponTypes[this.name -1] = this
    }

    public switchFrom() {
        if (this.instances.length && this.activeInstance && this.activeInstance.blastRadElement) {
            if (this.activeInstance.ready == true) {
                this.activeInstance.blastRadElement.style.visibility = "hidden";
            }
        }
    }
    protected playSound() {
        RandomSoundGen.playSequentialSound(this.sound);
    }
    protected playSelectSound() {
        RandomSoundGen.playSequentialSound(this.select);
    }
    public switchTo() {
        this.playSelectSound();
        this.setActiveInstance();
        this.additionalSwitchFunc();
    }
    public additionalSwitchFunc() {
        const root: HTMLElement = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    public setActiveInstance() {
        this.activeInstance = this.getAvailableInstance();
        game.updateCursorPosition(); // NEEDED?
    }

    public getAvailableInstance() {
        let nextReady: weaponInstance = null;
        nextReady = this.searchInstances(nextReady);
        return nextReady;
    }
    protected searchInstances(nextReady) {
        for (let i in this.instances) {
            game.hud.deselectInst(parseInt(i), this.name) //MESSY?
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    game.hud.selectInst(parseInt(i), this.name); //MESSY?
                }
            }
        }
        return nextReady
    }
    protected setBlastRadVisible(nextReady) {
        if (nextReady != null) {
            nextReady.blastRadElement.style.visibility = "visible";
        }
    }

    public pushNewWeaponInstance() {
        pickup.play();
        let inst: weaponInstance = {
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
    protected blastRadNum() {
        return 0
    }
    protected shotCounter() {
        game.shotCount++
        game.updateShotCounter();
    }
    protected returnBlastRadiusDiv(radius: number) {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        el.style.width = el.style.height = radius * 2 + 'px';
        el.style.visibility = "hidden";
        el.id = weaponNames[this.name] + "_" + this.instances.length + 1 + "";
        ContentElHandler.addToContentEl(el);
        return el;
    }

    public fireFunc(targets: Array<Target>) {

    }

    protected cooldownTimeout(inst: weaponInstance) {
        let instances: Array<weaponInstance> = this.instances;
        let name: weaponNames = this.name;
        let index = instances.indexOf(inst);
        game.hud.unavailInst(index, name);

        let _this = this;
        setTimeout(() => {
            inst.ready = true;
            game.hud.availInst(index, name); //MESSY?
            _this.activeInstance = _this.activeInstance == null ? _this.getAvailableInstance() : _this.activeInstance;
            if (_this !== game.weapon && _this.activeInstance.blastRadElement) {
                _this.activeInstance.blastRadElement.style.visibility = 'hidden';
            }
            game.updateCursorPosition(); //MESSY?
        }, _this.cooldown);
    }

    protected ammoCheck() {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            this.noAmmo.play();
            return false;
        }
        else return true
    }

    protected determineSeverity(fraction?: number) {
        let severity: strikeSeverity;
        if (this.name === weaponNames.tunnelcharge || this.name === weaponNames.drone) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }

    //protected bonusHitSound() {
    //    RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    //}
}

class BulletWeaponType extends WeaponType {
    constructor(info: weaponInfo) {
        super(info);
        this.pushNewWeaponInstance();

    }

    public fireFunc(targets: Array<Target>) {
        if (this.ammoCheck() === false) { return }

        this.playSound();
        let inst: weaponInstance = this.activeInstance as weaponInstance;
        inst.ready = false;
        this.shotCounter();

        setTimeout(() => {
            this.checkForTargets(inst.blastRadElement, targets)
        }, this.speed);

        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    protected determineSeverity() {
        let severity: strikeSeverity = strikeSeverity.light
        return severity
    }
    public checkForTargets(elem: HTMLElement, targets: Array<Target>) {
        for (let target of targets) {
            
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, target.getPicEl())) {
                let severity: strikeSeverity = this.determineSeverity();
                if (this.determineExceptionsForArmour(target, severity)) {
                    continue
                };

                if (target.damage != Damage.destroyed) {
                    target.hit(severity, this.name, direction.forward); // TARGET - Main hit function
                    //if (target.status == Status.active) {
                    //    this.bonusHitSound();
                    //}
                }
            }
        }
    }
    private determineExceptionsForArmour(target: Target, severity: strikeSeverity) {
        let exception: boolean = false;
        if (target.armour >= Armour.moderate) {
                RandomSoundGen.playRandomSound(ricochet);
                exception = true;
        }
        return exception;
    }
}
class ExplosiveWeaponType extends WeaponType {
    public blastRadius: number;
    protected explosionInfo: ExplosionInfo;

    constructor(info: ExplosiveWeaponInfo) {
        super(info);
        this.explosionInfo = info.explosionInfo;
        this.blastRadius = info.blastRadius;

        this.pushNewWeaponInstance();
    }
    public additionalSwitchFunc() {
        let inst = this.activeInstance;
        if (inst) {
            this.switchBlastIndicatorStyle(false, inst as weaponInstance);
        }
    }
    protected blastRadNum() {
        return this.blastRadius;
    }

    public getAvailableInstance() {
        let nextReady: weaponInstance = null;
        nextReady = this.searchInstances(nextReady);
        if (this.blastRadNum()) {                   // MESSY // MESSY
            this.setBlastRadVisible(nextReady);  
        }
        return nextReady;
    }

    public fireFunc(targets: Array<Target>) {
        if (this.ammoCheck() === false) { return }
        this.playSound();
        this.shotCounter();

        let inst: weaponInstance = this.activeInstance as weaponInstance;
        inst.ready = false;

        this.rippleEffect(inst);
        this.switchBlastIndicatorStyle(true, inst);

        if (this.explosionInfo.sound.length) {
            setTimeout(() => RandomSoundGen.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
        }

        setTimeout(() => {
            let blastCenter = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource);
            let blastPos: position = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            this.checkForTargets(blastPos, targets);

            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);

        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }

    public checkForTargets(blastPos: position, targets: Array<Target>) {
        for (let target of targets) {
            let collisionInfo: vectorMoveObj = CollisionDetection.checkCollisionFromPositionWithBlast(blastPos, target.getTargetEl(), this.explosionInfo.size /2); // MESSY!
            if (collisionInfo) {
                this.targetStrike(target, collisionInfo)
            }
        }
    }
    protected targetStrike(target, collisionInfo: vectorMoveObj) {
        let fraction = collisionInfo.dist / collisionInfo.radius;
        let severity: strikeSeverity = this.determineSeverity(fraction);

        if (target.movesAtBlast) {
            if (target.armour >= Armour.moderate) {
                collisionInfo.radius /= 2; // hack to reduce punting armour about
            }
            severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";
        }
        let direc: direction = this.determineDirectionForFlip(collisionInfo);
        if (target.damage != Damage.destroyed) {
            target.hit(severity, this.name, direc); // TARGET - Main hit function
        }
    }

    private determineDirectionForFlip(collisionInfo: vectorMoveObj) {
        let angle = collisionInfo.angle;

        let direc: direction = null;
        if (angle > 300 && angle <= 360 || angle > 0 && angle <= 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle <= 210) {
            direc = direction.backward;
        }
        return direc
    }
    protected determineSeverity(fraction: number) {
        let severity: strikeSeverity;
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
        return severity
    }

    public switchBlastIndicatorStyle(bool: boolean, inst: weaponInstance) {
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

    private rippleEffect(inst: weaponInstance) {
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
    constructor(info: weaponInfo) {
        super(info);
        this.pushNewWeaponInstance();
    }
    public switchFrom() {
        const root: HTMLElement = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    public additionalSwitchFunc() {
        const root: HTMLElement = document.querySelector(':root');
            root.style.setProperty('--chargeSelected', 'visible'); // :D change root css to get 'lockon' svg!
    }

    public fireFunc(targets: Array<Target>) {
        if (this.ammoCheck() === false) { return }

        let inst: weaponInstance = this.activeInstance as weaponInstance;

        let tunnels: Array<TunnelTarget> = targets.filter((element): element is TunnelTarget => {
            return element.constructor.name === TunnelTarget.name;
        });
        let hit: boolean = false;
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
                    tunnel.hit(severity, this.name);       // TARGET - Main hit function
                    tunnel.toggleLockOn(false);
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed)
            };
        }
        hit === false ? bleep_neg.play() : "";
        this.setActiveInstance();

    }
}
class DroneWeaponType extends ExplosiveWeaponType {
    public attackLimit = 3;
    private lockedTargets: Array<Target> = [];
    constructor(info: ExplosiveWeaponInfo) {
        super(info);
        this.pushNewWeaponInstance();
    }
    private clearTargets() {
        this.lockedTargets.forEach((trgt) => {
            trgt.toggleLockOn(false)
        })
        this.lockedTargets = [];
    }
    public switchFrom() {
        this.clearTargets();
    }
    public additionalSwitchFunc() {
        this.findTargets();
    }
    private findTargets() {
        bleep_pos.play();
        this.clearTargets();
        let activeTargets = game.level.targets.filter(t => t.status == Status.active && t.getLockOnStatus() == false && t.movesAtBlast);
        //  let armouredTargets = activeTargets.filter(t => t.armour === Armour.heavy);
        let sortedByArmour = activeTargets.sort((a, b) => b.armour - a.armour);

        let chosenTargets = sortedByArmour.slice(0, this.attackLimit);
        chosenTargets = chosenTargets.sort((a, b) => b.getTargetEl().getBoundingClientRect().x - a.getTargetEl().getBoundingClientRect().x);
        chosenTargets.forEach((trgt) => {
            trgt.toggleLockOn(true)
        })
        this.lockedTargets = chosenTargets;
    }
    protected playSound() {
        bleepbleep.play();
        let snd = this.sound;
        setTimeout(() => {
            RandomSoundGen.playSequentialSound(strikePrep);
            setTimeout(() => { RandomSoundGen.playRandomSound(snd); }, 300)
        }, 300)
    }

    public fireFunc(targets: Array<Target>) {
        if (this.lockedTargets.length < this.attackLimit) {
            this.findTargets();
            return
        }
        if (this.ammoCheck() === false) { return }
        this.playSound();

        let inst: weaponInstance = this.activeInstance as weaponInstance;
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
                trgt.toggleLockOn(false)
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
            }, this.speed + currentSpeedBuffer)
        })
      //  this.switchFrom();
        this.setActiveInstance();
    }
}

class ExplosionHandler {
    private static craterDecalStay: number = 15000;
    private static craterFadingTillRemoval: number = fadeAnimTime;
    public static basicExplosion(blastCenter, size, explSrc) {
        let explosion = this.setAndReturnExplosion(blastCenter, size, explSrc);
        let crater = this.setAndReturnCrater(blastCenter, size);
        this.explode(explosion, crater);
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
        ContentElHandler.fadeRemoveItem(explosion, 2000, 100);
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