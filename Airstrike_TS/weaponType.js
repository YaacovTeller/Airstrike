class WeaponType {
    name;
    cursor;
    sound;
    imageSource;
    speed;
    cooldown;
    activeInstance;
    instances = [];
    constructor(info) {
        this.name = info.name;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
    }
    switchTo() {
        this.activeInstance = this.getAvailableInstance();
    }
    getAvailableInstance() {
        let current = this.activeInstance;
        let nextReady = null;
        for (let i in this.instances) {
            if (game) {
                game.hud.deselectInst(parseInt(i)); //MESSY?
            }
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    if (game) {
                        game.hud.selectInst(parseInt(i)); //MESSY?
                    }
                }
            }
        }
        //   let nextReady = this.instances.find(inst => inst.ready == true) || null;
        if (nextReady != null) {
            nextReady.blastRadElement.style.visibility = "visible";
        }
        //    nextReady === current ? console.log("SAME!") : console.log("DIFF!")
        return nextReady;
    }
    pushNewWeaponInstance() {
        let el = document.createElement('div');
        let inst = {
            ready: true,
            blastRadElement: el,
        };
        this.instances.push(inst);
    }
    fireFunc(targets) {
    }
    determineSeverity(fraction) {
        let severity;
        if (this.name === weaponNames.charge) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
    }
}
class ChargeWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    setHudSelect(inst) {
        this.activeInstance = this.getAvailableInstance();
        game.hud.unavailInst(this.instances.indexOf(inst));
        inst.ready = false;
        setTimeout(() => {
            inst.ready = true;
            game.hud.availInst(this.instances.indexOf(inst)); //MESSY?
            this.activeInstance = this.activeInstance == null ? this.getAvailableInstance() : this.activeInstance;
        }, this.cooldown);
    }
    fireFunc(targets) {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            console.log("hit NULL inst");
            return;
        }
        let inst = this.activeInstance;
        this.activeInstance = this.getAvailableInstance();
        let collided;
        let tunnels = targets.filter((element) => {
            return element.constructor.name === TunnelTarget.name;
        });
        for (let tunnel of tunnels) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, tunnel.getTargetEl())) {
                game.shotCount++;
                game.updateShotCounter();
                this.setHudSelect(inst);
                RandomSoundGen.playNotSoRandomSound(beeps);
                RandomSoundGen.playNotSoRandomSound(ticks);
                setTimeout(() => {
                    let severity = this.determineSeverity();
                    tunnel.hit(severity);
                    RandomSoundGen.playNotSoRandomSound(multiExplosions);
                }, this.speed);
            }
            ;
        }
    }
}
class ExplosiveWeaponType extends WeaponType {
    blastRadius;
    explosionInfo;
    constructor(info) {
        super(info);
        this.blastRadius = info.blastRadius;
        this.explosionInfo = info.explosionInfo;
        this.pushNewWeaponInstance();
    }
    pushNewWeaponInstance() {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";
        el.classList.add('circle' + this.instances.length);
        el.style.width = el.style.height = this.blastRadius * 2 + 'px';
        el.style.visibility = "hidden";
        let explosion = document.createElement('img');
        explosion.classList.add('explosion');
        ContentElHandler.addToContentEl(explosion);
        let inst = {
            ready: true,
            blastRadElement: el,
            explosion
        };
        this.instances.push(inst);
        ContentElHandler.addToContentEl(el);
    }
    fireFunc(targets) {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            console.log("hit NULL inst");
            return;
        }
        game.shotCount++;
        game.updateShotCounter();
        let inst = this.activeInstance;
        let blastRadiusEl = inst.blastRadElement;
        this.prepFire(true, inst);
        let explosion = inst.explosion;
        let blastRect = blastRadiusEl.getBoundingClientRect();
        explosion.style.width = blastRect.width + 'px';
        explosion.style.height = blastRect.height + 'px';
        let blastCenter = CollisionDetection.getXYfromPoint(blastRadiusEl);
        explosion.style.left = blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';
        this.activeInstance = this.getAvailableInstance();
        game.hud.unavailInst(this.instances.indexOf(inst));
        setTimeout(() => {
            this.explosion_targetCheck(targets, inst);
            this.prepFire(false, inst);
        }, this.speed);
        setTimeout(() => {
            inst.ready = true;
            game.hud.availInst(this.instances.indexOf(inst)); //MESSY?
            this.activeInstance = this.activeInstance == null ? this.getAvailableInstance() : this.activeInstance;
        }, this.cooldown);
    }
    explosion_targetCheck(targets, inst) {
        let explosion = inst.explosion;
        explosion.src = this.explosionInfo.imageSource + loadNewImage();
        for (let target of targets) {
            let collisionInfo = CollisionDetection.checkCollisionFromElement(inst.blastRadElement, target.getTargetEl());
            if (collisionInfo) {
                let fraction = collisionInfo.dist / collisionInfo.radius;
                let severity = this.determineSeverity(fraction);
                //   console.log("SEVERITY: "+strikeSeverity[severity]);
                this.determineExceptionsForArmour(target, severity);
                if (target.movesAtBlast) {
                    severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";
                }
                let direc = this.determineDirectionForFlip(collisionInfo);
                if (target.damage != Damage.destroyed) {
                    target.hit(severity, direc); // TARGET - Main hit function
                    this.bonusHitSound();
                }
            }
        }
    }
    determineExceptionsForArmour(target, severity) {
        let exception = false;
        if (target.armour == Armour.moderate) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                this.name < weaponNames.nuke && severity == strikeSeverity.light) {
                exception = true;
            }
        }
        if (target.armour >= Armour.heavy) {
            if (this.name < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                this.name < weaponNames.nuke && severity == strikeSeverity.medium) {
                exception = true;
            }
        }
        return exception;
    }
    determineDirectionForFlip(collisionInfo) {
        let angle = collisionInfo.angle;
        //       console.log("ANGLE: " + angle);
        let direc;
        if (angle > 300 && angle < 360 || angle > 0 && angle < 60) {
            direc = direction.forward;
        }
        else if (angle > 150 && angle < 210) {
            direc = direction.backward;
            console.log("DIREC: " + direction.backward);
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
    prepFire(bool, inst) {
        this.switchBlastIndicatorStyle(bool, inst);
        if (bool) {
            this.rippleEffect(inst);
            RandomSoundGen.playNotSoRandomSound(this.sound);
            //if (this.activeInstance != inst) {
            //    inst.blastRadElement.style.visibility = 'hidden';
            //}
            if (this.explosionInfo.sound.length) {
                setTimeout(() => RandomSoundGen.playNotSoRandomSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
            }
        }
        inst.ready = !bool;
    }
    switchBlastIndicatorStyle(bool, inst) {
        if (inst == null)
            return;
        let blastRadiusEl = inst.blastRadElement;
        if (bool) {
            blastRadiusEl.classList.remove("preFire");
            blastRadiusEl.classList.add("firing");
        }
        else {
            blastRadiusEl.classList.add("preFire");
            blastRadiusEl.classList.remove("firing");
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
    bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    }
}
//# sourceMappingURL=weaponType.js.map