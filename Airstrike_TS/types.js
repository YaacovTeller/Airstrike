const assetsFolder = "./AS_assets/";
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
    weaponNames["gun"] = "gun";
    weaponNames["mortar"] = "mortar";
    weaponNames["howitzer"] = "howitzer";
    weaponNames["airstrike"] = "airstrike";
    weaponNames["nuke"] = "nuke";
})(weaponNames || (weaponNames = {}));
const sniperInfo = {
    name: weaponNames.gun,
    blastRadius: 6,
    speed: 0,
    cursor: "cursor1",
    explosionInfo: {
        imageSource: assetsFolder + 'fire_1.gif',
        sound: [],
        length: 1000
    },
    imageSource: assetsFolder + 'gun.svg',
    sound: gunSounds,
    cooldown: 0,
};
const mortarInfo = {
    name: weaponNames.mortar,
    blastRadius: 50,
    speed: 2000,
    cursor: "cursor2",
    explosionInfo: {
        imageSource: assetsFolder + 'expl.gif',
        sound: [],
        length: 1000
    },
    imageSource: assetsFolder + 'mortar.svg',
    sound: mortarSounds,
    cooldown: 1,
};
const howitzerInfo = {
    name: weaponNames.howitzer,
    blastRadius: 70,
    speed: 3000,
    cursor: "cursor3",
    explosionInfo: {
        imageSource: assetsFolder + 'expl.gif',
        sound: explosions,
        soundDelay: 3000,
        length: 1000
    },
    imageSource: assetsFolder + 'tank.svg',
    sound: howitzerSounds,
    cooldown: 2,
};
const airstrikeInfo = {
    name: weaponNames.airstrike,
    blastRadius: 100,
    speed: 4000,
    cursor: "cursor4",
    explosionInfo: {
        imageSource: assetsFolder + 'expl.gif',
        sound: strikes,
        soundDelay: 2500,
        length: 1000
    },
    imageSource: assetsFolder + 'jet.svg',
    sound: airstrikeSounds,
    cooldown: 4,
};
const nukeInfo = {
    name: weaponNames.nuke,
    blastRadius: 400,
    speed: 6000,
    cursor: "cursor4",
    explosionInfo: {
        imageSource: assetsFolder + 'mushroom_1.gif',
        sound: bigExplosions,
        soundDelay: 6500,
        length: 2500
    },
    imageSource: assetsFolder + 'bomb.svg',
    sound: nukeSounds,
    cooldown: 15,
};
//# sourceMappingURL=types.js.map