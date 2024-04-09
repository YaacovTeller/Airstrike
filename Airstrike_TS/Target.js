var Status;
(function (Status) {
    Status[Status["active"] = 0] = "active";
    Status[Status["disabled"] = 1] = "disabled";
    Status[Status["escaped"] = 2] = "escaped";
})(Status || (Status = {}));
var Damage;
(function (Damage) {
    Damage[Damage["undamaged"] = 0] = "undamaged";
    Damage[Damage["damaged"] = 1] = "damaged";
    Damage[Damage["moderateDamaged"] = 2] = "moderateDamaged";
    Damage[Damage["heavyDamaged"] = 3] = "heavyDamaged";
    Damage[Damage["destroyed"] = 4] = "destroyed";
})(Damage || (Damage = {}));
class Target {
    targetEl;
    picEl;
    damageEl;
    contentEl;
    speed;
    picSource = ['jeep.png', 'jeep.png', 'jeep2.png', 'jeep3.png', 'jeep_grey.png', 'jeep4.png', 'jeep_Grey_armour_1.png'];
    destroyedSource = assetsFolder + 'fire_3.gif';
    damagedSource = assetsFolder + 'smoke_3.gif';
    badDamagedSource = assetsFolder + 'fire_1.gif';
    startPosition;
    status = Status.active;
    damage = Damage.undamaged;
    constructor(contentEl) {
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
    move() {
        let x = parseInt(this.targetEl.style.left);
        if (x > this.contentEl.clientWidth) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = x + this.speed + "px";
    }
    getTargetEl() {
        return this.targetEl;
    }
    hit(sev, direc) {
        if (sev > strikeSeverity.light) {
            this.status = Status.disabled;
        }
        else {
            setTimeout(() => this.status = Status.disabled, 1000);
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
    flip(elem, direc) {
        let num = RandomNumberGen.randomNumBetween(1, 1);
        if (num == 1 && direc) {
            this.picEl.classList.remove('flipforward');
            this.picEl.classList.remove('flipbackward');
            this.picEl.classList.add('flip' + direc);
            CollisionDetection.throw(elem, direc);
        }
    }
    action() {
        if (this.status == Status.active) {
            this.move();
        }
    }
}
//# sourceMappingURL=target.js.map