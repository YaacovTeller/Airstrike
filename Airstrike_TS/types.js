"use strict";
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
const allRains = [noRain, lightRain, medRain, heavyRain];
const progressMarkers = {
    0: "Unacceptable",
    10: "Objectionable",
    20: "Disporportionate",
    30: "Intolerable",
    40: "Outrageous",
    50: "Indiscriminate",
    60: "Atrocious",
    70: "Reprehensible",
    80: "Deplorable",
    90: "Despicable",
    100: "Genocidal"
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
var HitSurface;
(function (HitSurface) {
    HitSurface[HitSurface["water"] = 0] = "water";
    HitSurface[HitSurface["land"] = 1] = "land";
})(HitSurface || (HitSurface = {}));
var ExplSizes;
(function (ExplSizes) {
    ExplSizes[ExplSizes["XXS"] = 20] = "XXS";
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
// Enemies hiding in a building: they don't move, and only the building's fate can touch them
const buildingEnemyTarget = {
    minSpeed: 0,
    maxSpeed: 0,
    armour: Armour.none,
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
const boatTarget = {
    minSpeed: 0,
    maxSpeed: 0,
    armour: Armour.moderate,
};
// The smaller boat has no armour, so it takes damage like a jeep: any proper hit sets it ablaze
const smallBoatTarget = {
    ...boatTarget,
    armour: Armour.none,
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
    weaponNames[weaponNames["sniper"] = 1] = "sniper";
    weaponNames[weaponNames["mortar"] = 2] = "mortar";
    weaponNames[weaponNames["tank"] = 3] = "tank";
    weaponNames[weaponNames["airstrike"] = 4] = "airstrike";
    weaponNames[weaponNames["drone"] = 5] = "drone";
    weaponNames[weaponNames["tunnel_Charge"] = 6] = "tunnel_Charge";
    weaponNames[weaponNames["flare"] = 7] = "flare";
    weaponNames[weaponNames["tactical_Nuke"] = 8] = "tactical_Nuke";
    weaponNames[weaponNames["chopper"] = 9] = "chopper";
    weaponNames[weaponNames["surveillance"] = 10] = "surveillance";
    weaponNames[weaponNames["carpet_bomb"] = 11] = "carpet_bomb"; // the - key
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
        description: "Regular speed targets, up to <b>15</b> will get taken care of for you.",
    },
    heb: {
        name: "רגיל",
        description: "יעדי מהירות רגילים, עד <b>15</b> יטופלו עבורך."
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
        description: "Faster targets, don't miss more than <b>10</b>.",
    },
    heb: {
        name: "קשה",
        description: "מטרות מהירות יותר, אל תפספסו יותר מ-<b>10</b>."
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
        description: "Targets pile in at a ridiculous rate, <b>you're on your own</b>.",
    },
    heb: {
        name: "מהומה",
        description: "מטרות נערמות בקצב מגוחך,  <b>אתה לבד</b>"
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
    name: weaponNames.sniper,
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
        frames: expl_small_imgs,
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
        frames: expl_small_imgs,
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
        frames: expl_med_imgs,
        sound: strikes,
        soundDelay: 2500,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'jet.svg',
    sound: airstrikeSounds,
    speed: 4000,
    cooldown: 10000,
    noAmmo: bleep_neg,
    select: [jet_pass],
    flyover: {
        imageSource: assetsSVGFolder + 'f16.svg',
        speed: 40,
        duration: 2000,
        delay: 2000
    }
};
const nukeInfo = {
    name: weaponNames.tactical_Nuke,
    class: ExplosiveWeaponType,
    blastRadius: 400,
    cursor: "cursor4",
    explosionInfo: {
        size: ExplSizes.XXL,
        frames: expl_big_imgs,
        sound: bigExplosions,
        soundDelay: 6500,
        length: 2500,
    },
    imageSource: assetsSVGFolder + 'bomb_nuke.svg',
    sound: nukeSounds,
    speed: 6000,
    cooldown: 30000,
    noAmmo: bleep_neg,
    select: [redeemerpickup],
    flyover: {
        imageSource: assetsSVGFolder + 'f16.svg',
        speed: 15,
        duration: 2000,
        delay: 2500
    }
};
// A superweapon, like the nuke: three aircraft sweep the whole width of the screen, right to left,
// along a band around the mouse, carpeting it with airstrike-sized explosions.
const carpetBombInfo = {
    name: weaponNames.carpet_bomb,
    displayName: "Carpet Strike",
    class: CarpetBombing,
    cursor: "cursor4",
    blastRadius: 150, // half the height of the band it covers
    explosionInfo: {
        size: ExplSizes.XL, // same as the airstrike
        frames: expl_med_imgs,
        sound: [],
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'f16.svg',
    sound: airstrikeSounds,
    speed: 0,
    cooldown: 30000,
    noAmmo: bleep_neg,
    select: [redeemerpickup],
    flyover: {
        imageSource: assetsSVGFolder + 'f16.svg', // the same shadow, but three of them and slower than the airstrike's
        speed: 10,
        duration: 2000,
        delay: 2000
    }
};
const chargeInfo = {
    name: weaponNames.tunnel_Charge,
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
        frames: expl_small_imgs,
        sound: explosions,
        length: 1000,
        soundDelay: 2000
    },
    imageSource: assetsSVGFolder + 'drone.svg',
    sound: [jet],
    speed: 3000,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: [jet],
    flyover: {
        imageSource: assetsSVGFolder + 'reaper3.svg',
        speed: 15,
        duration: 2000,
        delay: 2000
    }
};
const chopperInfo = {
    name: weaponNames.chopper,
    class: Chopper,
    cursor: "cursor4",
    blastRadius: 20,
    explosionInfo: {
        size: ExplSizes.tiny,
        frames: expl_small_imgs,
        sound: explosions,
        length: 1000,
        soundDelay: 1000
    },
    imageSource: assetsSVGFolder + 'chopper.svg',
    sound: chopper,
    speed: 3000,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: chopper,
    flyover: {
        imageSource: assetsSVGFolder + 'chopper.png',
        speed: 5,
        duration: 7000,
        delay: 500
    }
};
// A utility weapon: a slow pass of a drone that shows up what's hiding in buildings under the mouse
const surveillanceInfo = {
    name: weaponNames.surveillance,
    displayName: "Surveillance Drone",
    class: SurveillanceDrone,
    cursor: "cursor4",
    blastRadius: 90, // how far around the mouse it can pick up a heat signature
    explosionInfo: {
        size: ExplSizes.tiny,
        frames: [],
        sound: [],
        length: 0,
    },
    imageSource: assetsSVGFolder + 'drone.svg',
    sound: [jet],
    speed: 0,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: [jet],
    flyover: {
        imageSource: assetsSVGFolder + 'reaper3.svg',
        speed: 3, // vw per 100ms, so a pass of 4s crosses the screen with a bit to spare
        duration: 4000,
        delay: 1000 // a second to arrive
    }
};
const flareInfo = {
    name: weaponNames.flare,
    class: Flare,
    cursor: "cursor4",
    blastRadius: 300,
    explosionInfo: {
        size: ExplSizes.small,
        frames: expl_small_imgs,
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
// ---- Scaled-down weapon set, used by Test_3 instead of the standard weapons above ----
// Each one is a standard weapon with a smaller explosion -- one rung down the ExplSizes ladder -- so it
// covers a smaller area and needs a closer hit to do the same damage, and it keeps that weapon's name,
// so it hurts things the way that weapon does. There's no gun: it can't hurt anything in this mode, so
// the bombs take slots 1-3 (the "slot" setting, which is separate from the name), and the guided strike
// keeps 5. Everything else (cooldowns, flight times, flyovers, impact sounds) is inherited.
// The jet icon and aircraft noises (from the airstrike) are placeholders for the bombs.
const jetPlaceholder = {
    imageSource: airstrikeInfo.imageSource,
    sound: airstrikeInfo.sound,
    select: airstrikeInfo.select,
    noAmmo: airstrikeInfo.noAmmo,
};
const scaledMortarInfo = {
    ...mortarInfo,
    ...jetPlaceholder,
    slot: 1,
    displayName: "Light Bomb",
    blastRadius: 30,
    explosionInfo: { ...mortarInfo.explosionInfo, size: ExplSizes.tiny }, // about a chopper round
};
const scaledHowitzerInfo = {
    ...howitzerInfo,
    ...jetPlaceholder,
    slot: 2,
    displayName: "Bomb",
    blastRadius: 50,
    explosionInfo: { ...howitzerInfo.explosionInfo, size: ExplSizes.small }, // about the standard mortar
};
const scaledAirstrikeInfo = {
    ...airstrikeInfo,
    ...jetPlaceholder,
    slot: 3,
    displayName: "Heavy Bomb",
    blastRadius: 70,
    explosionInfo: { ...airstrikeInfo.explosionInfo, size: ExplSizes.large }, // about the standard howitzer
};
const scaledDroneInfo = {
    ...droneInfo, // with its own drone icon
    displayName: "Guided Strike",
    explosionInfo: { ...droneInfo.explosionInfo, size: ExplSizes.tiny },
};
const scaledWeapons = [scaledMortarInfo, scaledHowitzerInfo, scaledAirstrikeInfo, scaledDroneInfo];
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
        SoundPlayer.playWithVolumeSet(bleepbleep);
        if (!this.popUpArray.length)
            return;
        let popup = document.getElementById("popupBox");
        let currentMsg = this.popUpArray[0];
        let titlebox = document.getElementById("popupTitle");
        let textbox = document.getElementById("popupText");
        //titlebox.innerText = currentMsg.title;
        //textbox.innerText = currentMsg.text;
        titlebox.innerHTML = currentMsg.title;
        textbox.innerHTML = currentMsg.text;
        popup.classList.remove("hide");
        let this_ = this;
        setTimeout(function () {
            popup.classList.add("hide");
        }, currentMsg.length);
        setTimeout(function () {
            titlebox.innerHTML = "";
            textbox.innerHTML = "";
            this_.popUpArray.shift();
            this_.showPopup();
        }, currentMsg.length + 200);
    }
}
//# sourceMappingURL=types.js.map