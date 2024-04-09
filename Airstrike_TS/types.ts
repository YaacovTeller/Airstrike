const assetsFolder: string = "./AS_assets/";
enum direction {
    forward = "forward",
    backward = "backward"
}
enum strikeSeverity {
    light,
    medium,
    heavy,
    catastrophic
}
type position = {
    X,
    Y
}
enum weaponNames {
    gun = "gun",
    mortar = "mortar",
    howitzer = "howitzer",
    airstrike = "airstrike",
    nuke = "nuke",
}
type weaponInstance = {
    ready: boolean;
    blastRadElement: HTMLElement;
    explosion: HTMLElement;
}
type weaponInfo = {
    name: string,
    blastRadius: number,
    speed: number,
    blastPower: number,
    cooldown: number,
    cursor: string,
    explosionSource: string,
    explosionLength: number,
    imageSource: string,
    sound: Array<Sound>,
    instances: Array<weaponInstance>,
}

const sniperInfo: weaponInfo = {
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
}
const mortarInfo: weaponInfo = {
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
}
const howitzerInfo: weaponInfo = {
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
}
const airstrikeInfo: weaponInfo = {
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
}
const nukeInfo: weaponInfo = {
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
}