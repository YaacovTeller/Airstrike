
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

        if (this.name < weaponNames.flare) {
            allWeaponTypes[this.name - 1] = this
        }
        else {
            extraWeaponTypes[this.name - 1] = this
        }
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

    public fireFunc() {

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
        if (this.name == weaponNames.flare && game.level.currentWave.timeOfDay != Time.day) return false   // VERY MESSY
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            this.noAmmo.play();
            return false;
        }
        else return true
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

    public fireFunc() {
        if (this.ammoCheck() === false) { return }

        this.playSound();
        let inst: weaponInstance = this.activeInstance as weaponInstance;
        inst.ready = false;
        this.shotCounter();

        setTimeout(() => {
            this.checkForTargets_instantHit()
        }, this.speed);

        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    protected determineSeverity() {
        let severity: strikeSeverity = strikeSeverity.light
        return severity
    }
    public checkForTargets_instantHit() {
        
        for (let target of allTargets) {
            
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, target.getPicEl())) {
                let severity: strikeSeverity = this.determineSeverity();
                if (this.determineExceptionsForArmour(target, severity)) {
                    continue
                };

                if (target.damage != Damage.destroyed) {
                    target.hit(severity, this.name); // TARGET - Main hit function
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

    public fireFunc() {
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

        this.fireResultsTimeout(inst);

        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    protected fireResultsTimeout(inst: weaponInstance) {
        setTimeout(() => {
            let blastCenter: position = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource, this.name);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
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
class Flare extends ExplosiveWeaponType {
    constructor(info: ExplosiveWeaponInfo) {
        super(info);
    }
    protected fireResultsTimeout(inst: weaponInstance) {
        setTimeout(() => {
            let blastCenter: position = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.createFlare(blastCenter, this.explosionInfo.size,);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
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

    public fireFunc() {
        if (this.ammoCheck() === false) { return }

        let inst: weaponInstance = this.activeInstance as weaponInstance;

        let tunnels: Array<TunnelTarget> = allTargets.filter((trgt): trgt is TunnelTarget => {
            return trgt.constructor.name === TunnelTarget.name && trgt.getLockOnStatus() == false;
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

                    tunnel.hit(strikeSeverity.catastrophic, this.name);       // TARGET - Main hit function
                    tunnel.toggleLockOn(false);
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed)
            };
        }
        hit === false ? bleep_neg.play() : "";
        this.setActiveInstance();

    }
}
function inNoStrikeZone(target: Target) {  // FOR TESTING
    let noStrikeZones = document.querySelectorAll(".noStrikeZone");
    if (noStrikeZones) {
        for (let z of noStrikeZones) {
            let zone = z as HTMLElement
            console.log(CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl()))
        }
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
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z as HTMLElement
                activeTargets = activeTargets.filter(t => CollisionDetection.checkCollisionWithElement(t.getTargetEl(), zone) == false);
            }
        }
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

    public fireFunc() {
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
                ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource, this.name);
            //    this.checkForTargets(blastCenter, allTargets);
            }, this.speed + currentSpeedBuffer)
        })
        this.setActiveInstance();
    }
}
