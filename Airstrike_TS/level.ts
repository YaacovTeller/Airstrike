enum WaveType {
    gradual,
    sudden,
    double
}
enum Time {
    day,
    dusk,
    night
}
class Wave {
    public number: number
    public type: WaveType
    public finished: boolean = false
    public timeOfDay: Time
    public weather: Rain
    constructor(num: number, type: WaveType, timeOfDay?: Time, rain?: Rain) {
        this.timeOfDay = timeOfDay ? timeOfDay : Time.day;
        this.weather = rain ? rain : noRain;
        this.number = num;
        this.type = type;
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
    targetFunc: () => Target
}


class Level {
    public waveIndex: number = -1;
    public frequency: number;
    public currentWave: Wave;
    public targets: Array<Target> = [];
    public winCheckTimer: number;
    public targetTimer: number;
    public waveDurationTimer: number;
    private allTargetsDeployed: boolean = false;
    private pauseTargetProduction: boolean = false;
    private passedHalfTargetProduction: boolean = false;
    private pauseLength: number = 6000;
    private suddenTargetFreq: number = 150;

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

    protected provideAvailTargets(): Target { return } // FIX?
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
        for (let msg of this.info.messages) {
            PopupHandler.addToArray(msg.text, msg.title, msg.length);
        }
    }

    public setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }
        this.currentWave = this.info.waves[num];
        game.changeTime(this.currentWave.timeOfDay);
        game.setRain(this.currentWave.weather);
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
                break
            }
        }
        return fin;
    }
    protected endWave() {
        PopupHandler.addToArray(
            "Nice job!" + "\n" // "WaveIndex " + this.index + " of " + this.winLimits.length
        );
        this.allTargetsDeployed = false;
        this.targets = [];
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
            }
        }, 5000);
    }

    public nextWave() {
        this.waveIndex++;
        let length = this.info.waves.length;
        let funcToExecute: Function;
        switch (this.waveIndex) {
            case (0):
                funcToExecute = ()=>this.armingUp();
                break;
            case (length - 1):
                funcToExecute = () =>this.finalStageArms();
                break;
            case (length):
                this.waveIndex = -1;
                return false;
            default:
        }
        this.setCurrentWave();
        funcToExecute ? funcToExecute(): "";
        if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            RandomSoundGen.playSequentialSound(revs);
        }
        this.continueWave();
        return true;
    }

    public continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        let freq: number;
        if (this.currentWave.type == WaveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == WaveType.sudden || this.currentWave.type == WaveType.double) {
            freq = this.suddenTargetFreq;
        }
        if (this.targetTimer != null) console.log("WARNING: STARTED MULTIPLE TARGET TIMERS!!!")
        this.targetTimer = setInterval(() => {
            if (this.allTargetsDeployed == false) {
                this.produceSingleTarget();
            }
        }, freq);
    }
    public produceSingleTarget(tgt?: Target) {
        if (this.pauseTargetProduction == true) {
            return
        }
        let target: Target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);
        game.updateKillStats(killStatDisplayOptions.total)

        if (this.currentWave.type == WaveType.double && this.passedHalfTargetProduction == false && this.targets.length == this.currentWave.number / 2) {
            this.pauseTargetProduction = this.passedHalfTargetProduction = true;
            let this_ = this;
            setTimeout(() => {
                this_.pauseTargetProduction = false;
                RandomSoundGen.playSequentialSound(revs); // UNIFY with NEXT WAVE revs
            }, this_.pauseLength)
        }

        if (this.targets.length >= this.currentWave.number && this.allTargetsDeployed === false) {
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
        let wepName = weaponNames[info.name];
        let wepArr: Array<WeaponType> = info.name <= weaponNames.drone ? conventionalWeapons : extraWeapons;
        if (wepArr[info.name]) {
            wepArr[info.name].pushNewWeaponInstance();
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
    }
}
const continuousInfo: LevelInfo = {
    number: 0,
    messages: [{ title: "Weapons Test", text: "", length: msgLength.short }],
    waves: [
        new Wave(16, WaveType.sudden),
        new Wave(30, WaveType.double, null, lightRain),
        new Wave(50, WaveType.double, null, heavyRain),
        new Wave(10, WaveType.gradual, Time.dusk),
        new Wave(10, WaveType.gradual, Time.night),
        new Wave(25, WaveType.sudden, Time.dusk),
        new Wave(40, WaveType.sudden),
        new Wave(90, WaveType.double),
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => {
        return provideAllTargets();
    },
}
const weatherTestInfo: LevelInfo = {
    number: 0,
    messages: [{ title: "Weather Test", text: "", length: msgLength.short }],
    waves: [
        new Wave(8, WaveType.double),
        new Wave(8, WaveType.double, Time.dusk),
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
    },
}



const allLevelInfo: Array<LevelInfo> = [
    {
        number: 1,
        messages: [{ text: "", title: "WAKE UP!" } as popupMsg],
        waves: [
            new Wave(8, WaveType.double, Time.dusk),
            new Wave(8, WaveType.gradual), //GRAD
            new Wave(8, WaveType.sudden),
            new Wave(14, WaveType.sudden)
        ],
        startArms: [sniperInfo, mortarInfo, mortarInfo],
        endArms: [mortarInfo],
        targetFunc: () => { return new RegVehicleTarget(); },
    },
    {
        number: 2,
        messages: [{ text: "It's getting dark...", title: "NOTE" } as popupMsg],
        waves: [
            new Wave(8, WaveType.sudden, Time.dusk),
            new Wave(25, WaveType.gradual, Time.night),
            new Wave(20, WaveType.sudden, Time.dusk),
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
        },
    },
    {
        number: 3,
        messages: [],
        waves: [
            new Wave(16, WaveType.gradual, null, medRain),
            new Wave(10, WaveType.sudden, null, heavyRain),
        ],
        startArms: [howitzerInfo, airstrikeInfo],
        endArms: [howitzerInfo, airstrikeInfo],
        targetFunc: () => { return new HeavyVehicleTarget(); },
    },
    {
        number: 4,
        messages: [{ text: "Watch out for tunnels", title: "WARNING" } as popupMsg],
        waves: [
            new Wave(8, WaveType.gradual, null, lightRain),
            new Wave(12, WaveType.sudden),
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
            return newTarget;
        },
    },
    {
        number: 5,
        messages: [{ text: "Mortar team positioning to provide flare rounds...", title: "NOTE" } as popupMsg],
        waves: [
            new Wave(16, WaveType.sudden),
            new Wave(30, WaveType.gradual, Time.dusk),
            new Wave(30, WaveType.gradual, Time.night),
            new Wave(40, WaveType.double, Time.dusk),
        ],
        startArms: [flareInfo, mortarInfo],
     //   startArms: [flareInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, howitzerInfo, airstrikeInfo, sniperInfo, ],
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
            new Wave(20, WaveType.sudden),
            new Wave(35, WaveType.double),
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
            return newTarget;
        }
    },
    {
        number: 7,
        messages: [],
        waves: [
            new Wave(20, WaveType.double),
            new Wave(30, WaveType.gradual),
            new Wave(35, WaveType.gradual),
            new Wave(40, WaveType.double),
        ],
        startArms: [mortarInfo, droneInfo],
        endArms: [droneInfo],
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
            return newTarget;
        }
    },
    {
        number: 8,
        messages: [{ text: "Almost there!", title: "" } as popupMsg],
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
        case (rand >= 68):
            newTarget = new RocketLauncher();
            break;
        default:
            newTarget = new RegVehicleTarget();
            break;
    }
    return newTarget;
}