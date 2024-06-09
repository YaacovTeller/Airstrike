class level {
    nextLevelCallback;
    index = -1;
    frequency;
    winLimits;
    currentLimit;
    targets = [];
    winCheckTimer;
    targetTimer;
    constructor(levelendCallback) {
        this.nextLevelCallback = levelendCallback;
        this.frequency = game.difficulty.newTargetEvery;
        //this.currentLimit = this.winLimits[this.index]
        //    let newLevMsg: popupMsg = { text: "", title: this.constructor.name.replace("_", " "), length: msgLength.long }
        PopupHandler.addToArray("", this.constructor.name.replace("_", " "), msgLength.long);
    }
    winLimitCheck() {
        if (this.targets.length >= this.currentLimit) {
            this.pauseWave();
            if (this.winCheckTimer) {
                console.log("HIT existing wincheck!");
                return;
            }
            this.winCheckTimer = setInterval(() => {
                if (this.checkForNilActiveTargets()) {
                    this.resetWincheck();
                    this.endWave();
                }
            }, 100);
        }
    }
    resetWincheck() {
        clearInterval(this.winCheckTimer);
        this.winCheckTimer = null;
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
        if (this.index >= this.winLimits.length) {
            PopupHandler.addToArray("Past array length, /n pls fix this, wth");
        }
        else {
            this.nextWavePrepGap();
        }
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
    nextWave() {
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
    continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevents new target on unpause
        this.targetTimer = setInterval(() => {
            this.produceSingleTarget();
        }, this.frequency);
    }
    produceSingleTarget(tgt) {
        let target = tgt ? tgt : this.provideAvailTargets();
        this.targets.push(target);
        allTargets.push(target);
        this.winLimitCheck();
    }
    pauseWave() {
        clearInterval(this.targetTimer);
    }
    resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
        }
        allTargets = [];
        this.resetWincheck();
    }
    addNewWeapon(className, info) {
        let wepName = weaponNames[info.name];
        if (allWeaponTypes[info.name - 1]) {
            PopupHandler.addToArray("You got another " + wepName);
            allWeaponTypes[info.name - 1].pushNewWeaponInstance();
        }
        else {
            PopupHandler.addToArray("New weapon:\n" + wepName);
            new className(info);
        }
        game.redrawHudWithWepSelectionChecked();
    }
}
class level_1 extends level {
    winLimits = [8, 22];
    armingUp() {
        console.log("ARMING");
        this.addNewWeapon(BulletWeaponType, sniperInfo);
        this.addNewWeapon(ExplosiveWeaponType, mortarInfo);
        this.addNewWeapon(ExplosiveWeaponType, mortarInfo);
    }
    provideAvailTargets() {
        return new VehicleTarget(regTarget);
    }
    finalStageArms() {
        this.addNewWeapon(ExplosiveWeaponType, mortarInfo);
    }
}
class level_2 extends level {
    winLimits = [12, 30];
    armingUp() {
        this.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
        this.addNewWeapon(ExplosiveWeaponType, mortarInfo);
    }
    provideAvailTargets() {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget;
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
    finalStageArms() {
        this.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
    }
}
class level_3 extends level {
    winLimits = [6, 16];
    armingUp() {
        this.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
        this.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
    }
    provideAvailTargets() {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget;
        switch (true) {
            default:
                newTarget = new VehicleTarget(heavyTarget);
                break;
        }
        return newTarget;
    }
    finalStageArms() {
        this.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
        this.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
    }
}
class level_4 extends level {
    winLimits = [5, 12];
    armingUp() {
        this.addNewWeapon(ChargeWeaponType, chargeInfo);
        this.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
    }
    provideAvailTargets() {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget;
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
    finalStageArms() {
        this.addNewWeapon(ChargeWeaponType, chargeInfo);
    }
}
class level_5 extends level {
    winLimits = [30, 70];
    armingUp() {
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.addNewWeapon(ExplosiveWeaponType, nukeInfo);
        }
    }
    provideAvailTargets() {
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        let newTarget;
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
    finalStageArms() {
        this.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
    }
}
//# sourceMappingURL=level.js.map