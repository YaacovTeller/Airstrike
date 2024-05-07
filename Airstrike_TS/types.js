const assetsFolder = "./AS_assets/";
const classicExplosion = 'expl1.gif';
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
var direction;
(function (direction) {
    direction["forward"] = "forward";
    direction["backward"] = "backward";
})(direction || (direction = {}));
var strikeSeverity;
(function (strikeSeverity) {
    strikeSeverity[strikeSeverity["light"] = 0] = "light";
    strikeSeverity[strikeSeverity["medium"] = 1] = "medium";
    strikeSeverity[strikeSeverity["heavy"] = 2] = "heavy";
    strikeSeverity[strikeSeverity["catastrophic"] = 3] = "catastrophic";
})(strikeSeverity || (strikeSeverity = {}));
var weaponNames;
(function (weaponNames) {
    weaponNames[weaponNames["gun"] = 0] = "gun";
    weaponNames[weaponNames["mortar"] = 1] = "mortar";
    weaponNames[weaponNames["howitzer"] = 2] = "howitzer";
    weaponNames[weaponNames["airstrike"] = 3] = "airstrike";
    weaponNames[weaponNames["nuke"] = 4] = "nuke";
    weaponNames[weaponNames["charge"] = 5] = "charge";
})(weaponNames || (weaponNames = {}));
//const easy: difficultyLevelInfo = {
//    newTargetEvery: 3000,
//    regTargetSpeed: { min: 2, max: 3 },
//    modTargetSpeed: { min: 1, max: 2 },
//    heavyTargetSpeed: { min: 1, max: 1 },
//    tunnelTargetSpeed: { min: 1, max: 2 },
//}
const normal = {
    newTargetEvery: 3500,
    failLimit: 15,
    regTargetSpeed: { min: 3, max: 6 },
    modTargetSpeed: { min: 3, max: 4 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    name: "Normal",
    description: "Regular speed targets, up to 15 will get taken care of for you."
};
const hard = {
    newTargetEvery: 2500,
    failLimit: 10,
    regTargetSpeed: { min: 4, max: 7 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    name: "Hard",
    description: "Faster targets, don't miss more than 10."
};
const chaos = {
    failLimit: 1,
    newTargetEvery: 1500,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 3 },
    name: "Chaos",
    description: "Targets pile in at a ridiculous rate, you're on your own."
};
const dev = {
    failLimit: 9999,
    newTargetEvery: 300,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 3, max: 5 },
    name: "Dev",
    description: "dev"
};
const sniperInfo = {
    name: weaponNames.gun,
    blastRadius: 6,
    cursor: "cursor1",
    explosionInfo: {
        imageSource: assetsFolder + 'fire_1.gif',
        sound: [],
        length: 1000
    },
    imageSource: assetsFolder + 'gun.svg',
    sound: gunSounds,
    speed: 0,
    cooldown: 500,
};
const mortarInfo = {
    name: weaponNames.mortar,
    blastRadius: 50,
    cursor: "cursor2",
    explosionInfo: {
        imageSource: assetsFolder + classicExplosion,
        sound: [],
        length: 1000
    },
    imageSource: assetsFolder + 'mortar.svg',
    sound: mortarSounds,
    speed: 2000,
    cooldown: 2000,
};
const howitzerInfo = {
    name: weaponNames.howitzer,
    blastRadius: 70,
    cursor: "cursor3",
    explosionInfo: {
        imageSource: assetsFolder + classicExplosion,
        sound: explosions,
        soundDelay: 3000,
        length: 1000
    },
    imageSource: assetsFolder + 'tank.svg',
    sound: howitzerSounds,
    speed: 3000,
    cooldown: 6000,
};
const airstrikeInfo = {
    name: weaponNames.airstrike,
    blastRadius: 100,
    cursor: "cursor4",
    explosionInfo: {
        imageSource: assetsFolder + classicExplosion,
        sound: strikes,
        soundDelay: 2500,
        length: 1000
    },
    imageSource: assetsFolder + 'jet.svg',
    sound: airstrikeSounds,
    speed: 4000,
    cooldown: 9000,
};
const nukeInfo = {
    name: weaponNames.nuke,
    blastRadius: 400,
    cursor: "cursor4",
    explosionInfo: {
        imageSource: assetsFolder + 'mushroom_1.gif',
        sound: bigExplosions,
        soundDelay: 6500,
        length: 2500
    },
    imageSource: assetsFolder + 'bomb.svg',
    sound: nukeSounds,
    speed: 6000,
    cooldown: 15000,
};
const chargeInfo = {
    name: weaponNames.charge,
    cursor: "cursor4",
    imageSource: assetsFolder + 'dynamite.svg',
    sound: gunSounds,
    speed: 3000,
    cooldown: 8000
};
function loadNewImage() {
    return '?' + new Date().getTime();
}
class ContentElHandler {
    static returnContentEl() {
        return document.getElementById("content");
    }
    static addToContentEl(elem) {
        let contentEl = this.returnContentEl();
        contentEl.appendChild(elem);
    }
    static contentElWidth() {
        return document.getElementById("content").clientWidth;
    }
    static clearContent() {
        document.getElementById("content").innerHTML = "";
    }
}
class MouseHandler {
    static mousePos = { X: '', Y: '' };
    static updateMousePos(event) {
        if (event) {
            this.mousePos.X = event.clientX;
            this.mousePos.Y = event.clientY;
        }
        return this.mousePos;
    }
}
class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
//# sourceMappingURL=types.js.map