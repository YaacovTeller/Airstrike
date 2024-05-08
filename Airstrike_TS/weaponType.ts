class WeaponType {
    public name: weaponNames;
    public cursor: string;
    public sound: Array<Sound>;
    public imageSource: string;
    public speed: number;
    public cooldown: number;
    public craterDecalStay: number = 5000;
    public craterFadingTillRemoval: number = 5000;


    public activeInstance: weaponInstance;
    public instances: Array<weaponInstance> = [];

    constructor(info: weaponInfo) {
        this.name = info.name;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
    }
    public setActiveInstance() {
        this.activeInstance = this.getAvailableInstance();
        game.updateCursorPosition(); // NEEDED?
    }

    public getAvailableInstance() {
        let nextReady: weaponInstance = null;
        for (let i in this.instances) {
            game.hud.deselectInst(parseInt(i), this.name) //MESSY?
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    game.hud.selectInst(parseInt(i), this.name); //MESSY?
                }
            }
        }
        if (nextReady != null) {
            nextReady.blastRadElement.style.visibility = "visible";
        }
        return nextReady;
    }

    public pushNewWeaponInstance() {
        let el = document.createElement('div');
        let inst: weaponInstance = {
            ready: true,
            blastRadElement: el,
        };
        this.instances.push(inst);
    }
    protected shotCounter() {
        game.shotCount++
        game.updateShotCounter();
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


    protected determineSeverity(fraction?: number) {
        let severity: strikeSeverity;
                if (this.name === weaponNames.charge) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }
}


class ExplosiveWeaponType extends WeaponType {
    public blastRadius: number;

    private explosionInfo: explosionInfo;

    constructor(info: ExplosiveWeaponInfo) {
        super(info);

        this.blastRadius = info.blastRadius;
        this.explosionInfo = info.explosionInfo;

        this.pushNewWeaponInstance();
    }

    public pushNewWeaponInstance() {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";

        el.classList.add('circle' + this.instances.length);
        el.style.width = el.style.height = this.blastRadius * 2 + 'px';
        el.style.visibility = "hidden";

        let explosion = this.returnNewImageEl("explosion");

        let inst: ExplosiveWeaponInstance = {
            ready: true,
            blastRadElement: el,
            explosion
        };
        this.instances.push(inst);
        ContentElHandler.addToContentEl(el);
    }

    public fireFunc(targets: Array<Target>) {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            console.log("hit NULL inst");
            bleep_neg.play();
            return;
        }

        let inst: ExplosiveWeaponInstance = this.activeInstance as ExplosiveWeaponInstance;
        inst.ready = false;

        this.setExplosionPos(inst);
        this.prepFire(true, inst);

        this.shotCounter();
        let crater = this.setAndReturnCrater(inst);

        setTimeout(() => {
            this.explosion_targetCheck(targets, inst, crater);
            this.prepFire(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);

        this.cooldownTimeout(inst);
        this.activeInstance = this.getAvailableInstance();
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

    private explosion_targetCheck(targets: Array<Target>, inst: ExplosiveWeaponInstance, crater: HTMLImageElement) {
        let explosion = inst.explosion;
        explosion.src = this.explosionInfo.imageSource + loadNewImage();
        crater.style.visibility = "visible";
        setTimeout(() => {
            crater.classList.add("fadeOut");
        }, this.craterDecalStay)
        setTimeout(() => {
            ContentElHandler.removeFromContentEl(crater);
        }, this.craterDecalStay + this.craterFadingTillRemoval)

        this.genericExplosion(inst.blastRadElement, targets);
    }

    public genericExplosion(elem: HTMLElement, targets: Array<Target>) {
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
                    if (target.damage < Damage.heavyDamaged) {
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
                exception = true;
            }
        }
        if (target.armour >= Armour.heavy) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                this.name < weaponNames.nuke && severity <= strikeSeverity.medium) {
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
            console.log("DIREC: " + direction.backward);
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
    private prepFire(bool: boolean, inst: ExplosiveWeaponInstance) {
        this.switchBlastIndicatorStyle(bool, inst);
        if (bool) {
            this.rippleEffect(inst);
            RandomSoundGen.playSequentialSound(this.sound);
            //if (this.activeInstance != inst) {
            //    inst.blastRadElement.style.visibility = 'hidden';
            //}
            if (this.explosionInfo.sound.length) {
                setTimeout(() => RandomSoundGen.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
            }
        }
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
    private bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    }
}

class ChargeWeaponType extends WeaponType {
    constructor(info: weaponInfo) {
        super(info);
        this.pushNewWeaponInstance();
    }

    public fireFunc(targets: Array<Target>) {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            bleep_neg.play();
            return;
        }

        let inst: weaponInstance = this.activeInstance as weaponInstance;
        this.activeInstance = this.getAvailableInstance();
        
        let tunnels: Array<TunnelTarget> = targets.filter((element): element is TunnelTarget => {
            return element.constructor.name === TunnelTarget.name;
        });
        let hit: boolean = false;
        for (let tunnel of tunnels) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, tunnel.getTargetEl())) {
                hit = true;
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
        hit === false ? bleep_neg.play(): "";
    }
}