enum WaveType {
    gradual,
    sudden
}
class Wave {
    public number: number
    public type: WaveType
    public finished: boolean
    constructor(num: number, type: WaveType, finished: boolean = false) {
        this.number = num;
        this.type = type;
        this.finished = finished;
    }
}
type TargetProbability = {
    type: Target;
    prob: number;
}
type LevelInfo = {
    number: number
    messages: Array<popupMsg>
    waves: Array<Wave>
    startArms: Array<weaponInfo>
    endArms: Array<weaponInfo>
//    targetsAvail: Array<TargetProbability>
    targetFunc: () => Target
}


class Level {
    //public nextLevelCallback: Function;
    public waveIndex: number = -1;
    public frequency: number;
 //   public waves: Array<Wave>;
 //   public winLimits: Array<number>;
    public currentWave: Wave;
    public targets: Array<Target> = [];
    public winCheckTimer: number;
    public targetTimer: number;
    public waveDurationTimer: number;
    private allTargetsDeployed: boolean = false;

    private info: LevelInfo;
    constructor(info: LevelInfo) {
        this.info = info;
        this.armingUp = () => {
            this.addWeaponsFromArray(this.info.startArms);
        }
        this.finalStageArms = () => {
            this.addWeaponsFromArray(this.info.endArms);
        }
        this.provideAvailTargets = this.info.targetFunc;
    }

    protected provideAvailTargets(): Target{ return } // FIX?
    protected armingUp() { };
    protected finalStageArms() { };

    private addWeaponsFromArray(arr: Array<weaponInfo>) {
        for (let wep of arr) {
            this.addNewWeapon(wep);
        }
    }
    private setLevelDisplay(num: number) {
        let div = document.getElementById("levDiv_" + num);
        let prevDiv = document.getElementById("levDiv_" + (num - 1));
        if (prevDiv) {
            prevDiv.classList.remove('selected')
        }
        div.classList.add("selected");
    }
    private setWaveDisplay(num: number) {
        let levDiv = document.getElementById("levDiv_" + (this.info.number));
        let div = levDiv.querySelector("#wavDiv_" + num) as HTMLElement;

        let prevDiv = levDiv.querySelector("#wavDiv_" + (num - 1)) as HTMLElement;
        if (prevDiv) {
            prevDiv.classList.remove('selected')
        }
        else {
            let prevLev = document.getElementById("levDiv_" + (this.info.number - 1)) as HTMLElement;
            if (prevLev) {
                let lastChild = prevLev.lastChild as HTMLElement;
                lastChild.classList.remove('selected')
            }
        }
        div.classList.add("selected");
    }
    public setAsLevel() {
        let num = this.info.number;

        this.frequency = game.difficulty.newTargetEvery;
        if (game.gameMode == GameMode.regular) {
            PopupHandler.addToArray("", "Level " + num, msgLength.long)
            this.setLevelDisplay(num);
        }
        else {
            PopupHandler.addToArray("", "Sandbox", msgLength.short)
        }
    }
    public setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }

        this.currentWave = this.info.waves[num];
    }


    public winLimitCheck() {
        if (this.winCheckTimer != null) {
            console.log("HIT existing wincheck!")
            return
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
                    PopupHandler.addToArray(
                        "Press 'S' to scan for survivors..."
                    );
                }
            }
        }, 100);
    }

    private resetWincheck() {
        clearInterval(this.winCheckTimer);
        this.winCheckTimer = null;
    }
    public showActiveTargets() {
        for (let t of this.targets) {
            if (t.status === Status.active) {
                t.toggleLockOn(true);
                setTimeout(() => {
                    t.toggleLockOn(false);
                }, 1000)
            }
        }
    }
    protected checkForDamagedActiveTargets() {
        let warn: boolean = false;
        for (let t of this.targets) {
            if (t.damage != Damage.undamaged && t.status === Status.active) {
                warn = true;
            }
        }
        return warn;
    }

    protected checkForNilActiveTargets() {
        let fin: boolean = true;
        for (let t of this.targets) {
            if (t.status === Status.active) {
                fin = false;
            }
        }
        console.log("FIN?: " + fin)
        return fin;
    }
    protected endWave() {
        PopupHandler.addToArray(
           "Nice job!" + "\n" // "WaveIndex " + this.index + " of " + this.winLimits.length
        );
        this.allTargetsDeployed = false;
        this.nextWavePrepGap();
    }
    protected nextWavePrepGap() {
        setTimeout(() => {
        //    PopupHandler.addToArray("Get ready, more coming!");
        }, 3500);
        setTimeout(() => {
            if (this.nextWave() == false) {
                let index = allLevelsArray.indexOf(this);
                let nextLevel = allLevelsArray[index + 1];
                game.newLevel(nextLevel, game.gameMode)
              //  console.log("NEXT LEVEL callback")
            }
        }, 5000);
    }

    public nextWave() {
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
        if (this.currentWave.type == WaveType.sudden) {
            RandomSoundGen.playSequentialSound(revs);
        }
      //  console.log("WAVE TYPE: " + this.currentWave.type + " " + "NUMBER: " + this.currentWave.number)
      //  this.currentLimit = this.waves[this.index].;
        this.continueWave();
        return true;
    }

    public continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        let freq: number;
        if (this.currentWave.type == WaveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == WaveType.sudden) {
            freq = 50;
        }
        if (this.targetTimer != null) console.log("WARNING: STARTED MULTIPLE TARGET TIMERS!!!")
        this.targetTimer = setInterval(() => {
            if (this.allTargetsDeployed == false) {
                this.produceSingleTarget();
            }
            }, freq);
    }
    public produceSingleTarget(tgt?: Target) {
        let target: Target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);

        if (this.targets.length >= this.currentWave.number) {
            this.allTargetsDeployed = true;
            this.pauseWave();
            this.winLimitCheck();
        }
    }
    public pauseWave() {
        clearInterval(this.targetTimer);
        this.targetTimer = null;
    }
    public resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
        }
        allTargets = [];
        this.allTargetsDeployed = false;
        this.resetWincheck();
    }

    public addNewWeapon(info: weaponInfo, showMsg?: boolean) {
        let wepName = weaponNames[info.name]
        if (allWeaponTypes[info.name - 1]) {
            allWeaponTypes[info.name - 1].pushNewWeaponInstance();
            if (showMsg != false) {
                PopupHandler.addToArray("You got another " + wepName);
            }
        }
        else {
            new info.class(info);
            if (showMsg != false) {
                PopupHandler.addToArray("New weapon:\n" + wepName)
            }
        }
   //     game.redrawHudWithWepSelectionChecked();
    }
}
const continuousInfo: LevelInfo = {
    number: 0,
    messages: [{ title: "Cont", text: "", length: msgLength.short }],
    waves: [
        new Wave(16, WaveType.sudden),
        new Wave(30, WaveType.gradual),
        new Wave(70, WaveType.gradual),
        new Wave(25, WaveType.sudden),
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => {
        return provideAllTargets();
    }
}

const allLevelInfo: Array<LevelInfo> = [
    {
        number: 1,
        messages: [],
        waves: [
            new Wave(8, WaveType.gradual),
            new Wave(8, WaveType.sudden),
            new Wave(14, WaveType.sudden)
        ],
        startArms: [sniperInfo, mortarInfo, mortarInfo],
        endArms: [mortarInfo],
        targetFunc: () => { return new RegVehicleTarget(); }
    },
    {
        number: 2,
        messages: [],
        waves: [
            new Wave(8, WaveType.sudden),
            new Wave(30, WaveType.gradual),
            new Wave(20, WaveType.sudden),
        ],
        startArms: [mortarInfo, howitzerInfo],
        endArms: [howitzerInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget: Target;
            switch (true) {
                case (rand >= 90):
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
        number: 3,
        messages: [],
        waves: [
            new Wave(16, WaveType.gradual),
            new Wave(10, WaveType.sudden),
        ],
        startArms: [howitzerInfo, airstrikeInfo],
        endArms: [howitzerInfo, airstrikeInfo],
        targetFunc: () => {  return new HeavyVehicleTarget(); }
    },
    {
        number: 4,
        messages: [],
        waves: [
            new Wave(6, WaveType.gradual),
            new Wave(12, WaveType.gradual),
        ],
        startArms: [chargeInfo, airstrikeInfo],
        endArms: [chargeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget: Target;
            switch (true) {
                case (rand >= 50):
                    newTarget = new TunnelTarget();
                    break;
                default:
                    newTarget = new HeavyVehicleTarget();
                    break;
            }
            return newTarget; }
    },
    {
        number: 5,
        messages: [],
        waves: [
            new Wave(16, WaveType.sudden),
            new Wave(30, WaveType.gradual),
            new Wave(70, WaveType.gradual),
            new Wave(25, WaveType.sudden),
        ],
        startArms: [nukeInfo],
        endArms: [airstrikeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget: Target;
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
        messages: [{ text: "Missile trucks prevent aircraft strikes", title: "WARNING" } as popupMsg],
        waves: [
            new Wave(30, WaveType.gradual),
            new Wave(30, WaveType.sudden),
        ],
        startArms: [],
        endArms: [mortarInfo, airstrikeInfo],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget: Target;
            switch (true) {
                case (rand >= 85):
                    newTarget = new RocketLauncher();
                    break;
                default:
                    newTarget = new RegVehicleTarget();
                    break;
            }
            return newTarget; }
    },
    {
        number: 7,
        messages: [],
        waves: [
            new Wave(16, WaveType.sudden),
            new Wave(30, WaveType.gradual),
            new Wave(70, WaveType.gradual),
            new Wave(25, WaveType.sudden),
        ],
        startArms: [],
        endArms: [],
        targetFunc: () => {
            let rand = RandomNumberGen.randomNumBetween(1, 100);
            let newTarget: Target;
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
            return newTarget; }
    },
    {
        number: 8,
        messages: [],
        waves: [
            new Wave(20, WaveType.sudden),
            new Wave(30, WaveType.gradual),
            new Wave(60, WaveType.gradual),
            new Wave(40, WaveType.sudden),
        ],
        startArms: [],
        endArms: [],
        targetFunc: () => {
            return provideAllTargets();
 }
    },

]

function provideAllTargets(): Target {
    let rand = RandomNumberGen.randomNumBetween(1, 100);
    let newTarget: Target;
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
        case (rand >= 70):
            newTarget = new RocketLauncher();
            break;
        default:
            newTarget = new RegVehicleTarget();
            break;
    }
    return newTarget;
}

//class Level_continuous extends Level {
//    public waves: Array<Wave> = [
//        new Wave(14, WaveType.gradual),
//        new Wave(14, WaveType.sudden),
//        new Wave(30, WaveType.sudden),
//        new Wave(40, WaveType.gradual),   /// CONFLICT!!
//        ]
//    public setCurrentWave() {  /// CONFLICT!!
//        let newWave: Wave 
//        if (this.waveIndex > 0) {
//            if (this.waves[this.waveIndex - 1].type == WaveType.gradual) {
//                newWave = new Wave(25, WaveType.sudden)
//            }
//            else {
//                newWave = new Wave(50, WaveType.gradual)
//            }
//            this.waves.push(
//                newWave
//             )
//        }
//        this.currentWave = this.waves[this.waveIndex];
//    }

//    public armingUp() {
//    }
//    public finalStageArms() {
//    }
//    public provideAvailTargets(): Target {
//        return provideAllTargets();
//    }
//}