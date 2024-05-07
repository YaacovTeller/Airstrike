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
    setActiveInstance() {
        this.activeInstance = this.getAvailableInstance();
        game.updateCursorPosition(); // NEEDED?
    }
    getAvailableInstance() {
        let nextReady = null;
        for (let i in this.instances) {
            game.hud.deselectInst(parseInt(i), this.name); //MESSY?
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
    pushNewWeaponInstance() {
        let el = document.createElement('div');
        let inst = {
            ready: true,
            blastRadElement: el,
        };
        this.instances.push(inst);
    }
    shotCounter() {
        game.shotCount++;
        game.updateShotCounter();
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
            game.hud.availInst(index, name); //MESSY?
            _this.activeInstance = _this.activeInstance == null ? _this.getAvailableInstance() : _this.activeInstance;
            if (_this !== game.weapon) {
                _this.activeInstance.blastRadElement.style.visibility = 'hidden';
            }
            game.updateCursorPosition(); //MESSY?
        }, _this.cooldown);
    }
    determineSeverity(fraction) {
        let severity;
        if (this.name === weaponNames.charge) {
            severity = strikeSeverity.catastrophic;
        }
        return severity;
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
            bleep_neg.play();
            return;
        }
        let inst = this.activeInstance;
        inst.ready = false;
        this.setExplosionPos(inst);
        this.prepFire(true, inst);
        this.shotCounter();
        setTimeout(() => {
            this.explosion_targetCheck(targets, inst);
            this.prepFire(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
        //    this.activeInstance = this.activeInstance == null ? this.getAvailableInstance() : this.activeInstance;
        this.cooldownTimeout(inst);
        this.activeInstance = this.getAvailableInstance();
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
    explosion_targetCheck(targets, inst) {
        let explosion = inst.explosion;
        explosion.src = this.explosionInfo.imageSource + loadNewImage();
        this.genericExplosion(inst.blastRadElement, targets);
    }
    genericExplosion(elem, targets) {
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
                    target.hit(severity, direc); // TARGET - Main hit function
                    if (target.damage < Damage.heavyDamaged) {
                        this.bonusHitSound();
                    }
                }
            }
        }
    }
    determineExceptionsForArmour(target, severity) {
        let exception = false;
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
            RandomSoundGen.playSequentialSound(this.sound);
            //if (this.activeInstance != inst) {
            //    inst.blastRadElement.style.visibility = 'hidden';
            //}
            if (this.explosionInfo.sound.length) {
                setTimeout(() => RandomSoundGen.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
            }
        }
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
    bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    }
}
class ChargeWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    fireFunc(targets) {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            bleep_neg.play();
            return;
        }
        let inst = this.activeInstance;
        this.activeInstance = this.getAvailableInstance();
        let tunnels = targets.filter((element) => {
            return element.constructor.name === TunnelTarget.name;
        });
        let hit = false;
        for (let tunnel of tunnels) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, tunnel.getTargetEl())) {
                hit = true;
                this.shotCounter();
                this.cooldownTimeout(inst);
                RandomSoundGen.playSequentialSound(beeps);
                RandomSoundGen.playSequentialSound(ticks);
                setTimeout(() => {
                    let severity = this.determineSeverity();
                    tunnel.hit(severity); // TARGET - Main hit function
                    RandomSoundGen.playSequentialSound(multiExplosions);
                }, this.speed);
            }
            ;
        }
        hit === false ? bleep_neg.play() : "";
    }
}
//# sourceMappingURL=weaponType.js.map