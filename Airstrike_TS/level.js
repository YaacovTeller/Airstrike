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
    Area[Area["hills"] = 2] = "hills";
    Area[Area["teheran"] = 3] = "teheran";
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
    // keepPictures: leave the targets' pictures where they are (they've been carried off to leave the screen, see
    // GameHandler.moveStageToExit) instead of taking them away at once
    resetTargets(keepPictures = false) {
        this.targets = [];
        for (let x of allTargets) {
            if (!keepPictures)
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
        let wepArr = info.name <= weaponNames.drone && !info.utility ? conventionalWeapons : extraWeapons;
        if (wepArr[slot]) {
            wepArr[slot].pushNewWeaponInstance();
            if (showMsg != false) {
                PopupHandler.addToArray("You got another " + wepName);
            }
        }
        else {
            new info.class(info);
            if (showMsg != false) {
                PopupHandler.addToArray(info.pickupMessage || "New weapon:\n" + wepName);
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
        // The game's own message at the start says where it is and how hard; after that, each new level of the desert game announces itself
        // (the first level's own messages are left out, and the levels of the other games have no messages of their own)
        if (game.gameMode == GameMode.regular) {
            this.setLevelDisplay(num);
            if (num > 1) {
                PopupHandler.addToArray("", "Level " + num, msgLength.long);
                for (let msg of this.info.messages) {
                    PopupHandler.addToArray(msg.text, msg.title, msg.length);
                }
            }
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
    static testWaveTargets = 3;
    setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }
        this.currentWave = this.info.waves[num];
        if (game.testMode && game.gameMode == GameMode.regular && this.currentWave.number > Level.testWaveTargets) {
            // test mode: the desert game is one brief wave, a few targets (a copy, so the level's own wave isn't changed for the next game)
            this.currentWave = Object.assign(Object.create(Object.getPrototypeOf(this.currentWave)), this.currentWave, { number: Level.testWaveTargets });
        }
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
            if (checkIndex >= 200) { // every 20 seconds
                checkIndex = 0;
                // a hint about the drone, if there's one to use
                if (this.checkForDamagedActiveTargets() && extraWeapons[slotOf(surveillanceInfo)]) {
                    PopupHandler.addToArray("Use the surveillance drone (" + slotOf(surveillanceInfo) + ") to check for survivors...");
                }
            }
        }, 100);
    }
    resetWincheck() {
        clearInterval(this.winCheckTimer);
        this.winCheckTimer = null;
    }
    // The ground rushes past between the levels of the desert game, as it does between the stages of the others
    rushDirections = ["down"];
    static levelRushAt = 1800; // ms into the gap after the last wave of a level, once its message has been seen
    endWave() {
        // the last wave of a level (and not the last level) is a finished stage, as in the other games; the others are just a "Nice job!"
        const lastOfLevel = game.gameMode == GameMode.regular && this.waveIndex >= this.waveCount() - 1;
        if (lastOfLevel) {
            PopupHandler.addToArray("", "Stage cleared", msgLength.long);
        }
        else {
            PopupHandler.addToArray("Nice job!" + "\n" // "WaveIndex " + this.index + " of " + this.winLimits.length
            );
        }
        this.allTargetsDeployed = false;
        this.targets = [];
        this.nextWavePrepGap(lastOfLevel);
    }
    waveCount() {
        return game.testMode && game.gameMode == GameMode.regular ? 1 : this.info.waves.length;
    }
    nextWavePrepGap(lastOfLevel = false) {
        const index = allLevelsArray.indexOf(this);
        const nextLevel = game.testMode && game.gameMode == GameMode.regular ? undefined : allLevelsArray[index + 1]; // (test mode: the one level, and then it's the end)
        if (lastOfLevel && nextLevel) {
            setTimeout(() => this.rushToNextLevel(), Level.levelRushAt); // the wrecks ride off with the ground, and the next level starts when it's stopped
        }
        setTimeout(() => {
            //    PopupHandler.addToArray("Get ready, more coming!");
        }, 3500);
        setTimeout(() => {
            if (this.nextWave() == false) {
                game.newLevel(nextLevel, game.gameMode);
            }
        }, this.nextStageGap());
    }
    nextStageGap() { return 5000; } // how long after one is cleared before the next begins
    rushToNextLevel() {
        if (game.level !== this)
            return; // a stale call from before the game was reset
        game.moveStageToExit();
        this.resetTargets(true);
        game.clearStageLeftovers();
        StageTransition.rush(RandomNumberGen.returnRandomFromArray(this.rushDirections));
    }
    nextWave() {
        this.waveIndex++;
        let length = game.testMode && game.gameMode == GameMode.regular ? 1 : this.info.waves.length; // (test mode: the desert game is its first wave)
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
    // Whether something's interfering with the drone's feed, so its flyover shows nothing
    droneBlocked() { return false; }
    noteShot(slot, cost, bigBomb) { }
    // Something has exploded (a drone flyover or a gunshot hasn't)
    noteExplosion() { }
    // One of the special enemies has been dealt with (see SpecialEnemy)
    specialDown() { }
    // A tunnel charge has been set; true if it's the first of the stage
    noteChargeSet() { return false; }
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
        let target = tgt ? tgt : this.specialDue() ? this.provideSpecialTarget() : this.provideAvailTargets();
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
    // In the regular game, the last wave of each level has a special enemy in it, about a third of the way through, in
    // a vehicle (a plain one for now). If he gets off the screen it's game over, and if he's stopped he's eliminated.
    specialWave = -1; // the wave he's already been sent in
    specialDue() {
        return game.gameMode == GameMode.regular
            && this.waveIndex === this.info.waves.length - 1
            && this.specialWave !== this.waveIndex
            && this.targets.length >= Math.floor(this.currentWave.number / 3);
    }
    provideSpecialTarget() {
        this.specialWave = this.waveIndex;
        const vehicle = new ModVehicleTarget();
        vehicle.makeSpecial(SpecialNames.random(), SpecialPortraits.random());
        return vehicle;
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
    staticTargetCount = 20 / 3; // boats to a coast stage (two thirds of what there were: 7, 9 or 13, by difficulty)
    stage = 0;
    // A game of these levels is this many stages, and then it's won
    static totalStages = 6;
    static stagesInAGame(mode = game.gameMode) { return game.testMode ? 1 : mode == GameMode.teheran ? 4 : SceneLevel.totalStages; } // (one in test mode, and four in Tehran: three sites, then the city)
    // What this stage has taken so far, for the message when it's cleared
    stageElapsedMs = 0;
    stageShotsAtStart = 0;
    stageDroneFlyovers = 0;
    stageOrdnanceSpent = 0; // the shots so far, each weighed by what it costs
    stageBigBombsBySlot = {};
    // The rush between stages isn't the player's time. Over par, the clock goes red and bleeps once.
    tickClock() {
        if (StageTransition.active || this.stageFinished)
            return; // (the clock stops when the stage is cleared, as its message comes up)
        this.stageElapsedMs += 100;
        if (++this.ticksSinceRetreatCheck >= 10) { // once a second: has there been enough destruction for the special in the bunker to run for it?
            this.ticksSinceRetreatCheck = 0;
            this.checkForRetreat();
        }
        game.hud.updateStageTimer(this.stageElapsedMs, this.parMs());
        if (!this.overParWarned && this.stageElapsedMs > this.parMs()) {
            this.overParWarned = true;
            SoundPlayer.playWithVolumeSet(bleep_neg);
        }
    }
    overParWarned = false;
    stageFinished = false;
    // How long a stage can take before the hurry-up nudge: the difficulty's time, or the level's own if it has none
    parMs() {
        return game.difficulty.parMs || this.slowAfterMs;
    }
    // How far through the game this stage is, 0 for the first and 1 for the last (a game of one stage, in test mode, is half way): the stages grow, from
    // small ones with few targets to very big ones with a lot
    progress() {
        const stages = SceneLevel.stagesInAGame();
        return stages > 1 ? Math.max(0, Math.min(1, (this.stage - 1) / (stages - 1))) : 0.5;
    }
    byProgress(first, last) {
        return Math.round(first + (last - first) * this.progress());
    }
    // How many of something: more of them on the harder difficulties
    scaled(count) {
        return Math.max(1, Math.round(count * (game.difficulty.enemyFactor || 1)));
    }
    noteDroneFlyover() { this.stageDroneFlyovers++; }
    stageChargesSet = 0;
    noteChargeSet() { return this.stageChargesSet++ === 0; }
    noteShot(slot, cost, bigBomb) {
        if (slot == slotOf(surveillanceInfo))
            return; // the drone's flyovers are counted on their own
        this.stageOrdnanceSpent += cost;
        if (bigBomb)
            this.stageBigBombsBySlot[slot] = (this.stageBigBombsBySlot[slot] || 0) + 1;
    }
    static praise = ["Well done!", "Nice work!", "Target area cleared!", "Excellent shooting!"];
    static hurryUp = ["Speed up your game!", "Pick up the pace!", "That took you a while!", "You took your time on that one."];
    static congratulations = ["Perfectly executed!", "Fantastic work!", "Great job!", "Clean and efficient!"];
    static lotsOfShots = ["That was a lot of ordnance...", "I think you probably could've got by with fewer munitions.", "Is ammunition free where you come from?"];
    static lotsOfDroneFlyovers = ["You know it costs to keep that thing in the air, right?"];
    static noDroneFlyovers = ["Didn't need to check anything then?", "You were given that drone for a reason, right?"];
    static expensiveBombs = ["Hey, those things are expensive!", "I'm not even sure why you have those bombs, really.", "...surgical precision..."];
    static tooManyDroneFlyovers = 4; // more than this and you're told about it
    static shotsPerTarget = 1.5; // more than this much shooting for each target and you're told about it
    // (How much a shot counts towards that is the weapon's own shotCost: small ones are cheap, so there's loads
    // to spend, the big ones cost more, and the tunnel charge nothing.)
    static tooManyBigBombs = 2; // more than this of either big bomb and you're told about it
    slowAfterMs = 60000; // how long a stage can take before the hurry-up nudge
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
        const praise = RandomNumberGen.returnRandomFromArray(SceneLevel.praise);
        let criticised = false;
        // each criticism goes under the figure it's about
        const criticise = (pool) => {
            criticised = true;
            return "<br><strong>" + RandomNumberGen.returnRandomFromArray(pool) + "</strong>";
        };
        let text = "<br>Time: " + this.formatTime(this.stageElapsedMs);
        if (this.stageElapsedMs > this.parMs()) {
            text += criticise(SceneLevel.hurryUp);
        }
        text += "<br>" + this.plural(shots, "shot") + " fired";
        if (this.stageOrdnanceSpent > this.targets.length * SceneLevel.shotsPerTarget) {
            text += criticise(SceneLevel.lotsOfShots);
        }
        if (Object.values(this.stageBigBombsBySlot).some(count => count > SceneLevel.tooManyBigBombs)) {
            text += criticise(SceneLevel.expensiveBombs);
        }
        text += "<br>" + this.plural(flyovers, "drone flyover") + " needed";
        if (flyovers == 0 && extraWeapons[slotOf(surveillanceInfo)]) { // had a drone, and never sent it
            text += criticise(SceneLevel.noDroneFlyovers);
        }
        if (flyovers > SceneLevel.tooManyDroneFlyovers) {
            text += criticise(SceneLevel.lotsOfDroneFlyovers);
        }
        // the name goes in once: with the congratulations if there are any, otherwise the plain praise
        if (!criticised) { // nothing to say against it: say something for it, at the bottom
            text += "<br><strong>" + userHandler.addressed(RandomNumberGen.returnRandomFromArray(SceneLevel.congratulations)) + "</strong>";
        }
        return (criticised ? userHandler.addressed(praise) : praise) + text;
    }
    // Who's to be found in a stage: the men in the list the game began with, in order (any extra are made up)
    specialAt(n) {
        const entry = game.roster[(this.stage - 1) * this.scaled(1) + n];
        return entry || { name: SpecialNames.random(), portrait: SpecialPortraits.random() };
    }
    // Morning (daylight) or dusk, one stage in three at dusk. There's no night yet, as there are no flares.
    chooseTimeOfDay() {
        const time = RandomNumberGen.randomNumBetween(1, 100) <= 33 ? Time.dusk : Time.day;
        this.currentWave.timeOfDay = time;
        game.changeTime(time);
    }
    // Mostly fine: one stage in five has rain, half of those (one in ten) hard rain, the rest light or medium
    chooseWeather() {
        const roll = RandomNumberGen.randomNumBetween(1, 100);
        if (roll <= 80)
            return noRain;
        if (roll <= 90)
            return RandomNumberGen.returnRandomFromArray([lightRain, medRain]);
        return heavyRain;
    }
    nextWave() {
        if (game.level !== this)
            return true; // a stale call from before the game was reset
        this.stage++;
        if (this.stage > 1) {
            game.moveStageToExit(); // the last stage's buildings, craters and debris ride off the screen with the ground...
            this.resetTargets(true);
        }
        else {
            this.resetTargets();
        }
        game.clearStageLeftovers(); // ...and nothing of it is left behind in the new one
        if (this.stage == 1) {
            this.waveIndex = 0;
            this.setCurrentWave(); // later stages keep whatever time of day they're in
        }
        game.setRain(this.chooseWeather()); // but the weather's chosen afresh for each
        this.chooseTimeOfDay(); // and the time of day
        PowerGrid.reset();
        this.populateStage();
        game.lightStage(this.lightArea()); // after dark the buildings glow
        this.stageElapsedMs = 0;
        this.stageShotsAtStart = game.killStats.shots;
        this.stageDroneFlyovers = 0;
        this.stageOrdnanceSpent = 0;
        this.stageChargesSet = 0;
        this.stageBigBombsBySlot = {};
        this.overParWarned = false;
        this.stageFinished = false;
        if (this.stage > 1) {
            if (this.announcesStages())
                PopupHandler.addToArray("", "Stage " + this.stage + " of " + SceneLevel.stagesInAGame(), msgLength.short);
            StageTransition.rush(RandomNumberGen.returnRandomFromArray(this.rushDirections)); // the ground runs past empty, then the new stage slides in with it and stops
            for (const info of this.stageAwards[this.stage] || [])
                this.addNewWeapon(info, true); // a new stage, and what's won for getting there
        }
        this.winLimitCheck();
        return true;
    }
    continueWave() { } // unpausing must not start target production
    // Whether each new stage is announced with its number (Tehran's isn't: the one that's cleared says which it was)
    announcesStages() { return true; }
    // The weapons won on getting to each stage (from the second), set when the game's begun: the game starts with a few, and gets more
    stageAwards = {};
    // Where the lights of a stage are lit: the place it's in
    lightArea() { return this.returnLocation(); }
    // Which buildings enemies can be put in
    canBeInfested(b) { return b.canHideEnemies(); }
    // What a stage is made of: here, boats on the water and a block layout of buildings, some with enemies in
    populateStage() {
        game.shapeCoast(); // first, as the boats and buildings keep clear of the water, wherever it is
        // make the boats all, then place them together (see WaterVehicleTarget.arrange): the lower ones go in front
        const made = [];
        const boats = this.scaled(this.byProgress(3, 7)); // (from a few boats to a crowded sea)
        for (let i = 0; i < boats; i++) {
            made.push(this.provideAvailTargets());
        }
        if (made.length && made.every(t => t instanceof WaterVehicleTarget)) {
            const spots = WaterVehicleTarget.arrange(made);
            made.forEach((t, i) => this.registerTarget(t, spots[i]));
        }
        else {
            made.forEach(t => this.registerTarget(t));
        }
        const buildings = game.drawAllBuildings(false, this.byProgress(32, 110)); // (from a few blocks to a big town)
        this.infestBuildings(buildings);
        this.placeBunkers(buildings);
    }
    // The special enemies here are in bunkers, one under a building, who only a bunker buster can get at
    placeBunkers(buildings) {
        this.stageBuildings = buildings;
        this.bunkerSpecials = [];
        this.retreatScheduled = false;
        this.stageToken++;
        const pool = buildings.filter(b => !b.isElectric() && b.canHideEnemies()); // (nobody hides in a jetty, a breakwater or a water tank)
        for (let n = 0; n < this.scaled(1) && pool.length; n++) {
            const building = pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0];
            const bunker = new Bunker(building);
            const room = bunker.setUp();
            const who = this.specialAt(n);
            const enemy = new SpecialEnemy(who.name, who.portrait);
            enemy.goUnderground();
            enemy.bunker = bunker;
            bunker.occupant = enemy;
            this.registerTarget(enemy, { X: room.X - 4, Y: room.Y - 4 });
            this.bunkerSpecials.push(enemy);
        }
    }
    // Once there's been a lot of destruction (more than half of the targets gone, or more than half of the buildings
    // down) the specials in the bunkers try to get away by sea: after 10 to 20 seconds a boat that's still running
    // heads slowly for the coast, and the special gets aboard and turns for open water (see WaterVehicleTarget.runToShore).
    stageBuildings = [];
    bunkerSpecials = [];
    retreatScheduled = false;
    stageToken = 0;
    ticksSinceRetreatCheck = 0;
    // The special in the bunker feels threatened, and makes a run for it, once most of the boats have been dealt with, or most of the targets on land
    heavilyDestroyed() {
        const boats = this.targets.filter(t => t instanceof WaterVehicleTarget);
        const land = this.targets.filter(t => !(t instanceof WaterVehicleTarget));
        const mostGone = (group) => group.length > 0 && group.filter(t => t.isFinished()).length * 2 > group.length;
        return mostGone(boats) || mostGone(land);
    }
    checkForRetreat() {
        if (this.retreatScheduled || !this.bunkerSpecials.length || !this.heavilyDestroyed())
            return;
        if (this.bunkerSpecials.every(s => s.isFinished()))
            return;
        this.retreatScheduled = true;
        const stage = this.stageToken;
        setTimeout(() => {
            if (stage !== this.stageToken || game.level !== this)
                return;
            for (const special of this.bunkerSpecials) {
                if (!special.isFinished())
                    this.sendBoat(special, stage);
            }
        }, SceneLevel.fleeDelay());
    }
    // How long after the first strike a special enemy waits before he runs for it (the harder the difficulty, the sooner)
    static spookDelay() {
        const range = game.difficulty.spookDelay || { min: 3500, max: 7000 };
        return RandomNumberGen.randomNumBetween(range.min, range.max);
    }
    static fleeDelay() {
        const range = game.difficulty.fleeDelay || { min: 8000, max: 15000 };
        return RandomNumberGen.randomNumBetween(range.min, range.max);
    }
    // He calls for the nearest boat that's running
    // Where there are two of them, taking one out spooks the other, who runs for it at once (give or take a moment)
    specialDown() {
        if (this.bunkerSpecials.length < 2)
            return;
        const stage = this.stageToken;
        this.retreatScheduled = true; // (no need for the usual wait and the usual reason)
        setTimeout(() => {
            if (stage !== this.stageToken || game.level !== this)
                return;
            for (const special of this.bunkerSpecials) {
                if (!special.isFinished())
                    this.sendBoat(special, stage);
            }
        }, SceneLevel.spookDelay());
    }
    sendBoat(special, stage) {
        if (special.called || special.isFinished())
            return;
        const boats = allTargets.filter(t => t instanceof WaterVehicleTarget && t.isRunning() && !t.isRunningToShore());
        if (!boats.length)
            return;
        const here = CollisionDetection.getXYfromPoint(special.getTargetEl());
        const distanceTo = (t) => {
            const there = CollisionDetection.getXYfromPoint(t.getTargetEl());
            return Math.hypot(there.X - here.X, there.Y - here.Y);
        };
        const boat = boats.reduce((best, t) => distanceTo(t) < distanceTo(best) ? t : best);
        special.called = true;
        boat.runToShore(special, game.difficulty.boatFleeSpeed || 3, () => {
            // that one was knocked out on the way: another, a moment later
            special.called = false;
            setTimeout(() => {
                if (stage === this.stageToken && game.level === this && !special.isFinished())
                    this.sendBoat(special, stage);
            }, 3000);
        });
    }
    static infestedBuildingCount = 3;
    static minOccupants = 2;
    static maxOccupants = 6;
    infestedCount() { return this.scaled(this.byProgress(1, SceneLevel.infestedBuildingCount)); }
    // A few of the buildings have enemies hiding in them, who count as targets for the stage.
    infestBuildings(buildings) {
        const pool = buildings.filter(b => this.canBeInfested(b));
        for (let n = 0; n < this.infestedCount() && pool.length; n++) {
            const building = pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0];
            const occupants = this.scaled(RandomNumberGen.randomNumBetween(SceneLevel.minOccupants, SceneLevel.maxOccupants));
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
        this.stageFinished = true; // the time is what it was when the stage was cleared
        PopupHandler.addToArray(this.stageSummary(), "Stage cleared", msgLength.long);
        if (this.stage >= SceneLevel.stagesInAGame()) { // the last of them: the game's won, once its message has been read
            setTimeout(() => { if (game.level === this)
                game.finishCampaign(); }, msgLength.long + 600);
            return;
        }
        this.nextWavePrepGap(); // then nextWave() builds the next stage
    }
}
// The Hills level: scrubby hills with villas dotted about, a few vehicles parked near them (some running,
// some not), enemies hiding in some of the villas, and tunnels nobody can see until a surveillance drone
// scans them. Stages follow on from each other like the port's.
class HillsLevel extends SceneLevel {
    // What a village is made of, which varies from stage to stage, in four sizes: just villas; villas with a few of the small
    // apartment blocks; villas with a range of apartment buildings, the tall ones too; and one that's very built up, mostly
    // apartment buildings. The small villages have one small mosque (any of them); the big ones a medium one, and often a small one as well.
    static villageSizes = [
        { chance: 25, villas: [20, 26], blocks: [0, 0], blockPool: smallBlockInfo, big: false, gap: 22 }, // just villas
        { chance: 30, villas: [14, 20], blocks: [2, 4], blockPool: smallBlockInfo, big: false, gap: 20 }, // villas, and a few small apartment blocks
        { chance: 25, villas: [8, 12], blocks: [6, 9], blockPool: allBlockInfo, big: true, gap: 14 }, // a range of apartment buildings
        { chance: 20, villas: [4, 7], blocks: [20, 26], blockPool: allBlockInfo, big: true, gap: 7 }, // very built up
    ];
    static secondMosqueChance = 65; // (percent, in a big village)
    static minOutliers = 1; // and standing off from it
    static maxOutliers = 2;
    static villageGap = 22; // between the buildings in the village
    static minVehicles = 2;
    static maxVehicles = 8;
    static minTunnels = 2;
    static maxTunnels = 4;
    static screenTop = 120; // clear of the HUD
    static screenEdge = 70;
    // The industrial odds and ends the village has among the houses (see industrial misc): a couple of each of these...
    static miscNames = ["Fuel_Station", "Storage_Shed", "Water_Tank", "Fuel_Depot", "Storage_Pad"];
    static minOfEachMisc = 1;
    static maxOfEachMisc = 2;
    // ...and one or two water towers, of the four kinds. Nothing parks beside a water tower. They're drawn at a bit
    // under their usual size to go with the villas.
    static towerNames = ["Water_Tower_Concrete", "Water_Tower_Metal", "Water_Tower_Box", "Water_Tower_Conical", "Water_Tower_B1", "Water_Tower_B2", "Water_Tower_B3", "Water_Tower_B4"];
    static miscScale = 0.85;
    static minWaterTowers = 1;
    static maxWaterTowers = 2;
    rushDirections = ["up", "right"]; // there's no sea here to keep in place, so it can go either way
    slowAfterMs = 90000; // a stage here takes longer: there's a village to search and tunnels to find
    takenBoxes = []; // where things have been put this stage, so nothing's put on top of anything
    populateStage() {
        this.takenBoxes = [];
        this.placePower();
        const buildings = this.placeVillage();
        this.infestBuildings(buildings); // only the villas have somewhere for anyone to hide
        this.placeSpecialEnemies(buildings);
        this.placeVehicles(buildings);
        this.placeUNVehicles();
        this.placeExplosives(buildings);
        this.placeTunnels();
    }
    // UNIFIL: a small village has a lookout tower with a UN car parked near it; a big one a whole base, with its buildings, a lookout and a couple of
    // trucks or other vehicles. Damaged, it's the UN that has something to say about it (see GameHandler.unifilDamaged).
    unBuildings = [];
    unBase = false;
    placeUNVehicles() {
        if (!this.unBuildings.length)
            return;
        const count = this.unBase ? RandomNumberGen.randomNumBetween(2, 3) : 1;
        for (let i = 0; i < count; i++) {
            const kind = this.unBase ? RandomNumberGen.randomNumBetween(0, 3) : 0; // jeep, or in a base a truck or a carrier as well
            const size = kind == 0 ? { w: 45, h: 45 } : { w: 65, h: 45 };
            let spot = null;
            for (let attempt = 0; attempt < 8 && !spot; attempt++)
                spot = this.spotBesideAVilla(this.unBuildings, size.w, size.h);
            if (!spot)
                continue;
            const vehicle = kind == 0 ? new UNJeepTarget() : kind == 1 ? new UNArmourTarget() : new UNTruckTarget();
            vehicle.park();
            this.takenBoxes.push({ left: spot.X, top: spot.Y, right: spot.X + size.w, bottom: spot.Y + size.h });
            vehicle.cold = true;
            vehicle.decidePosition(spot);
            allTargets.push(vehicle); // can be hit like the others, but isn't one of the targets to clear
        }
    }
    // The substation near the edge of the screen, and its lines leading off the map, are put down first, so the village keeps clear of them
    placePower() {
        const slots = PowerGrid.plan(["top", "right", "bottom", "left"], box => !this.overlapsTaken(box, 14));
        for (const slot of slots) {
            const building = new Building(slot.info);
            building.setPosition(slot);
            PowerGrid.add(building);
            this.takenBoxes.push({ left: slot.X, top: slot.Y, right: slot.X + slot.info.width, bottom: slot.Y + slot.info.height });
        }
    }
    // Stacks of ammunition and rockets standing about among the villas, which count as targets: anything that damages one sets it on fire,
    // and it goes up (see ExplosiveTarget)
    static minExplosives = 2;
    static maxExplosives = 5;
    placeExplosives(buildings) {
        const villas = buildings.filter(b => !b.isTall());
        if (!villas.length)
            return;
        const count = RandomNumberGen.randomNumBetween(this.byProgress(1, HillsLevel.minExplosives), this.byProgress(2, HillsLevel.maxExplosives));
        for (let i = 0; i < count; i++) {
            const info = RandomNumberGen.returnRandomFromArray(allExplosiveInfo);
            const spot = this.spotBesideAVilla(villas, info.width, info.height);
            if (!spot)
                continue;
            this.takenBoxes.push({ left: spot.X, top: spot.Y, right: spot.X + info.width, bottom: spot.Y + info.height });
            this.registerTarget(new ExplosiveTarget(info), spot);
        }
    }
    // The special enemies here hide in buildings, and once the first explosion has gone off they'll try to get away
    // in a vehicle, between 10 and 20 seconds later (see startFlee), if there's one still running.
    specials = [];
    fleeScheduled = false;
    stageNumber = 0; // which stage's special enemies a timer set going belongs to
    placeSpecialEnemies(buildings) {
        this.specials = [];
        this.fleeScheduled = false;
        this.stageNumber++;
        const pool = buildings.filter(b => b.canHideEnemies());
        for (let n = 0; n < this.scaled(1) && pool.length; n++) {
            const building = pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0];
            const who = this.specialAt(n);
            const enemy = new SpecialEnemy(who.name, who.portrait);
            building.addOccupant(enemy);
            this.registerTarget(enemy, building.randomHidingSpot());
            this.specials.push(enemy);
        }
    }
    noteExplosion() {
        if (this.fleeScheduled || !this.specials.length)
            return;
        this.fleeScheduled = true;
        const stage = this.stageNumber;
        setTimeout(() => {
            if (stage === this.stageNumber && game.level === this)
                this.startFlee();
        }, SceneLevel.fleeDelay());
    }
    // Where there are two of them, taking one out spooks the other, who runs for it at once (give or take a moment)
    specialDown() {
        if (this.specials.length < 2)
            return;
        this.fleeScheduled = true;
        const stage = this.stageNumber;
        setTimeout(() => {
            if (stage === this.stageNumber && game.level === this)
                this.startFlee();
        }, SceneLevel.spookDelay());
    }
    // Each special enemy still in a building gets into the nearest vehicle that's running, and starts it up
    startFlee() {
        const taken = [];
        for (const special of this.specials) {
            if (special.isFinished())
                continue;
            const here = CollisionDetection.getXYfromPoint(special.getTargetEl());
            let nearest = null, nearestDist = Infinity;
            for (const target of allTargets) {
                if (!(target instanceof VehicleTarget) || target instanceof RocketLauncher || taken.includes(target) || !target.isRunning())
                    continue;
                const there = CollisionDetection.getXYfromPoint(target.getTargetEl());
                const dist = Math.hypot(there.X - here.X, there.Y - here.Y);
                if (dist < nearestDist) {
                    nearest = target;
                    nearestDist = dist;
                }
            }
            if (!nearest)
                return; // nothing left to get away in
            taken.push(nearest);
            special.board();
            nearest.startFleeing(special.name, game.difficulty.fleeSpeed || 3, special.portrait);
        }
    }
    overlapsTaken(box, room = 0) {
        return this.takenBoxes.some(b => box.left - room < b.right && box.right + room > b.left && box.top - room < b.bottom && box.bottom + room > b.top);
    }
    within(low, high) {
        return RandomNumberGen.randomNumBetween(Math.floor(low), Math.max(Math.floor(low), Math.floor(high)));
    }
    miscInfo(name) {
        return scaledBuildingInfo(industrialByName(name), HillsLevel.miscScale);
    }
    // A village: the villas bunched up round the middle of the screen, the mosque, a couple of water towers and some of the fuel stations, sheds and the like among them,
    // and one or two villas out on their own
    placeVillage() {
        const buildings = [];
        const width = window.innerWidth, height = window.innerHeight;
        const middle = {
            X: width / 2 + this.within(-70, 70),
            Y: (height + HillsLevel.screenTop) / 2 + this.within(-40, 40),
        };
        const grow = 0.5 + 0.5 * this.progress(); // the first stages are small, with only half the buildings, and crowded closer in; the last are the full size
        const reachX = Math.min(540, width * 0.39) * Math.max(0.6, grow); // room for a good few more than a hamlet's worth
        const reachY = Math.min(340, (height - HillsLevel.screenTop) * 0.5) * Math.max(0.6, grow);
        const scaledCount = (low, high) => Math.round(RandomNumberGen.randomNumBetween(low, high) * grow);
        // try to put one down: inside the village's ellipse (nearer the middle more often) or, for an outlier, well outside it
        let gap = HillsLevel.villageGap; // set to the village's own once its size is known
        const place = (info, outlier) => {
            for (let attempt = 0; attempt < 250; attempt++) {
                let x, y;
                if (outlier) {
                    x = this.within(HillsLevel.screenEdge, width - HillsLevel.screenEdge - info.width);
                    y = this.within(HillsLevel.screenTop, height - HillsLevel.screenEdge - info.height);
                    if (Math.hypot((x + info.width / 2 - middle.X) / reachX, (y + info.height / 2 - middle.Y) / reachY) < 1.5)
                        continue;
                }
                else {
                    const angle = Math.random() * Math.PI * 2;
                    const pull = Math.random(); // an even spread in distance from the middle, which is thicker the nearer it gets to it
                    x = middle.X + Math.cos(angle) * reachX * pull - info.width / 2;
                    y = middle.Y + Math.sin(angle) * reachY * pull - info.height / 2;
                }
                const box = { left: x, top: y, right: x + info.width, bottom: y + info.height };
                const onScreen = x >= HillsLevel.screenEdge && y >= HillsLevel.screenTop && box.right <= width - HillsLevel.screenEdge && box.bottom <= height - HillsLevel.screenEdge;
                if (!onScreen || this.overlapsTaken(box, gap))
                    continue;
                const building = new Building(info);
                building.setPosition({ X: x, Y: y });
                buildings.push(building);
                this.takenBoxes.push(box);
                return true;
            }
            return false;
        };
        // how big a village this one is: the stages go up through the sizes, from a hamlet of villas to a built up town
        const size = HillsLevel.villageSizes[Math.min(HillsLevel.villageSizes.length - 1, Math.round(this.progress() * (HillsLevel.villageSizes.length - 1)))];
        gap = size.gap;
        // the big ones first, while there's room: the village's mosque (one small one in a small village; in a big one a medium one, and often a small one too), and the blocks
        place(oneOf(size.big ? mediumMosqueInfo : smallMosqueInfo), false);
        if (size.big && RandomNumberGen.randomNumBetween(1, 100) <= HillsLevel.secondMosqueChance)
            place(oneOf(smallMosqueInfo), false);
        // UNIFIL's: a lookout in a small village, and in a big one a base as well
        this.unBuildings = [];
        this.unBase = size.big;
        const placeUN = (info) => { if (place(info, false))
            this.unBuildings.push(buildings[buildings.length - 1]); };
        if (size.big)
            placeUN(oneOf(unBaseInfo));
        placeUN(oneOf(unLookoutInfo));
        const blocks = scaledCount(size.blocks[0], size.blocks[1]);
        for (let i = 0; i < blocks; i++) {
            place(RandomNumberGen.returnRandomFromArray(size.blockPool), false);
        }
        const towers = Math.max(1, scaledCount(HillsLevel.minWaterTowers, HillsLevel.maxWaterTowers));
        for (let i = 0; i < towers; i++) {
            place(this.miscInfo(RandomNumberGen.returnRandomFromArray(HillsLevel.towerNames)), false);
        }
        for (const name of HillsLevel.miscNames) {
            const count = scaledCount(HillsLevel.minOfEachMisc, HillsLevel.maxOfEachMisc);
            for (let i = 0; i < count; i++) {
                place(this.miscInfo(name), false);
            }
        }
        const villas = Math.max(4, scaledCount(size.villas[0], size.villas[1]));
        for (let i = 0; i < villas; i++) {
            place(RandomNumberGen.returnRandomFromArray(allVillaInfo), false);
        }
        const outliers = RandomNumberGen.randomNumBetween(HillsLevel.minOutliers, HillsLevel.maxOutliers);
        for (let i = 0; i < outliers; i++) {
            place(RandomNumberGen.returnRandomFromArray(allVillaInfo), true);
        }
        return buildings;
    }
    // A few vehicles just parked, each beside a villa. Some are running (they show on a drone's scan and are
    // targets that have to be dealt with); the others are cold, and can still be hit, flipped and blown up.
    placeVehicles(buildings) {
        const villas = buildings.filter(b => !b.isTall());
        if (!villas.length)
            return;
        const count = this.scaled(RandomNumberGen.randomNumBetween(this.byProgress(1, HillsLevel.minVehicles + 1), this.byProgress(2, HillsLevel.maxVehicles)));
        const running = [];
        for (let i = 0; i < count; i++)
            running.push(RandomNumberGen.randomNumBetween(0, 1) == 1);
        if (!running.some(r => r))
            running[0] = true; // at least one of them is a target
        for (let i = 0; i < count; i++) {
            const roll = RandomNumberGen.randomNumBetween(1, 100);
            const size = roll > 40 ? { w: 65, h: 45 } : { w: 45, h: 45 };
            const spot = this.spotBesideAVilla(villas, size.w, size.h);
            if (!spot)
                continue;
            const vehicle = roll > 85 ? new HeavyVehicleTarget() : roll > 40 ? new ModVehicleTarget() : new RegVehicleTarget();
            vehicle.park();
            this.takenBoxes.push({ left: spot.X, top: spot.Y, right: spot.X + size.w, bottom: spot.Y + size.h });
            if (running[i]) {
                vehicle.finishedWhenDisabled = true;
                this.registerTarget(vehicle, spot);
            }
            else {
                vehicle.cold = true;
                vehicle.decidePosition(spot);
                allTargets.push(vehicle); // can be hit like the others, but isn't one of the targets to clear
            }
        }
    }
    // Somewhere just off one side of a villa that's on the screen and free
    spotBesideAVilla(villas, width, height) {
        for (let attempt = 0; attempt < 40; attempt++) {
            const villa = villas[RandomNumberGen.randomNumBetween(0, villas.length - 1)];
            const rect = { left: parseInt(villa.getTargetEl().style.left), top: parseInt(villa.getTargetEl().style.top), width: villa.getTargetEl().offsetWidth, height: villa.getTargetEl().offsetHeight };
            const gap = RandomNumberGen.randomNumBetween(6, 26);
            let x, y;
            switch (RandomNumberGen.randomNumBetween(0, 3)) {
                case 0:
                    x = rect.left - gap - width;
                    y = this.within(rect.top, rect.top + rect.height - height);
                    break; // to the left
                case 1:
                    x = rect.left + rect.width + gap;
                    y = this.within(rect.top, rect.top + rect.height - height);
                    break; // to the right
                case 2:
                    y = rect.top + rect.height + gap;
                    x = this.within(rect.left - 10, rect.left + rect.width - width + 10);
                    break; // in front
                default:
                    y = rect.top - gap - height;
                    x = this.within(rect.left - 10, rect.left + rect.width - width + 10);
                    break; // behind
            }
            const box = { left: x, top: y, right: x + width, bottom: y + height };
            const onScreen = x >= 20 && y >= HillsLevel.screenTop - 30 && x + width <= window.innerWidth - 20 && y + height <= window.innerHeight - 20;
            if (onScreen && !this.overlapsTaken(box, 4))
                return { X: x, Y: y };
        }
        return null;
    }
    // Tunnels: just their heads are placed here, clear of everything else; each works out where it runs
    placeTunnels() {
        // however hard, not many more of these
        const count = RandomNumberGen.randomNumBetween(this.byProgress(1, HillsLevel.minTunnels), this.byProgress(2, HillsLevel.maxTunnels)) + (game.difficulty.extraTunnels || 0);
        const heads = [];
        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < 400; attempt++) {
                const x = this.within(90, window.innerWidth - 135);
                const y = this.within(HillsLevel.screenTop, window.innerHeight - 135);
                const box = { left: x, top: y, right: x + 45, bottom: y + 45 };
                if (this.overlapsTaken(box, 20) || heads.some(h => Math.hypot(h.X - x, h.Y - y) < 120))
                    continue;
                heads.push({ X: x, Y: y });
                this.takenBoxes.push(box);
                this.registerTarget(new HiddenTunnel(), { X: x, Y: y });
                break;
            }
        }
    }
}
// Tehran: four stages with one countdown through all of them. Three anti aircraft sites first, in the hills' terrain: a few rocket launchers in the middle of the
// screen, and a warehouse beside them with a few enemies hiding in it; when they're all dealt with the ground rushes by, to the next. Then the city, the
// coast's ground with no sea, a town of blocks of buildings that goes right off every edge of the screen, a good part of it the big ones, with a few blocks of
// warehouses, roads between the blocks, a big mosque, a medium one and a small one or two, and a power station. The one man you're after is in a bunker
// complex deep under one of the big buildings, and doesn't run. There are enemies hiding in the buildings all over (the ones that can be seen).
class TeheranLevel extends SceneLevel {
    // How long the countdown is: by difficulty (3 minutes, 2 minutes 30, 2 minutes)
    static countdownMs() { return game.difficulty.tehranMs || 180000; }
    countdownLeft = 0;
    timedOut = false;
    slowAfterMs = 150000;
    rushDirections = ["down", "up", "right"];
    nextStageGap() { return 2500; } // (the clock's running)
    announcesStages() { return false; }
    static wantedMan() {
        return { name: "Ali Khamenei", portrait: SpecialPortraits.path(2) };
    }
    static briefingText() {
        const seconds = Math.round(TeheranLevel.countdownMs() / 1000);
        const span = seconds % 60 == 0 ? (seconds / 60) + " minute" : Math.floor(seconds / 60) + " minute " + (seconds % 60) + " second";
        return "Destroy the anti aircraft sites to clear a path for our jets!<br>Watch out, you only have a " + span + " window to get this done!";
    }
    specialAt(n) { return TeheranLevel.wantedMan(); }
    infestedCount() { return this.scaled(5); } // (a bunch of buildings, with a bunch of enemies in each)
    checkForRetreat() { } // he stays where he is, deep underground
    specialDown() { }
    // The last stage is the city
    isCity() { return this.stage >= SceneLevel.stagesInAGame(); }
    lightArea() { return this.isCity() ? Area.teheran : Area.hills; }
    nextWave() {
        if (this.stage == 0) { // the first: the countdown starts
            this.countdownLeft = TeheranLevel.countdownMs();
            this.timedOut = false;
        }
        return super.nextWave();
    }
    // The countdown, which runs through all of it (the rush between the stages too) until the city's been cleared; at nothing, it's over
    tickClock() {
        if (this.blockers.length && !this.blockersCleared && !this.droneBlocked()) { // the last of the bugged buildings has come down
            this.blockersCleared = true;
            PopupHandler.addToArray("You are clear to use drone surveillance to find your targets!", "", msgLength.long);
        }
        if (this.stageFinished || this.timedOut)
            return;
        this.stageElapsedMs += 100;
        this.countdownLeft = Math.max(0, this.countdownLeft - 100);
        game.hud.updateCountdown(this.countdownLeft);
        if (this.countdownLeft <= 0) {
            this.timedOut = true;
            game.failGame("You're out of time, we missed our window! Calling off the strike");
        }
    }
    endWave() {
        if (this.isCity()) {
            super.endWave(); // the summary, and the game's won
            return;
        }
        PopupHandler.addToArray("", "Site " + this.stage + " of " + (SceneLevel.stagesInAGame() - 1) + " destroyed", msgLength.short);
        this.nextWavePrepGap();
    }
    // Enemies only go in the buildings that can be seen on the screen (the city goes on past its edges)
    canBeInfested(b) {
        return b.canHideEnemies() && !b.isElectric() && this.onScreen(b);
    }
    onScreen(b) {
        const r = b.getTargetEl().getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth && r.top >= 110 && r.bottom <= window.innerHeight; // (below the HUD)
    }
    within(low, high) {
        return RandomNumberGen.randomNumBetween(Math.floor(low), Math.max(Math.floor(low), Math.floor(high)));
    }
    populateStage() {
        if (this.isCity())
            this.populateCity();
        else
            this.populateSite();
    }
    populateCity() {
        game.handleBackgroundByLocation(Area.teheran);
        game.shapeCity();
        const buildings = game.drawAllBuildings(true);
        this.infestBuildings(buildings);
        this.placeBunkers(buildings);
        this.placeBlockers(buildings);
    }
    // Three of the buildings that can be seen are bugged: a satellite dish on the roof, signal blockers that jam the drone while any of them stands.
    // (Not the one over the bunker, and well apart from each other.)
    blockers = [];
    blockersCleared = false;
    static blockerCount = 3;
    placeBlockers(buildings) {
        this.blockers = [];
        this.blockersCleared = false;
        const bunkerBuilding = this.bunkerSpecials.length ? this.bunkerSpecials[0].bunker.building : null;
        const pool = buildings.filter(b => b !== bunkerBuilding && !b.isElectric() && this.onScreen(b) && b.getTargetEl().offsetWidth >= 70);
        const centre = (b) => { const r = b.getTargetEl().getBoundingClientRect(); return { X: (r.left + r.right) / 2, Y: (r.top + r.bottom) / 2 }; };
        for (let attempt = 0; attempt < 300 && this.blockers.length < TeheranLevel.blockerCount && pool.length; attempt++) {
            const b = pool[RandomNumberGen.randomNumBetween(0, pool.length - 1)];
            const at = centre(b);
            if (this.blockers.includes(b) || this.blockers.some(o => Math.hypot(centre(o).X - at.X, centre(o).Y - at.Y) < 260))
                continue;
            this.blockers.push(b);
        }
        for (const b of this.blockers)
            b.addRooftop(rooftopDishPicture, 30);
    }
    droneBlocked() {
        return this.blockers.some(b => !b.isWrecked());
    }
    // An anti aircraft site: a warehouse or two in the middle of the screen with a few enemies hiding in each, some radar, and rocket launchers standing about
    // them. How many of each depends on how hard it is.
    populateSite() {
        game.handleBackgroundByLocation(Area.hills);
        const width = window.innerWidth, height = window.innerHeight;
        const hard = game.difficulty;
        const howMany = (range, fallback) => this.within((range || fallback)[0], (range || fallback)[1]);
        const warehouses = howMany(hard.siteBuildings, [1, 1]);
        const scanners = howMany(hard.siteScanners, [1, 1]);
        const launchers = howMany(hard.siteLaunchers, [1, 2]);
        const more = Math.max(0, warehouses + scanners + launchers - 3); // (the more there is, the more room it's spread over)
        const middle = { X: width / 2 + this.within(-70, 70), Y: (height + 120) / 2 + this.within(-40, 40) };
        const taken = [];
        // puts something down somewhere in the middle of the screen that's clear of what's there; the first goes right in the middle
        const place = (w, h, first, create) => {
            for (let attempt = 0; attempt < 150; attempt++) {
                const x = first ? middle.X - w / 2 : middle.X + this.within(-230 - 30 * more, 230 + 30 * more) - w / 2;
                const y = first ? middle.Y - h / 2 : middle.Y + this.within(-140 - 16 * more, 140 + 16 * more) - h / 2;
                const box = { left: x, top: y, right: x + w, bottom: y + h };
                const clear = (t) => !(box.left < t.right + 14 && box.right > t.left - 14 && box.top < t.bottom + 10 && box.bottom > t.top - 10);
                if (y < 130 || y + h > height - 30 || x < 30 || x + w > width - 30 || !taken.every(clear))
                    continue;
                taken.push(box);
                create({ X: x, Y: y });
                return true;
            }
            return false;
        };
        for (let n = 0; n < warehouses; n++) {
            const info = oneOf(teheranWarehouseInfo);
            place(info.width, info.height, n == 0, spot => {
                const warehouse = new Building(info);
                warehouse.setPosition(spot);
                const hidden = RandomNumberGen.randomNumBetween(2, 4);
                for (let i = 0; i < hidden; i++) {
                    const enemy = new BuildingEnemy();
                    warehouse.addOccupant(enemy);
                    this.registerTarget(enemy, warehouse.randomHidingSpot());
                }
            });
        }
        for (let n = 0; n < scanners; n++) {
            const info = oneOf(allRadarInfo);
            place(info.width, info.height, false, spot => this.registerTarget(new RadarTarget(info), spot));
        }
        for (let n = 0; n < launchers; n++) {
            place(65, 45, false, spot => {
                const truck = new RocketLauncher();
                truck.setUpAsSite();
                truck.finishedWhenDisabled = true;
                this.registerTarget(truck, spot);
            });
        }
    }
    // The one special enemy, in a bunker complex under one of the bigger buildings that can be seen
    placeBunkers(buildings) {
        this.stageBuildings = buildings;
        this.bunkerSpecials = [];
        this.retreatScheduled = true;
        this.stageToken++;
        const eligible = buildings.filter(b => this.canBeInfested(b));
        const big = eligible.filter(b => b.getTargetEl().offsetWidth >= 110);
        const pool = big.length ? big : eligible;
        if (!pool.length)
            return;
        const building = pool[RandomNumberGen.randomNumBetween(0, pool.length - 1)];
        const bunker = new Bunker(building);
        const room = bunker.setUp(true);
        const who = this.specialAt(0);
        const enemy = new SpecialEnemy(who.name, who.portrait);
        enemy.goUnderground();
        enemy.bunker = bunker;
        bunker.occupant = enemy;
        this.registerTarget(enemy, { X: room.X - 4, Y: room.Y - 4 });
        this.bunkerSpecials.push(enemy);
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
const teheranInfo = {
    number: 0,
    location: Area.teheran,
    messages: [],
    waves: [
        new Wave(0, WaveType.static, Time.day), // only carries time of day/weather, see SceneLevel
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => new RegVehicleTarget(), // not used: TeheranLevel puts its own stage together
};
const hillsInfo = {
    number: 0,
    location: Area.hills,
    messages: [{ title: "Hills", text: "", length: msgLength.short }],
    waves: [
        new Wave(0, WaveType.static, Time.day), // only carries time of day/weather, see SceneLevel
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => new RegVehicleTarget(), // not used: HillsLevel puts its own stage together
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
        endArms: [howitzerInfo, airstrikeInfo, surveillanceInfo], // and a drone, to find the tunnels that come next
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