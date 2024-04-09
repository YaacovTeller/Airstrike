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
type explosionInfo = {
    imageSource: string,
    length: number,
    sound: Array<Sound>,
    soundDelay?: number
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
    cooldown: number,
    cursor: string,
    explosionInfo: explosionInfo,
    imageSource: string,
    sound: Array<Sound>,
}

const sniperInfo: weaponInfo = {
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
}
const mortarInfo: weaponInfo = {
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
}
const howitzerInfo: weaponInfo = {
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
}
const airstrikeInfo: weaponInfo = {
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
}
const nukeInfo: weaponInfo = {
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
}