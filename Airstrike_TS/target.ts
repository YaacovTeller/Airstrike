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
    heavy
}
type targetInfo = {
    maxSpeed: number,
    minSpeed: number,
    armour: Armour,
    picSources: Array<string>
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
class Target {
    private targetEl: HTMLElement;
    private picEl: HTMLImageElement;
    private damageEl: HTMLImageElement;
    private contentEl: HTMLElement;

    private speed: number;
    public armour: Armour
/*    private picSource: Array<string>;*/

    private destroyedSource: string = assetsFolder + 'fire_3.gif';
    private damagedSource: string = assetsFolder + 'smoke_3.gif';
    private badDamagedSource: string = assetsFolder + 'fire_1.gif';
    private startPosition: number;
    public status: number = Status.active;
    public damage: number = Damage.undamaged;

    constructor(contentEl: HTMLElement, info: targetInfo) {
        this.targetEl = document.createElement("div");
        this.picEl = document.createElement("img");
        this.damageEl = document.createElement("img");

        this.targetEl.classList.add('target');
        this.targetEl.appendChild(this.picEl);
        this.targetEl.appendChild(this.damageEl);

        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
        this.targetEl.style.top = window.innerHeight * this.startPosition / 100 + 'px';
        this.targetEl.style.left = 0 + 'px';
        this.contentEl = contentEl;
        contentEl.appendChild(this.targetEl);

        this.picEl.src = assetsFolder + info.picSources[RandomNumberGen.randomNumBetween(0, info.picSources.length - 1)];
        this.speed = RandomNumberGen.randomNumBetween(info.minSpeed, info.maxSpeed);
        this.armour = info.armour;
    }
    private move() {
        let x = parseInt(this.targetEl.style.left)
        if (x > this.contentEl.clientWidth) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = x + this.speed + "px";
  
    }
    public getTargetEl() {
        return this.targetEl;
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
            
            this.damageEl.src = this.badDamagedSource;
            this.damageEl.classList.add('badDamaged');
            this.damageEl.classList.remove('lightDamaged');

            this.flip(this.targetEl, direc);
        }
        if (sev == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;

            this.damageEl.src = this.badDamagedSource;
            this.damageEl.classList.add('badDamaged');
            this.damageEl.classList.remove('lightDamaged');

            this.flip(this.targetEl, direc);
        }
        if (sev == strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;

            this.picEl.src = this.destroyedSource;
            this.picEl.className = 'destroyed';
            this.damageEl.style.visibility = "hidden";
        }
    }
    private flip(elem: HTMLElement, direc: direction) {
        let num = RandomNumberGen.randomNumBetween(1, 1);
        if (num == 1 && direc) {
            this.picEl.classList.remove('flipforward');
            this.picEl.classList.remove('flipbackward');
            this.picEl.classList.add('flip' + direc);
            CollisionDetection.throw(elem, direc);
            setTimeout(() => RandomSoundGen.playRandomSound(crashes), crashTimeout);
        }
    }

    public action() {
        if (this.status == Status.active) {

            this.move();
        }
    }
}
