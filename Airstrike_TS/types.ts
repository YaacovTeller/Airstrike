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
enum HitSurface {
    water,
    land
}
enum ExplSizes {
    XXS = 20,
    tiny = 60,
    small = 100,
    large = 140,
    XL = 200,
    huge = 280,
    massive = 360,
    colossal = 450,
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
// Enemies hiding in a building: they don't move, and only the building's fate can touch them
const buildingEnemyTarget: TargetInfo = {
    minSpeed: 0,
    maxSpeed: 0,
    armour: Armour.none,
}
// A tunnel you can't see, under the ground: doesn't move, nothing damages it but a charge or a really big blast
const hiddenTunnelTarget: TargetInfo = {
    minSpeed: 0,
    maxSpeed: 0,
    armour: Armour.none,
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
const boatTarget: TargetInfo = {
    minSpeed: 0,
    maxSpeed: 0,
    armour: Armour.moderate,
}
// The smaller boat has no armour, so it takes damage like a jeep: any proper hit sets it ablaze
const smallBoatTarget: TargetInfo = {
    ...boatTarget,
    armour: Armour.none,
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
    flare = 7,
    tactical_Nuke = 8,
    chopper = 9,
    surveillance = 10, // (it's on key 8: see its slot)
    carpet_bomb = 11   // the - key
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
    enemyFactor?: number, // the stage levels (hills and coast): how many more enemies than usual
    parMs?: number,       // and how long a stage gets before you're told off for being slow
    extraTunnels?: number, // and how many tunnels more than usual (Hills)
    fleeSpeed?: number,   // how fast a special enemy makes off in a car (Hills), in px every 100ms
    boatFleeSpeed?: number, // and in a boat (Coast)
    fleeDelay?: speedRange, // how long (ms) after the first strike he waits before making a run for it
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
    displayName?: string, // what the HUD tooltip and pickup popups call it, instead of the name above
    slot?: number, // where it sits in the HUD, and which key picks it, if that isn't its name's number. The name still decides how it hurts things
    pickupMessage?: string, // what the popup says when it's picked up, instead of "New weapon: ...".
    shotCost?: number, // how much a shot counts when a stage is judged for using too much ordnance (1 if not given; 0 never counts)
    bigBomb?: boolean, // one of the bombs a stage's summary tells you off for using too many of
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
    //  imageSource: string,
    frames: Array<HTMLImageElement>,
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
        description: "Regular speed targets, up to <b>15</b> will get taken care of for you.",
    },
    heb: {
        name: "רגיל",
        description: "יעדי מהירות רגילים, עד <b>15</b> יטופלו עבורך."
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
        description: "Faster targets, don't miss more than <b>10</b>.",
    },
    heb: {
        name: "קשה",
        description: "מטרות מהירות יותר, אל תפספסו יותר מ-<b>10</b>."
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
        description: "Targets pile in at a ridiculous rate, <b>you're on your own</b>.",  
    },
    heb: {
        name: "מהומה",
        description: "מטרות נערמות בקצב מגוחך,  <b>אתה לבד</b>"
    }
}
// The same three choices for the levels made of stages (Hills and Coast), which have no escapes to count: they
// differ in how many enemies there are, and how long you get before you're hurried along.
const sceneNormal: difficultyLevelInfo = {
    ...normal,
    enemyFactor: 1,
    parMs: 120000,
    fleeSpeed: 3,
    boatFleeSpeed: 3,
    fleeDelay: { min: 8000, max: 15000 },
    eng: { name: "Normal", description: "The usual number of enemies, and 2 minutes to clear a stage." },
    heb: { name: "רגיל", description: "מספר אויבים רגיל, וזמן רגיל לניקוי שלב." }
}
const sceneHard: difficultyLevelInfo = {
    ...hard,
    enemyFactor: 1.4,
    parMs: 105000,
    fleeSpeed: 5.5,
    boatFleeSpeed: 5,
    fleeDelay: { min: 6000, max: 11000 },
    eng: { name: "Hard", description: "More enemies, and 1 minute 45 before you're told to hurry up." },
    heb: { name: "קשה", description: "יותר אויבים, ופחות זמן לפני שמאיצים בך." }
}
const sceneChaos: difficultyLevelInfo = {
    ...chaos,
    enemyFactor: 2,
    parMs: 90000,
    extraTunnels: 1,
    fleeSpeed: 8,                                   // as fast as the fastest car there is (a regular target's top speed on Chaos)
    boatFleeSpeed: 7,
    fleeDelay: { min: 4000, max: 8000 },
    eng: { name: "Chaos", description: "Twice the enemies, and just 1 minute 30." },
    heb: { name: "מהומה", description: "פי שניים אויבים, וחצי מהזמן." }
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
    shotCost: 0.25,
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
    shotCost: 0.5,
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
}
const howitzerInfo: ExplosiveWeaponInfo = {
    name: weaponNames.tank,
    shotCost: 0.75,
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
}
const airstrikeInfo: ExplosiveWeaponInfo = {
    name: weaponNames.airstrike,
    shotCost: 1.25,
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
}
const nukeInfo: ExplosiveWeaponInfo = {
    name: weaponNames.tactical_Nuke,
    slot: 9,
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
    }}
// A superweapon, like the nuke: three aircraft sweep the whole width of the screen, right to left,
// along a band around the mouse, carpeting it with airstrike-sized explosions.
const carpetBombInfo: ExplosiveWeaponInfo = {
    name: weaponNames.carpet_bomb,
    slot: 11, // the - key
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
    imageSource: assetsSVGFolder + 'CarpetBomb.png',
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
}
const chargeInfo: weaponInfo = {
    name: weaponNames.tunnel_Charge,
    shotCost: 0, // one to a tunnel: never held against you
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
}
const chopperInfo: ExplosiveWeaponInfo = {
    name: weaponNames.chopper,
    slot: 10, // the 0 key
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
}

// A utility weapon: a slow pass of a drone that shows up what's hiding in buildings under the mouse
const surveillanceInfo: ExplosiveWeaponInfo = {
    name: weaponNames.surveillance,
    slot: 8, // on key 8, so the three superweapons (9, 0 and -) are together
    displayName: "Surveillance Drone",
    pickupMessage: "A surveillance drone has been flown out to scan for active targets.",
    class: SurveillanceDrone,
    cursor: "cursor4",
    blastRadius: 110, // how far around the mouse it can pick up a heat signature
    explosionInfo: { // it doesn't explode, but the weapon classes expect one
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
        speed: 2,       // vw per 100ms, so a pass of 6s crosses the screen with a bit to spare
        duration: 6000, // how long the scan lasts too
        delay: 1000     // a second to arrive
    }
}

// Where a weapon sits: its slot, or the number of its name if it hasn't been given one
function slotOf(info: weaponInfo): number {
    return info.slot !== undefined ? info.slot : info.name;
}

const flareInfo: ExplosiveWeaponInfo = {
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
}

// ---- The weapon set the Coast level uses instead of the standard weapons above ----
// Seven bombs on keys 1-7, each one a larger explosion than the last. The first three are the
// standard mortar, howitzer and airstrike with their explosions a rung down the ExplSizes ladder
// (so they cover a smaller area and need a closer hit to do the same damage); the rest are airstrikes
// with ever bigger explosions. They keep the name of the weapon they're made from, so they hurt things
// the way that weapon does; the "slot" is just their key and place in the HUD. There's no gun: it can't
// hurt anything in this mode. Everything else (cooldowns, flight times, flyovers) is inherited, and the
// aircraft noises (from the airstrike) are placeholders. The icons are in AS_assets/SVG.
const jetPlaceholder = {
    sound: airstrikeInfo.sound,
    select: airstrikeInfo.select,
    noAmmo: airstrikeInfo.noAmmo,
}
const scaledMortarInfo: ExplosiveWeaponInfo = {
    ...mortarInfo,
    ...jetPlaceholder,
    slot: 1,
    displayName: "Light Missile",
    imageSource: assetsSVGFolder + 'Missile_1.png',
    blastRadius: 30,
    explosionInfo: { ...mortarInfo.explosionInfo, size: ExplSizes.tiny }, // about a chopper round
}
const scaledHowitzerInfo: ExplosiveWeaponInfo = {
    ...howitzerInfo,
    ...jetPlaceholder,
    slot: 2,
    shotCost: 0.5,
    displayName: "Missile",
    imageSource: assetsSVGFolder + 'Missile_2.png',
    blastRadius: 50,
    explosionInfo: { ...howitzerInfo.explosionInfo, size: ExplSizes.small }, // about the standard mortar
}
const scaledAirstrikeInfo: ExplosiveWeaponInfo = {
    ...airstrikeInfo,
    ...jetPlaceholder,
    slot: 3,
    shotCost: 0.75,
    displayName: "Heavy Missile",
    imageSource: assetsSVGFolder + 'Missile_3.png',
    blastRadius: 70,
    explosionInfo: { ...airstrikeInfo.explosionInfo, size: ExplSizes.large }, // about the standard howitzer
}
// A bigger airstrike, in the given slot, whose explosion is this size (and so its circle is half of that)
function scaledBigStrike(slot: number, displayName: string, icon: string, size: ExplSizes): ExplosiveWeaponInfo {
    return {
        ...airstrikeInfo,
        ...jetPlaceholder,
        slot: slot,
        shotCost: slot >= 6 ? 1.25 : 0.75, // the bombs cost most
        bigBomb: slot >= 6,
        displayName: displayName,
        imageSource: assetsSVGFolder + icon,
        blastRadius: size / 2,
        explosionInfo: { ...airstrikeInfo.explosionInfo, size: size },
    };
}
// Slot 5 of the Coast set. It goes through the ground, with a thud, and a second later goes off far below: no
// explosion at the surface, but a shake as big as the largest bomb's, and the building it's over comes down
// with the bunker beneath it.
const bunkerBusterInfo: ExplosiveWeaponInfo = {
    ...scaledBigStrike(5, "Bunker Buster", 'missile_5.png', ExplSizes.huge),
    class: BunkerBusterWeaponType,
    blastRadius: 12, // just a marker: it's the point it lands on that counts
    explosionInfo: { ...airstrikeInfo.explosionInfo, size: ExplSizes.huge, sound: [] }, // its own sound, in its own time
};
const scaledWeapons: Array<weaponInfo> = [
    scaledMortarInfo,
    scaledHowitzerInfo,
    scaledAirstrikeInfo,
    scaledBigStrike(4, "Strike Missile", 'Missile_4.png', ExplSizes.XL),         // as big as the standard airstrike
    bunkerBusterInfo,
    scaledBigStrike(6, "Bomb", 'Bomb_1.png', ExplSizes.massive),
    scaledBigStrike(7, "Heavy Bomb", 'Bomb_2.png', ExplSizes.colossal),
];


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
    // Drops anything queued or showing
    static reset() {
        this.popUpArray = [];
        const popup = document.getElementById("popupBox");
        if (popup) popup.classList.add("hide");
    }
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
        SoundPlayer.playWithVolumeSet(bleepbleep);

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
