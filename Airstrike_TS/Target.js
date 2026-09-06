const buildingSources = {
    W1: "Warehouse_blue",
    W2: "Warehouse_brown",
    //   H1: "house_1",
};
class Building {
    targetEl;
    picEl;
    baseImgEl;
    damageEl;
    damage = Damage.undamaged;
    picSrc; // = assetsFolder + "house_1.png";
    constructor() {
        //   let picSrc = assetsFolder + "buildings_1.png";
        let picSrc = assetsFolder + "buildings/" + this.getSource();
        this.targetEl = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "building");
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "", "", true);
        allTargets.push(this);
    }
    reAssignSrc() {
        this.baseImgEl.src = this.getSource();
    }
    getSource() {
        let src;
        if (this.picSrc) {
            src = this.picSrc;
        }
        else {
            const keys = Object.keys(buildingSources);
            const randomIndex = RandomNumberGen.randomNumBetween(0, keys.length - 1);
            const randomKey = keys[randomIndex];
            src = buildingSources[randomKey];
        }
        let num;
        switch (this.damage) {
            case Damage.undamaged:
                num = 1;
                break;
            case Damage.dented:
            case Damage.badlyDented:
            case Damage.damaged:
                num = 2;
                break;
            case Damage.moderateDamaged:
            case Damage.heavyDamaged:
            case Damage.destroyed:
                num = 3;
                break;
            default:
                num = 1;
                break;
        }
        return `${src}_${num}.png`;
    }
    setPosition(position) {
        let x, y;
        x = position.X;
        y = position.Y;
        this.setStartPos(x, y);
    }
    setStartPos(left, top) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    hit(severity, wepName, collisionInfo) {
        this.damage = Damage.damaged;
        this.reAssignSrc();
    }
    getTargetEl() {
        return this.targetEl;
    }
}
class Target {
    targetEl;
    picEl;
    baseImgEl;
    damageEl;
    //  protected damageEl: HTMLImageElement;
    lockonEl;
    destroyedSource = assetsFolder + 'fire_3.gif';
    onFireSource = assetsFolder + 'fire_1.gif';
    smokingSource = assetsFolder + 'smoke_3.gif';
    player;
    //   protected damagedSource: Array<string> = smoke_Frames;
    speed;
    armour;
    startPosition;
    status = Status.active;
    health;
    damage = Damage.undamaged;
    movesAtBlast;
    info;
    constructor(info) {
        this.info = info;
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter', 'smoothTransition');
        let picSrc = assetsFolder + RandomNumberGen.returnRandomFromArray(this.picSources);
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = ElementCreator.returnNewCanvas(this.targetEl, "smallSquare", true);
        //   this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "smallSquare");
        this.lockonEl = ElementCreator.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        this.player = new CanvasGifPlayer(this.damageEl);
        ContentElHandler.addToContentEl(this.targetEl);
        //        console.log("POS_X: " + this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(this.info.minSpeed, this.info.maxSpeed);
        this.armour = this.info.armour;
        //     this.health = this.info.health;
    }
    get picSources() {
        return [];
    }
    decidePosition(pos) {
        let x, y;
        if (pos) {
            x = pos.X;
            y = pos.Y;
        }
        else {
            x = this.getTargetEl().clientWidth * -1;
            this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
            y = window.innerHeight * this.startPosition / 100;
        }
        this.setPosition(x, y);
    }
    returnPosition() {
        let pos = { X: parseInt(this.targetEl.style.left), Y: parseInt(this.targetEl.style.top) };
        return pos;
    }
    setPosition(left, top) {
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
            game.updateKillStats(killStatDisplayOptions.escaped);
        }
        this.targetEl.style.left = posX + this.speed + "px";
    }
    targetDisabled() {
        if (this.status != Status.disabled) {
            this.status = Status.disabled;
            game.updateKillStats(killStatDisplayOptions.disabled);
        }
    }
    targetDestroyed(priorStatus) {
        this.damage = Damage.destroyed;
        game.updateKillStats(killStatDisplayOptions.destroyed);
        if (priorStatus == Status.disabled) {
            game.updateKillStats(killStatDisplayOptions.disabled, -1);
        }
        this.removeFromArray();
    }
    removeFromArray() {
        setTimeout(() => {
            let arr = allTargets;
            let index = arr.indexOf(this);
            if (index >= 0) {
                arr.splice(index, 1);
            }
        }, damagedTargetStay + fadeAnimTime);
    }
    destructionBits() { }
    returnBit(imageSrc, parentClass, childClass) {
        let bit = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), parentClass);
        ElementCreator.returnNewImageEl(bit, childClass, imageSrc);
        this.positionBit(bit);
        allObjects.push(bit);
        ContentElHandler.fadeRemoveItem(bit, itemStay, fadeAnimTime, allObjects);
        return bit;
    }
    positionBit(bit) {
        const rect = this.picEl.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        bit.style.position = "absolute";
        bit.style.left = `${x}px`;
        bit.style.top = `${y}px`;
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
    //protected trailBlast: string = assetsFolder + classicExplosion;
    damagedSource = assetsFolder + 'smoke_3.gif';
    //protected destroyedSource: string = assetsFolder + 'fire_1.gif';
    trailBlast = expl_small_imgs;
    //  protected destroyedSource: Array<string> = fire_1_frames;
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
            let newTarget = new RegVehicleTarget();
            //     newTarget.setPosition(rect.x, rect.y);
            game.targetCreation(newTarget, pos);
            SoundPlayer.playSequentialSound(revs);
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
        let priorStatus = this.status;
        this.targetDisabled();
        if (severity >= strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
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
                    ExplosionHandler.basicExplosion(blastCenter, ExplSizes.XL, expl_med_imgs, weaponNames.airstrike);
                }
                ExplosionHandler.basicExplosion(blastCenter, ExplSizes.small, this.trailBlast, weaponNames.mortar);
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
    wheelSource = assetsFolder + 'wheel.png';
    wheelSizeClass;
    movesAtBlast = true;
    angle = 0;
    constructor(info) {
        super(info);
    }
    ricochetChance(num) {
        RandomNumberGen.randomNumBetween(1, 10) > num ? SoundPlayer.playRandomSound(ricochet) : "";
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
            if (wepName == weaponNames.sniper) {
                if (this.damage > Damage.undamaged) {
                    setTimeout(() => this.targetDisabled(), RandomNumberGen.randomNumBetween(200, 1200));
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
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.light) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        return;
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
        if (this.armour == Armour.heavy) {
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.medium) {
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
                SoundPlayer.playRandomSound(acknowledge);
            }
        }
    }
    basicVehicleDamageModel(severity, direc, collisionInfo) {
        let priorStatus = this.status;
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
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc);
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
        if (severity == strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.completeDestruction(collisionInfo);
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
    }
    lightDamage() {
        if (this.damage >= Damage.moderateDamaged) {
            return;
        }
        this.damage = Damage.damaged;
        this.smoking();
        //       this.damageEl.src = this.smokingSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    playGifPlayer(frames, bool) {
        this.player.pause();
        this.player.play(frames, bool);
    }
    addSrc(src) {
        //return src + loadNewImage();
        return src;
    }
    smoking() {
        this.playGifPlayer(smoke_imgs, true);
        //this.player.pause();
        //this.player.play(smoke_frames, true);
        //   this.damageEl.src = this.addSrc(this.smokingSource);
    }
    pushFire(lightArr, blastCenter, explSize) {
        lightID++;
        let light = { id: lightID, pos: blastCenter, opac: 1, size: explSize, fading: false, parent: this.getTargetEl() };
        lightArr.push(light);
    }
    badDamage(direc) {
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.playGifPlayer(fire_1_imgs, true);
            //        this.playGifPlayer(fire_1_frames, true)
            //        this.damageEl.src = this.addSrc(this.onFireSource);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.pushFire(fires, this.returnPosition(), ExplSizes.XL);
        setTimeout(() => {
            if (RandomNumberGen.randomNumBetween(0, 10) >= 8 && this.damageEl.classList.contains("badDamaged")) {
                this.completeDestruction();
            }
        }, itemStay / 2 + RandomNumberGen.randomNumBetween(0, 3000));
        setTimeout(() => {
            this.damageEl.classList.remove('badDamaged');
            this.damageEl.classList.add('lightDamaged');
            this.smoking();
        }, fireStay + RandomNumberGen.randomNumBetween(0, 3000));
        if (direc) {
            this.angle = ThrowHandler.flip(this.picEl, direc, crashes, this.targetEl, this.angle);
        }
        ContentElHandler.fadeRemoveItem(this.targetEl, damagedTargetStay, fadeAnimTime);
        this.removeFromArray();
    }
    completeDestruction(collisionInfo) {
        this.targetEl.classList.remove('smoothTransition');
        this.targetEl.classList.add('smoothFade');
        this.removeFlip(this.picEl);
        this.baseImgEl.src = this.addSrc(this.destroyedSource);
        this.baseImgEl.className = 'destroyed';
        this.damageEl.style.visibility = "hidden";
        this.targetEl.classList.add('show');
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
        SoundPlayer.playRandomSound(explosions);
        this.destructionBits();
    }
    lightOnFire(elem) {
        ElementCreator.returnNewImageEl(elem, 'wheelFire', this.onFireSource, true);
    }
    rollWheel() {
        let wheel = this.createWheel();
        wheel.classList.add("rollWheel");
    }
    createWheel() {
        let wheel = this.returnBit(this.wheelSource, "wheel", "wheelPic");
        wheel.classList.add(this.wheelSizeClass);
        return wheel;
    }
    throwWheel(direc) {
        let wheel = this.createWheel();
        this.lightOnFire(wheel);
        let wheelPic = wheel.querySelector(".wheelPic");
        ThrowHandler.flip(wheelPic, direc, null, wheel);
    }
    destructionBits() {
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
    }
}
class WaterVehicleTarget extends VehicleTarget {
    constructor() {
        super(boatTarget);
        this.targetEl.classList.add('longTarget');
    }
    createScrap() {
        return this.returnBit("bit.png", "wheel", "wheelPic");
    }
    throwBit(direc) {
        let bit = this.createScrap();
        ThrowHandler.flip(bit, direc, null);
    }
    destructionBits() {
        this.throwBit(direction.forward);
        this.throwBit(direction.backward);
    }
    get picSources() {
        return ['ship1.png'];
    }
    decidePosition() {
        let x, y;
        let randX = RandomNumberGen.randomNumBetween(10, 90);
        let randY = RandomNumberGen.randomNumBetween(10, 90);
        y = window.innerHeight * randY / 100;
        x = game.waterWidth + window.innerWidth / 3 * randX / 100;
        let water = document.getElementById("water");
        let pos = { X: x, Y: y };
        if (CollisionDetection.checkCollisionFromPosition(pos, water)) {
            this.setPosition(x, y);
        }
        else {
            console.log("none-water boat position");
            this.decidePosition();
        }
    }
}
class RegVehicleTarget extends VehicleTarget {
    wheelSizeClass = "smallWheel";
    constructor() {
        super(regTarget);
        this.targetEl.classList.add('smallSquare');
    }
    get picSources() {
        return ['jeep__.png', 'jeep__light.png', 'jeep__grey.png', 'jeep2__.png', 'jeep2__light.png', 'Jeep2__lightgrey.png', 'jeep2__tan.png']; // 'jeep2__grey.png', 
        //  return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor() {
        super(modTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    get picSources() {
        return ['truck__tan2.png', 'truck__green.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor() {
        super(heavyTarget);
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
    constructor() {
        super(rocketLauncher);
        this.targetEl.classList.add('medRectTarget');
        this.stopPos = RandomNumberGen.randomNumBetween(50, 200);
        this.launcherEl = ElementCreator.returnNewImageEl(this.picEl, 'rocketPack', assetsFolder + "rockets.png");
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
        ThrowHandler.flip(pack, direction.backward, crashes); /////////////////////////////////////////////////////////////////
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out'; }, itemStay); // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, itemStay, fadeAnimTime, allObjects);
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
        let zoneDelay = 1500;
        let _this = this;
        setTimeout(() => {
            SoundPlayer.playWithVolumeSet(activate);
            _this.launcherEl.classList.add('raiseLauncher');
        }, delay);
        setTimeout(() => {
            _this.setNoStrikeZone();
        }, delay + zoneDelay);
    }
    setNoStrikeZone() {
        this.noStrikeZone = ElementCreator.returnNewDiv(this.targetEl, 'noStrikeZone');
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