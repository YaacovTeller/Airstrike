const crashTimeout = 600;
enum Status {
    active,
    disabled,
    escaped
}
enum Damage {
    undamaged,
    damaged,
    moderateDamaged,
    heavyDamaged,
    destroyed
}
enum Armour {
    none,
    moderate,
    heavy,
}
type targetInfo = {
    maxSpeed: number,
    minSpeed: number,
    armour: Armour,
    picSources: Array<string>,
}
const regTarget: targetInfo = {
    //maxSpeed: 3, //KIDS
    //minSpeed: 2,
    maxSpeed: 8, 
    minSpeed: 4, 
    armour : Armour.none,
    picSources: ['jeep.png', 'jeep.png', 'jeep2.png', 'jeep3.png', 'jeep4_cres.png']
}
const modTarget: targetInfo = {
    //maxSpeed: 1, //KIDS
    //minSpeed: 1,
    maxSpeed: 6,
    minSpeed: 4,
    armour: Armour.moderate,
    picSources: ['jeep_grey.png']
}
const heavyTarget: targetInfo = {
    maxSpeed: 3, 
    //maxSpeed: 1, //KIDS
    minSpeed: 1,
    armour: Armour.heavy,
    picSources: ['jeep_grey_armour.png']
}
const regTunnelTarget: targetInfo = {
    maxSpeed: 2,
    minSpeed: 1,
    armour: Armour.moderate,
    picSources: ['trans.png']
}

class Target {
    protected targetEl: HTMLElement;
    protected picEl: HTMLImageElement;
    protected damageEl: HTMLImageElement;

    protected speed: number;
    public armour: Armour;

    protected startPosition: number;
    public status: number = Status.active;
    public damage: number = Damage.undamaged;
    public movesAtBlast: boolean;

    constructor(info: targetInfo) {
        this.targetEl = document.createElement("div");
        this.picEl = document.createElement("img");
        this.damageEl = document.createElement("img");

        this.targetEl.classList.add('target', 'flexCenter');

        this.targetEl.appendChild(this.picEl);
        this.targetEl.appendChild(this.damageEl);

        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
        this.targetEl.style.top = window.innerHeight * this.startPosition / 100 + 'px';
        this.targetEl.style.left = 0 + 'px';
        ContentElHandler.addToContentEl(this.targetEl);

        this.picEl.src = assetsFolder + info.picSources[RandomNumberGen.randomNumBetween(0, info.picSources.length - 1)];
        this.speed = RandomNumberGen.randomNumBetween(info.minSpeed, info.maxSpeed);
        this.armour = info.armour;
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

    private trail: HTMLElement;
    constructor(info: targetInfo) {
        super(info);
        this.trail = document.createElement('div');
        this.trail.className = 'trail';
        this.targetEl.classList.remove('flexCenter'); // MESSY
        this.targetEl.classList.add('flexEnd');
        this.targetEl.classList.add('tunnelHead');
        this.targetEl.append(this.trail)
    }

    protected extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }

    public hit(sev: strikeSeverity) {
        this.status = Status.disabled;
        console.log("tunnel hit, SEV: " + sev)
        if (sev >= strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;
            this.picEl.src = this.damagedSource;
            this.targetEl.classList.remove('tunnelHead');
            this.blowTunnel();
        }
        else {
            console.log("... but not blown")
}
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
                mortar.genericExplosion(imgArr[index], game.targets)
                imgArr[index].src = this.trailBlast + loadNewImage();
            }, (parseInt(index) + 1) * 150)
        }
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

    constructor(info: targetInfo) {
        super(info);
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
    private badDamage(direc) {
        this.damageEl.src = this.badDamagedSource;
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');

        RandomNumberGen.randomNumBetween(1, 8) == 8 ? aluak.play() : "";
        CollisionDetection.throw(this.targetEl, direc); // ARC
        this.flip(direc);                               // ROTATION
    }
}
