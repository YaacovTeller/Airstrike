
class WeaponType {
    public name: weaponNames;
    public slot: number;
    public displayName: string;
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
        this.slot = info.slot !== undefined ? info.slot : info.name;
        this.displayName = info.displayName;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.imageSource = info.imageSource;
        this.speed = info.speed;
        this.cooldown = info.cooldown;
        this.noAmmo = info.noAmmo;
        this.select = info.select;

        let wepArr: Array<WeaponType> = this.getWeaponArray();
        wepArr[this.slot] = this
        game.addHudWeapon(this)
    }
    public getWeaponArray() {
        return this.name <= weaponNames.drone ? conventionalWeapons : extraWeapons; // by what it is; its slot is just its key and place
    }

    public switchFrom() {
        if (this.instances.length && this.activeInstance && this.activeInstance.blastRadElement) {
            if (this.activeInstance.ready == true) {
                this.activeInstance.blastRadElement.style.visibility = "hidden";
            }
        }
    }
    protected playSound() {
        SoundPlayer.playSequentialSound(this.sound);
    }
    protected playSelectSound() {
        SoundPlayer.playSequentialSound(this.select);
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
            game.hud.deselectInst(parseInt(i), this.slot) //MESSY?
            if (this.instances[i].ready === true) {
                if (nextReady == null) {
                    nextReady = this.instances[i];
                    game.hud.selectInst(parseInt(i), this.slot); //MESSY?
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
        SoundPlayer.playWithVolumeSet(pickup);
        let inst: weaponInstance = {
            ready: true,
        };
        if (this.blastRadNum()) {
            let el = this.returnBlastRadiusDiv(this.blastRadNum());
            this.name == weaponNames.tactical_Nuke ? el.classList.add('nukeIndicator') : "";
            this.name == weaponNames.carpet_bomb ? el.classList.add('carpetIndicator') : "";
            inst.blastRadElement = el;
        }

        this.instances.push(inst);
        game.addHudInstance(this);
    }
    protected blastRadNum() {
        return 0
    }
    protected shotCounter() {
        game.updateKillStats(killStatDisplayOptions.shots)
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
        let name: number = this.slot;
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

    protected ammoCheck() {
        if (this.activeInstance == null || this.activeInstance.ready === false) {
            SoundPlayer.playWithVolumeSet(this.noAmmo);
            return false;
        }
        else return true
    }
    protected removeWeapon() {
        if ([weaponNames.tactical_Nuke, weaponNames.chopper, weaponNames.carpet_bomb].includes(this.name)) {
            let arr = this.getWeaponArray();
            let index = arr.indexOf(this);
            arr[index] = null;
            for (let i = weaponNames.airstrike; i >= 0; i--) {
                if (conventionalWeapons[i]) {
                    game.changeWeapon(conventionalWeapons[i]);
                    break
                }
            }
            game.hud.removeWeapon(this.slot)
        }
    }
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
            SoundPlayer.playRandomSound(ricochet);
            exception = true;
        }
        return exception;
    }
}

class ExplosiveWeaponType extends WeaponType {
    public blastRadius: number;
    protected explosionInfo: ExplosionInfo;
    protected flyoverInfo: FlyOver;

    constructor(info: ExplosiveWeaponInfo) {
        super(info);
        this.explosionInfo = info.explosionInfo;
        this.blastRadius = info.blastRadius;
        if (info.flyover) {
            this.flyoverInfo = info.flyover;
        }
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
    protected resetProgress() {
        this.removeWeapon();
        game.drainProgressBar();
    }

    protected createFlyover(inst: weaponInstance) {
        let div = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "flyover");
        let img = document.createElement('img') as HTMLImageElement;
        div.appendChild(img)
        img.src = this.flyoverInfo.imageSource;
        div.style.left = '100vw';
        div.style.top = this.getFlyoverTopValue(inst);

        const pause = this.flyoverInfo.delay;
        const duration = this.flyoverInfo.duration;
        setTimeout(() => this.beginMoveInterval(div, this.flyoverInfo.speed, duration), pause)
        ContentElHandler.fadeRemoveItem(div, pause + duration, 10);
    }
    protected getFlyoverTopValue(inst: weaponInstance) {
        let returnVal
        let maxTop = window.innerHeight - 180;
        let minTop = 0;
        if (inst.blastRadElement) {
            const topValue = parseFloat(inst.blastRadElement.style.top) || 0;
            returnVal = `${Math.max(minTop, Math.min(topValue, maxTop))}px`;
        }
        else returnVal = '50vh';
        return returnVal;
    }
    protected beginMoveInterval(div, speed, duration) {
        let interval = setInterval(() => {
            this.move(div, direction.backward, speed)
        }, 100)
        setTimeout(() => clearInterval(interval), duration)
    }
    protected move(elem: HTMLElement, direc: direction, speed: number) {
        if (direc == direction.backward) {
            speed = speed * -1
        }
        elem.style.left = parseInt(elem.style.left) + speed + 'vw';
    }
    protected fireResultsTimeout(inst: weaponInstance) {
        setTimeout(() => {
            let blastCenter: position = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.frames, this.name);
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

    protected rippleEffect(inst: weaponInstance) {
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
                SoundPlayer.playSequentialSound(beeps);
                SoundPlayer.playSequentialSound(ticks);
                setTimeout(() => {

                    tunnel.hit(strikeSeverity.catastrophic, this.name);       // TARGET - Main hit function
                    tunnel.toggleLockOn(false);
                    SoundPlayer.playSequentialSound(multiExplosions);
                }, this.speed)
            };
        }
        hit === false ? SoundPlayer.playWithVolumeSet(bleep_neg) : "";
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
// A superweapon. Three aircraft cross the whole screen right to left, and just after they've gone by the
// band across it around the mouse (the height of the weapon's circle) is carpeted with explosions, which
// sweep across the same way, right to left. The explosions do what the airstrike's do.
class CarpetBombing extends ExplosiveWeaponType {
    private static tickMs: number = 100;      // how often the aircraft's position steps along, as in beginMoveInterval
    private static bombsPerTick: number = 3;   // one in each third of the band's height
    private static wingmen = [                 // where each aircraft is, relative to the lead
        { dx: 0, dy: 0 },
        { dx: 6, dy: -110 },                  // vw behind, and px above or below
        { dx: 6, dy: 110 },
    ];

    constructor(info: ExplosiveWeaponInfo) {
        super(info);
    }

    public fireFunc() {
        if (this.ammoCheck() === false) { return }
        this.playSound();
        this.shotCounter();

        let inst: weaponInstance = this.activeInstance as weaponInstance;
        inst.ready = false;
        this.rippleEffect(inst);
        this.switchBlastIndicatorStyle(true, inst);

        const bandMiddle = CollisionDetection.getXYfromPoint(inst.blastRadElement).Y; // the circle stays where it was fired
        this.createFormation(bandMiddle);
        setTimeout(() => this.sweep(bandMiddle, inst), this.flyoverInfo.delay + this.flyoverCrossingTime());

        this.cooldownTimeout(inst);
        this.setActiveInstance();
        this.resetProgress(); // it's used up, like the nuke
    }

    // How long, once they set off, until the last of the aircraft has gone off the left of the screen
    private flyoverCrossingTime(): number {
        const vw = window.innerWidth / 100;
        const furthestBack = Math.max(...CarpetBombing.wingmen.map(place => place.dx));
        const distance = (100 + furthestBack) * vw + 200; // from off the right, to clear of the left (the aircraft is 200px wide)
        return Math.ceil(distance / (this.flyoverInfo.speed * vw)) * CarpetBombing.tickMs;
    }

    private createFormation(bandMiddle: number) {
        const info = this.flyoverInfo;
        for (const place of CarpetBombing.wingmen) {
            let div = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "flyover");
            let img = document.createElement('img') as HTMLImageElement;
            div.appendChild(img);
            img.src = info.imageSource;
            div.style.left = (100 + place.dx) + 'vw';
            div.style.top = (bandMiddle - 100 + place.dy) + 'px'; // the aircraft is 200px high
            setTimeout(() => this.beginMoveInterval(div, info.speed, info.duration), info.delay);
            ContentElHandler.fadeRemoveItem(div, info.delay + info.duration, 10);
        }
    }

    // Moves across the screen at the aircraft's speed, dropping a few explosions at each step
    private sweep(bandMiddle: number, inst: weaponInstance) {
        const screenWidth = window.innerWidth;
        const vw = screenWidth / 100;
        const halfBand = this.blastRadius;
        const laneHeight = halfBand * 2 / CarpetBombing.bombsPerTick;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const leadMiddle = (100 - this.flyoverInfo.speed * step) * vw + 100; // where the lead aircraft was, were it going with this
            if (leadMiddle < -150) {
                clearInterval(timer);
                inst.blastRadElement.style.visibility = 'hidden';
                this.switchBlastIndicatorStyle(false, inst);
                return;
            }
            if (leadMiddle > screenWidth + 40) return; // not on the screen yet
            if (step % 2 == 0) { SoundPlayer.playSequentialSound(multiExplosions); }

            for (let lane = 0; lane < CarpetBombing.bombsPerTick; lane++) {
                const x = Math.min(screenWidth, Math.max(0, leadMiddle + RandomNumberGen.randomNumBetween(0, 160)));
                const y = bandMiddle - halfBand + lane * laneHeight + RandomNumberGen.randomNumBetween(0, laneHeight);
                ExplosionHandler.basicExplosion({ X: x, Y: y }, this.explosionInfo.size, this.explosionInfo.frames, weaponNames.airstrike);
            }
        }, CarpetBombing.tickMs);
    }
}

class Chopper extends ExplosiveWeaponType {
    private shotDelay = 1000;
    private firing: boolean = false;
    constructor(info: ExplosiveWeaponInfo) {
        super(info);
        this.flyoverInfo = info.flyover;
    }
    public fireFunc() {
        if (this.ammoCheck() === false || this.firing === true) { return }
        this.shotCounter();
        this.firing = true;

        SoundPlayer.playRandomSound(this.sound);
        setTimeout(() => this.fireInterval(), this.shotDelay);
    }
    private fireInterval() {
        let inst: weaponInstance = this.activeInstance as weaponInstance;
        let shotGap = 200;
        let shots = 30;
        let side = true;
        this.createFlyover(inst);
        let fireTimer = setInterval(() => {
            let blastCenter: position = CollisionDetection.getXYfromPoint(inst.blastRadElement);
            side == true ? blastCenter.X += this.blastRadius / 2 : blastCenter.X -= this.blastRadius;
            SoundPlayer.playSequentialSound(cannonSounds);
            ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.frames, this.name);
            side = !side;
            shots--
            if (shots <= 0) {
                this.resetProgress();
                clearInterval(fireTimer);
                this.firing = false;
            }
        }, shotGap)
    }

    protected createFlyover(inst: weaponInstance) {
        let div = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "flyover");
        div.classList.add("chopper")
        let img = document.createElement('img') as HTMLImageElement;
        let img2 = document.createElement('img') as HTMLImageElement;
        div.appendChild(img);
        div.appendChild(img2);
        img.src = assetsSVGFolder + "chopper_base.png";
        img2.src = assetsSVGFolder + "chopper_blades.png";
        img2.className = "rotors"
        div.style.left = '100vw';
        div.style.top = this.getFlyoverTopValue(inst);

        const pause = this.flyoverInfo.delay;
        const duration = this.flyoverInfo.duration;
        const enterTime = 300;
        const startSpeed = 1;
        const leaveSpeed = startSpeed + 5;
        setTimeout(() => this.beginMoveInterval(div, leaveSpeed, enterTime), 0)
        setTimeout(() => this.beginMoveInterval(div, startSpeed, duration), enterTime)
        setTimeout(() => { this.beginMoveInterval(div, leaveSpeed, duration), SoundPlayer.playRandomSound(this.sound); }, duration)
        ContentElHandler.fadeRemoveItem(div, pause + duration * 2, 10);
    }
}

// A utility weapon. The drone takes a moment to arrive and then makes a slow pass, and for as long as it's
// overhead the area around the mouse is scanned: anything giving off a heat signature (see
// Target.heatSignatureBox) that the scan reaches shows up -- enemies hiding in buildings, through the
// building, vehicles that are up and running, and a tunnel in its whole length. Things that are
// dead or destroyed don't show.
class SurveillanceDrone extends ExplosiveWeaponType {
    private static activePasses: number = 0;
    private static scanInterval: number = 50;

    constructor(info: ExplosiveWeaponInfo) {
        super(info);
    }
    public fireFunc() {
        if (this.ammoCheck() === false) { return }
        this.playSound();
        this.shotCounter();
        game.level.noteDroneFlyover();

        let inst: weaponInstance = this.activeInstance as weaponInstance;
        inst.ready = false;
        inst.blastRadElement.style.visibility = 'hidden'; // the scan has its own ring, once the drone's there
        this.createFlyover(inst);

        setTimeout(() => this.scan(this.flyoverInfo.duration), this.flyoverInfo.delay);

        this.cooldownTimeout(inst);
        this.setActiveInstance();
    }

    private scan(duration: number) {
        const radius = this.blastRadius;
        const ring = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), 'blastRadius scanRing');
        ring.style.width = ring.style.height = radius * 2 + 'px';

        SurveillanceDrone.activePasses++;
        const sweep = () => {
            const mouse = MouseHandler.mousePos;
            if (typeof mouse.X !== 'number') return; // the mouse hasn't been over the game yet
            ring.style.left = mouse.X - radius + 'px';
            ring.style.top = mouse.Y - radius + 'px';
            for (const target of allTargets) {
                if (!(target instanceof Target)) continue; // buildings give off nothing themselves
                const area = target.heatSignatureBox();
                const nearest = area ? CollisionDetection.nearestPointInBox(mouse, area) : null;
                target.setHeatSignature(!!nearest && Math.hypot(nearest.X - mouse.X, nearest.Y - mouse.Y) <= radius);
            }
        };
        const timer = setInterval(sweep, SurveillanceDrone.scanInterval);
        sweep();

        setTimeout(() => {
            clearInterval(timer);
            ring.remove();
            if (--SurveillanceDrone.activePasses === 0) { // nothing else is scanning: back to normal
                allTargets.forEach(t => t instanceof Target ? t.setHeatSignature(false) : "");
            }
        }, duration);
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
        SoundPlayer.playWithVolumeSet(bleep_pos);
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
        SoundPlayer.playWithVolumeSet(bleepbleep);

        let snd = this.sound;
        setTimeout(() => {
            SoundPlayer.playSequentialSound(strikePrep);
            setTimeout(() => { SoundPlayer.playRandomSound(snd); }, 300)
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

        this.createFlyover(inst);

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
                SoundPlayer.playSequentialSound(multiExplosions);
                let deviation = 10;
                let deviationX = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let deviationY = RandomNumberGen.randomNumBetween(-deviation, deviation);
                let blastCenter = CollisionDetection.getXYfromPoint(trgt.getTargetEl());
                blastCenter.X += deviationX;
                blastCenter.Y += deviationY;
                ExplosionHandler.basicExplosion(blastCenter, this.explosionInfo.size, this.explosionInfo.frames, this.name);
                //    this.checkForTargets(blastCenter, allTargets);
            }, this.speed + currentSpeedBuffer)
        })
        this.setActiveInstance();
    }
}