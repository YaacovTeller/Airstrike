// Filenames (all relative to assetsFolder + "buildings/") for one building type's three stages.
type BuildingInfo = {
    undamaged: string,
    damaged: string,
    destroyed: string,
}
const warehouseBlueInfo: BuildingInfo = {
    undamaged: "Warehouse_blue_1.png",
    damaged: "Warehouse_blue_2.png",
    destroyed: "Warehouse_blue_3.png",
}
const warehouseBrownInfo: BuildingInfo = {
    undamaged: "Warehouse_brown_1.png",
    damaged: "Warehouse_brown_2.png",
    destroyed: "Warehouse_brown_3.png",
}
// Add new building types here to get them into the random rotation.
const allBuildingInfo: Array<BuildingInfo> = [warehouseBlueInfo, warehouseBrownInfo];

// Generic rubble chunks used as flying debris when a building is hit (see Building.debrisSources).
const buildingRuinSources: Array<string> = [
    assetsFolder + "ruin_1.png",
    assetsFolder + "ruin_2.png",
];

// Shared by Target and Building: both are sprites placed and repositioned within the content area.
class MapEntity {
    protected targetEl: HTMLElement;
    protected picEl: HTMLElement;
    protected baseImgEl: HTMLImageElement;

    protected placeAt(left: number, top?: number) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    public getTargetEl(): HTMLElement {
        return this.targetEl;
    }
    public getPicEl(): HTMLElement {
        return this.picEl;
    }

    // Spawns a free-standing piece of debris at this entity's current on-screen position,
    // registers it for cleanup, and fades it out after a while.
    protected returnBit(imageSrc, parentClass, childClass): HTMLElement {
        let bit = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), parentClass);
        ElementCreator.returnNewImageEl(bit, childClass, imageSrc);

        ElementCreator.positionAbsoluteAtElementRect(this.picEl, bit);

        allObjects.push(bit);
        ContentElHandler.fadeRemoveItem(bit, itemStay, fadeAnimTime, allObjects);
        return bit;
    }
}

// Wraps the gif-based damage overlay (smoke/fire) that plays on a target's damageEl canvas.
class DamageOverlay {
    private player: CanvasGifPlayer;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.player = new CanvasGifPlayer(canvas);
    }
    public playLoop(frames: Array<HTMLImageElement>) {
        this.player.pause();
        this.player.play(frames, true);
    }
    public hide() {
        this.canvas.style.visibility = "hidden";
    }
}

class Building extends MapEntity {
    protected damageEl: HTMLImageElement;
    public damage: number = Damage.undamaged;
    protected info: BuildingInfo;

    private static debrisSources: Array<string> = [
        ...buildingRuinSources,
        assetsFolder + "bit.png",
    ];
    private static debrisPerHit: number = 2;

    constructor(info?: BuildingInfo) {
        super();
        this.info = info ? info : RandomNumberGen.returnRandomFromArray(allBuildingInfo);
        this.targetEl = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "building");
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", this.getSource());
        this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "", "", true);
        allTargets.push(this);
    }
    protected reAssignSrc() {
        this.baseImgEl.src = this.getSource();
    }
    public getSource(): string {
        let filename: string;
        switch (this.damage) {
            case Damage.undamaged:
                filename = this.info.undamaged;
                break;
            case Damage.destroyed:
                filename = this.info.destroyed;
                break;
            default:
                filename = this.info.damaged;
                break;
        }
        return assetsFolder + "buildings/" + filename;
    }

    public setPosition(position?: position) {
        let x, y;
            x = position.X;
            y = position.Y;
        this.placeAt(x, y);
    }
    // Three stages (undamaged -> damaged -> destroyed), and how far a hit moves a building depends
    // on the weapon and on how close to the blast's centre it was (severity), like the vehicles:
    //  - bullets do nothing
    //  - anything that only clips it (the outer part of the blast) scuffs it up to damaged, but
    //    never brings it down, whatever the weapon
    //  - a direct hit from a mortar/howitzer shell knocks it down one stage
    //  - a direct hit from an airstrike or nuke flattens it outright
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        if (wepName < weaponNames.mortar) {
            return;
        }
        const direct = severity >= strikeSeverity.heavy;
        const flattening = wepName == weaponNames.airstrike || wepName == weaponNames.tactical_Nuke;

        if (direct && flattening) {
            this.damage = Damage.destroyed;
        }
        else if (direct) {
            this.damage = this.damage === Damage.undamaged ? Damage.damaged : Damage.destroyed;
        }
        else if (this.damage === Damage.undamaged) {
            this.damage = Damage.damaged;
        }
        this.reAssignSrc();
        this.throwDebris();
    }

    private throwDebris() {
        for (let i = 0; i < Building.debrisPerHit; i++) {
            this.throwDebrisPiece();
        }
    }
    private throwDebrisPiece() {
        let imageSrc = RandomNumberGen.returnRandomFromArray(Building.debrisSources);
        let piece = this.returnBit(imageSrc, "wheel", "wheelPic");
        piece.classList.add("buildingDebris");
        let direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
        ThrowHandler.flip(piece, direc, crashes, undefined, undefined, ThrowHandler.removeIfLandedInWater);
    }
}

class Target extends MapEntity {
    protected damageEl: HTMLCanvasElement;
  //  protected damageEl: HTMLImageElement;
    protected lockonEl: HTMLImageElement;
    protected destroyedSource: string = assetsFolder + 'fire_3.gif';
    protected onFireSource: string = assetsFolder + 'fire_1.gif';
    protected smokingSource: string = assetsFolder + 'smoke_3.gif';
    protected damageOverlay: DamageOverlay;

     //   protected damagedSource: Array<string> = smoke_Frames;


    protected speed: number;
    public armour: Armour;

    protected startPosition: number;
    public status: number = Status.active;
    public health: number;
    public damage: number = Damage.undamaged;
    public movesAtBlast: boolean;
    protected info: TargetInfo;

    constructor(info: TargetInfo) {
        super();
        this.info = info;
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter', 'smoothTransition');
        let picSrc = assetsFolder + RandomNumberGen.returnRandomFromArray(this.picSources);
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = ElementCreator.returnNewCanvas(this.targetEl, "smallSquare", true);
     //   this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "smallSquare");
        this.lockonEl = ElementCreator.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        this.damageOverlay = new DamageOverlay(this.damageEl);

        ContentElHandler.addToContentEl(this.targetEl);
//        console.log("POS_X: " + this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(this.info.minSpeed, this.info.maxSpeed);
        this.armour = this.info.armour;
   //     this.health = this.info.health;
    }
    protected get picSources(): Array<string> {
        return [];
    }

    public decidePosition(pos: position) {
        let x, y;
        if (pos) {
            x = pos.X
            y = pos.Y
        }
        else {
            x = this.getTargetEl().clientWidth * -1;
            this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
            y = window.innerHeight * this.startPosition / 100;
        }
        this.placeAt(x, y);
    }
    public returnPosition() {
        let pos: position = { X: parseInt(this.targetEl.style.left), Y: parseInt(this.targetEl.style.top) }
        return pos
    }

    protected moveFromBlast(severity: strikeSeverity, collisionInfo: vectorMoveObj) {
        if (this.movesAtBlast) {
            if (this.armour >= Armour.moderate) {
                collisionInfo.radius /= 2; // hack to reduce punting armour about
            }
            severity > strikeSeverity.light ? ThrowHandler.moveAtAngle(collisionInfo) : "";
        }
    }

    public hit(sev: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) { }

    protected move(posX: number) {
        if (posX > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
            game.updateKillStats(killStatDisplayOptions.escaped)
        }
        this.targetEl.style.left = posX + this.speed + "px";
    }

    protected targetDisabled() {
        if (this.status != Status.disabled) {
            this.status = Status.disabled;
            game.updateKillStats(killStatDisplayOptions.disabled)
        }
    }

    protected targetDestroyed(priorStatus: Status) {
        this.damage = Damage.destroyed;
        game.updateKillStats(killStatDisplayOptions.destroyed)
        if (priorStatus == Status.disabled) {
            game.updateKillStats(killStatDisplayOptions.disabled, -1)
        }
        this.removeFromArray();
    }

    protected removeFromArray() {
        setTimeout(() => {
            let arr = allTargets;
            let index = arr.indexOf(this);
            if (index >= 0) {
                arr.splice(index, 1);
            }
        }, damagedTargetStay + fadeAnimTime);
    }
    protected destructionBits() {    }

    public toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "lock_red.svg" + loadNewImage() : this.lockonEl.src = assetsSVGFolder + "target-box.svg"
    }
    public toggleLockOn(bool) { 
        bool ? this.lockonEl.style.visibility = 'visible' : this.lockonEl.style.visibility = 'hidden';
    }
    public getLockOnStatus() {
        return this.lockonEl.style.visibility == 'visible' ? true : false;
    }

    public action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
        }
    }
}

class TunnelTarget extends Target {
    //protected trailBlast: string = assetsFolder + classicExplosion;
    protected damagedSource: string = assetsFolder + 'smoke_3.gif';
    //protected destroyedSource: string = assetsFolder + 'fire_1.gif';
    protected trailBlast: Array<HTMLImageElement> = expl_small_imgs;
  //  protected destroyedSource: Array<string> = fire_1_frames;
    public movesAtBlast: boolean = false;
    private targetTimer: number;
    private newTargetFrequency: number = 5000;

    private trail: HTMLElement;
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
    protected get picSources(): Array<string> {
        return ['trans.png'];
    }

    private extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    private produceTargetCheck() {
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 90) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos: position = { X: rect.x, Y: rect.y }
            let newTarget = new RegVehicleTarget();
       //     newTarget.setPosition(rect.x, rect.y);
            game.targetCreation(newTarget, pos);

            SoundPlayer.playSequentialSound(revs);
        }
    }
    private setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            if (game.gameTimer) {
                this.produceTargetCheck();
            }
        }, this.newTargetFrequency);
    }
    private stopTargetProduction() {
        clearInterval(this.targetTimer);
    }

    public hit(severity: strikeSeverity, wepName: weaponNames) {
        if (wepName < weaponNames.airstrike) {
                return
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

    private blowTunnel() {
        let numOfimgs: number = parseInt(this.trail.style.width) / 175;
        let imgArr: Array<HTMLImageElement> = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let img in imgArr) {
            let indexNum = parseInt(img);
            setTimeout(() => {
                let blastCenter: position = CollisionDetection.getXYfromPoint(imgArr[img])
                if (indexNum == 0) {
                    ExplosionHandler.basicExplosion(blastCenter, ExplSizes.XL, expl_med_imgs, weaponNames.airstrike)
                }
                ExplosionHandler.basicExplosion(blastCenter, ExplSizes.small, this.trailBlast, weaponNames.mortar)
            }, (indexNum + 1) * 150)
        }
        this.removeTunnel(imgArr.length);
    }
    private removeTunnel(length) {
        this.trail.classList.add('hide');
   //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove() }, 8000);
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    public action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
            this.extendTunnel();
        }
    }
}

class VehicleTarget extends Target {
    protected wheelSource: string = assetsFolder + 'wheel.png';
    protected wheelSizeClass: string;
    public movesAtBlast: boolean = true;
    public angle: number = 0;

    constructor(info: TargetInfo) {
        super(info);
    }
    private ricochetChance(num) {
        RandomNumberGen.randomNumBetween(1, 10) > num ? SoundPlayer.playRandomSound(ricochet) : "";
    }
    private incrementDamageForArmour() {
        this.damage += 1;
        this.ricochetChance(7);
    }

    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        let direc: direction;
        if (collisionInfo) {
            direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
            this.moveFromBlast(severity, collisionInfo)
        }

        if (this.armour == Armour.none) {
            if (wepName == weaponNames.sniper) {
                    if (this.damage > Damage.undamaged) {
                        setTimeout(() => this.targetDisabled(), RandomNumberGen.randomNumBetween(200, 1200))
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
                    return
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.light) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        return
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }

        if (this.armour == Armour.heavy) {
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.medium) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        if (this.damage == Damage.badlyDented) {
                            this.lightDamage();
                        }
                        return
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
    }

    private removeFlip(elem) {
        elem.classList.remove('flip');
        ThrowHandler.cssRotateAngle(elem, 0);
    }

    private hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                SoundPlayer.playRandomSound(acknowledge)
            }
        }
    }
    private basicVehicleDamageModel(severity: strikeSeverity, direc: direction, collisionInfo?: vectorMoveObj) {
        let priorStatus = this.status;
        if (severity == strikeSeverity.light) {
            this.damage >= Damage.badlyDented ? severity = strikeSeverity.medium : "";
            this.lightDamage();
        }
        if (severity >= strikeSeverity.medium) {
            this.targetDisabled();
            this.hitAcknowledge();                 /////// put with the other!!!
        }
        if (severity == strikeSeverity.medium) {
            this.damage = Damage.moderateDamaged;
            this.badDamage(direc);
            game.assessKillPoints(priorStatus, this.damage);
            return
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc);
            game.assessKillPoints(priorStatus, this.damage);
            return
        }
        if (severity == strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.completeDestruction(collisionInfo);
            game.assessKillPoints(priorStatus, this.damage);
            return
        }
    }
    private lightDamage() {
        if (this.damage >= Damage.moderateDamaged) { return }
        this.damage = Damage.damaged;

        this.smoking();
 //       this.damageEl.src = this.smokingSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    private addSrc(src) {
        //return src + loadNewImage();
        return src
    }
    private smoking() {
        this.damageOverlay.playLoop(smoke_imgs);
     //   this.damageEl.src = this.addSrc(this.smokingSource);
    }
    protected pushFire(lightArr: Array<light>, blastCenter: position, explSize: ExplSizes) {
        lightID++
        let light: light = { id: lightID, pos: blastCenter, opac: 1, size: explSize, fading: false, parent: this.getTargetEl() }
        lightArr.push(light);
    }

    protected badDamage(direc?) {
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.damageOverlay.playLoop(fire_1_imgs);
    //        this.damageEl.src = this.addSrc(this.onFireSource);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.pushFire(fires, this.returnPosition(), ExplSizes.XL);
        setTimeout(() => {
            if (RandomNumberGen.randomNumBetween(0, 10) >= 8 && this.damageEl.classList.contains("badDamaged")) {
                this.completeDestruction();
            }
        }, itemStay / 2 + RandomNumberGen.randomNumBetween(0, 3000))

        setTimeout(() => {
            this.damageEl.classList.remove('badDamaged');
            this.damageEl.classList.add('lightDamaged');
            this.smoking();
        }, fireStay + RandomNumberGen.randomNumBetween(0,3000))

        if (direc) {
            this.angle = ThrowHandler.flip(this.picEl, direc, crashes, this.targetEl, this.angle);
        }
        ContentElHandler.fadeRemoveItem(this.targetEl, damagedTargetStay, fadeAnimTime);
        this.removeFromArray();
    }

    // How long the burning wreck of a completely destroyed vehicle stays before it starts to fade.
    protected get destroyedStay(): number {
        return destroyedTargetStay;
    }

    private completeDestruction(collisionInfo?: vectorMoveObj) {
        this.targetEl.classList.remove('smoothTransition');
        this.targetEl.classList.add('smoothFade');
        this.removeFlip(this.picEl);

        this.baseImgEl.src = this.addSrc(this.destroyedSource);
        this.baseImgEl.className = 'destroyed';
        this.damageOverlay.hide();
        this.targetEl.classList.add('show');
        ContentElHandler.fadeRemoveItem(this.targetEl, this.destroyedStay, fadeAnimTime);

        SoundPlayer.playRandomSound(explosions);
        this.destructionBits();
    }

    private lightOnFire(elem) {
        ElementCreator.returnNewImageEl(elem, 'wheelFire', this.onFireSource, true);
    }
    private rollWheel() {
        let wheel = this.createWheel();
        wheel.classList.add("rollWheel");
    }
    private createWheel() {
        let wheel = this.returnBit(this.wheelSource, "wheel", "wheelPic");
        wheel.classList.add(this.wheelSizeClass);
        return wheel
    }

    protected throwWheel(direc: direction) {
        let wheel = this.createWheel();
        this.lightOnFire(wheel);
        let wheelPic = wheel.querySelector(".wheelPic") as HTMLElement;
        ThrowHandler.flip(wheelPic, direc, null, wheel, undefined, ThrowHandler.removeIfLandedInWater);
    }
    protected destructionBits() {
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
    }
}

class WaterVehicleTarget extends VehicleTarget {
    private static shoreMargin: number = 10; // how far inside the open water a boat has to stay
    private static fireBeforeSinkMin: number = 2000;
    private static fireBeforeSinkMax: number = 7000;
    private static sinkDuration: number = 6000;
    private static tiltPause: number = 1500;
    private static tiltSinkDuration: number = 7000;

    constructor() {
        super(boatTarget);
        this.targetEl.classList.add('longTarget');
    }
    private createScrap() {
        return this.returnBit(assetsFolder + "bit.png", "wheel", "wheelPic");
    }

    private throwBit(direc: direction) {
        let bit = this.createScrap();
        ThrowHandler.flip(bit, direc, null, undefined, undefined, ThrowHandler.removeIfLandedInWater);
    }
    protected destructionBits() {
        this.throwBit(direction.forward);
        this.throwBit(direction.backward);
    }
    protected get picSources(): Array<string> {
        return ['ship1.png'];
    }

    // A wrecked boat's fire burns out in half the time -- it's sitting on water.
    protected get destroyedStay(): number {
        return destroyedTargetStay / 2;
    }

    // A badly damaged boat always burns for a while and then sinks, rather than the generic
    // vehicle's chance of an early explosion or recovering back to just smoking.
    protected badDamage() {
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.damageOverlay.playLoop(fire_1_imgs);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.pushFire(fires, this.returnPosition(), ExplSizes.XL);

        let fireDuration = RandomNumberGen.randomNumBetween(WaterVehicleTarget.fireBeforeSinkMin, WaterVehicleTarget.fireBeforeSinkMax);
        setTimeout(() => {
            RandomNumberGen.randomNumBetween(0, 1) === 0 ? this.sink() : this.tiltingSink();
        }, fireDuration);
    }

    // Wraps the boat's image AND its fire/smoke overlay canvas in a fixed-size, fixed-position,
    // unrotated overflow:hidden window matching the boat's current on-screen box. The window
    // itself never moves or resizes -- it's the two elements inside it that get translated
    // downward (and optionally rotated) together and disappear as they're clipped by the
    // window's bottom edge, so the boat (fire included) visibly sinks down into a block of water
    // beneath it, rather than a shrinking window revealing less of a static boat.
    private createSinkMask(): { mask: HTMLElement, sinkables: Array<HTMLElement> } {
        const targetRect = this.targetEl.getBoundingClientRect();
        const picRect = this.picEl.getBoundingClientRect();
        const damageRect = this.damageEl.getBoundingClientRect();

        const mask = ElementCreator.returnNewDiv(this.targetEl, "sinkMask");
        mask.style.left = (picRect.left - targetRect.left) + "px";
        mask.style.top = (picRect.top - targetRect.top) + "px";
        mask.style.width = picRect.width + "px";
        mask.style.height = picRect.height + "px";

        mask.appendChild(this.baseImgEl);
        this.baseImgEl.style.width = picRect.width + "px"; // picEl's CSS sized it via "width: 100%", which no longer applies once it's moved out of picEl
        this.picEl.style.visibility = "hidden";

        mask.appendChild(this.damageEl);
        this.damageEl.style.position = "absolute";
        this.damageEl.style.left = (damageRect.left - picRect.left) + "px"; // damageEl was centered over picEl via flex layout -- pin that same spot explicitly now it's absolutely positioned inside mask
        this.damageEl.style.top = (damageRect.top - picRect.top) + "px";

        return { mask, sinkables: [this.baseImgEl, this.damageEl] };
    }

    private sink() {
        let { mask, sinkables } = this.createSinkMask();
        let sinkDistance = mask.getBoundingClientRect().height * 1.2; // overshoot a bit so it's fully clear of the window
        let duration = WaterVehicleTarget.sinkDuration / 1000;
        sinkables.forEach(el => el.style.transition = `transform ${duration}s ease-in`);
        requestAnimationFrame(() => {
            sinkables.forEach(el => el.style.transform = `translateY(${sinkDistance}px)`);
        });
        setTimeout(() => this.finishSinking(), WaterVehicleTarget.sinkDuration);
    }

    private tiltingSink() {
        let { mask, sinkables } = this.createSinkMask();
        let sinkDistance = mask.getBoundingClientRect().height * 1.2;
        let tiltAngle = RandomNumberGen.randomNumBetween(20, 35);
        let tiltDuration = WaterVehicleTarget.tiltPause / 1000;
        sinkables.forEach(el => {
            el.style.transition = `transform ${tiltDuration}s ease-in-out`;
            el.style.transform = `rotate(${tiltAngle}deg)`;
        });

        setTimeout(() => {
            let submergeDuration = (WaterVehicleTarget.tiltSinkDuration - WaterVehicleTarget.tiltPause) / 1000;
            sinkables.forEach(el => el.style.transition = `transform ${submergeDuration}s ease-in`);
            requestAnimationFrame(() => {
                sinkables.forEach(el => el.style.transform = `translateY(${sinkDistance}px) rotate(${tiltAngle}deg)`);
            });
        }, WaterVehicleTarget.tiltPause);

        setTimeout(() => this.finishSinking(), WaterVehicleTarget.tiltSinkDuration);
    }

    private finishSinking() {
        let priorStatus = this.status;
        this.targetDestroyed(priorStatus);
        this.damageOverlay.hide();
        ContentElHandler.removeFromContentEl(this.targetEl);
        this.destructionBits();
        game.assessKillPoints(priorStatus, this.damage);
    }
    // Anywhere in open water: the whole boat has to fit between the left of the water and the
    // start of the faded shallows at the shore (see Shoreline), not just its top-left corner.
    public decidePosition() {
        const size = this.targetEl.getBoundingClientRect();
        const minY = Math.ceil(window.innerHeight * 0.1);
        const maxY = Math.floor(window.innerHeight * 0.9 - size.height);
        for (let attempt = 0; attempt < 50; attempt++) {
            const y = RandomNumberGen.randomNumBetween(minY, maxY);
            const span = Shoreline.waterSpan(y, y + size.height);
            if (!span) break; // no water showing at all
            const minX = Math.ceil(Math.max(span.left + WaterVehicleTarget.shoreMargin, 0));
            const maxX = Math.floor(Math.min(span.openRight - WaterVehicleTarget.shoreMargin - size.width, window.innerWidth - size.width));
            if (maxX >= minX) {
                this.placeAt(RandomNumberGen.randomNumBetween(minX, maxX), y);
                return;
            }
        }
        console.warn("no open water to place a boat in");
    }
}

class RegVehicleTarget extends VehicleTarget {
    wheelSizeClass = "smallWheel";
    constructor() {
        super(regTarget);
        this.targetEl.classList.add('smallSquare');
    }
    protected get picSources(): Array<string> {
        return ['jeep__.png', 'jeep__light.png', 'jeep__grey.png', 'jeep2__.png', 'jeep2__light.png', 'Jeep2__lightgrey.png', 'jeep2__tan.png'];// 'jeep2__grey.png', 
      //  return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor() {
        super(modTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    protected get picSources(): Array<string> {
        return ['truck__tan2.png', 'truck__green.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    wheelSize = "medWheel";
    constructor() {
        super(heavyTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    protected get picSources(): Array<string> {
        return ['truck__grey.png'];
    }
}

class RocketLauncher extends VehicleTarget {
    wheelSize = "medWheel";
    stopPos: number;
    deployed: boolean = false;
    launcherEl: HTMLImageElement;
    noStrikeZone: HTMLElement;

    constructor() {
        super(rocketLauncher);
        this.targetEl.classList.add('medRectTarget');
        this.stopPos = RandomNumberGen.randomNumBetween(50, 200);
        this.launcherEl = ElementCreator.returnNewImageEl(this.picEl, 'rocketPack', assetsFolder + "rockets.png");
    }
    protected get picSources(): Array<string> {
        return ['launcher.png'];
       // return ['rocketVehicle.jpg'];
         //   picSources: ['rocketVehicle_undeployed.jpg']
    }
    protected move() {
        let x = parseInt(this.targetEl.style.left);
        this.targetEl.style.left = x + this.speed + "px";
    }
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo: vectorMoveObj) {
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
    private throwRocketPack() {
        let pack = this.launcherEl;
        ElementCreator.positionAbsoluteAtElementRect(pack, pack);
        pack.remove();
        ContentElHandler.addToContentEl(pack);
        allObjects.push(pack);

        ThrowHandler.flip(pack, direction.backward, crashes, undefined, undefined, ThrowHandler.removeIfLandedInWater); /////////////////////////////////////////////////////////////////
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out' }, itemStay)   // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, itemStay, fadeAnimTime, allObjects);
    }

    public inNoStrikeZone(target: Target) {
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z as HTMLElement
                //if (CollisionDetection.checkCollisionWithElement(target.getTargetEl(), zone)) {
                if (CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl())) {
                    return true
                }
            }
        }
        return false
    }
    public action() {
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
                console.log("Hit ACTION nostrikezone remove")
                this.removeNoStrikeZone();
            }
        }
        //if (this.damage > Damage.badlyDented) {
        //    this.noStrikeZone.remove();
        //}
    }
    private deploy() {
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
    private setNoStrikeZone() {
        this.noStrikeZone = ElementCreator.returnNewDiv(this.targetEl, 'noStrikeZone');
        this.noStrikeZone.addEventListener('mouseover', this.overNoStrikeZone.bind(this));
        this.noStrikeZone.addEventListener('mouseleave', this.leaveNoStrikeZone.bind(this));
    }
    private removeNoStrikeZone() {
        this.noStrikeZone.remove();
        this.noStrikeZone = null;
    }
    private overNoStrikeZone() {
        game.strikesRestricted = true;
    }
    private leaveNoStrikeZone() {
        game.strikesRestricted = false;
    }
}