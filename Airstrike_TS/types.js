var RainTypes;
(function (RainTypes) {
    RainTypes["none"] = "none";
    RainTypes["light"] = "lightRain";
    RainTypes["medium"] = "mediumRain";
    RainTypes["heavy"] = "heavyRain";
})(RainTypes || (RainTypes = {}));
const noRain = {
    className: RainTypes.none,
    drops: 0,
    angle: 0,
    height: '100vh',
};
const lightRain = {
    className: RainTypes.light,
    drops: 30,
    angle: 0,
    height: '100vh',
    ambience: rain_amb
};
const medRain = {
    className: RainTypes.medium,
    drops: 100,
    angle: 15,
    height: '140vh',
    ambience: heavyRain_amb
};
const heavyRain = {
    className: RainTypes.heavy,
    drops: 150,
    angle: 35,
    height: '190vh',
    ambience: storm_amb
};
const multiKillText = {
    2: { size: 30, colour: 'yellow' },
    3: { size: 45, colour: 'orange' },
    4: { size: 60, colour: 'red' },
    5: { size: 75, colour: 'green' },
    6: { size: 90, colour: 'blue' },
    7: { size: 105, colour: 'purple' },
    8: { size: 120, colour: 'brown' },
    9: { size: 135, colour: 'grey' },
    10: { size: 150, colour: 'black' },
    11: { size: 170, colour: 'black' },
    12: { size: 190, colour: 'black' },
    13: { size: 200, colour: 'black' },
    14: { size: 200, colour: 'black' },
};
var ExplSizes;
(function (ExplSizes) {
    ExplSizes[ExplSizes["tiny"] = 60] = "tiny";
    ExplSizes[ExplSizes["small"] = 100] = "small";
    ExplSizes[ExplSizes["large"] = 140] = "large";
    ExplSizes[ExplSizes["XL"] = 200] = "XL";
    ExplSizes[ExplSizes["XXL"] = 800] = "XXL";
})(ExplSizes || (ExplSizes = {}));
var Status;
(function (Status) {
    Status[Status["active"] = 0] = "active";
    Status[Status["disabled"] = 1] = "disabled";
    Status[Status["escaped"] = 2] = "escaped";
})(Status || (Status = {}));
var Damage;
(function (Damage) {
    Damage[Damage["undamaged"] = 0] = "undamaged";
    Damage[Damage["dented"] = 1] = "dented";
    Damage[Damage["badlyDented"] = 2] = "badlyDented";
    Damage[Damage["damaged"] = 3] = "damaged";
    Damage[Damage["moderateDamaged"] = 4] = "moderateDamaged";
    Damage[Damage["heavyDamaged"] = 5] = "heavyDamaged";
    Damage[Damage["destroyed"] = 6] = "destroyed";
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
};
const modTarget = {
    minSpeed: 4,
    maxSpeed: 6,
    armour: Armour.moderate,
};
const heavyTarget = {
    minSpeed: 1,
    maxSpeed: 3,
    armour: Armour.heavy,
};
const rocketLauncher = {
    minSpeed: 2,
    maxSpeed: 4,
    armour: Armour.heavy,
};
const regTunnelTarget = {
    minSpeed: 1,
    maxSpeed: 2,
    armour: Armour.moderate,
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
    weaponNames[weaponNames["gun"] = 1] = "gun";
    weaponNames[weaponNames["mortar"] = 2] = "mortar";
    weaponNames[weaponNames["tank"] = 3] = "tank";
    weaponNames[weaponNames["airstrike"] = 4] = "airstrike";
    weaponNames[weaponNames["drone"] = 5] = "drone";
    weaponNames[weaponNames["tunnelcharge"] = 6] = "tunnelcharge";
    weaponNames[weaponNames["nuke"] = 7] = "nuke";
    weaponNames[weaponNames["flare"] = 8] = "flare";
    weaponNames[weaponNames["chopper"] = 9] = "chopper";
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
    regTargetSpeed: { min: 2, max: 5 },
    modTargetSpeed: { min: 2, max: 4 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    eng: {
        name: "Normal",
        description: "Regular speed targets, up to 15 will get taken care of for you.",
    },
    heb: {
        name: "רגיל",
        description: "יעדי מהירות רגילים, עד 15 יטופלו עבורך."
    }
};
const hard = {
    newTargetEvery: 2500,
    failLimit: 10,
    regTargetSpeed: { min: 4, max: 7 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    eng: {
        name: "Hard",
        description: "Faster targets, don't miss more than 10.",
    },
    heb: {
        name: "קשה",
        description: "מטרות מהירות יותר, אל תפספסו יותר מ-10."
    }
};
const chaos = {
    failLimit: 1,
    newTargetEvery: 1300,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 3 },
    eng: {
        name: "Chaos",
        description: "Targets pile in at a ridiculous rate, you're on your own.",
    },
    heb: {
        name: "מהומה",
        description: "מטרות נערמות בקצב מגוחך, אתה לבד"
    }
};
const dev = {
    failLimit: 9999,
    newTargetEvery: 300,
    regTargetSpeed: { min: 8, max: 8 },
    modTargetSpeed: { min: 9, max: 9 },
    heavyTargetSpeed: { min: 8, max: 8 },
    tunnelTargetSpeed: { min: 4, max: 6 },
    eng: {
        name: "Dev",
        description: "",
    },
    heb: {
        name: "",
        description: ""
    }
};
const sniperInfo = {
    name: weaponNames.gun,
    class: BulletWeaponType,
    cursor: "cursor1",
    imageSource: assetsSVGFolder + 'gun.svg',
    sound: gunSounds,
    speed: 0,
    cooldown: 700,
    noAmmo: click_1,
    select: [mag]
};
const mortarInfo = {
    name: weaponNames.mortar,
    class: ExplosiveWeaponType,
    blastRadius: 50,
    cursor: "cursor2",
    explosionInfo: {
        size: ExplSizes.small,
        imageSource: assetsFolder + classicExplosion,
        sound: [],
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'mortar.svg',
    sound: mortarSounds,
    speed: 2000,
    cooldown: 2200,
    noAmmo: click_2,
    select: gib
};
const howitzerInfo = {
    name: weaponNames.tank,
    class: ExplosiveWeaponType,
    blastRadius: 70,
    cursor: "cursor3",
    explosionInfo: {
        size: ExplSizes.large,
        imageSource: assetsFolder + classicExplosion,
        sound: explosions,
        soundDelay: 3000,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'tank.svg',
    sound: howitzerSounds,
    speed: 3000,
    cooldown: 7000,
    noAmmo: click_2,
    select: [flak]
};
const airstrikeInfo = {
    name: weaponNames.airstrike,
    class: ExplosiveWeaponType,
    blastRadius: 100,
    cursor: "cursor4",
    explosionInfo: {
        size: ExplSizes.XL,
        imageSource: assetsFolder + strikeExplosion,
        sound: strikes,
        soundDelay: 2500,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'jet.svg',
    sound: airstrikeSounds,
    speed: 4000,
    cooldown: 10000,
    noAmmo: bleep_neg,
    select: [jet_pass]
};
const nukeInfo = {
    name: weaponNames.nuke,
    class: ExplosiveWeaponType,
    blastRadius: 400,
    cursor: "cursor4",
    explosionInfo: {
        size: ExplSizes.XXL,
        imageSource: assetsFolder + mushroomExplosion,
        sound: bigExplosions,
        soundDelay: 6500,
        length: 2500,
    },
    imageSource: assetsSVGFolder + 'bomb_nuke.svg',
    sound: nukeSounds,
    speed: 6000,
    cooldown: 30000,
    noAmmo: bleep_neg,
    select: [redeemerpickup]
};
const chargeInfo = {
    name: weaponNames.tunnelcharge,
    class: ChargeWeaponType,
    cursor: "cursor4",
    imageSource: assetsSVGFolder + 'dynamite.svg',
    sound: gunSounds,
    speed: 3000,
    cooldown: 8000,
    noAmmo: bleep_neg,
    select: [alarm3]
};
const droneInfo = {
    name: weaponNames.drone,
    class: DroneWeaponType,
    cursor: "cursor4",
    blastRadius: 0,
    explosionInfo: {
        size: ExplSizes.small,
        imageSource: assetsFolder + classicExplosion,
        sound: explosions,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'drone.svg',
    sound: [jet],
    speed: 3000,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: [jet]
};
const chopperInfo = {
    name: weaponNames.chopper,
    class: Chopper,
    cursor: "cursor4",
    blastRadius: 20,
    explosionInfo: {
        size: ExplSizes.tiny,
        imageSource: assetsFolder + classicExplosion,
        sound: explosions,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'chopper.svg',
    sound: chopper,
    speed: 3000,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: chopper
};
const flareInfo = {
    name: weaponNames.flare,
    class: Flare,
    cursor: "cursor4",
    blastRadius: 300,
    explosionInfo: {
        size: ExplSizes.small,
        imageSource: assetsFolder + classicExplosion,
        sound: [],
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'flame5.svg',
    sound: mortarSounds,
    speed: 2000,
    cooldown: 12000,
    noAmmo: click_2,
    select: gib
};
function loadNewImage() {
    return '?' + new Date().getTime();
}
var msgLength;
(function (msgLength) {
    msgLength[msgLength["long"] = 3000] = "long";
    msgLength[msgLength["short"] = 2000] = "short";
})(msgLength || (msgLength = {}));
class PopupHandler {
    static popUpArray = [];
    static addToArray(txt, title, lngth) {
        let msg = {
            text: txt,
            title: title ? title : null,
            length: lngth ? lngth : msgLength.short
        };
        this.popUpArray.push(msg);
        if (this.popUpArray.length == 1) {
            this.showPopup();
        }
    }
    static showPopup() {
        //pop.play();
        bleepbleep.play();
        if (!this.popUpArray.length)
            return;
        let popup = document.getElementById("popupBox");
        let currentMsg = this.popUpArray[0];
        let titlebox = document.getElementById("popupTitle");
        let textbox = document.getElementById("popupText");
        titlebox.innerText = currentMsg.title;
        textbox.innerText = currentMsg.text;
        popup.classList.remove("hide");
        let this_ = this;
        setTimeout(function () {
            popup.classList.add("hide");
        }, currentMsg.length);
        setTimeout(function () {
            titlebox.innerText = "";
            textbox.innerText = "";
            this_.popUpArray.shift();
            this_.showPopup();
        }, currentMsg.length + 200);
    }
}
class ContentElHandler {
    static returnContentWrapper() {
        return document.getElementById("contentWrapper");
    }
    static addToContentWrapper(elem) {
        this.returnContentWrapper().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content");
    }
    static addToContentEl(elem) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem) {
        let contentEl = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
    }
    static returnNewEl(parent, classname) {
        let el = document.createElement('div');
        el.className = classname;
        //    parent.appendChild(el);
        parent.prepend(el);
        return el;
    }
    static contentElWidth() {
        return document.getElementById("content").clientWidth;
    }
    static clearContent() {
        document.getElementById("content").innerHTML = "";
    }
    static fadeRemoveItem(item, stayTime, fadeTime, array) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime);
        setTimeout(() => {
            if (item) {
                ContentElHandler.removeFromContentEl(item);
                if (array) {
                    let index = array.indexOf(item);
                    if (index >= 0) {
                        array.splice(index, 1);
                    }
                }
            }
        }, stayTime + fadeTime);
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