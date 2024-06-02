const crashTimeout = 600;

class Target {
    protected targetEl: HTMLElement;
    protected picEl: HTMLImageElement;
    protected damageEl: HTMLImageElement;
    protected lockonEl: HTMLImageElement;

    protected speed: number;
    public armour: Armour;

    protected startPosition: number;
    public status: number = Status.active;
    public damage: number = Damage.undamaged;
    public movesAtBlast: boolean;

    constructor(info: targetInfo, position?: position) {
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter');
        let picSrc = assetsFolder + info.picSources[RandomNumberGen.randomNumBetween(0, info.picSources.length - 1)];
        this.picEl = this.returnNewImageEl(this.targetEl, "", picSrc);
        this.damageEl = this.returnNewImageEl(this.targetEl, "");
        this.lockonEl = this.returnNewImageEl(this.targetEl, 'lockon', assetsFolder + "target-box2.svg");

        ContentElHandler.addToContentEl(this.targetEl);

        position ? this.setStartPos(position.X, position.Y) : this.setStartPos(this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(info.minSpeed, info.maxSpeed);
        this.armour = info.armour;
    }
    private returnNewImageEl(parent: HTMLElement, classname: string, src?: string) {
        let el = document.createElement('img');
        if (src) el.src = src;
        el.className = classname;
        parent.appendChild(el);
        return el;
    }
    protected setStartPos(left: number, top?: number) {
        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
        top = top ? top : window.innerHeight * this.startPosition / 100;
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }

    public hit(sev: strikeSeverity, direc: direction) { }

    protected move() {
        let x = parseInt(this.targetEl.style.left)
        if (x > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = x + this.speed + "px";
  
    }
    public getTargetEl() {
        return this.targetEl;
    }
    public getPicEl() {
        return this.picEl;
    }

    protected flip(direc: direction) {
            this.picEl.classList.remove('flipforward');
            this.picEl.classList.remove('flipbackward');
            this.picEl.classList.add('flip' + direc);
            setTimeout(() => RandomSoundGen.playRandomSound(crashes), crashTimeout);
    }

    public action() {
        if (this.status == Status.active) {

            this.move();
        }
    }
}
class TunnelTarget extends Target {
    protected trailBlast: string = assetsFolder + 'expl1.gif';
    protected damagedSource: string = assetsFolder + 'smoke_3.gif';
    protected destroyedSource: string = assetsFolder + 'fire_1.gif';
    public movesAtBlast: boolean = false;
    private targetTimer: number;
    private newTargetFrequency: number = 5000;

    private trail: HTMLElement;
    constructor(info: targetInfo) {
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

    private extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    private produceTargetCheck() {
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 95) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos: position = { X: rect.x, Y: rect.y }
            let newTarget = new VehicleTarget(regTarget, pos);
            game.targetCreation(newTarget);
        }
    }
    private setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            this.produceTargetCheck();
        }, this.newTargetFrequency);
    }
    private stopTargetProduction() {
        clearInterval(this.targetTimer);
    }

    public hit(sev: strikeSeverity) {
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
    private removeTunnel(length) {
        this.trail.classList.add('hide');
   //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove() }, 8000)
    }
    private blowTunnel() {
        let numOfimgs: number = parseInt(this.trail.style.width) / 100;
        let imgArr: Array<HTMLImageElement> = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let index in imgArr) {
            setTimeout(() => {
                let mrtr: ExplosiveWeaponType = allWeaponTypes[weaponNames.mortar] as ExplosiveWeaponType // MESSY
                if (mrtr) {
                    mrtr.checkForTargets(imgArr[index], game.returnLevelTargets())
                }
                imgArr[index].src = this.trailBlast + loadNewImage();
            }, (parseInt(index) + 1) * 150)
        }
        this.removeTunnel(imgArr.length);
    }
    public action() {
        if (this.status == Status.active) {
            this.move();
            this.extendTunnel();
        }
    }
}
class VehicleTarget extends Target {
    protected destroyedSource: string = assetsFolder + 'fire_3.gif';
    protected damagedSource: string = assetsFolder + 'smoke_3.gif';
    protected badDamagedSource: string = assetsFolder + 'fire_1.gif';
    public movesAtBlast: boolean = true;

    constructor(info: targetInfo, position?: position) {
        super(info, position);
    }

    public hit(sev: strikeSeverity, direc: direction) {
        if (sev > strikeSeverity.light) {
            this.status = Status.disabled;
        }
        else {
            setTimeout(() => this.status = Status.disabled, 1000)
        }
        if (sev == strikeSeverity.light) {
            this.damage != Damage.undamaged ? sev = strikeSeverity.medium : "";
            this.damage = Damage.damaged;

            this.damageEl.src = this.damagedSource;
            this.damageEl.classList.add('lightDamaged');
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
        }
    }
    private hitAcknowledge() {
        RandomNumberGen.randomNumBetween(1, 2) == 2 ? aluak.play() : matara.play();
    }
    private badDamage(direc) {
        this.damageEl.src = this.badDamagedSource;
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');

        RandomNumberGen.randomNumBetween(1, 8) == 8 ? this.hitAcknowledge() : "";
        CollisionDetection.throw(this.targetEl, direc); // ARC
        this.flip(direc);                               // ROTATION
    }
}
