enum RainTypes {
    none = 'none',
    light = 'lightRain',
    medium = 'mediumRain',
    heavy = 'heavyRain'
}

type Rain = {
    className: string,
    drops: number,
    angle: number,
    height: string,
    ambience?: AmbienceSet
}
const noRain: Rain = {
    className: RainTypes.none,
    drops: 0,
    angle: 0,
    height: '100vh',
}
const lightRain: Rain = {
    className: RainTypes.light,
    drops: 30,
    angle: 0,
    height: '100vh',
    ambience: rain_amb
}
const medRain: Rain = {
    className: RainTypes.medium,
    drops: 100,
    angle: 15,
    height: '140vh',
    ambience: heavyRain_amb
}
const heavyRain: Rain = {
    className: RainTypes.heavy,
    drops: 150,
    angle: 35,
    height: '190vh',
    ambience: storm_amb
}

const multiKillText = {
    2: { size: 30, colour: 'yellow'},
    3: { size: 45, colour: 'orange'},
    4: { size: 60, colour: 'red'},
    5: { size: 75, colour: 'green'},
    6: { size: 90, colour: 'blue'},
    7: { size: 105, colour: 'purple'},
    8: { size: 120, colour: 'brown'},
    9: { size: 135, colour: 'grey'},
    10: { size: 150, colour: 'black' },
    11: { size: 170, colour: 'black' },
    12: { size: 190, colour: 'black' },
    13: { size: 200, colour: 'black' },
    14: { size: 200, colour: 'black' },
}
enum ExplSizes {
    tiny = 60,
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
    dented,
    badlyDented,
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
}
// speeds are actually set with the difficulty settings. Nominal values here
const regTarget: TargetInfo = {
    minSpeed: 4,
    maxSpeed: 8,
    armour: Armour.none,
}
const modTarget: TargetInfo = {
    minSpeed: 4,
    maxSpeed: 6,
    armour: Armour.moderate,
}
const heavyTarget: TargetInfo = {
    minSpeed: 1,
    maxSpeed: 3,
    armour: Armour.heavy,
}
const rocketLauncher: TargetInfo = {
    minSpeed: 2,
    maxSpeed: 4,
    armour: Armour.heavy,
}
const regTunnelTarget: TargetInfo = {
    minSpeed: 1,
    maxSpeed: 2,
    armour: Armour.moderate,
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
    sniper = 1,
    mortar = 2,
    tank = 3,
    airstrike = 4,

    drone = 5,
    tunnel_Charge = 6,
    tactical_Nuke = 7,
    flare = 8,
    chopper = 9
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
    class: typeof WeaponType,
    sound: Array<Sound>,
    imageSource: string,
    cursor: string,
    speed: number,
    cooldown: number,
    noAmmo: Sound,
    select: Array<Sound>,
}
type ExplosiveWeaponInfo = weaponInfo & {
    blastRadius: number,
    explosionInfo: ExplosionInfo,
    flyover?: FlyOver
}
type ExplosionInfo = {
    imageSource: string,
    size: ExplSizes,
    length: number,
    sound: Array<Sound>,
    soundDelay?: number,
}
type FlyOver = {
    imageSource: string,
    speed: number,
    delay: number,
    duration: number
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
    name: weaponNames.sniper,
    class: BulletWeaponType,
    cursor: "cursor1",
    imageSource: assetsSVGFolder + 'gun.svg',
    sound: gunSounds,
    speed: 0,
    cooldown: 700,
    noAmmo: click_1,
    select: [mag]
}
const mortarInfo: ExplosiveWeaponInfo = {
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
}
const howitzerInfo: ExplosiveWeaponInfo = {
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
}
const airstrikeInfo: ExplosiveWeaponInfo = {
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
    select: [jet_pass],
    flyover: {
        imageSource: assetsSVGFolder + 'f16.svg',
        speed: 40,
        duration: 2000,
        delay: 2000
    }
}
const nukeInfo: ExplosiveWeaponInfo = {
    name: weaponNames.tactical_Nuke,
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
    select: [redeemerpickup],
    flyover: {
        imageSource: assetsSVGFolder + 'f16.svg',
        speed: 15,
        duration: 2000,
        delay: 2500
    }}
const chargeInfo: weaponInfo = {
    name: weaponNames.tunnel_Charge,
    class: ChargeWeaponType,
    cursor: "cursor4",
    imageSource: assetsSVGFolder + 'dynamite.svg',
    sound: gunSounds,
    speed: 3000,
    cooldown: 8000,
    noAmmo: bleep_neg,
    select: [alarm3]
}
const droneInfo: ExplosiveWeaponInfo = {
    name: weaponNames.drone,
    class: DroneWeaponType,
    cursor: "cursor4",
    blastRadius: 0,
    explosionInfo: {
        size: ExplSizes.small,
        imageSource: assetsFolder + classicExplosion,
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
}
const chopperInfo: ExplosiveWeaponInfo = {
    name: weaponNames.chopper,
    class: Chopper,
    cursor: "cursor4",
    blastRadius: 20,
    explosionInfo: {
        size: ExplSizes.tiny,
        imageSource: assetsFolder + classicExplosion,
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
}

const flareInfo: ExplosiveWeaponInfo = {
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
        //pop.play();
        bleepbleep.play();
        if (!this.popUpArray.length) return
        let popup = document.getElementById("popupBox");
        let currentMsg = this.popUpArray[0]
        let titlebox = document.getElementById("popupTitle")
        let textbox = document.getElementById("popupText")
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

class ContentElHandler {
    static returnContentWrapper() {
        return document.getElementById("contentWrapper")!;
    }
    static addToContentWrapper(elem: HTMLElement) {
        this.returnContentWrapper().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content")!;
    }
    static addToContentEl(elem: HTMLElement) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
        elem = null
    }
    static returnNewEl(parent: HTMLElement, classname: string) {
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
    static fadeRemoveItem(item: HTMLElement, stayTime, fadeTime, array?) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime)
        setTimeout(() => {
            if (item) {
                if (array) {
                    let index = array.indexOf(item);
                    if (index >= 0) {
                        array.splice(index, 1);
                    }
                }
                ContentElHandler.removeFromContentEl(item);
            }
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