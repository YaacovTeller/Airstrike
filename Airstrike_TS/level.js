var waveType;
(function (waveType) {
    waveType[waveType["gradual"] = 0] = "gradual";
    waveType[waveType["sudden"] = 1] = "sudden";
})(waveType || (waveType = {}));
class wave {
    number;
    type;
    finished;
    constructor(num, type, finished = false) {
        this.number = num;
        this.type = type;
        this.finished = finished;
    }
}
class level {
    nextLevelCallback;
    index = -1;
    frequency;
    waves;
    //   public winLimits: Array<number>;
    currentWave;
    targets = [];
    winCheckTimer;
    targetTimer;
    waveDurationTimer;
    allTargetsDeployed = false;
    constructor(levelendCallback) {
        this.nextLevelCallback = levelendCallback;
        this.frequency = game.difficulty.newTargetEvery;
        if (game.gameMode == GameMode.regular) {
            PopupHandler.addToArray("", this.constructor.name.replace("_", " "), msgLength.long);
        }
        else {
            PopupHandler.addToArray("", "Sandbox", msgLength.short);
        }
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
                this.nextLevelCallback();
                console.log("NEXT LEVEL callback");
            }
        }, 5000);
    }
    setCurrentWave() {
        this.currentWave = this.waves[this.index];
    }
    nextWave() {
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
        //  console.log("WAVE TYPE: " + this.currentWave.type + " " + "NUMBER: " + this.currentWave.number)
        //  this.currentLimit = this.waves[this.index].;
        this.continueWave();
        return true;
    }
    continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        let freq;
        if (this.currentWave.type == waveType.gradual) {
            freq = this.frequency;
        }
        else if (this.currentWave.type == waveType.sudden) {
            freq = 50;
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
        let target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);
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
class level_1 extends level {
    waves = [
        new wave(8, waveType.gradual),
        new wave(8, waveType.sudden),
        new wave(14, waveType.sudden),
    ];
    armingUp() {
        this.addNewWeapon(sniperInfo, false);
        this.addNewWeapon(mortarInfo, false);
        this.addNewWeapon(mortarInfo, false);
    }
    finalStageArms() {
        this.addNewWeapon(mortarInfo);
    }
    provideAvailTargets() {
        return new RegVehicleTarget();
    }
}
class level_2 extends level {
    waves = [
        new wave(8, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(20, waveType.sudden),
    ];
    armingUp() {
        this.addNewWeapon(howitzerInfo);
        this.addNewWeapon(mortarInfo);
    }
    finalStageArms() {
        this.addNewWeapon(howitzerInfo);
    }
    provideAvailTargets() {
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
    }
}
class level_3 extends level {
    waves = [
        new wave(16, waveType.gradual),
        new wave(10, waveType.sudden),
    ];
    armingUp() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(howitzerInfo);
    }
    finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(howitzerInfo);
    }
    provideAvailTargets() {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget;
        switch (true) {
            default:
                newTarget = new HeavyVehicleTarget();
                break;
        }
        return newTarget;
    }
}
class level_4 extends level {
    waves = [
        new wave(6, waveType.gradual),
        new wave(12, waveType.gradual),
    ];
    armingUp() {
        this.addNewWeapon(chargeInfo);
        this.addNewWeapon(airstrikeInfo);
    }
    provideAvailTargets() {
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
    }
    finalStageArms() {
        this.addNewWeapon(chargeInfo);
    }
}
class level_5 extends level {
    waves = [
        new wave(16, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(70, waveType.gradual),
        new wave(25, waveType.sudden),
    ];
    armingUp() {
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.addNewWeapon(nukeInfo);
        }
    }
    finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
    }
    provideAvailTargets() {
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
}
class level_6 extends level {
    waves = [
        new wave(30, waveType.gradual),
        new wave(30, waveType.sudden),
    ];
    armingUp() {
        PopupHandler.addToArray("Missile trucks prevent aircraft strikes", "WARNING");
    }
    finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(mortarInfo);
    }
    provideAvailTargets() {
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
}
//class level_6 extends level_5 {
//    public armingUp() {
//        this.addNewWeapon(sniperInfo, false);
//        this.addNewWeapon(mortarInfo, false);
//        this.addNewWeapon(droneInfo);    
//    }
//    public finalStageArms() {
//        this.addNewWeapon(droneInfo);
//    }
//}
class level_7 extends level {
    waves = [
        new wave(16, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(70, waveType.gradual),
        new wave(25, waveType.sudden),
    ];
    armingUp() {
    }
    finalStageArms() {
    }
    provideAvailTargets() {
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
}
class level_8 extends level {
    waves = [
        new wave(20, waveType.sudden),
        new wave(30, waveType.gradual),
        new wave(60, waveType.gradual),
        new wave(40, waveType.sudden),
    ];
    armingUp() {
    }
    finalStageArms() {
    }
    provideAvailTargets() {
        return provideAllTargets();
    }
}
////////
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
        case (rand >= 70):
            newTarget = new RocketLauncher();
            break;
        default:
            newTarget = new RegVehicleTarget();
            break;
    }
    return newTarget;
}
class level_continuous extends level {
    waves = [
        new wave(14, waveType.gradual),
        new wave(14, waveType.sudden),
        new wave(30, waveType.sudden),
        new wave(40, waveType.gradual), /// CONFLICT!!
    ];
    setCurrentWave() {
        let newWave;
        if (this.index > 0) {
            if (this.waves[this.index - 1].type == waveType.gradual) {
                newWave = new wave(25, waveType.sudden);
            }
            else {
                newWave = new wave(50, waveType.gradual);
            }
            this.waves.push(newWave);
        }
        this.currentWave = this.waves[this.index];
    }
    armingUp() {
    }
    finalStageArms() {
    }
    provideAvailTargets() {
        return provideAllTargets();
    }
}
//# sourceMappingURL=level.js.map