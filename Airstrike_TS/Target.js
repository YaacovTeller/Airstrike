class Target {
    targetEl;
    picEl;
    baseImgEl;
    damageEl;
    lockonEl;
    speed;
    armour;
    startPosition;
    status = Status.active;
    health;
    damage = Damage.undamaged;
    movesAtBlast;
    info;
    constructor(info, position) {
        this.info = info;
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter', 'smoothTransition');
        let picSrc = assetsFolder + this.picSources[RandomNumberGen.randomNumBetween(0, this.picSources.length - 1)];
        this.picEl = this.returnNewEl(this.targetEl, "picEl");
        this.baseImgEl = this.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = this.returnNewImageEl(this.targetEl, "");
        this.lockonEl = this.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        ContentElHandler.addToContentEl(this.targetEl);
        let offsetX = 50 * -1; //this.getTargetEl().clientWidth * -1;
        position ? this.setStartPos(position.X, position.Y) : this.setStartPos(offsetX);
        //        console.log("POS_X: " + this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(this.info.minSpeed, this.info.maxSpeed);
        this.armour = this.info.armour;
        //     this.health = this.info.health;
    }
    get picSources() {
        return [];
    }
    returnNewImageEl(parent, classname, src, prep) {
        let el = document.createElement('img');
        if (src)
            el.src = src;
        el.className = classname;
        prep ? parent.prepend(el) : parent.appendChild(el);
        return el;
    }
    returnNewEl(parent, classname) {
        let el = document.createElement('div');
        el.className = classname;
        //    parent.appendChild(el);
        parent.prepend(el);
        return el;
    }
    setStartPos(left, top) {
        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
        top = top ? top : window.innerHeight * this.startPosition / 100;
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    moveFromBlast(severity, collisionInfo) {
        if (this.movesAtBlast) {
            if (this.armour >= Armour.moderate) {
                collisionInfo.radius /= 2; // hack to reduce punting armour about
            }
            severity > strikeSeverity.light ? ThrowHandler.moveAtAngle(collisionInfo) : "";
        }
    }
    hit(sev, wepName, collisionInfo) { }
    move(posX) {
        if (posX > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = posX + this.speed + "px";
    }
    targetDisabled() {
        this.status = Status.disabled;
        this.transmitDestruction();
    }
    transmitDestruction() {
        game.updateHudMultiKill();
    }
    toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "lock_red.svg" + loadNewImage() : this.lockonEl.src = assetsSVGFolder + "target-box.svg";
    }
    toggleLockOn(bool) {
        bool ? this.lockonEl.style.visibility = 'visible' : this.lockonEl.style.visibility = 'hidden';
    }
    getLockOnStatus() {
        return this.lockonEl.style.visibility == 'visible' ? true : false;
    }
    getTargetEl() {
        return this.targetEl;
    }
    getPicEl() {
        return this.picEl;
    }
    action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
        }
    }
}
class TunnelTarget extends Target {
    trailBlast = assetsFolder + classicExplosion;
    damagedSource = assetsFolder + 'smoke_3.gif';
    destroyedSource = assetsFolder + 'fire_1.gif';
    movesAtBlast = false;
    targetTimer;
    newTargetFrequency = 5000;
    trail;
    constructor() {
        super(regTunnelTarget);
        this.targetEl.classList.add('smallSquare');
        this.trail = document.createElement('div');
        this.trail.className = 'trail';
        this.targetEl.classList.remove('flexCenter'); // MESSY
        this.targetEl.classList.add('flexEnd');
        this.targetEl.classList.add('tunnelHead');
        this.picEl.classList.add('tunnelFocus');
        this.targetEl.append(this.trail);
        this.setTargetProduction();
    }
    get picSources() {
        return ['trans.png'];
    }
    extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    produceTargetCheck() {
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 90) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos = { X: rect.x, Y: rect.y };
            let newTarget = new RegVehicleTarget(pos);
            RandomSoundGen.playSequentialSound(revs);
            game.targetCreation(newTarget);
        }
    }
    setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            if (game.gameTimer) {
                this.produceTargetCheck();
            }
        }, this.newTargetFrequency);
    }
    stopTargetProduction() {
        clearInterval(this.targetTimer);
    }
    hit(severity, wepName) {
        if (wepName < weaponNames.airstrike) {
            return;
        }
        this.targetDisabled();
        if (severity >= strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;
            this.baseImgEl.src = this.damagedSource;
            this.targetEl.classList.remove('tunnelHead');
            this.stopTargetProduction();
            this.blowTunnel();
        }
        else {
        }
    }
    blowTunnel() {
        let numOfimgs = parseInt(this.trail.style.width) / 175;
        let imgArr = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let img in imgArr) {
            let indexNum = parseInt(img);
            setTimeout(() => {
                let blastCenter = CollisionDetection.getXYfromPoint(imgArr[img]);
                if (indexNum == 0) {
                    ExplosionHandler.basicExplosion(blastCenter, ExplSizes.XL, assetsFolder + strikeExplosion + loadNewImage(), weaponNames.airstrike);
                }
                ExplosionHandler.basicExplosion(blastCenter, ExplSizes.small, this.trailBlast + loadNewImage(), weaponNames.mortar);
                //let mrtr: ExplosiveWeaponType = allWeaponTypes[weaponNames.mortar] as ExplosiveWeaponType // MESSY
                //if (mrtr) {
                //    mrtr.checkForTargets(pos, allTargets)
                //}
                //imgArr[index].src = 
            }, (indexNum + 1) * 150);
        }
        this.removeTunnel(imgArr.length);
    }
    removeTunnel(length) {
        this.trail.classList.add('hide');
        //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove(); }, 8000);
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
            this.extendTunnel();
        }
    }
}
class VehicleTarget extends Target {
    destroyedSource = assetsFolder + 'fire_3.gif';
    smokingSource = assetsFolder + 'smoke_3.gif';
    onFireSource = assetsFolder + 'fire_1.gif';
    wheelSource = assetsFolder + 'wheel.png';
    wheelSize;
    movesAtBlast = true;
    angle = 0;
    constructor(info, position) {
        super(info, position);
    }
    ricochetChance(num) {
        RandomNumberGen.randomNumBetween(1, 10) > num ? RandomSoundGen.playRandomSound(ricochet) : "";
    }
    incrementDamageForArmour() {
        this.damage += 1;
        this.ricochetChance(7);
    }
    hit(severity, wepName, collisionInfo) {
        let direc;
        if (collisionInfo) {
            direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
            this.moveFromBlast(severity, collisionInfo);
        }
        if (this.armour == Armour.none) {
            if (wepName == weaponNames.gun) {
                if (this.damage > Damage.undamaged) {
                    setTimeout(() => this.status = Status.disabled, RandomNumberGen.randomNumBetween(200, 1200));
                }
                else {
                    this.lightDamage();
                }
            }
            if (wepName >= weaponNames.mortar) {
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
        if (this.armour == Armour.moderate) {
            if (wepName == weaponNames.gun) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                    wepName < weaponNames.nuke && severity <= strikeSeverity.light) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        return;
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
        if (this.armour == Armour.heavy) {
            if (wepName == weaponNames.gun) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                    wepName < weaponNames.nuke && severity <= strikeSeverity.medium) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        if (this.damage == Damage.badlyDented) {
                            this.lightDamage();
                        }
                        return;
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
    }
    removeFlip(elem) {
        elem.classList.remove('flip');
        ThrowHandler.cssRotateAngle(elem, 0);
    }
    hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                RandomSoundGen.playRandomSound(acknowledge);
            }
        }
    }
    basicVehicleDamageModel(severity, direc, collisionInfo) {
        if (severity == strikeSeverity.light) {
            this.damage >= Damage.badlyDented ? severity = strikeSeverity.medium : "";
            this.lightDamage();
        }
        if (severity >= strikeSeverity.medium) {
            this.targetDisabled();
            this.hitAcknowledge(); /////// put with the other!!!
        }
        if (severity == strikeSeverity.medium) {
            this.damage = Damage.moderateDamaged;
            this.badDamage(direc);
            return;
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc);
            return;
        }
        if (severity == strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;
            this.completeDestruction(collisionInfo);
            return;
        }
    }
    lightDamage() {
        this.damage = Damage.damaged;
        this.damageEl.src = this.smokingSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    badDamage(direc) {
        this.damageEl.src = this.onFireSource + loadNewImage();
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.angle = ThrowHandler.flip(this.picEl, direc, this.targetEl, this.angle);
    }
    completeDestruction(collisionInfo) {
        this.targetEl.classList.remove('smoothTransition');
        this.targetEl.classList.add('smoothFade');
        this.removeFlip(this.picEl);
        this.baseImgEl.src = this.destroyedSource + loadNewImage();
        this.baseImgEl.className = 'destroyed';
        this.damageEl.style.visibility = "hidden";
        this.targetEl.classList.add('show');
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
    }
    returnWheel() {
        let wheel = this.returnNewEl(ContentElHandler.returnContentEl(), 'wheel');
        wheel.classList.add(this.wheelSize);
        this.returnNewImageEl(wheel, 'wheelPic', this.wheelSource);
        const rect = this.picEl.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        wheel.style.position = "absolute";
        wheel.style.left = `${x}px`;
        wheel.style.top = `${y}px`;
        allObjects.push(wheel);
        return wheel;
    }
    lightOnFire(elem) {
        this.returnNewImageEl(elem, 'wheelFire', this.onFireSource, true);
    }
    castWheel(className) {
        let wheel = this.returnWheel();
        wheel.classList.add(className);
        //     ContentElHandler.fadeRemoveItem(wheel, itemStay, fadeAnimTime);
        return wheel;
    }
    rollWheel() {
        this.castWheel("rollWheel");
    }
    throwWheel(direc) {
        let wheel = this.castWheel("throwWheel");
        this.lightOnFire(wheel);
        let wheelPic = wheel.querySelector(".wheelPic");
        ThrowHandler.flip(wheelPic, direc, wheel);
    }
}
class RegVehicleTarget extends VehicleTarget {
    wheelSize = "smallWheel";
    constructor(position) {
        super(regTarget, position);
        this.targetEl.classList.add('smallSquare');
    }
    get picSources() {
        return ['jeep__.png', 'jeep__light.png', 'jeep__grey.png', 'jeep2__.png', 'jeep2__light.png', 'Jeep2__lightgrey.png', 'jeep2__tan.png']; // 'jeep2__grey.png', 
        //  return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor(position) {
        super(modTarget, position);
        this.targetEl.classList.add('medRectTarget');
    }
    get picSources() {
        return ['truck__tan2.png', 'truck__green.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor(position) {
        super(heavyTarget, position);
        this.targetEl.classList.add('medRectTarget');
    }
    get picSources() {
        return ['truck__grey.png'];
    }
}
class RocketLauncher extends VehicleTarget {
    wheelSize = "medWheel";
    stopPos;
    deployed = false;
    launcherEl;
    noStrikeZone;
    constructor(position) {
        super(rocketLauncher, position);
        this.targetEl.classList.add('medRectTarget');
        this.stopPos = RandomNumberGen.randomNumBetween(50, 200);
        this.launcherEl = this.returnNewImageEl(this.picEl, 'rocketPack', assetsFolder + "rockets.png");
    }
    get picSources() {
        return ['launcher.png'];
        // return ['rocketVehicle.jpg'];
        //   picSources: ['rocketVehicle_undeployed.jpg']
    }
    move() {
        let x = parseInt(this.targetEl.style.left);
        this.targetEl.style.left = x + this.speed + "px";
    }
    hit(severity, wepName, collisionInfo) {
        super.hit(severity, wepName, collisionInfo);
        if (this.damage > Damage.badlyDented) {
            if (this.noStrikeZone) {
                this.removeNoStrikeZone();
            }
        }
        if (this.damage > Damage.damaged) {
            //this.flip(this.launcherEl, direc)
            //this.launcherEl.remove();
            this.throwRocketPack();
        }
    }
    throwRocketPack() {
        let pack = this.launcherEl;
        const rect = pack.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        pack.remove();
        pack.style.position = "absolute";
        pack.style.left = `${x}px`;
        pack.style.top = `${y}px`;
        ContentElHandler.addToContentEl(pack);
        allObjects.push(pack);
        ThrowHandler.flip(pack, direction.backward); /////////////////////////////////////////////////////////////////
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out'; }, itemStay); // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, itemStay, fadeAnimTime);
    }
    inNoStrikeZone(target) {
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z;
                //if (CollisionDetection.checkCollisionWithElement(target.getTargetEl(), zone)) {
                if (CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl())) {
                    return true;
                }
            }
        }
        return false;
    }
    action() {
        if (this.status == Status.active) {
            let posX = parseInt(this.targetEl.style.left);
            if (posX < this.stopPos || this.inNoStrikeZone(this) && this.deployed == false) {
                this.move();
            }
            else {
                if (this.damage < Damage.badlyDented && this.deployed == false) {
                    this.deploy();
                    this.deployed = true;
                }
            }
        }
        else {
            if (this.noStrikeZone) {
                console.log("Hit ACTION nostrikezone remove");
                this.removeNoStrikeZone();
            }
        }
        //if (this.damage > Damage.badlyDented) {
        //    this.noStrikeZone.remove();
        //}
    }
    deploy() {
        let delay = 500;
        let _this = this;
        setTimeout(() => {
            activate.play();
            _this.launcherEl.classList.add('raiseLauncher');
        }, delay);
        setTimeout(() => {
            _this.setNoStrikeZone();
        }, delay + 500);
    }
    setNoStrikeZone() {
        this.noStrikeZone = this.returnNewEl(this.targetEl, 'noStrikeZone');
        this.noStrikeZone.addEventListener('mouseover', this.overNoStrikeZone.bind(this));
        this.noStrikeZone.addEventListener('mouseleave', this.leaveNoStrikeZone.bind(this));
    }
    removeNoStrikeZone() {
        this.noStrikeZone.remove();
        this.noStrikeZone = null;
    }
    overNoStrikeZone() {
        game.strikesRestricted = true;
    }
    leaveNoStrikeZone() {
        game.strikesRestricted = false;
    }
}
//# sourceMappingURL=target.js.map