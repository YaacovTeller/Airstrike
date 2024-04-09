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
class Target {
    private targetEl: HTMLElement;
    private picEl: HTMLImageElement;
    private damageEl: HTMLImageElement;
    private contentEl: HTMLElement;


    private speed: number;
    private picSource: Array<string> = ['jeep.png', 'jeep.png', 'jeep2.png', 'jeep3.png', 'jeep_grey.png', 'jeep4.png'];
    private destroyedSource: string = assetsFolder + 'fire_3.gif';
    private damagedSource: string = assetsFolder + 'smoke_3.gif';
    private badDamagedSource: string = assetsFolder + 'fire_1.gif';
    private startPosition: number;
    public status: number = Status.active;
    public damage: number = Damage.undamaged;

    constructor(contentEl: HTMLElement) {
        this.speed = RandomNumberGen.randomNumBetween(1, 8);
        this.startPosition = RandomNumberGen.randomNumBetween(10, 90);

        this.targetEl = document.createElement("div");
        this.picEl = document.createElement("img");
        this.picEl.src = assetsFolder + this.picSource[RandomNumberGen.randomNumBetween(0, this.picSource.length - 1)];
        this.damageEl = document.createElement("img");

        this.targetEl.classList.add('target');
        this.targetEl.appendChild(this.picEl);
        this.targetEl.appendChild(this.damageEl);

        this.targetEl.style.top = window.innerHeight * this.startPosition / 100 + 'px';
        this.targetEl.style.left = 0 + 'px';
        this.contentEl = contentEl;
        contentEl.appendChild(this.targetEl);
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
            // MOVE
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
         //   this.picEl.classList.add('destroyed');
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
        }
    }
    private moveAtAngle() {

    }

    public action() {
        if (this.status == Status.active) {

            this.move();
        }
    }
}
