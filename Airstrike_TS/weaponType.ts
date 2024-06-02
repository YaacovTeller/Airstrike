class WeaponType {
    public name: weaponNames;
    public cursor: string;
    public sound: Array<Sound>;
    public imageSource: string;
    public speed: number;
    public cooldown: number;
    public craterDecalStay: number = 10000;
    public craterFadingTillRemoval: number = 8000;
    public noAmmo: Sound;

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

        allWeaponTypes[this.name -1] = this
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
        let el = this.returnBlastRadiusDiv(10);
        let inst: weaponInstance = {
            ready: true,
            blastRadElement: el,
        };
        this.instances.push(inst);
        game.redrawHudWithWepSelectionChecked();
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
            if (_this !== game.weapon) {
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
        if (this.name === weaponNames.tunnelcharge) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }

    protected bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    }
}

class BulletWeaponType extends WeaponType {
    constructor(info: weaponInfo) {
        super(info);
        this.pushNewWeaponInstance();

    }

    public fireFunc(targets: Array<Target>) {
        if (this.ammoCheck() === false) { return }

        RandomSoundGen.playSequentialSound(this.sound);
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
                    target.hit(severity, direction.forward); // TARGET - Main hit function
                    if (target.status == Status.active) {
                        this.bonusHitSound();
                    }
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
    private explosionInfo: explosionInfo;

    constructor(info: ExplosiveWeaponInfo) {
        super(info);
        this.explosionInfo = info.explosionInfo;
        this.blastRadius = info.blastRadius;

        this.pushNewWeaponInstance();
    }

    public pushNewWeaponInstance() {
        let el = this.returnBlastRadiusDiv(this.blastRadius);
        this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";
        let explosion = this.returnNewImageEl("explosion");

        let inst: ExplosiveWeaponInstance = {
            ready: true,
            blastRadElement: el,
            explosion
        };
        this.instances.push(inst);
        game.redrawHudWithWepSelectionChecked();
    }

    public getAvailableInstance() {
        let nextReady: weaponInstance = null;
        nextReady = this.searchInstances(nextReady);
        this.setBlastRadVisible(nextReady);
        return nextReady;
    }

    public fireFunc(targets: Array<Target>) {
        if (this.ammoCheck() === false) { return }
        RandomSoundGen.playSequentialSound(this.sound);
        this.shotCounter();

        let inst: ExplosiveWeaponInstance = this.activeInstance as ExplosiveWeaponInstance;
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

    private setExplosionPos(inst: ExplosiveWeaponInstance) {
        let blastRadiusEl = inst.blastRadElement;
        let explosion = inst.explosion;
        let blastRect = blastRadiusEl.getBoundingClientRect();

        explosion.style.width = blastRect.width + 'px';
        explosion.style.height = blastRect.height + 'px';

        let blastCenter = CollisionDetection.getXYfromPoint(blastRadiusEl);
        explosion.style.left =  blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';
    }
    private setAndReturnCrater(inst: ExplosiveWeaponInstance) {
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

    private returnNewImageEl(classname: string, src?: string) {
        let el = document.createElement('img');
        if (src) el.src = src;
        el.className = classname;
        ContentElHandler.addToContentEl(el);
        return el;
    }

    private explosion(inst: ExplosiveWeaponInstance, crater: HTMLImageElement) {
        let explosion = inst.explosion;
        explosion.src = this.explosionInfo.imageSource + loadNewImage();
        crater.style.visibility = "visible";
        setTimeout(() => {
            crater.classList.add("hide");
        }, this.craterDecalStay)
        setTimeout(() => {
            ContentElHandler.removeFromContentEl(crater);
        }, this.craterDecalStay + this.craterFadingTillRemoval)
    }

    public checkForTargets(elem: HTMLElement, targets: Array<Target>) {
        for (let target of targets) {
            let collisionInfo: vectorMoveObj = CollisionDetection.checkCollisionFromElement(elem, target.getTargetEl());
            if (collisionInfo) {
                let fraction = collisionInfo.dist / collisionInfo.radius;
                let severity: strikeSeverity = this.determineSeverity(fraction);

                if (this.determineExceptionsForArmour(target, severity)) {
                    continue
                };
                if (target.movesAtBlast) {
                    severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";
                }
                let direc: direction = this.determineDirectionForFlip(collisionInfo);

                if (target.damage != Damage.destroyed) {
                    target.hit(severity, direc); // TARGET - Main hit function
                    if (target.status == Status.active) {
                        this.bonusHitSound();
                    }
                }
            }
        }
    }

    private determineExceptionsForArmour(target: Target, severity: strikeSeverity) {
        let exception: boolean = false;
        if (target.armour == Armour.moderate) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                this.name < weaponNames.nuke && severity <= strikeSeverity.light) {
                RandomSoundGen.playRandomSound(ricochet);
                exception = true;
            }
        }
        if (target.armour >= Armour.heavy) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                this.name < weaponNames.nuke && severity <= strikeSeverity.medium) {
                RandomSoundGen.playRandomSound(ricochet);
                exception = true;
            }
        }
        if (target.movesAtBlast === false) {
            if (this.name < weaponNames.airstrike) {
                exception = true;
            }
        }
        return exception
    }
    private determineDirectionForFlip(collisionInfo: vectorMoveObj) {
        let angle = collisionInfo.angle;
        //       console.log("ANGLE: " + angle);

        let direc: direction;
        if (angle > 300 && angle < 360 || angle > 0 && angle < 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle < 210) {
            direc = direction.backward;
      //      console.log("DIREC: " + direction.backward);
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

    public switchBlastIndicatorStyle(bool: boolean, inst: ExplosiveWeaponInstance) {
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

    private rippleEffect(inst: ExplosiveWeaponInstance) {
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
        this.pushNewWeaponInstance();
        this.pushNewWeaponInstance();

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
                hit = true;
                inst.ready = false;

                this.shotCounter();
                this.cooldownTimeout(inst);
                RandomSoundGen.playSequentialSound(beeps);
                RandomSoundGen.playSequentialSound(ticks);
                setTimeout(() => {
                    let severity = this.determineSeverity();
                    tunnel.hit(severity);       // TARGET - Main hit function
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed)
            };
        }
        hit === false ? bleep_neg.play() : "";
        this.setActiveInstance();

    }
}