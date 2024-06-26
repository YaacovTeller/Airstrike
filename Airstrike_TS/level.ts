﻿abstract class level {
    public nextLevelCallback: Function;
    public index: number = -1;
    public frequency: number;
    public winLimits: Array<number>;
    public currentLimit: number;
    public targets: Array<Target> = [];
    public winCheckTimer: number;
    public targetTimer: number;
    abstract provideAvailTargets(): Target;
    abstract armingUp();
    abstract finalStageArms();
    constructor(levelendCallback) {
        this.nextLevelCallback = levelendCallback;
        this.frequency = game.difficulty.newTargetEvery;
        PopupHandler.addToArray("", this.constructor.name.replace("_", " "), msgLength.long)
    }
    // Start // 
    public winLimitCheck() {
        if (this.targets.length >= this.currentLimit) {
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
        if (this.index >= this.winLimits.length) {
            PopupHandler.addToArray("Past array length, /n pls fix this, wth")
        }
        else {
            this.nextWavePrepGap();
        }
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
    public nextWave() {
        this.index++;
        switch (this.index) {
            case (0):
                this.armingUp();
                break;
            case (this.winLimits.length - 1):
                this.finalStageArms();
                break;
            case (this.winLimits.length):
                this.index = -1;
                return false;
            default:
        }

        this.currentLimit = this.winLimits[this.index];
        this.continueWave();
        return true;
    }

    public continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        this.targetTimer = setInterval(() => {
            this.produceSingleTarget();
        }, this.frequency);
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

    public addNewWeapon(info: weaponInfo) {
        let wepName = weaponNames[info.name]
        if (allWeaponTypes[info.name - 1]) {
            PopupHandler.addToArray("You got another " + wepName);
            allWeaponTypes[info.name - 1].pushNewWeaponInstance();
        }
        else {
            PopupHandler.addToArray("New weapon:\n" + wepName)
            new info.class(info);
        }
        game.redrawHudWithWepSelectionChecked();
    }
}
class level_1 extends level {
    public winLimits: Array<number> = [8, 22];
    public armingUp() {
        console.log("ARMING");
        this.addNewWeapon(sniperInfo);
        this.addNewWeapon(mortarInfo);
        this.addNewWeapon(mortarInfo);
    }
    public provideAvailTargets(): Target {
        return new VehicleTarget(regTarget);
    }
    public finalStageArms() {
        this.addNewWeapon(mortarInfo);
    }
}
class level_2 extends level {
    public winLimits: Array<number> = [12, 30];
    public armingUp() {
        this.addNewWeapon(howitzerInfo);
        this.addNewWeapon(mortarInfo);
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            case (rand >= 90):
                newTarget = new VehicleTarget(modTarget);
                break;
            default:
                newTarget = new VehicleTarget(regTarget);
                break;
        }
        return newTarget;
    }
    public finalStageArms() {
        this.addNewWeapon(howitzerInfo);
    }
}
class level_3 extends level {
    public winLimits: Array<number> = [6, 16];
    public armingUp() {
        this.addNewWeapon(airstrikeInfo);
        this.addNewWeapon(howitzerInfo);
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            default:
                newTarget = new VehicleTarget(heavyTarget);
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
    public winLimits: Array<number> = [5, 12];
    public armingUp() {
        this.addNewWeapon(chargeInfo);
        this.addNewWeapon(airstrikeInfo);
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            case (rand >= 50):
                newTarget = new TunnelTarget(regTunnelTarget);
                break;
            default:
                newTarget = new VehicleTarget(heavyTarget);
                break;
        }
        return newTarget;
    }
    public finalStageArms() {
        this.addNewWeapon(chargeInfo);
    }
}
class level_5 extends level {
    public winLimits: Array<number> = [30, 70];
    public armingUp() {
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.addNewWeapon(nukeInfo);
        }
    }
    public provideAvailTargets(): Target {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget: Target;
        switch (true) {
            case (rand >= 92):
                newTarget = new TunnelTarget(regTunnelTarget);
                break;
            case (rand >= 85):
                newTarget = new VehicleTarget(heavyTarget);
                break;
            case (rand >= 75):
                newTarget = new VehicleTarget(modTarget);
                break;
            default:
                newTarget = new VehicleTarget(regTarget);
                break;
        }
        return newTarget;
    }
    public finalStageArms() {
        this.addNewWeapon(airstrikeInfo);
    }
}
