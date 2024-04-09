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
    blastPower: 0,
    cursor: "cursor1",
    explosionSource: assetsFolder + 'fire_1.gif',
    imageSource: assetsFolder + 'gun.svg',
    explosionLength: 1000,
    sound: gunSounds,
    cooldown: 0,
    instances: [],
};
const mortarInfo = {
    name: weaponNames.mortar,
    blastRadius: 50,
    speed: 2000,
    blastPower: 5,
    cursor: "cursor2",
    explosionSource: assetsFolder + 'expl.gif',
    imageSource: assetsFolder + 'mortar.svg',
    explosionLength: 1000,
    sound: mortarSounds,
    cooldown: 1,
    instances: [],
};
const howitzerInfo = {
    name: weaponNames.howitzer,
    blastRadius: 70,
    speed: 3000,
    blastPower: 5,
    cursor: "cursor3",
    explosionSource: assetsFolder + 'expl.gif',
    imageSource: assetsFolder + 'tank.svg',
    explosionLength: 1000,
    sound: howitzerSounds,
    cooldown: 2,
    instances: [],
};
const airstrikeInfo = {
    name: weaponNames.airstrike,
    blastRadius: 100,
    speed: 4000,
    blastPower: 10,
    cursor: "cursor4",
    explosionSource: assetsFolder + 'expl.gif',
    imageSource: assetsFolder + 'jet.svg',
    explosionLength: 1000,
    sound: airstrikeSounds,
    cooldown: 4,
    instances: [],
};
const nukeInfo = {
    name: weaponNames.nuke,
    blastRadius: 400,
    speed: 6000,
    blastPower: 10,
    cursor: "cursor4",
    explosionSource: assetsFolder + 'mushroom_1.gif',
    imageSource: assetsFolder + 'bomb.svg',
    explosionLength: 2500,
    sound: nukeSounds,
    cooldown: 15,
    instances: [],
};
//# sourceMappingURL=types.js.map