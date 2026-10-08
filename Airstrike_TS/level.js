"use strict";
var WaveType;
(function (WaveType) {
    WaveType[WaveType["gradual"] = 0] = "gradual";
    WaveType[WaveType["sudden"] = 1] = "sudden";
    WaveType[WaveType["double"] = 2] = "double";
    WaveType[WaveType["static"] = 3] = "static";
})(WaveType || (WaveType = {}));
var Time;
(function (Time) {
    Time[Time["day"] = 0] = "day";
    Time[Time["dusk"] = 1] = "dusk";
    Time[Time["night"] = 2] = "night";
})(Time || (Time = {}));
var Area;
(function (Area) {
    Area[Area["desert"] = 0] = "desert";
    Area[Area["port"] = 1] = "port";
})(Area || (Area = {}));
class Wave {
    number;
    type;
    finished = false;
    timeOfDay;
    weather;
    constructor(num, type, timeOfDay, rain) {
        this.timeOfDay = timeOfDay ? timeOfDay : Time.day;
        this.weather = rain ? rain : noRain;
        this.number = num;
        this.type = type;
    }
}
//type WaveLevelInfo = LevelInfo & {
//}
class Level {
    waveIndex = -1;
    frequency;
    winCheckTimer;
    targetTimer;
    waveDurationTimer;
    allTargetsDeployed = false;
    pauseTargetProduction = false;
    passedHalfTargetProduction = false;
    pauseLength = 6000;
    suddenTargetFreq = 150;
    staticTargetFreq = 2;
    constructor(info) {
        this.info = info;
        this.armingUp = () => {
            this.addWeaponsFromArray(this.info.startArms);
        };
        this.finalStageArms = () => {
            this.addWeaponsFromArray(this.info.endArms);
        };
        this.provideAvailTargets = this.info.targetFunc;
    }
    // Back to how a level starts, for a level that's played again (the standard levels are reused)
    resetState() {
        this.resetTargets();
        this.pauseWave();
        this.waveIndex = -1;
        this.pauseTargetProduction = false;
        this.passedHalfTargetProduction = false;
    }
    provideAvailTargets() { return; } // FIX?
    armingUp() { }
    ;
    finalStageArms() { }
    ;
    targets = [];
    currentWave;
    returnLocation() {
        return this.info.location;
    }
    resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
            if (x.dispose)
                x.dispose();
        }
        allTargets = [];
        this.allTargetsDeployed = false;
        this.resetWincheck();
    }
    addNewWeapon(info, showMsg) {
        let wepName = info.displayName || weaponNames[info.name];
        let slot = info.slot !== undefined ? info.slot : info.name;
        let wepArr = info.name <= weaponNames.drone ? conventionalWeapons : extraWeapons;
        if (wepArr[slot]) {
            wepArr[slot].pushNewWeaponInstance();
            if (showMsg != false) {
                PopupHandler.addToArray("You got another " + wepName);
            }
        }
        else {
            new info.class(info);
            if (showMsg != false) {
                PopupHandler.addToArray("New weapon:\n" + wepName);
            }
        }
    }
    showActiveTargets() {
        for (let t of this.targets) {
            if (t.status === Status.active) {
                t.toggleLockOn(true);
                setTimeout(() => {
                    t.toggleLockOn(false);
                }, 1000);
            }
        }
    }
    checkForDamagedActiveTargets() {
        let warn = false;
        for (let t of this.targets) {
            if (t.damage != Damage.undamaged && t.status === Status.active) {
                warn = true;
            }
        }
        return warn;
    }
    checkForNilActiveTargets() {
        let fin = true;
        for (let t of this.targets) {
            if (t.status === Status.active) {
                fin = false;
                break;
            }
        }
        return fin;
    }
    addWeaponsFromArray(arr) {
        for (let wep of arr) {
            this.addNewWeapon(wep);
        }
    }
    setAsLevel() {
        let num = this.info.number;
        this.frequency = game.difficulty.newTargetEvery;
        if (game.gameMode == GameMode.regular) {
            PopupHandler.addToArray("", "Level " + num, msgLength.long);
            this.setLevelDisplay(num);
        }
        else {
            PopupHandler.addToArray("", "Sandbox", msgLength.short);
        }
        for (let msg of this.info.messages) {
            PopupHandler.addToArray(msg.text, msg.title, msg.length);
        }
    }
    setLevelDisplay(num) {
        let div = document.getElementById("levDiv_" + num);
        let prevDiv = document.getElementById("levDiv_" + (num - 1));
        if (prevDiv) {
            prevDiv.classList.remove('selected');
        }
        div.classList.add("selected");
    }
    setWaveDisplay(num) {
        let levDiv = document.getElementById("levDiv_" + (this.info.number));
        let div = levDiv.querySelector("#wavDiv_" + num);
        let prevDiv = levDiv.querySelector("#wavDiv_" + (num - 1));
        if (prevDiv) {
            prevDiv.classList.remove('selected');
        }
        else {
            let prevLev = document.getElementById("levDiv_" + (this.info.number - 1));
            if (prevLev) {
                let lastChild = prevLev.lastChild;
                lastChild.classList.remove('selected');
            }
        }
        div.classList.add("selected");
    }
    setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }
        this.currentWave = this.info.waves[num];
        game.changeTime(this.currentWave.timeOfDay);
        game.setRain(this.currentWave.weather);
    }
    // For levels that have a fixed set of targets to clear: how many are done out of how many.
    stageProgress() {
        return null;
    }
    winLimitCheck() {
        if (this.winCheckTimer != null) {
            console.log("HIT existing wincheck!");
            return;
        }
        let checkIndex = 0;
        this.winCheckTimer = setInterval(() => {
            if (this.checkForNilActiveTargets()) {
                this.resetWincheck();
                this.endWave();
            }
            checkIndex++;
            if (checkIndex >= 100) {
                checkIndex = 0;
                if (this.checkForDamagedActiveTargets()) {
                    PopupHandler.addToArray("Press 'S' to scan for survivors...");
                }
            }
        }, 100);
    }
    resetWincheck() {
        clearInterval(this.winCheckTimer);
        this.winCheckTimer = null;
    }
    endWave() {
        PopupHandler.addToArray("Nice job!" + "\n" // "WaveIndex " + this.index + " of " + this.winLimits.length
        );
        this.allTargetsDeployed = false;
        this.targets = [];
        this.nextWavePrepGap();
    }
    nextWavePrepGap() {
        setTimeout(() => {
            //    PopupHandler.addToArray("Get ready, more coming!");
        }, 3500);
        setTimeout(() => {
            if (this.nextWave() == false) {
                let index = allLevelsArray.indexOf(this);
                let nextLevel = allLevelsArray[index + 1];
                game.newLevel(nextLevel, game.gameMode);
            }
        }, 5000);
    }
    nextWave() {
        this.waveIndex++;
        let length = this.info.waves.length;
        let funcToExecute;
        switch (this.waveIndex) {
            case (0):
                funcToExecute = () => this.armingUp();
                break;
            case (length - 1):
                funcToExecute = () => this.finalStageArms();
                break;
            case (length):
                this.waveIndex = -1;
                return false;
            default:
        }
        this.setCurrentWave();
        funcToExecute ? funcToExecute() : "";
        if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            SoundPlayer.playSequentialSound(revs);
        }
        this.continueWave();
        return true;
    }
    // Called every game tick (100ms) while the game is running, so a level can keep time without
    // counting the time it's been paused
    tickClock() { }
    // The surveillance drone has been sent out
    noteDroneFlyover() { }
    continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevented new target on unpause
        let freq;
        if (this.currentWave.type == WaveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            freq = this.suddenTargetFreq;
        }
        else if (this.currentWave.type == WaveType.static) {
            freq = this.staticTargetFreq;
        }
        //   if (this.targetTimer != null) console.log("WARNING: STARTED MULTIPLE TARGET TIMERS!!!")
        this.targetTimer = setInterval(() => {
            if (this.allTargetsDeployed == false) {
                this.produceSingleTarget();
            }
        }, freq);
    }
    produceSingleTarget(tgt, pos) {
        if (this.pauseTargetProduction == true) {
            return;
        }
        let target = tgt ? tgt : this.provideAvailTargets();
        this.registerTarget(target, pos);
        if (this.currentWave.type == WaveType.double && this.passedHalfTargetProduction == false && this.targets.length == this.currentWave.number / 2) {
            this.pauseTargetProduction = this.passedHalfTargetProduction = true;
            let this_ = this;
            setTimeout(() => {
                this_.pauseTargetProduction = false;
                SoundPlayer.playSequentialSound(revs); // UNIFY with NEXT WAVE revs
            }, this_.pauseLength);
        }
        if (this.targets.length >= this.currentWave.number && this.allTargetsDeployed === false) {
            this.allTargetsDeployed = true;
            this.pauseWave();
            this.winLimitCheck();
        }
    }
    pauseWave() {
        clearInterval(this.targetTimer);
        this.targetTimer = null;
    }
    registerTarget(target, pos) {
        target.decidePosition(pos);
        this.targets.push(target);
        allTargets.push(target);
        game.updateKillStats(killStatDisplayOptions.total);
    }
}
// A level that's a series of static scenes rather than a stream of targets. Each stage places its
// buildings and targets once up front; nothing is produced afterwards, nothing escapes, and the
// stage is finished when every target has been destroyed, after which a freshly generated stage
// follows -- forever. Its single wave only carries the time of day and weather.
class SceneLevel extends Level {
    staticTargetCount = 10;
    stage = 0;
    // What this stage has taken so far, for the message when it's cleared
    stageElapsedMs = 0;
    stageShotsAtStart = 0;
    stageDroneFlyovers = 0;
    tickClock() { this.stageElapsedMs += 100; }
    noteDroneFlyover() { this.stageDroneFlyovers++; }
    static praise = ["Well done!", "Nice work!", "Target area cleared!", "Excellent shooting!"];
    static hurryUp = ["Speed up your game!", "Pick up the pace, soldier!", "Faster! The enemy won't wait!"];
    static slowAfterMs = 60000;
    formatTime(ms) {
        const seconds = Math.round(ms / 1000);
        return seconds >= 60 ? Math.floor(seconds / 60) + "m " + (seconds % 60) + "s" : seconds + "s";
    }
    plural(count, noun) {
        return count + " " + noun + (count == 1 ? "" : "s");
    }
    // The congratulations at the end of a stage: how long it took, how many shots, how many drone
    // flyovers (which aren't counted as shots), and a nudge if it took more than a minute
    stageSummary() {
        const flyovers = this.stageDroneFlyovers;
        const shots = Math.max(0, game.killStats.shots - this.stageShotsAtStart - flyovers);
        let text = RandomNumberGen.returnRandomFromArray(SceneLevel.praise) +
            "<br>Time: " + this.formatTime(this.stageElapsedMs) +
            "<br>" + this.plural(shots, "shot") + " fired" +
            "<br>" + this.plural(flyovers, "drone flyover") + " needed";
        if (this.stageElapsedMs > SceneLevel.slowAfterMs) {
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.hurryUp) + "</strong>";
        }
        return text;
    }
    nextWave() {
        if (game.level !== this)
            return true; // a stale call from before the game was reset
        this.stage++;
        this.resetTargets(); // clears the last stage's targets and buildings
        if (this.stage == 1) {
            this.waveIndex = 0;
            this.setCurrentWave(); // later stages keep whatever time of day and weather they're in
        }
        for (let i = 0; i < this.staticTargetCount; i++) {
            this.registerTarget(this.provideAvailTargets());
        }
        this.infestBuildings(game.drawAllBuildings());
        this.stageElapsedMs = 0;
        this.stageShotsAtStart = game.killStats.shots;
        this.stageDroneFlyovers = 0;
        if (this.stage > 1) {
            PopupHandler.addToArray("", "Stage " + this.stage, msgLength.short);
        }
        this.winLimitCheck();
        return true;
    }
    continueWave() { } // unpausing must not start target production
    static infestedBuildingCount = 3;
    static minOccupants = 2;
    static maxOccupants = 6;
    // A few of the buildings have enemies hiding in them, who count as targets for the stage.
    infestBuildings(buildings) {
        const pool = buildings.filter(b => b.canHideEnemies());
        for (let n = 0; n < SceneLevel.infestedBuildingCount && pool.length; n++) {
            const building = pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0];
            const occupants = RandomNumberGen.randomNumBetween(SceneLevel.minOccupants, SceneLevel.maxOccupants);
            for (let i = 0; i < occupants; i++) {
                const enemy = new BuildingEnemy();
                building.addOccupant(enemy);
                this.registerTarget(enemy, building.randomHidingSpot());
            }
        }
    }
    stageProgress() {
        return { done: this.targets.filter(t => t.isFinished()).length, total: this.targets.length };
    }
    // The base level's check for "nothing left to do" -- here that means every target destroyed, not
    // just disabled. (A boat counts as destroyed once its fire has done for it, not when it's on the bottom.)
    checkForNilActiveTargets() {
        return this.targets.every(t => t.isFinished());
    }
    endWave() {
        PopupHandler.addToArray(this.stageSummary(), "Stage " + this.stage + " finished!", msgLength.long);
        this.nextWavePrepGap(); // then nextWave() builds the next stage
    }
}
function pickWeightedTarget(options) {
    let roll = RandomNumberGen.randomNumBetween(1, 100);
    for (let option of options) {
        if (roll >= option.threshold) {
            return option.create();
        }
    }
}
function provideAllTargets() {
    return pickWeightedTarget([
        { threshold: 93, create: () => new TunnelTarget() },
        { threshold: 87, create: () => new HeavyVehicleTarget() },
        { threshold: 78, create: () => new ModVehicleTarget() },
        { threshold: 68, create: () => new RocketLauncher() },
        { threshold: 0, create: () => new RegVehicleTarget() },
    ]);
}
const sceneInfo = {
    number: 0,
    location: Area.port,
    messages: [{ title: "Static Scene", text: "", length: msgLength.short }],
    waves: [
        new Wave(0, WaveType.static, Time.day), // only carries time of day/weather, see SceneLevel
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => new WaterVehicleTarget(),
};
const continuousInfo = {
    number: 0,
    location: Area.desert,
    messages: [{ title: "Weapons Test", text: "", length: msgLength.short }],
    waves: [
        new Wave(16, WaveType.sudden, null, lightRain),
        new Wave(30, WaveType.double),
        new Wave(50, WaveType.double, null, heavyRain),
        new Wave(10, WaveType.gradual, Time.dusk),
        new Wave(10, WaveType.gradual, Time.night),
        new Wave(25, WaveType.sudden, Time.dusk),
        new Wave(40, WaveType.sudden, null, heavyRain),
        new Wave(90, WaveType.double),
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => {
        //let rand = RandomNumberGen.randomNumBetween(1, 100);
        //let newTarget: Target;
        //switch (true) {
        //    case (rand >= 90):
        //        newTarget = new WaterVehicleTarget();
        //        break;
        //    default:
        //        newTarget = new WaterVehicleTarget();
        //        break;
        //}
        //return newTarget;
        return provideAllTargets();
    },
};
const weatherTestInfo = {
    number: 0,
    location: Area.desert,
    messages: [{ title: "Weather Test", text: "", length: msgLength.short }],
    waves: [
        new Wave(8, WaveType.double, null, medRain),
        new Wave(8, WaveType.double, Time.dusk, heavyRain),
        new Wave(8, WaveType.double, Time.night),
        new Wave(8, WaveType.double, Time.dusk, lightRain),
        new Wave(8, WaveType.double, null, medRain),
        new Wave(8, WaveType.double, null, heavyRain),
        new Wave(8, WaveType.double, Time.dusk, lightRain),
        new Wave(8, WaveType.double, Time.night, heavyRain),
        new Wave(8, WaveType.double, Time.dusk),
        new Wave(8, WaveType.double),
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => pickWeightedTarget([
        { threshold: 90, create: () => new ModVehicleTarget() },
        { threshold: 0, create: () => new RegVehicleTarget() },
    ]),
};
const allLevelInfo = [
    {
        number: 1,
        location: Area.desert,
        messages: [{ text: "", title: "WAKE UP!" }],
        waves: [
            new Wave(8, WaveType.double, Time.dusk),
            new Wave(8, WaveType.gradual), //GRAD
            new Wave(8, WaveType.sudden),
            /*            new Wave(14, WaveType.sudden)*/
        ],
        startArms: [sniperInfo, mortarInfo, mortarInfo],
        endArms: [mortarInfo],
        targetFunc: () => { return new RegVehicleTarget(); },
    },
    {
        number: 2,
        location: Area.desert,
        messages: [{ text: "It's getting dark...", title: "NOTE" }],
        waves: [
            new Wave(8, WaveType.sudden, Time.dusk),
            new Wave(14, WaveType.gradual, Time.night),
            new Wave(20, WaveType.sudden, Time.dusk),
        ],
        startArms: [mortarInfo, howitzerInfo],
        endArms: [howitzerInfo],
        targetFunc: () => pickWeightedTarget([
            { threshold: 90, create: () => new ModVehicleTarget() },
            { threshold: 0, create: () => new RegVehicleTarget() },
        ]),
    },
    {
        number: 3,
        location: Area.desert,
        messages: [],
        waves: [
            new Wave(16, WaveType.gradual, null, medRain),
            new Wave(10, WaveType.sudden, null, heavyRain),
        ],
        startArms: [howitzerInfo, airstrikeInfo],
        //   startArms: [flareInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, sniperInfo, ],
        endArms: [howitzerInfo, airstrikeInfo],
        targetFunc: () => { return new HeavyVehicleTarget(); },
    },
    {
        number: 4,
        location: Area.desert,
        messages: [{ text: "Watch out for tunnels", title: "WARNING" }],
        waves: [
            new Wave(8, WaveType.gradual, null, lightRain),
            new Wave(12, WaveType.sudden),
        ],
        startArms: [chargeInfo, airstrikeInfo],
        endArms: [chargeInfo],
        targetFunc: () => pickWeightedTarget([
            { threshold: 50, create: () => new TunnelTarget() },
            { threshold: 0, create: () => new HeavyVehicleTarget() },
        ]),
    },
    {
        number: 5,
        location: Area.desert,
        messages: [{ text: "Mortar team positioning to provide flare rounds...", title: "NOTE" }],
        waves: [
            new Wave(16, WaveType.sudden),
            new Wave(30, WaveType.gradual, Time.dusk),
            new Wave(30, WaveType.gradual, Time.night),
            new Wave(40, WaveType.double, Time.dusk),
        ],
        startArms: [flareInfo, flareInfo, mortarInfo],
        endArms: [airstrikeInfo],
        targetFunc: () => pickWeightedTarget([
            { threshold: 90, create: () => new TunnelTarget() },
            { threshold: 80, create: () => new HeavyVehicleTarget() },
            { threshold: 72, create: () => new ModVehicleTarget() },
            { threshold: 0, create: () => new RegVehicleTarget() },
        ])
    },
    {
        number: 6,
        location: Area.desert,
        messages: [{ text: "Missile trucks prevent aircraft strikes", title: "WARNING" }],
        waves: [
            new Wave(30, WaveType.gradual),
            new Wave(20, WaveType.sudden),
            new Wave(35, WaveType.double),
        ],
        startArms: [],
        endArms: [mortarInfo, airstrikeInfo],
        targetFunc: () => pickWeightedTarget([
            { threshold: 85, create: () => new RocketLauncher() },
            { threshold: 0, create: () => new RegVehicleTarget() },
        ])
    },
    {
        number: 7,
        location: Area.desert,
        messages: [],
        waves: [
            new Wave(20, WaveType.double),
            new Wave(30, WaveType.gradual),
            new Wave(35, WaveType.gradual),
            new Wave(40, WaveType.double),
        ],
        startArms: [mortarInfo, droneInfo],
        endArms: [droneInfo],
        targetFunc: () => pickWeightedTarget([
            { threshold: 70, create: () => new RocketLauncher() },
            { threshold: 40, create: () => new HeavyVehicleTarget() },
            { threshold: 0, create: () => new RegVehicleTarget() },
        ])
    },
    {
        number: 8,
        location: Area.desert,
        messages: [{ text: "Almost there!", title: "" }],
        waves: [
            new Wave(25, WaveType.double, Time.dusk),
            new Wave(30, WaveType.gradual, Time.night),
            new Wave(55, WaveType.double, Time.dusk),
            new Wave(80, WaveType.double),
        ],
        startArms: [flareInfo, droneInfo],
        endArms: [],
        targetFunc: () => {
            return provideAllTargets();
        }
    },
];
//# sourceMappingURL=level.js.map