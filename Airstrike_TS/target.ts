const buildingSources = {
    W1 : "Warehouse_blue",
    W2 : "Warehouse_brown",
 //   H1: "house_1",
}



class Building {
    protected targetEl: HTMLElement;
    protected picEl: HTMLElement;
    protected baseImgEl: HTMLImageElement;
    protected damageEl: HTMLImageElement;
    public damage: number = Damage.undamaged;
    public picSrc: string// = assetsFolder + "house_1.png";

    constructor() {
     //   let picSrc = assetsFolder + "buildings_1.png";
        let picSrc = assetsFolder + "buildings/" + this.getSource();
        this.targetEl = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "building");
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "", "", true);
        allTargets.push(this);
    }
    protected reAssignSrc() {
        this.baseImgEl.src = this.getSource();
    }
    public getSource() {
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
                num = 3
                break;
            default:
                num = 1;
                break;
        }
        return `${src}_${num}.png`
    } 

    public setPosition(position?: position) {
        let x, y;
            x = position.X;
            y = position.Y;
        this.setStartPos(x, y);
    }
    protected setStartPos(left: number, top?: number) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        this.damage = Damage.damaged;
        this.reAssignSrc();
    }
    public getTargetEl(): HTMLElement {
        return this.targetEl;
    }
}

class Target {
    protected targetEl: HTMLElement;
    protected picEl: HTMLElement;
    protected baseImgEl: HTMLImageElement;
    protected damageEl: HTMLCanvasElement;
  //  protected damageEl: HTMLImageElement;
    protected lockonEl: HTMLImageElement;
    protected destroyedSource: string = assetsFolder + 'fire_3.gif';
    protected onFireSource: string = assetsFolder + 'fire_1.gif';
    protected smokingSource: string = assetsFolder + 'smoke_3.gif';
    protected player: CanvasGifPlayer;

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
        this.setPosition(x, y);
    }
    public returnPosition() {
        let pos: position = { X: parseInt(this.targetEl.style.left), Y: parseInt(this.targetEl.style.top) }
        return pos
    }
    protected setPosition(left: number, top?: number) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
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

    protected returnBit(imageSrc, parentClass, childClass): HTMLElement {
        let bit = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), parentClass);
        ElementCreator.returnNewImageEl(bit, childClass, imageSrc);

        this.positionBit(bit)

        allObjects.push(bit);
        ContentElHandler.fadeRemoveItem(bit, itemStay, fadeAnimTime, allObjects);
        return bit;
    }
    private positionBit(bit) {
        const rect = this.picEl.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        bit.style.position = "absolute";
        bit.style.left = `${x}px`;
        bit.style.top = `${y}px`;
    }

    public toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "lock_red.svg" + loadNewImage() : this.lockonEl.src = assetsSVGFolder + "target-box.svg"
    }
    public toggleLockOn(bool) { 
        bool ? this.lockonEl.style.visibility = 'visible' : this.lockonEl.style.visibility = 'hidden';
    }
    public getLockOnStatus() {
        return this.lockonEl.style.visibility == 'visible' ? true : false;
    }
    public getTargetEl(): HTMLElement {
        return this.targetEl;
    }
    public getPicEl() {
        return this.picEl;
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
    private playGifPlayer(frames, bool) {
        this.player.pause();
        this.player.play(frames, bool);
    }
    private addSrc(src) {
        //return src + loadNewImage();
        return src
    }
    private smoking() {
        this.playGifPlayer(smoke_imgs, true);
        //this.player.pause();
        //this.player.play(smoke_frames, true);
     //   this.damageEl.src = this.addSrc(this.smokingSource);
    }
    private pushFire(lightArr: Array<light>, blastCenter: position, explSize: ExplSizes) {
        lightID++
        let light: light = { id: lightID, pos: blastCenter, opac: 1, size: explSize, fading: false, parent: this.getTargetEl() }
        lightArr.push(light);
    }

    private badDamage(direc?) {
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.playGifPlayer(fire_1_imgs, true)
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

    private completeDestruction(collisionInfo?: vectorMoveObj) {
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
        ThrowHandler.flip(wheelPic, direc, null, wheel);
    }
    protected destructionBits() {
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
    private createScrap() {
        return this.returnBit("bit.png", "wheel", "wheelPic");
    }

    private throwBit(direc: direction) {
        let bit = this.createScrap();
        ThrowHandler.flip(bit, direc, null);
    }
    protected destructionBits() {
        this.throwBit(direction.forward);
        this.throwBit(direction.backward);
    }
    protected get picSources(): Array<string> {
        return ['ship1.png'];
    }
    public decidePosition() {
        let x, y;
            let randX = RandomNumberGen.randomNumBetween(10, 90);
        let randY = RandomNumberGen.randomNumBetween(10, 90);
        y = window.innerHeight * randY / 100;
        x = game.waterWidth + window.innerWidth / 3 * randX / 100;
        let water = document.getElementById("water")
        let pos: position = { X:x,Y:y };
        if (CollisionDetection.checkCollisionFromPosition(pos, water)) {
            this.setPosition(x, y);
        }
        else {
            console.log("none-water boat position")
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