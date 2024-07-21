enum waveType {
    gradual,
    sudden
}
class wave {
    public number: number
    public type: waveType
    public finished: boolean
    constructor(num: number, type: waveType, finished: boolean = false) {
        this.number = num;
        this.type = type;
        this.finished = finished;
    }
}

abstract class level {
    public nextLevelCallback: Function;
    public index: number = -1;
    public frequency: number;
    public waves: Array<wave>;
 //   public winLimits: Array<number>;
    public currentWave: wave;
    public targets: Array<Target> = [];
    public winCheckTimer: number;
    public targetTimer: number;
    public waveDurationTimer: number;
    abstract provideAvailTargets(): Target;
    abstract armingUp();
    abstract finalStageArms();
    constructor(levelendCallback) {
        this.nextLevelCallback = levelendCallback;
        this.frequency = game.difficulty.newTargetEvery;
        if (game.gameMode == GameMode.regular) {
            PopupHandler.addToArray("", this.constructor.name.replace("_", " "), msgLength.long)
        }
        else {
            PopupHandler.addToArray("", "Sandbox", msgLength.short)
        }
    }
    // Start // 
    public winLimitCheck() {
        let spentWave = false;
        if (this.targets.length >= this.currentWave.number) {
            spentWave = true;
        }
        if (spentWave) {
            this.pauseWave();
            if (this.winCheckTimer) {
                console.log("HIT existing wincheck!")
                return
            }
            this.winCheckTimer = setInterval(() => {
                if (this.checkForNilActiveTargets()) {
                    this.resetWincheck();
                    this.endWave();
                }
            }, 100);
        }
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
        this.nextWavePrepGap();
    }
    protected nextWavePrepGap() {
        setTimeout(() => {
        //    PopupHandler.addToArray("Get ready, more coming!");
        }, 3500);
        setTimeout(() => {
            if (this.nextWave() == false) {
                this.nextLevelCallback();
                console.log("NEXT LEVEL callback")
            }
        }, 5000);
    }
    public setCurrentWave() {
        this.currentWave = this.waves[this.index];

    }
    public nextWave() {
        this.targets = [];
        this.index++;
        switch (this.index) {
            case (0):
                this.armingUp();
                break;
            case (this.waves.length - 1):
                this.finalStageArms();
                break;
            case (this.waves.length):
                this.index = -1;
                return false;
            default:
        }
        this.setCurrentWave();
        if (this.currentWave.type == waveType.sudden) {
            RandomSoundGen.playSequentialSound(revs);
        }
        console.log("WAVE TYPE: " + this.currentWave.type + " " + "NUMBER: " + this.currentWave.number)
      //  this.currentLimit = this.waves[this.index].;
        this.continueWave();
        return true;
    }

    public continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        let freq: number;
        if (this.currentWave.type == waveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == waveType.sudden) {
            freq = 50;
        }
        this.targetTimer = setInterval(() => {
            this.produceSingleTarget();
        }, freq);
    }
    public produceSingleTarget(tgt?: Target) {
        let target: Target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);
        this.winLimitCheck();
    }
    public pauseWave() {
        clearInterval(this.targetTimer);
    }
    public resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
        }
        allTargets = [];
        this.resetWincheck();
    }

    public addNewWeapon(info: weaponInfo, showMsg?: boolean) {
        let wepName = weaponNames[info.name]
        if (allWeaponTypes[info.name - 1]) {
            allWeaponTypes[info.name - 1].pushNewWeaponInstance();
            if (showMsg) {
                PopupHandler.addToArray("You got another " + wepName);
            }
        }
        else {
            new info.class(info);
            if (showMsg) {
                PopupHandler.addToArray("New weapon:\n" + wepName)
            }
        }
        game.redrawHudWithWepSelectionChecked();
    }
}
class level_1 extends level {
    public waves: Array<wave> = [
        new wave(8, waveType.gradual),
        new wave(8, waveType.sudden),
        new wave(14, waveType.sudden),
    ];
    public armingUp() {
        console.log("ARMING");
        this.addNewWeapon(sniperInfo, false);
        this.addNewWeapon(mortarInfo, false);
        this.addNewWeapon(mortarInfo, false);
    }
    public provideAvailTargets(): Target {
        return new RegVehicleTarget();
    }
    public finalStageArms() {
        this.addNewWeapon(mortarInfo);
    }
}
class level_2 extends level {
    public waves: Array<wave> = [
        new wave(8, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(20, waveType.sudden),
    ];
    public armingUp() {
        this.addNewWeapon(howitzerInfo);
        this.addNewWeapon(mortarInfo);
    }
    public provideAvailTargets(): Target {
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
    public finalStageArms() {
        this.addNewWeapon(howitzerInfo);
    }
}
class level_3 extends level {
    public waves: Array<wave> = [
        new wave(16, waveType.gradual),
        new wave(10, waveType.sudden),
    ];
    public armingUp() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(howitzerInfo);
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            default:
                newTarget = new HeavyVehicleTarget();
                break;
        }
        return newTarget;
    }
    public finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(howitzerInfo);
    }
}
class level_4 extends level {
    public waves: Array<wave> = [
        new wave(6, waveType.gradual),
        new wave(12, waveType.gradual),
    ];
    public armingUp() {
        this.addNewWeapon(chargeInfo);
        this.addNewWeapon(airstrikeInfo);
    }
    public provideAvailTargets(): Target {
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
    }
    public finalStageArms() {
        this.addNewWeapon(chargeInfo);
    }
}
class level_5 extends level {
    public waves: Array<wave> = [
        new wave(16, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(70, waveType.gradual),
        new wave(25, waveType.sudden),
    ];
    public armingUp() {
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.addNewWeapon(nukeInfo);
        }
    }
    public provideAvailTargets(): Target {
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
    public finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
    }
}

class level_6 extends level_5 {
    public armingUp() {
        this.addNewWeapon(droneInfo);    
    }
    public finalStageArms() {
        this.addNewWeapon(droneInfo);
    }
}

class level_continuous extends level {
    public waves: Array<wave> = [
        new wave(14, waveType.gradual),
        ]
    public setCurrentWave() {
        let newWave: wave
        if (this.index > 0) {

            if (this.waves[this.index - 1].type == waveType.gradual) {
                newWave = new wave(25, waveType.sudden)
            }
            else {
                newWave = new wave(50, waveType.gradual)
            }
            this.waves.push(
                newWave
            )
        }
        this.currentWave = this.waves[this.index];
    }

    public armingUp() {
    }
    public finalStageArms() {
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            case (rand >= 92):
                newTarget = new TunnelTarget();
                break;
            case (rand >= 85):
                newTarget = new HeavyVehicleTarget();
                break;
            case (rand >= 75):
                newTarget = new ModVehicleTarget();
                break;
            default:
                newTarget = new RegVehicleTarget();
                break;
        }
        return newTarget;
    }
}