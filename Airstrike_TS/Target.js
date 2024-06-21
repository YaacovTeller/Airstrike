const crashTimeout = 600;
const destroyedTargetStay = 20000;
const fadeAnimTime = 8000;
class Target {
    targetEl;
    picEl;
    damageEl;
    lockonEl;
    speed;
    armour;
    startPosition;
    status = Status.active;
    damage = Damage.undamaged;
    movesAtBlast;
    constructor(info, position) {
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter', 'smoothTransition');
        let picSrc = assetsFolder + info.picSources[RandomNumberGen.randomNumBetween(0, info.picSources.length - 1)];
        this.picEl = this.returnNewImageEl(this.targetEl, "", picSrc);
        this.damageEl = this.returnNewImageEl(this.targetEl, "");
        this.lockonEl = this.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        ContentElHandler.addToContentEl(this.targetEl);
        position ? this.setStartPos(position.X, position.Y) : this.setStartPos(this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(info.minSpeed, info.maxSpeed);
        this.armour = info.armour;
    }
    returnNewImageEl(parent, classname, src) {
        let el = document.createElement('img');
        if (src)
            el.src = src;
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
    move() {
        let x = parseInt(this.targetEl.style.left);
        if (x > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = x + this.speed + "px";
    }
    toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "target-box_green.svg" : this.lockonEl.src = assetsSVGFolder + "target-box.svg";
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
            this.move();
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
    constructor(info) {
        super(info);
        this.trail = document.createElement('div');
        this.trail.className = 'trail';
        this.targetEl.classList.remove('flexCenter'); // MESSY
        this.targetEl.classList.add('flexEnd');
        this.targetEl.classList.add('tunnelHead');
        this.picEl.classList.add('tunnelFocus');
        this.targetEl.append(this.trail);
        this.setTargetProduction();
    }
    extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    produceTargetCheck() {
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 95) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos = { X: rect.x, Y: rect.y };
            let newTarget = new VehicleTarget(regTarget, pos);
            game.targetCreation(newTarget);
        }
    }
    setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            this.produceTargetCheck();
        }, this.newTargetFrequency);
    }
    stopTargetProduction() {
        clearInterval(this.targetTimer);
    }
    hit(sev) {
        this.status = Status.disabled;
        if (sev >= strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;
            this.picEl.src = this.damagedSource;
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
            this.move();
            this.extendTunnel();
        }
    }
}
class VehicleTarget extends Target {
    destroyedSource = assetsFolder + 'fire_3.gif';
    damagedSource = assetsFolder + 'smoke_3.gif';
    badDamagedSource = assetsFolder + 'fire_1.gif';
    movesAtBlast = true;
    constructor(info, position) {
        super(info, position);
    }
    hit(sev, wepName, direc) {
        this.targetEl.classList.remove('smoothTransition');
        if (wepName == weaponNames.gun) { // JUST FOR GUN
            setTimeout(() => this.status = Status.disabled, RandomNumberGen.randomNumBetween(200, 1200));
            this.damage = Damage.damaged;
            this.damageEl.src = this.damagedSource;
            this.damageEl.classList.add('lightDamaged');
        }
        else {
            if (sev > strikeSeverity.light) {
                this.status = Status.disabled;
                this.hitAcknowledge(); /////// put with the other!!!
                //if (this.movesAtBlast) {
                //    CollisionDetection.moveAtAngle(collisionInfo);
                //}
            }
            if (sev == strikeSeverity.light) {
                this.damage != Damage.undamaged ? sev = strikeSeverity.medium : "";
                this.damage = Damage.damaged;
                this.damageEl.src = this.damagedSource;
                this.damageEl.classList.add('lightDamaged');
                this.speed = this.speed / 3;
            }
            if (sev == strikeSeverity.medium) {
                this.damage = Damage.moderateDamaged;
                this.badDamage(direc);
            }
            if (sev == strikeSeverity.heavy) {
                this.damage = Damage.heavyDamaged;
                this.badDamage(direc);
            }
            if (sev == strikeSeverity.catastrophic) {
                this.damage = Damage.destroyed;
                this.picEl.src = this.destroyedSource;
                this.picEl.className = 'destroyed';
                this.damageEl.style.visibility = "hidden";
                this.targetEl.classList.add('show');
                ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
            }
        }
    }
    hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                RandomNumberGen.randomNumBetween(1, 2) == 2 ? aluak.play() : matara.play();
            }
        }
    }
    badDamage(direc) {
        this.damageEl.src = this.badDamagedSource;
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.flip(direc);
    }
    flip(direc) {
        CollisionDetection.throw(this.targetEl, direc); // ARC
        this.picEl.classList.remove('flipforward');
        this.picEl.classList.remove('flipbackward');
        this.picEl.classList.add('flip' + direc); // ROTATION
        setTimeout(() => RandomSoundGen.playRandomSound(crashes), crashTimeout);
    }
}
//# sourceMappingURL=target.js.map