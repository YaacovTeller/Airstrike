var WaveType;
(function (WaveType) {
    WaveType[WaveType["gradual"] = 0] = "gradual";
    WaveType[WaveType["sudden"] = 1] = "sudden";
    WaveType[WaveType["double"] = 2] = "double";
})(WaveType || (WaveType = {}));
var Time;
(function (Time) {
    Time[Time["day"] = 0] = "day";
    Time[Time["dusk"] = 1] = "dusk";
    Time[Time["night"] = 2] = "night";
})(Time || (Time = {}));
class Wave {
    number;
    type;
    finished;
    constructor(num, type, finished = false) {
        this.number = num;
        this.type = type;
        this.finished = finished;
    }
}
class Level {
    //public nextLevelCallback: Function;
    waveIndex = -1;
    frequency;
    //   public waves: Array<Wave>;
    //   public winLimits: Array<number>;
    currentWave;
    targets = [];
    winCheckTimer;
    targetTimer;
    waveDurationTimer;
    allTargetsDeployed = false;
    pauseTargetProduction = false;
    passedHalfTargetProduction = false;
    pauseLength = 6000;
    suddenTargetFreq = 150;
    info;
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
    provideAvailTargets() { return; } // FIX?
    armingUp() { }
    ;
    finalStageArms() { }
    ;
    addWeaponsFromArray(arr) {
        for (let wep of arr) {
            this.addNewWeapon(wep);
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
    setAsLevel() {
        let num = this.info.number;
        game.changeTime(this.info.timeOfDay);
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
    setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }
        this.currentWave = this.info.waves[num];
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
        console.log("FIN?: " + fin);
        return fin;
    }
    endWave() {
        PopupHandler.addToArray("Nice job!" + "\n" // "WaveIndex " + this.index + " of " + this.winLimits.length
        );
        this.allTargetsDeployed = false;
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
                //  console.log("NEXT LEVEL callback")
            }
        }, 5000);
    }
    nextWave() {
        this.targets = [];
        this.waveIndex++;
        let length = this.info.waves.length;
        switch (this.waveIndex) {
            case (0):
                this.armingUp();
                break;
            case (length - 1):
                this.finalStageArms();
                break;
            case (length):
                this.waveIndex = -1;
                return false;
            default:
        }
        this.setCurrentWave();
        if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            RandomSoundGen.playSequentialSound(revs);
        }
        this.continueWave();
        return true;
    }
    continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        let freq;
        if (this.currentWave.type == WaveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            freq = this.suddenTargetFreq;
        }
        if (this.targetTimer != null)
            console.log("WARNING: STARTED MULTIPLE TARGET TIMERS!!!");
        this.targetTimer = setInterval(() => {
            if (this.allTargetsDeployed == false) {
                this.produceSingleTarget();
            }
        }, freq);
    }
    produceSingleTarget(tgt) {
        if (this.pauseTargetProduction == true) {
            return;
        }
        let target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);
        if (this.currentWave.type == WaveType.double && this.passedHalfTargetProduction == false && this.targets.length == this.currentWave.number / 2) {
            this.pauseTargetProduction = this.passedHalfTargetProduction = true;
            let this_ = this;
            setTimeout(() => {
                this_.pauseTargetProduction = false;
                RandomSoundGen.playSequentialSound(revs); // UNIFY with NEXT WAVE revs
            }, this_.pauseLength);
        }
        if (this.targets.length >= this.currentWave.number) {
            this.allTargetsDeployed = true;
            this.pauseWave();
            this.winLimitCheck();
        }
    }
    pauseWave() {
        clearInterval(this.targetTimer);
        this.targetTimer = null;
    }
    resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
        }
        allTargets = [];
        this.allTargetsDeployed = false;
        this.resetWincheck();
    }
    addNewWeapon(info, showMsg) {
        let wepName = weaponNames[info.name];
        if (allWeaponTypes[info.name - 1]) {
            allWeaponTypes[info.name - 1].pushNewWeaponInstance();
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
        //     game.redrawHudWithWepSelectionChecked();
    }
}
const continuousInfo = {
    number: 0,
    timeOfDay: Time.day,
    messages: [{ title: "Dev_", text: "", length: msgLength.short }],
    waves: [
        new Wave(16, WaveType.sudden),
        new Wave(30, WaveType.double),
        new Wave(70, WaveType.double),
        new Wave(25, WaveType.sudden),
        new Wave(40, WaveType.sudden),
        new Wave(100, WaveType.double),
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => {
        return provideAllTargets();
    },
};
const allLevelInfo = [
    {
        number: 1,
        timeOfDay: Time.night,
        messages: [],
        waves: [
            new Wave(8, WaveType.double),
            //new Wave(8, WaveType.gradual),
            //new Wave(8, WaveType.sudden),
            //new Wave(14, WaveType.sudden)
        ],
        startArms: [sniperInfo, mortarInfo, mortarInfo],
        endArms: [mortarInfo],
        targetFunc: () => { return new RegVehicleTarget(); },
    },
    {
        number: 2,
        timeOfDay: Time.dusk,
        messages: [],
        waves: [
            new Wave(8, WaveType.sudden),
            //new Wave(30, WaveType.gradual),
            //new Wave(20, WaveType.sudden),
        ],
        startArms: [mortarInfo, howitzerInfo],
        endArms: [howitzerInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget;
            switch (true) {
                case (rand >= 90):
                    newTarget = new ModVehicleTarget();
                    break;
                default:
                    newTarget = new RegVehicleTarget();
                    break;
            }
            return newTarget;
        },
    },
    {
        number: 3,
        timeOfDay: Time.night,
        messages: [],
        waves: [
            //      new Wave(16, WaveType.gradual),
            new Wave(10, WaveType.sudden),
        ],
        startArms: [howitzerInfo, airstrikeInfo],
        endArms: [howitzerInfo, airstrikeInfo],
        targetFunc: () => { return new HeavyVehicleTarget(); },
    },
    {
        number: 4,
        timeOfDay: Time.dusk,
        messages: [{ text: "Watch out for tunnels", title: "WARNING" }],
        waves: [
            //        new Wave(8, WaveType.gradual),
            new Wave(12, WaveType.sudden),
        ],
        startArms: [chargeInfo, airstrikeInfo],
        endArms: [chargeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget;
            switch (true) {
                case (rand >= 50):
                    newTarget = new TunnelTarget();
                    break;
                default:
                    newTarget = new HeavyVehicleTarget();
                    break;
            }
            return newTarget;
        },
    },
    {
        number: 5,
        timeOfDay: Time.day,
        messages: [],
        waves: [
            //new Wave(16, WaveType.sudden),
            //new Wave(30, WaveType.gradual),
            //new Wave(50, WaveType.gradual),
            new Wave(40, WaveType.double),
        ],
        startArms: [nukeInfo],
        endArms: [airstrikeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget;
            switch (true) {
                case (rand >= 90):
                    newTarget = new TunnelTarget();
                    break;
                case (rand >= 80):
                    newTarget = new HeavyVehicleTarget();
                    break;
                case (rand >= 72):
                    newTarget = new ModVehicleTarget();
                    break;
                default:
                    newTarget = new RegVehicleTarget();
                    break;
            }
            return newTarget;
        }
    },
    {
        number: 6,
        timeOfDay: Time.day,
        messages: [{ text: "Missile trucks prevent aircraft strikes", title: "WARNING" }],
        waves: [
            new Wave(30, WaveType.gradual),
            new Wave(20, WaveType.sudden),
            new Wave(35, WaveType.double),
        ],
        startArms: [],
        endArms: [mortarInfo, airstrikeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget;
            switch (true) {
                case (rand >= 85):
                    newTarget = new RocketLauncher();
                    break;
                default:
                    newTarget = new RegVehicleTarget();
                    break;
            }
            return newTarget;
        }
    },
    {
        number: 7,
        timeOfDay: Time.day,
        messages: [],
        waves: [
            new Wave(20, WaveType.double),
            new Wave(30, WaveType.gradual),
            new Wave(35, WaveType.gradual),
            new Wave(40, WaveType.double),
        ],
        startArms: [],
        endArms: [],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget;
            switch (true) {
                case (rand >= 70):
                    newTarget = new RocketLauncher();
                    break;
                case (rand >= 40):
                    newTarget = new HeavyVehicleTarget();
                    break;
                default:
                    newTarget = new RegVehicleTarget();
                    break;
            }
            return newTarget;
        }
    },
    {
        number: 8,
        timeOfDay: Time.day,
        messages: [{ text: "Almost there!", title: "" }],
        waves: [
            new Wave(25, WaveType.double),
            new Wave(30, WaveType.gradual),
            new Wave(55, WaveType.double),
            new Wave(80, WaveType.double),
        ],
        startArms: [],
        endArms: [],
        targetFunc: () => {
            return provideAllTargets();
        }
    },
];
function provideAllTargets() {
    let rand = RandomNumberGen.randomNumBetween(1, 100);
    let newTarget;
    switch (true) {
        case (rand >= 93):
            newTarget = new TunnelTarget();
            break;
        case (rand >= 87):
            newTarget = new HeavyVehicleTarget();
            break;
        case (rand >= 78):
            newTarget = new ModVehicleTarget();
            break;
        case (rand >= 68):
            newTarget = new RocketLauncher();
            break;
        default:
            newTarget = new RegVehicleTarget();
            break;
    }
    return newTarget;
}
//# sourceMappingURL=level.js.map