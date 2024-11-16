class Target {
    targetEl;
    picEl;
    baseImgEl;
    damageEl;
    lockonEl;
    speed;
    armour;
    //    protected picSources: Array<string>;
    startPosition;
    status = Status.active;
    health;
    damage = Damage.undamaged;
    movesAtBlast;
    info;
    constructor(info, position) {
        this.info = info;
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'smallSquare', 'flexCenter', 'smoothTransition');
        let picSrc = assetsFolder + this.picSources[RandomNumberGen.randomNumBetween(0, this.picSources.length - 1)];
        this.picEl = this.returnNewEl(this.targetEl, "picEl");
        this.baseImgEl = this.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = this.returnNewImageEl(this.targetEl, "");
        this.lockonEl = this.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        ContentElHandler.addToContentEl(this.targetEl);
        position ? this.setStartPos(position.X, position.Y) : this.setStartPos(this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(this.info.minSpeed, this.info.maxSpeed);
        this.armour = this.info.armour;
        //     this.health = this.info.health;
    }
    get picSources() {
        return [];
    }
    returnNewImageEl(parent, classname, src) {
        let el = document.createElement('img');
        if (src)
            el.src = src;
        el.className = classname;
        parent.appendChild(el);
        return el;
    }
    returnNewEl(parent, classname) {
        let el = document.createElement('div');
        el.className = classname;
        parent.appendChild(el);
        return el;
    }
    setStartPos(left, top) {
        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
        top = top ? top : window.innerHeight * this.startPosition / 100;
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    hit(sev, wepName, direc) { }
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
    trailBlast = assetsFolder + 'expl1.gif';
    damagedSource = assetsFolder + 'smoke_3.gif';
    destroyedSource = assetsFolder + 'fire_1.gif';
    movesAtBlast = false;
    targetTimer;
    newTargetFrequency = 5000;
    trail;
    constructor() {
        super(regTunnelTarget);
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
    removeTunnel(length) {
        this.trail.classList.add('hide');
        //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove(); }, 8000);
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    blowTunnel() {
        let numOfimgs = parseInt(this.trail.style.width) / 100;
        let imgArr = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let index in imgArr) {
            setTimeout(() => {
                let mrtr = allWeaponTypes[weaponNames.mortar]; // MESSY
                if (mrtr) {
                    let pos = CollisionDetection.getXYfromPoint(imgArr[index]);
                    mrtr.checkForTargets(pos, allTargets);
                }
                imgArr[index].src = this.trailBlast + loadNewImage();
            }, (parseInt(index) + 1) * 150);
        }
        this.removeTunnel(imgArr.length);
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
    damagedSource = assetsFolder + 'smoke_3.gif';
    badDamagedSource = assetsFolder + 'fire_1.gif';
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
    hit(severity, wepName, direc) {
        this.targetEl.classList.remove('smoothTransition');
        this.targetEl.classList.add('smoothFade');
        if (this.armour == Armour.none) {
            if (wepName == weaponNames.gun) {
                setTimeout(() => this.status = Status.disabled, RandomNumberGen.randomNumBetween(200, 1200));
                this.lightDamage();
            }
            if (wepName >= weaponNames.mortar) {
                this.basicVehicleDamageModel(severity, direc);
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
                this.basicVehicleDamageModel(severity, direc);
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
                this.basicVehicleDamageModel(severity, direc);
            }
        }
    }
    removeFlip(elem) {
        elem.classList.remove('flip');
        this.cssRotateAngle(elem, 0);
    }
    hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                RandomSoundGen.playRandomSound(acknowledge);
            }
        }
    }
    lightDamage() {
        this.damage = Damage.damaged;
        this.damageEl.src = this.damagedSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    badDamage(direc) {
        this.damageEl.src = this.badDamagedSource + loadNewImage();
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.flip(this.picEl, direc, this.targetEl);
    }
    completeDestruction() {
        this.removeFlip(this.picEl);
        this.baseImgEl.src = this.destroyedSource + loadNewImage();
        this.baseImgEl.className = 'destroyed';
        this.damageEl.style.visibility = "hidden";
        this.targetEl.classList.add('show');
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    basicVehicleDamageModel(severity, direc) {
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
            this.completeDestruction();
            return;
        }
    }
    flip(elem, direc, parentElem) {
        let thrownElem = parentElem ? parentElem : elem;
        CollisionDetection.throw(thrownElem, direc); // ARC
        this.rotate(elem, direc); // ROTATION
        setTimeout(() => {
            RandomSoundGen.playRandomSound(crashes);
        }, crashTimeout);
    }
    rotate(elem, direc) {
        const angles = [-720, -560, -360, -200, 0, 160, 360, 520, 720];
        const index = angles.indexOf(this.angle);
        let rand = RandomNumberGen.randomNumBetween(0, 20);
        let increment = 1;
        if (rand > 18) {
            increment++;
        }
        let deg = direc == direction.forward ? angles[index + increment] : angles[index - increment];
        if (deg == undefined) {
            deg = 0;
            this.angle = deg;
            elem.classList.remove('flip');
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this.cssRotateAngle(elem, deg);
                    elem.offsetHeight; // forces reflow
                    this.rotate(elem, direc);
                }, 0);
            });
        }
        else {
            this.angle = deg;
            elem.classList.add('flip');
            this.cssRotateAngle(elem, deg);
        }
    }
    cssRotateAngle(elem, deg) {
        elem.style.transform = `rotate(${deg}deg)`;
    }
}
class RegVehicleTarget extends VehicleTarget {
    constructor(position) {
        super(regTarget, position);
    }
    get picSources() {
        return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    constructor(position) {
        super(modTarget, position);
    }
    get picSources() {
        return ['jeep_grey.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    constructor(position) {
        super(heavyTarget, position);
    }
    get picSources() {
        return ['jeep_grey_armour.png'];
    }
}
class RocketLauncher extends VehicleTarget {
    stopPos;
    deployed = false;
    launcherEl;
    noStrikeZone;
    constructor(position) {
        super(rocketLauncher, position);
        this.targetEl.classList.remove('smallSquare');
        this.targetEl.classList.add('medRect');
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
    hit(severity, wepName, direc) {
        super.hit(severity, wepName, direc);
        if (this.damage > Damage.badlyDented) {
            if (this.noStrikeZone) {
                this.noStrikeZone.remove();
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
        this.flip(pack, direction.backward); /////////////////////////////////////////////////////////////////
        let packStay = 2000;
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out'; }, packStay); // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, packStay, fadeAnimTime);
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
                this.noStrikeZone.remove();
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
    overNoStrikeZone() {
        game.strikesRestricted = true;
    }
    leaveNoStrikeZone() {
        game.strikesRestricted = false;
    }
}
//# sourceMappingURL=target.js.map