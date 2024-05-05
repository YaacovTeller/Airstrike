const assetsFolder = "./AS_assets/";
const classicExplosion = 'expl1.gif';
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
    newTargetEvery: 3000,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 5 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
};
const hard = {
    newTargetEvery: 2000,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
};
const chaos = {
    newTargetEvery: 1000,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 3 },
};
const dev = {
    newTargetEvery: 300,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 3, max: 5 },
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