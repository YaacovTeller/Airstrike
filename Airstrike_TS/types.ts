const assetsFolder: string = "./AS_assets/";
const assetsSVGFolder: string = assetsFolder + "SVG/"
const classicExplosion: string = 'expl1.gif';
enum ExplSizes {
    small = 100,
    large = 140,
    XL = 200,
    XXL = 800,
}
enum Status {
    active,
    disabled,
    escaped
}
enum Damage {
    undamaged,
    damaged,
    moderateDamaged,
    heavyDamaged,
    destroyed
}
enum Armour {
    none,
    moderate,
    heavy,
}
type TargetInfo = {
    maxSpeed: number,
    minSpeed: number,
    armour: Armour,
    picSources: Array<string>,
}
// speeds are actually set with the difficulty settings. Nominal values here
const regTarget: TargetInfo = {
    minSpeed: 4,
    maxSpeed: 8,
    armour: Armour.none,
    picSources: ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png','jeep3.png', 'jeep3.png', 'jeep4_cres.png']
}
const modTarget: TargetInfo = {
    minSpeed: 4,
    maxSpeed: 6,
    armour: Armour.moderate,
    picSources: ['jeep_grey.png']
}
const heavyTarget: TargetInfo = {
    minSpeed: 1,
    maxSpeed: 3,
    armour: Armour.heavy,
    picSources: ['jeep_grey_armour.png']
}
const regTunnelTarget: TargetInfo = {
    minSpeed: 1,
    maxSpeed: 2,
    armour: Armour.moderate,
    picSources: ['trans.png']
}

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
    gun = 1,
    mortar = 2,
    tank = 3,
    airstrike = 4,
    tunnelcharge = 5,
    nuke = 6,
    drone = 7,
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
    eng: langInfo,
    heb: langInfo
}
type langInfo = {
    name: string,
    description: string
}

type weaponInstance = {
    ready: boolean;
    blastRadElement?: HTMLElement;
}

type weaponInfo = {
    name: weaponNames,
    sound: Array<Sound>,
    imageSource: string,
    cursor: string,
    speed: number,
    cooldown: number,
    noAmmo: Sound,
    select: Sound,
}
type ExplosiveWeaponInfo = weaponInfo & {
    blastRadius: number,
    explosionInfo: ExplosionInfo,
}
type ExplosionInfo = {
    imageSource: string,
    size: ExplSizes,
    length: number,
    sound: Array<Sound>,
    soundDelay?: number,
}

//const easy: difficultyLevelInfo = {
//    newTargetEvery: 3000,
//    regTargetSpeed: { min: 2, max: 3 },
//    modTargetSpeed: { min: 1, max: 2 },
//    heavyTargetSpeed: { min: 1, max: 1 },
//    tunnelTargetSpeed: { min: 1, max: 2 },
//}
const normal: difficultyLevelInfo = {
    newTargetEvery: 3500,
    failLimit: 15,
    regTargetSpeed: { min: 3, max: 6 },
    modTargetSpeed: { min: 3, max: 4 },
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
}
const hard: difficultyLevelInfo = {
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
}
const chaos: difficultyLevelInfo = {
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
}
const dev: difficultyLevelInfo = {
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
}
const sniperInfo: weaponInfo = {
    name: weaponNames.gun,
    cursor: "cursor1",
    imageSource: assetsSVGFolder + 'gun.svg',
    sound: gunSounds,
    speed: 0,
    cooldown: 700,
    noAmmo: click_1,
    select: mag
}
const mortarInfo: ExplosiveWeaponInfo = {
    name: weaponNames.mortar,
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
    select: mag
}
const howitzerInfo: ExplosiveWeaponInfo = {
    name: weaponNames.tank,
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
    select: flak
}
const airstrikeInfo: ExplosiveWeaponInfo = {
    name: weaponNames.airstrike,
    blastRadius: 100,
    cursor: "cursor4",
    explosionInfo: {
        size: ExplSizes.XL,

        imageSource: assetsFolder + 'expl_big.gif',
        sound: strikes,
        soundDelay: 2500,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'jet.svg',
    sound: airstrikeSounds,
    speed: 4000,
    cooldown: 10000,
    noAmmo: bleep_neg,
    select: jet_pass
}
const nukeInfo: ExplosiveWeaponInfo = {
    name: weaponNames.nuke,
    blastRadius: 400,
    cursor: "cursor4",
    explosionInfo: {
        size: ExplSizes.XXL,
        imageSource: assetsFolder + 'mushroom_1.gif',
        sound: bigExplosions,
        soundDelay: 6500,
        length: 2500,
    },
    imageSource: assetsSVGFolder + 'bomb_nuke.svg',
    sound: nukeSounds,
    speed: 6000,
    cooldown: 30000,
    noAmmo: bleep_neg,
    select: redeemerpickup
}
const chargeInfo: weaponInfo = {
    name: weaponNames.tunnelcharge,
    cursor: "cursor4",
    imageSource: assetsSVGFolder + 'dynamite.svg',
    sound: gunSounds,
    speed: 3000,
    cooldown: 8000,
    noAmmo: bleep_neg,
    select: alarm3//beeps[0]
}
const droneInfo: ExplosiveWeaponInfo = {
    name: weaponNames.drone,
    cursor: "cursor4",
    blastRadius: 0,
    explosionInfo: {
        size: ExplSizes.small,
        imageSource: assetsFolder + 'mushroom_1.gif',
        sound: explosions,
        length: 1000,
    },
    imageSource: assetsSVGFolder + 'drone.svg',
    sound: [jet],
    speed: 3000,
    cooldown: 15000,
    noAmmo: bleep_neg,
    select: jet
}

function loadNewImage() {
    return '?' + new Date().getTime();
}
enum msgLength {
    long = 3000,
    short = 2000
}
type popupMsg = {
    title: string,
    text: string,
    length: msgLength
}
class PopupHandler {
    static popUpArray: Array<popupMsg> = [];
    static addToArray(txt, title?, lngth?) {
        let msg: popupMsg = {
            text: txt,
            title: title ? title : null,
            length: lngth ? lngth : msgLength.short
        }
        this.popUpArray.push(msg);
        if (this.popUpArray.length == 1) {
            this.showPopup();
        }
    }
    private static showPopup() {
        pop.play();
        if (!this.popUpArray.length) return
        let popup = document.getElementById("popupBox");
        let currentMsg = this.popUpArray[0]
        let titlebox = document.getElementById("popupTitle")
        let textbox = document.getElementById("popupText")
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
    static returnContentEl() {
        return document.getElementById("content")!;
    }
    static addToContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
        contentEl.appendChild(elem);
    }
    static removeFromContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
        contentEl.removeChild(elem);
    }
    static contentElWidth() {
        return document.getElementById("content").clientWidth;
    }
    static clearContent() {
        document.getElementById("content").innerHTML = "";
    }
    static fadeRemoveItem(item: HTMLElement, stayTime, fadeTime) {
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime)
        setTimeout(() => {
            ContentElHandler.removeFromContentEl(item);
        }, stayTime + fadeTime)
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