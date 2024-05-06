const assetsFolder: string = "./AS_assets/";
const classicExplosion: string = 'expl1.gif';

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
enum weaponNames {
    gun,
    mortar,
    howitzer,
    airstrike,
    nuke,
    charge
}
type position = {
    X,
    Y
}
type speedRange = {
    max: number,
    min: number
}

type difficultyLevelInfo = {
    newTargetEvery: number,
    failLimit: number
    regTargetSpeed: speedRange,
    modTargetSpeed: speedRange,
    heavyTargetSpeed: speedRange,
    tunnelTargetSpeed: speedRange,
    name: string,
    description: string
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
}
type ExplosiveWeaponInstance = weaponInstance & {
    explosion: HTMLImageElement;
}
type weaponInfo = {
    name: weaponNames,
    sound: Array<Sound>,
    imageSource: string,
    cursor: string,
    speed: number,
    cooldown: number
}
type ExplosiveWeaponInfo = weaponInfo & {
    blastRadius: number,
    explosionInfo: explosionInfo,
}

//const easy: difficultyLevelInfo = {
//    newTargetEvery: 3000,
//    regTargetSpeed: { min: 2, max: 3 },
//    modTargetSpeed: { min: 1, max: 2 },
//    heavyTargetSpeed: { min: 1, max: 1 },
//    tunnelTargetSpeed: { min: 1, max: 2 },
//}
const normal: difficultyLevelInfo = {
    newTargetEvery: 3000,
    failLimit: 15,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 5 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    name: "Normal",
    description: "Regular speed targets, up to 15 will get taken care of for you."
}
const hard: difficultyLevelInfo = {
    newTargetEvery: 2500,
    failLimit: 10,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 2 },
    name: "Hard",
    description: "Faster targets, don't miss more than 10."
}
const chaos: difficultyLevelInfo = {
    failLimit: 1,
    newTargetEvery: 1500,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 1, max: 3 },
    name: "Chaos",
    description: "Targets pile in at a ridiculous rate, you're on your own."
}
const dev: difficultyLevelInfo = {
    failLimit: 9999,
    newTargetEvery: 300,
    regTargetSpeed: { min: 4, max: 8 },
    modTargetSpeed: { min: 4, max: 6 },
    heavyTargetSpeed: { min: 1, max: 3 },
    tunnelTargetSpeed: { min: 3, max: 5 },
    name: "Dev",
    description: "dev"
}


const sniperInfo: ExplosiveWeaponInfo = {
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
}
const mortarInfo: ExplosiveWeaponInfo = {
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
}
const howitzerInfo: ExplosiveWeaponInfo = {
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
}
const airstrikeInfo: ExplosiveWeaponInfo = {
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
}
const nukeInfo: ExplosiveWeaponInfo = {
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
}
const chargeInfo: weaponInfo = {
    name: weaponNames.charge,
    cursor: "cursor4",
    imageSource: assetsFolder + 'dynamite.svg',
    sound: gunSounds,
    speed: 3000,
    cooldown: 8000
}

function loadNewImage() {
    return '?' + new Date().getTime();
}
class ContentElHandler {
    static returnContentEl() {
        return document.getElementById("content")!;
    }
    static addToContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
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
    static mousePos: position = { X: '', Y: '' };

    static updateMousePos(event?: MouseEvent) {
        if (event) {
            this.mousePos.X = event.clientX
            this.mousePos.Y = event.clientY
        }
        return this.mousePos
    }
}
class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}