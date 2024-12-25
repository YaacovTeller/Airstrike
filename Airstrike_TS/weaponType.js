class WeaponType {
    name;
    cursor;
    sound;
    imageSource;
    speed;
    cooldown;
    noAmmo;
    select;
    activeInstance;
    instances = [];
    constructor(info) {
        this.name = info.name;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
        this.noAmmo = info.noAmmo;
        this.select = info.select;
        let wepArr = this.getWeaponArray();
        wepArr[this.name] = this;
        game.addHudWeapon(this);
    }
    getWeaponArray() {
        return this.name <= weaponNames.drone ? conventionalWeapons : extraWeapons;
    }
    switchFrom() {
        if (this.instances.length && this.activeInstance && this.activeInstance.blastRadElement) {
            if (this.activeInstance.ready == true) {
                this.activeInstance.blastRadElement.style.visibility = "hidden";
            }
        }
    }
    playSound() {
        SoundPlayer.playSequentialSound(this.sound);
    }
    playSelectSound() {
        SoundPlayer.playSequentialSound(this.select);
    }
    switchTo() {
        this.playSelectSound();
        this.setActiveInstance();
        this.additionalSwitchFunc();
    }
    additionalSwitchFunc() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    setActiveInstance() {
        this.activeInstance = this.getAvailableInstance();
        game.updateCursorPosition(); // NEEDED?
    }
    getAvailableInstance() {
        let nextReady = null;
        nextReady = this.searchInstances(nextReady);
        return nextReady;
    }
    searchInstances(nextReady) {
        for (let i in this.instances) {
            game.hud.deselectInst(parseInt(i), this.name); //MESSY?
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    game.hud.selectInst(parseInt(i), this.name); //MESSY?
                }
            }
        }
        return nextReady;
    }
    setBlastRadVisible(nextReady) {
        if (nextReady != null) {
            nextReady.blastRadElement.style.visibility = "visible";
        }
    }
    pushNewWeaponInstance() {
        SoundPlayer.playWithVolumeSet(pickup);
        let inst = {
            ready: true,
        };
        if (this.blastRadNum()) {
            let el = this.returnBlastRadiusDiv(this.blastRadNum());
            this.name == weaponNames.tactical_Nuke ? el.classList.add('nukeIndicator') : "";
            inst.blastRadElement = el;
        }
        this.instances.push(inst);
        game.addHudInstance(this);
    }
    blastRadNum() {
        return 0;
    }
    shotCounter() {
        game.updateKillStats(killStatDisplayOptions.shots);
    }
    returnBlastRadiusDiv(radius) {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        el.style.width = el.style.height = radius * 2 + 'px';
        el.style.visibility = "hidden";
        el.id = weaponNames[this.name] + "_" + this.instances.length + 1 + "";
        ContentElHandler.addToContentEl(el);
        return el;
    }
    fireFunc() {
    }
    cooldownTimeout(inst) {
        let instances = this.instances;
        let name = this.name;
        let index = instances.indexOf(inst);
        game.hud.unavailInst(index, name, this.cooldown);
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
    ammoCheck() {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            SoundPlayer.playWithVolumeSet(this.noAmmo);
            return false;
        }
        else
            return true;
    }
    removeWeapon() {
        if ([weaponNames.tactical_Nuke, weaponNames.chopper].includes(this.name)) {
            let arr = this.getWeaponArray();
            let index = arr.indexOf(this);
            arr[index] = null;
            for (let i = weaponNames.airstrike; i >= 0; i--) {
                if (conventionalWeapons[i]) {
                    game.changeWeapon(conventionalWeapons[i]);
                    break;
                }
            }
            game.hud.removeWeapon(this.name);
        }
    }
}
class BulletWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    fireFunc() {
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        let inst = this.activeInstance;
        inst.ready = false;
        this.shotCounter();
        setTimeout(() => {
            this.checkForTargets_instantHit();
        }, this.speed);
        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }
    determineSeverity() {
        let severity = strikeSeverity.light;
        return severity;
    }
    checkForTargets_instantHit() {
        for (let target of allTargets) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, target.getPicEl())) {
                let severity = this.determineSeverity();
                if (this.determineExceptionsForArmour(target, severity)) {
                    continue;
                }
                ;
                if (target.damage != Damage.destroyed) {
                    target.hit(severity, this.name); // TARGET - Main hit function
                }
            }
        }
    }
    determineExceptionsForArmour(target, severity) {
        let exception = false;
        if (target.armour >= Armour.moderate) {
            SoundPlayer.playRandomSound(ricochet);
            exception = true;
        }
        return exception;
    }
}
class ExplosiveWeaponType extends WeaponType {
    blastRadius;
    explosionInfo;
    flyoverInfo;
    constructor(info) {
        super(info);
        this.explosionInfo = info.explosionInfo;
        this.blastRadius = info.blastRadius;
        if (info.flyover) {
            this.flyoverInfo = info.flyover;
        }
        this.pushNewWeaponInstance();
    }
    additionalSwitchFunc() {
        let inst = this.activeInstance;
        if (inst) {
            this.switchBlastIndicatorStyle(false, inst);
        }
    }
    blastRadNum() {
        return this.blastRadius;
    }
    getAvailableInstance() {
        let nextReady = null;
        nextReady = this.searchInstances(nextReady);
        if (this.blastRadNum()) { // MESSY // MESSY
            this.setBlastRadVisible(nextReady);
        }
        return nextReady;
    }
    fireFunc() {
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        this.shotCounter();
        let inst = this.activeInstance;
        inst.ready = false;
        this.rippleEffect(inst);
        this.switchBlastIndicatorStyle(true, inst);
        if (this.flyoverInfo) {
            this.createFlyover(inst);
        }
        if (this.explosionInfo.sound.length) {
            setTimeout(() => SoundPlayer.playSequentialSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
        }
        this.fireResultsTimeout(inst);
        this.cooldownTimeout(inst);
        this.setActiveInstance();
        if (this.name === weaponNames.tactical_Nuke) {
            this.resetProgress();
        }
    }
    resetProgress() {
        this.removeWeapon();
        game.drainProgressBar();
    }
    createFlyover(inst) {
        let div = ContentElHandler.returnNewEl(ContentElHandler.returnContentEl(), "flyover");
        let img = document.createElement('img');
        div.appendChild(img);
        img.src = this.flyoverInfo.imageSource;
        div.style.left = '100vw';
        div.style.top = this.getFlyoverTopValue(inst);
        const pause = this.flyoverInfo.delay;
        const duration = this.flyoverInfo.duration;
        setTimeout(() => this.beginMoveInterval(div, this.flyoverInfo.speed, duration), pause);
        ContentElHandler.fadeRemoveItem(div, pause + duration, 10);
    }
    getFlyoverTopValue(inst) {
        let returnVal;
        let maxTop = window.innerHeight - 180;
        let minTop = 0;
        if (inst.blastRadElement) {
            const topValue = parseFloat(inst.blastRadElement.style.top) || 0;
            returnVal = `${Math.max(minTop, Math.min(topValue, maxTop))}px`;
        }
        else
            returnVal = '50vh';
        return returnVal;
    }
    beginMoveInterval(div, speed, duration) {
        let interval = setInterval(() => {
            this.move(div, direction.backward, speed);
        }, 100);
        setTimeout(() => clearInterval(interval), duration);
    }
    move(elem, direc, speed) {
        if (direc == direction.backward) {
            speed = speed * -1;
        }
        elem.style.left = parseInt(elem.style.left) + speed + 'vw';
    }
    fireResultsTimeout(inst) {
        setTimeout(() => {
            let blastCenter = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource, this.name);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
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
}
class Flare extends ExplosiveWeaponType {
    constructor(info) {
        super(info);
    }
    fireResultsTimeout(inst) {
        setTimeout(() => {
            let blastCenter = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.createFlare(blastCenter, this.explosionInfo.size);
            this.switchBlastIndicatorStyle(false, inst);
            inst.blastRadElement.style.visibility = 'hidden';
        }, this.speed);
    }
}
class ChargeWeaponType extends WeaponType {
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    switchFrom() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'hidden');
    }
    additionalSwitchFunc() {
        const root = document.querySelector(':root');
        root.style.setProperty('--chargeSelected', 'visible'); // :D change root css to get 'lockon' svg!
    }
    fireFunc() {
        if (this.ammoCheck() === false) {
            return;
        }
        let inst = this.activeInstance;
        let tunnels = allTargets.filter((trgt) => {
            return trgt.constructor.name === TunnelTarget.name && trgt.getLockOnStatus() == false;
        });
        let hit = false;
        for (let tunnel of tunnels) {
            if (CollisionDetection.checkCollisionFromPosition(MouseHandler.mousePos, tunnel.getTargetEl())) {
                tunnel.toggleLockOn(true);
                tunnel.toggleLockOnStrike(true);
                hit = true;
                inst.ready = false;
                this.shotCounter();
                this.cooldownTimeout(inst);
                SoundPlayer.playSequentialSound(beeps);
                SoundPlayer.playSequentialSound(ticks);
                setTimeout(() => {
                    tunnel.hit(strikeSeverity.catastrophic, this.name); // TARGET - Main hit function
                    tunnel.toggleLockOn(false);
                    SoundPlayer.playSequentialSound(multiExplosions);
                }, this.speed);
            }
            ;
        }
        hit === false ? SoundPlayer.playWithVolumeSet(bleep_neg) : "";
        this.setActiveInstance();
    }
}
function inNoStrikeZone(target) {
    let noStrikeZones = document.querySelectorAll(".noStrikeZone");
    if (noStrikeZones) {
        for (let z of noStrikeZones) {
            let zone = z;
            console.log(CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl()));
        }
    }
}
class Chopper extends ExplosiveWeaponType {
    shotDelay = 1000;
    firing = false;
    constructor(info) {
        super(info);
        this.flyoverInfo = info.flyover;
    }
    fireFunc() {
        if (this.ammoCheck() === false || this.firing === true) {
            return;
        }
        this.shotCounter();
        this.firing = true;
        SoundPlayer.playRandomSound(this.sound);
        setTimeout(() => this.fireInterval(), this.shotDelay);
    }
    fireInterval() {
        let inst = this.activeInstance;
        let shotGap = 200;
        let shots = 30;
        let side = true;
        this.createFlyover(inst);
        let fireTimer = setInterval(() => {
            let blastCenter = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            side == true ? blastCenter.X += this.blastRadius / 2 : blastCenter.X -= this.blastRadius;
            SoundPlayer.playSequentialSound(cannonSounds);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource, this.name);
            side = !side;
            shots--;
            if (shots <= 0) {
                this.resetProgress();
                clearInterval(fireTimer);
                this.firing = false;
            }
        }, shotGap);
    }
    createFlyover(inst) {
        let div = ContentElHandler.returnNewEl(ContentElHandler.returnContentEl(), "flyover");
        div.classList.add("chopper");
        let img = document.createElement('img');
        let img2 = document.createElement('img');
        div.appendChild(img);
        div.appendChild(img2);
        img.src = assetsSVGFolder + "chopper_base.png";
        img2.src = assetsSVGFolder + "chopper_blades.png";
        img2.className = "rotors";
        div.style.left = '100vw';
        div.style.top = this.getFlyoverTopValue(inst);
        const pause = this.flyoverInfo.delay;
        const duration = this.flyoverInfo.duration;
        const enterTime = 300;
        const startSpeed = 1;
        const leaveSpeed = startSpeed + 5;
        setTimeout(() => this.beginMoveInterval(div, leaveSpeed, enterTime), 0);
        setTimeout(() => this.beginMoveInterval(div, startSpeed, duration), enterTime);
        setTimeout(() => { this.beginMoveInterval(div, leaveSpeed, duration), SoundPlayer.playRandomSound(this.sound); }, duration);
        ContentElHandler.fadeRemoveItem(div, pause + duration * 2, 10);
    }
}
class DroneWeaponType extends ExplosiveWeaponType {
    attackLimit = 3;
    lockedTargets = [];
    constructor(info) {
        super(info);
        this.pushNewWeaponInstance();
    }
    clearTargets() {
        this.lockedTargets.forEach((trgt) => {
            trgt.toggleLockOn(false);
        });
        this.lockedTargets = [];
    }
    switchFrom() {
        this.clearTargets();
    }
    additionalSwitchFunc() {
        this.findTargets();
    }
    findTargets() {
        SoundPlayer.playWithVolumeSet(bleep_pos);
        this.clearTargets();
        let activeTargets = game.level.targets.filter(t => t.status == Status.active && t.getLockOnStatus() == false && t.movesAtBlast);
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z;
                activeTargets = activeTargets.filter(t => CollisionDetection.checkCollisionWithElement(t.getTargetEl(), zone) == false);
            }
        }
        //  let armouredTargets = activeTargets.filter(t => t.armour === Armour.heavy);
        let sortedByArmour = activeTargets.sort((a, b) => b.armour - a.armour);
        let chosenTargets = sortedByArmour.slice(0, this.attackLimit);
        chosenTargets = chosenTargets.sort((a, b) => b.getTargetEl().getBoundingClientRect().x - a.getTargetEl().getBoundingClientRect().x);
        chosenTargets.forEach((trgt) => {
            trgt.toggleLockOn(true);
        });
        this.lockedTargets = chosenTargets;
    }
    playSound() {
        SoundPlayer.playWithVolumeSet(bleepbleep);
        let snd = this.sound;
        setTimeout(() => {
            SoundPlayer.playSequentialSound(strikePrep);
            setTimeout(() => { SoundPlayer.playRandomSound(snd); }, 300);
        }, 300);
    }
    fireFunc() {
        if (this.lockedTargets.length < this.attackLimit) {
            this.findTargets();
            return;
        }
        if (this.ammoCheck() === false) {
            return;
        }
        this.playSound();
        let inst = this.activeInstance;
        inst.ready = false;
        this.cooldownTimeout(inst);
        this.createFlyover(inst);
        let speedInc = 150;
        let currentSpeedBuffer = 0;
        let strikingTargets = this.lockedTargets;
        this.lockedTargets = [];
        strikingTargets.forEach((trgt) => {
            trgt.toggleLockOnStrike(true);
            currentSpeedBuffer += speedInc;
            setTimeout(() => {
                trgt.toggleLockOn(false);
                trgt.toggleLockOnStrike(false);
                SoundPlayer.playSequentialSound(multiExplosions);
                let deviation = 10;
                let deviationX = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let deviationY = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let blastCenter = CollisionDetection.getXYfromPoint(trgt.getTargetEl());
                blastCenter.X += deviationX;
                blastCenter.Y += deviationY;
                ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.imageSource, this.name);
                //    this.checkForTargets(blastCenter, allTargets);
            }, this.speed + currentSpeedBuffer);
        });
        this.setActiveInstance();
    }
}
//# sourceMappingURL=weaponType.js.map