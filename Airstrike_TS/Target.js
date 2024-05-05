const crashTimeout = 600;
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
var Armour;
(function (Armour) {
    Armour[Armour["none"] = 0] = "none";
    Armour[Armour["moderate"] = 1] = "moderate";
    Armour[Armour["heavy"] = 2] = "heavy";
})(Armour || (Armour = {}));
// speeds are actually set with the difficulty settings. Nominal values here
const regTarget = {
    minSpeed: 4,
    maxSpeed: 8,
    armour: Armour.none,
    picSources: ['jeep.png', 'jeep.png', 'jeep2.png', 'jeep3.png', 'jeep4_cres.png']
};
const modTarget = {
    minSpeed: 4,
    maxSpeed: 6,
    armour: Armour.moderate,
    picSources: ['jeep_grey.png']
};
const heavyTarget = {
    minSpeed: 1,
    maxSpeed: 3,
    armour: Armour.heavy,
    picSources: ['jeep_grey_armour.png']
};
const regTunnelTarget = {
    minSpeed: 1,
    maxSpeed: 2,
    armour: Armour.moderate,
    picSources: ['trans.png']
};
class Target {
    targetEl;
    picEl;
    damageEl;
    speed;
    armour;
    startPosition;
    status = Status.active;
    damage = Damage.undamaged;
    movesAtBlast;
    constructor(info) {
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
    hit(sev, direc) { }
    move() {
        let x = parseInt(this.targetEl.style.left);
        if (x > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
        }
        this.targetEl.style.left = x + this.speed + "px";
    }
    getTargetEl() {
        return this.targetEl;
    }
    flip(direc) {
        this.picEl.classList.remove('flipforward');
        this.picEl.classList.remove('flipbackward');
        this.picEl.classList.add('flip' + direc);
        setTimeout(() => RandomSoundGen.playRandomSound(crashes), crashTimeout);
    }
    action() {
        if (this.status == Status.active) {
            this.move();
        }
    }
}
class TunnelTarget extends Target {
    trailBlast = assetsFolder + 'expl1.gif';
    damagedSource = assetsFolder + 'smoke_3.gif';
    destroyedSource = assetsFolder + 'fire_1.gif';
    movesAtBlast = false;
    trail;
    constructor(info) {
        super(info);
        this.trail = document.createElement('div');
        this.trail.className = 'trail';
        this.targetEl.classList.remove('flexCenter'); // MESSY
        this.targetEl.classList.add('flexEnd');
        this.targetEl.classList.add('tunnelHead');
        this.targetEl.append(this.trail);
    }
    extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    hit(sev) {
        this.status = Status.disabled;
        console.log("tunnel hit, SEV: " + sev);
        if (sev >= strikeSeverity.catastrophic) {
            this.damage = Damage.destroyed;
            this.picEl.src = this.damagedSource;
            this.targetEl.classList.remove('tunnelHead');
            this.blowTunnel();
        }
        else {
            console.log("... but not blown");
        }
    }
    blowTunnel() {
        let numOfimgs = parseInt(this.trail.style.width) / 100;
        let imgArr = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let index in imgArr) {
            setTimeout(() => {
                mortar.genericExplosion(imgArr[index], game.targets);
                imgArr[index].src = this.trailBlast + loadNewImage();
            }, (parseInt(index) + 1) * 150);
        }
    }
    action() {
        if (this.status == Status.active) {
            this.move();
            this.extendTunnel();
        }
    }
}
class VehicleTarget extends Target {
    destroyedSource = assetsFolder + 'fire_3.gif';
    damagedSource = assetsFolder + 'smoke_3.gif';
    badDamagedSource = assetsFolder + 'fire_1.gif';
    movesAtBlast = true;
    constructor(info) {
        super(info);
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
    badDamage(direc) {
        this.damageEl.src = this.badDamagedSource;
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? aluak.play() : "";
        CollisionDetection.throw(this.targetEl, direc); // ARC
        this.flip(direc); // ROTATION
    }
}
//# sourceMappingURL=target.js.map