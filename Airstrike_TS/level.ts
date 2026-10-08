enum WaveType {
    gradual,
    sudden,
    double,
    static
}
enum Time {
    day,
    dusk,
    night
}
enum Area {
    desert,
    port,
    hills
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
    location: Area
    number: number
    messages: Array<popupMsg>
    waves: Array<Wave>
    startArms: Array<weaponInfo>
    endArms: Array<weaponInfo>
    targetFunc: () => Target
}
//type WaveLevelInfo = LevelInfo & {

//}

class Level {
    public waveIndex: number = -1;
    public frequency: number;
    public winCheckTimer: number;
    public targetTimer: number;
    public waveDurationTimer: number;
    private allTargetsDeployed: boolean = false;
    private pauseTargetProduction: boolean = false;
    private passedHalfTargetProduction: boolean = false;
    private pauseLength: number = 6000;
    private suddenTargetFreq: number = 150;
    private staticTargetFreq: number = 2;
    declare protected info: LevelInfo;

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

    // Back to how a level starts, for a level that's played again (the standard levels are reused)
    public resetState() {
        this.resetTargets();
        this.pauseWave();
        this.waveIndex = -1;
        this.pauseTargetProduction = false;
        this.passedHalfTargetProduction = false;
    }

    protected provideAvailTargets(): Target { return } // FIX?
    protected armingUp() { };
    protected finalStageArms() { };

    public targets: Array<Target> = [];
    public currentWave: Wave;

    public returnLocation() {
        return this.info.location
    }
    public resetTargets() {
        this.targets = [];
        for (let x of allTargets) {
            x.getTargetEl().remove();
            if (x.dispose) x.dispose();
        }
        allTargets = [];
        this.allTargetsDeployed = false;
        this.resetWincheck();
    }
    public addNewWeapon(info: weaponInfo, showMsg?: boolean) {
        let wepName = info.displayName || weaponNames[info.name];
        let slot = info.slot !== undefined ? info.slot : info.name;
        let wepArr: Array<WeaponType> = info.name <= weaponNames.drone ? conventionalWeapons : extraWeapons;
        if (wepArr[slot]) {
            wepArr[slot].pushNewWeaponInstance();
            if (showMsg != false) {
                PopupHandler.addToArray("You got another " + wepName);
            }
        }
        else {
            new info.class(info);
            if (showMsg != false) {
                PopupHandler.addToArray(info.pickupMessage || "New weapon:\n" + wepName)
            }
        }
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

    protected addWeaponsFromArray(arr: Array<weaponInfo>) {
        for (let wep of arr) {
            this.addNewWeapon(wep);
        }
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

    protected setCurrentWave() {
        let num = this.waveIndex;
        if (game.gameMode == GameMode.regular) {
            this.setWaveDisplay(num);
        }
        this.currentWave = this.info.waves[num];
        game.changeTime(this.currentWave.timeOfDay);
        game.setRain(this.currentWave.weather);
    }


    // For levels that have a fixed set of targets to clear: how many are done out of how many.
    public stageProgress(): { done: number, total: number } | null {
        return null;
    }

    protected winLimitCheck() {
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
            if (checkIndex >= 200) { // every 20 seconds
                checkIndex = 0;
                // a hint about the drone, if there's one to use
                if (this.checkForDamagedActiveTargets() && extraWeapons[slotOf(surveillanceInfo)]) {
                    PopupHandler.addToArray(
                        "Use the surveillance drone (" + slotOf(surveillanceInfo) + ") to check for survivors..."
                    );
                }
            }
        }, 100);
    }

    private resetWincheck() {
        clearInterval(this.winCheckTimer);
        this.winCheckTimer = null;
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
            SoundPlayer.playSequentialSound(revs);
        }
        this.continueWave();
        return true;
    }

    // Called every game tick (100ms) while the game is running, so a level can keep time without
    // counting the time it's been paused
    public tickClock() { }
    // The surveillance drone has been sent out
    public noteDroneFlyover() { }
    public noteShot(slot: number, cost: number, bigBomb: boolean) { }

    public continueWave() {
        // this.winLimitCheck(); // UNNEEDED? prevented new target on unpause
        let freq: number;
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

    public produceSingleTarget(tgt?: Target, pos?: position) {
        if (this.pauseTargetProduction == true) {
            return
        }
        let target: Target = tgt ? tgt : this.provideAvailTargets();
        this.registerTarget(target, pos);

        if (this.currentWave.type == WaveType.double && this.passedHalfTargetProduction == false && this.targets.length == this.currentWave.number / 2) {
            this.pauseTargetProduction = this.passedHalfTargetProduction = true;
            let this_ = this;
            setTimeout(() => {
                this_.pauseTargetProduction = false;
                SoundPlayer.playSequentialSound(revs); // UNIFY with NEXT WAVE revs
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

    protected registerTarget(target: Target, pos?: position) {
        target.decidePosition(pos);
        this.targets.push(target);
        allTargets.push(target);
        game.updateKillStats(killStatDisplayOptions.total)
    }
}

// A level that's a series of static scenes rather than a stream of targets. Each stage places its
// buildings and targets once up front; nothing is produced afterwards, nothing escapes, and the
// stage is finished when every target has been destroyed, after which a freshly generated stage
// follows -- forever. Its single wave only carries the time of day and weather.
class SceneLevel extends Level {
    private staticTargetCount: number = 10;
    private stage: number = 0;

    // What this stage has taken so far, for the message when it's cleared
    private stageElapsedMs: number = 0;
    private stageShotsAtStart: number = 0;
    private stageDroneFlyovers: number = 0;
    private stageOrdnanceSpent: number = 0;                  // the shots so far, each weighed by what it costs
    private stageBigBombsBySlot: { [slot: number]: number } = {};

    protected rushDirections: Array<RushDirection> = ["down"]; // the ways the ground can rush between stages

    // The rush between stages isn't the player's time. Over par, the clock goes red and bleeps once.
    public tickClock() {
        if (StageTransition.active) return;
        this.stageElapsedMs += 100;
        game.hud.updateStageTimer(this.stageElapsedMs, this.parMs());
        if (!this.overParWarned && this.stageElapsedMs > this.parMs()) {
            this.overParWarned = true;
            SoundPlayer.playWithVolumeSet(bleep_neg);
        }
    }
    private overParWarned: boolean = false;
    // How long a stage can take before the hurry-up nudge: the level's own time, shortened by the difficulty
    protected parMs(): number {
        return this.slowAfterMs * (game.difficulty.parFactor || 1);
    }
    // How many of something: more of them on the harder difficulties
    protected scaled(count: number): number {
        return Math.max(1, Math.round(count * (game.difficulty.enemyFactor || 1)));
    }
    public noteDroneFlyover() { this.stageDroneFlyovers++; }
    public noteShot(slot: number, cost: number, bigBomb: boolean) {
        if (slot == slotOf(surveillanceInfo)) return; // the drone's flyovers are counted on their own
        this.stageOrdnanceSpent += cost;
        if (bigBomb) this.stageBigBombsBySlot[slot] = (this.stageBigBombsBySlot[slot] || 0) + 1;
    }

    private static praise: Array<string> = ["Well done!", "Nice work!", "Target area cleared!", "Excellent shooting!"];
    private static hurryUp: Array<string> = ["Speed up your game!", "Pick up the pace, soldier!", "That took you a while!"];
    private static lotsOfShots: Array<string> = ["That was a lot of ordnance...", "I think you probably could've got by with fewer munitions.", "Is ammunition free where you come from?"];
    private static lotsOfDroneFlyovers: Array<string> = ["You know it costs to keep that thing in the air, right?"];
    private static noDroneFlyovers: Array<string> = ["Didn't need to check anything then?", "You were given that drone for a reason, right?"];
    private static expensiveBombs: Array<string> = ["Hey, those things are expensive!", "I'm not even sure why you have those bombs, really.", "...surgical precision..."];
    private static tooManyDroneFlyovers: number = 4;  // more than this and you're told about it
    private static shotsPerTarget: number = 1.5;       // more than this much shooting for each target and you're told about it
    // (How much a shot counts towards that is the weapon's own shotCost: small ones are cheap, so there's loads
    // to spend, the big ones cost more, and the tunnel charge nothing.)
    private static tooManyBigBombs: number = 2;        // more than this of either big bomb and you're told about it
    protected slowAfterMs: number = 60000; // how long a stage can take before the hurry-up nudge

    private formatTime(ms: number): string {
        const seconds = Math.round(ms / 1000);
        return seconds >= 60 ? Math.floor(seconds / 60) + "m " + (seconds % 60) + "s" : seconds + "s";
    }
    private plural(count: number, noun: string): string {
        return count + " " + noun + (count == 1 ? "" : "s");
    }
    // The congratulations at the end of a stage: how long it took, how many shots, how many drone
    // flyovers (which aren't counted as shots), and a nudge if it took more than a minute
    private stageSummary(): string {
        const flyovers = this.stageDroneFlyovers;
        const shots = Math.max(0, game.killStats.shots - this.stageShotsAtStart - flyovers);
        let text = RandomNumberGen.returnRandomFromArray(SceneLevel.praise) +
            "<br>Time: " + this.formatTime(this.stageElapsedMs) +
            "<br>" + this.plural(shots, "shot") + " fired" +
            "<br>" + this.plural(flyovers, "drone flyover") + " needed";
        if (this.stageElapsedMs > this.parMs()) {
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.hurryUp) + "</strong>";
        }
        if (this.stageOrdnanceSpent > this.targets.length * SceneLevel.shotsPerTarget) {
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.lotsOfShots) + "</strong>";
        }
        if (Object.values(this.stageBigBombsBySlot).some(count => count > SceneLevel.tooManyBigBombs)) {
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.expensiveBombs) + "</strong>";
        }
        if (flyovers == 0 && extraWeapons[slotOf(surveillanceInfo)]) { // had a drone, and never sent it
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.noDroneFlyovers) + "</strong>";
        }
        if (flyovers > SceneLevel.tooManyDroneFlyovers) {
            text += "<br><strong>" + RandomNumberGen.returnRandomFromArray(SceneLevel.lotsOfDroneFlyovers) + "</strong>";
        }
        return text;
    }

    public nextWave() {
        if (game.level !== this) return true; // a stale call from before the game was reset

        this.stage++;
        this.resetTargets(); // clears the last stage's targets and buildings
        game.clearStageLeftovers(); // and the craters, debris and the rest they left
        if (this.stage == 1) {
            this.waveIndex = 0;
            this.setCurrentWave(); // later stages keep whatever time of day and weather they're in
        }
        this.populateStage();
        this.stageElapsedMs = 0;
        this.stageShotsAtStart = game.killStats.shots;
        this.stageDroneFlyovers = 0;
        this.stageOrdnanceSpent = 0;
        this.stageBigBombsBySlot = {};
        this.overParWarned = false;
        if (this.stage > 1) {
            PopupHandler.addToArray("", "Stage " + this.stage, msgLength.short);
            StageTransition.rush(RandomNumberGen.returnRandomFromArray(this.rushDirections)); // the ground runs past empty, then the new stage slides in with it and stops
        }
        this.winLimitCheck();
        return true;
    }
    public continueWave() { } // unpausing must not start target production

    // What a stage is made of: here, boats on the water and a block layout of buildings, some with enemies in
    protected populateStage() {
        game.shapeCoast(); // first, as the boats and buildings keep clear of the water, wherever it is
        for (let i = 0; i < this.scaled(this.staticTargetCount); i++) {
            this.registerTarget(this.provideAvailTargets());
        }
        this.infestBuildings(game.drawAllBuildings());
    }

    private static infestedBuildingCount: number = 3;
    private static minOccupants: number = 2;
    private static maxOccupants: number = 6;

    // A few of the buildings have enemies hiding in them, who count as targets for the stage.
    protected infestBuildings(buildings: Array<Building>) {
        const pool = buildings.filter(b => b.canHideEnemies());
        for (let n = 0; n < this.scaled(SceneLevel.infestedBuildingCount) && pool.length; n++) {
            const building = pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0];
            const occupants = this.scaled(RandomNumberGen.randomNumBetween(SceneLevel.minOccupants, SceneLevel.maxOccupants));
            for (let i = 0; i < occupants; i++) {
                const enemy = new BuildingEnemy();
                building.addOccupant(enemy);
                this.registerTarget(enemy, building.randomHidingSpot());
            }
        }
    }

    public stageProgress() {
        return { done: this.targets.filter(t => t.isFinished()).length, total: this.targets.length };
    }

    // The base level's check for "nothing left to do" -- here that means every target destroyed, not
    // just disabled. (A boat counts as destroyed once its fire has done for it, not when it's on the bottom.)
    protected checkForNilActiveTargets() {
        return this.targets.every(t => t.isFinished());
    }

    protected endWave() {
        PopupHandler.addToArray(this.stageSummary(), "Stage " + this.stage + " finished!", msgLength.long);
        this.nextWavePrepGap(); // then nextWave() builds the next stage
    }
}

// The Hills level: scrubby hills with villas dotted about, a few vehicles parked near them (some running,
// some not), enemies hiding in some of the villas, and tunnels nobody can see until a surveillance drone
// scans them. Stages follow on from each other like the port's.
class HillsLevel extends SceneLevel {
    // What a village is made of, which varies from stage to stage: a small one is villas as it always was (with the odd
    // block), a medium one has a couple of the apartment blocks among them, and a large one is mostly blocks with
    // a few villas. The bigger the village, the bigger its mosque.
    private static villageSizes: Array<{ chance: number, villas: [number, number], blocks: [number, number], mosques: Array<BuildingInfo> }> = [
        { chance: 40, villas: [20, 26], blocks: [0, 1], mosques: allMosqueInfo },
        { chance: 35, villas: [14, 18], blocks: [2, 3], mosques: mediumMosqueInfo },
        { chance: 25, villas: [4, 6], blocks: [7, 9], mosques: largeMosqueInfo },
    ];
    private static minOutliers: number = 1;    // and standing off from it
    private static maxOutliers: number = 2;
    private static villageGap: number = 22;    // between the buildings in the village
    private static minVehicles: number = 2;
    private static maxVehicles: number = 8;
    private static minTunnels: number = 2;
    private static maxTunnels: number = 4;
    private static screenTop: number = 120;   // clear of the HUD
    private static screenEdge: number = 70;
    // The structure types the village borrows from the other set, at the villas' scale (theirs is 0.28 of
    // their pictures' size, the others' 0.4)
    private static borrowedScale: number = 0.7;
    // The odd ones out: the checkpoint booth (the fenced yards and the little shelter didn't suit), put down a couple
    // of times or three...
    private static oddCodes = ["r5c6"];
    private static minOfEachOdd: number = 2;
    private static maxOfEachOdd: number = 3;
    // ...and (no warehouses: they don't suit the sand) one or two water towers (of the three kinds), at a larger
    // scale than the rest, and one each of the containers and the stack of crates. Nothing parks beside a water tower.
    private static waterTowerCodes = ["r5c1", "r5c2", "r5c3"];
    private static waterTowerScale: number = 1;
    private static minWaterTowers: number = 1;
    private static maxWaterTowers: number = 2;
    private static containerCode = "r5c8";
    private static cratesCode = "r5c9";

    protected rushDirections: Array<RushDirection> = ["up", "right"]; // there's no sea here to keep in place, so it can go either way
    protected slowAfterMs: number = 90000; // a stage here takes longer: there's a village to search and tunnels to find

    private takenBoxes: Array<Box> = [];      // where things have been put this stage, so nothing's put on top of anything

    protected populateStage() {
        this.takenBoxes = [];
        const buildings = this.placeVillage();
        this.infestBuildings(buildings);    // only the villas have somewhere for anyone to hide
        this.placeVehicles(buildings);
        this.placeTunnels();
    }

    private overlapsTaken(box: Box, room: number = 0): boolean {
        return this.takenBoxes.some(b => box.left - room < b.right && box.right + room > b.left && box.top - room < b.bottom && box.bottom + room > b.top);
    }
    private within(low: number, high: number): number {
        return RandomNumberGen.randomNumBetween(Math.floor(low), Math.max(Math.floor(low), Math.floor(high)));
    }
    private typeFor(codes: Array<string>, noParking?: boolean, scale: number = HillsLevel.borrowedScale): BuildingInfo {
        const name = "Structure_" + RandomNumberGen.returnRandomFromArray(codes) + "_1.png";
        const info = allBuildingInfo.find(info => info.undamaged === name);
        return { ...resizedBuildingInfo(info, scale), noParking: noParking };
    }

    // A village: the villas bunched up round the middle of the screen, the mosque, a couple of water towers, containers, crates and a few of each of the other odd structures among them,
    // and one or two villas out on their own
    private placeVillage(): Array<Building> {
        const buildings: Array<Building> = [];
        const width = window.innerWidth, height = window.innerHeight;
        const middle = {
            X: width / 2 + this.within(-70, 70),
            Y: (height + HillsLevel.screenTop) / 2 + this.within(-40, 40),
        };
        const reachX = Math.min(540, width * 0.39);   // room for a good few more than a hamlet's worth
        const reachY = Math.min(340, (height - HillsLevel.screenTop) * 0.5);

        // try to put one down: inside the village's ellipse (nearer the middle more often) or, for an outlier, well outside it
        const place = (info: BuildingInfo, outlier: boolean): boolean => {
            for (let attempt = 0; attempt < 250; attempt++) {
                let x: number, y: number;
                if (outlier) {
                    x = this.within(HillsLevel.screenEdge, width - HillsLevel.screenEdge - info.width);
                    y = this.within(HillsLevel.screenTop, height - HillsLevel.screenEdge - info.height);
                    if (Math.hypot((x + info.width / 2 - middle.X) / reachX, (y + info.height / 2 - middle.Y) / reachY) < 1.5) continue;
                }
                else {
                    const angle = Math.random() * Math.PI * 2;
                    const pull = Math.random(); // an even spread in distance from the middle, which is thicker the nearer it gets to it
                    x = middle.X + Math.cos(angle) * reachX * pull - info.width / 2;
                    y = middle.Y + Math.sin(angle) * reachY * pull - info.height / 2;
                }
                const box = { left: x, top: y, right: x + info.width, bottom: y + info.height };
                const onScreen = x >= HillsLevel.screenEdge && y >= HillsLevel.screenTop && box.right <= width - HillsLevel.screenEdge && box.bottom <= height - HillsLevel.screenEdge;
                if (!onScreen || this.overlapsTaken(box, HillsLevel.villageGap)) continue;
                const building = new Building(info);
                building.setPosition({ X: x, Y: y });
                buildings.push(building);
                this.takenBoxes.push(box);
                return true;
            }
            return false;
        };

        // how big a village this one is
        let roll = RandomNumberGen.randomNumBetween(1, 100);
        let size = HillsLevel.villageSizes[0];
        for (const candidate of HillsLevel.villageSizes) {
            size = candidate;
            if ((roll -= candidate.chance) <= 0) break;
        }

        // the big ones first, while there's room: the village's mosque, which there's only the one of, and the blocks
        place(RandomNumberGen.returnRandomFromArray(size.mosques), false);
        const blocks = RandomNumberGen.randomNumBetween(size.blocks[0], size.blocks[1]);
        for (let i = 0; i < blocks; i++) {
            place(RandomNumberGen.returnRandomFromArray(allBlockInfo), false);
        }
        const towers = RandomNumberGen.randomNumBetween(HillsLevel.minWaterTowers, HillsLevel.maxWaterTowers);
        for (let i = 0; i < towers; i++) {
            place(this.typeFor(HillsLevel.waterTowerCodes, true, HillsLevel.waterTowerScale), false);
        }
        place(this.typeFor([HillsLevel.containerCode]), false);
        place(this.typeFor([HillsLevel.cratesCode]), false);
        for (const code of HillsLevel.oddCodes) {
            const count = RandomNumberGen.randomNumBetween(HillsLevel.minOfEachOdd, HillsLevel.maxOfEachOdd);
            for (let i = 0; i < count; i++) {
                place(this.typeFor([code]), false);
            }
        }
        const villas = RandomNumberGen.randomNumBetween(size.villas[0], size.villas[1]);
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
    private placeVehicles(buildings: Array<Building>) {
        const villas = buildings.filter(b => !b.isTall());
        if (!villas.length) return;
        const count = this.scaled(RandomNumberGen.randomNumBetween(HillsLevel.minVehicles, HillsLevel.maxVehicles));
        const running: Array<boolean> = [];
        for (let i = 0; i < count; i++) running.push(RandomNumberGen.randomNumBetween(0, 1) == 1);
        if (!running.some(r => r)) running[0] = true; // at least one of them is a target
        for (let i = 0; i < count; i++) {
            const roll = RandomNumberGen.randomNumBetween(1, 100);
            const size = roll > 40 ? { w: 65, h: 45 } : { w: 45, h: 45 };
            const spot = this.spotBesideAVilla(villas, size.w, size.h);
            if (!spot) continue;
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
    private spotBesideAVilla(villas: Array<Building>, width: number, height: number): position | null {
        for (let attempt = 0; attempt < 40; attempt++) {
            const villa = villas[RandomNumberGen.randomNumBetween(0, villas.length - 1)];
            const rect = { left: parseInt(villa.getTargetEl().style.left), top: parseInt(villa.getTargetEl().style.top), width: villa.getTargetEl().offsetWidth, height: villa.getTargetEl().offsetHeight };
            const gap = RandomNumberGen.randomNumBetween(6, 26);
            let x: number, y: number;
            switch (RandomNumberGen.randomNumBetween(0, 3)) {
                case 0: x = rect.left - gap - width; y = this.within(rect.top, rect.top + rect.height - height); break;     // to the left
                case 1: x = rect.left + rect.width + gap; y = this.within(rect.top, rect.top + rect.height - height); break; // to the right
                case 2: y = rect.top + rect.height + gap; x = this.within(rect.left - 10, rect.left + rect.width - width + 10); break; // in front
                default: y = rect.top - gap - height; x = this.within(rect.left - 10, rect.left + rect.width - width + 10); break;   // behind
            }
            const box = { left: x, top: y, right: x + width, bottom: y + height };
            const onScreen = x >= 20 && y >= HillsLevel.screenTop - 30 && x + width <= window.innerWidth - 20 && y + height <= window.innerHeight - 20;
            if (onScreen && !this.overlapsTaken(box, 4)) return { X: x, Y: y };
        }
        return null;
    }

    // Tunnels: just their heads are placed here, clear of everything else; each works out where it runs
    private placeTunnels() {
        const count = this.scaled(RandomNumberGen.randomNumBetween(HillsLevel.minTunnels, HillsLevel.maxTunnels));
        const heads: Array<position> = [];
        for (let i = 0; i < count; i++) {
            for (let attempt = 0; attempt < 50; attempt++) {
                const x = this.within(90, window.innerWidth - 135);
                const y = this.within(HillsLevel.screenTop, window.innerHeight - 135);
                const box = { left: x, top: y, right: x + 45, bottom: y + 45 };
                if (this.overlapsTaken(box, 20) || heads.some(h => Math.hypot(h.X - x, h.Y - y) < 120)) continue;
                heads.push({ X: x, Y: y });
                this.takenBoxes.push(box);
                this.registerTarget(new HiddenTunnel(), { X: x, Y: y });
                break;
            }
        }
    }
}

//class Level_Static extends Level {
//    constructor(info: LevelInfo) {
//        super(info)
//        this.info = info;
//    }

//}
//class Level_Waves extends Level {
//    constructor(info: LevelInfo) {
//        super(info)
//        this.info = info;
//    }

//}





// Each option is tried highest-threshold-first; the roll (1-100) picks the first option
// whose threshold it meets or exceeds, so the last entry should have threshold 0 as a catch-all.
type WeightedTargetOption = {
    threshold: number,
    create: () => Target
}
function pickWeightedTarget(options: Array<WeightedTargetOption>): Target {
    let roll = RandomNumberGen.randomNumBetween(1, 100);
    for (let option of options) {
        if (roll >= option.threshold) {
            return option.create();
        }
    }
}

function provideAllTargets(): Target {
    return pickWeightedTarget([
        { threshold: 93, create: () => new TunnelTarget() },
        { threshold: 87, create: () => new HeavyVehicleTarget() },
        { threshold: 78, create: () => new ModVehicleTarget() },
        { threshold: 68, create: () => new RocketLauncher() },
        { threshold: 0, create: () => new RegVehicleTarget() },
    ]);
}


const sceneInfo: LevelInfo = {
    number: 0,
    location: Area.port,
    messages: [{ title: "Static Scene", text: "", length: msgLength.short }],
    waves: [
        new Wave(0, WaveType.static, Time.day), // only carries time of day/weather, see SceneLevel
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => new WaterVehicleTarget(),
}

const hillsInfo: LevelInfo = {
    number: 0,
    location: Area.hills,
    messages: [{ title: "Hills", text: "", length: msgLength.short }],
    waves: [
        new Wave(0, WaveType.static, Time.day), // only carries time of day/weather, see SceneLevel
    ],
    startArms: [],
    endArms: [],
    targetFunc: () => new RegVehicleTarget(), // not used: HillsLevel puts its own stage together
}

const continuousInfo: LevelInfo = {
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
}
const weatherTestInfo: LevelInfo = {
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
}



const allLevelInfo: Array<LevelInfo> = [
    {
        number: 1,
        location: Area.desert,
        messages: [{ text: "", title: "WAKE UP!" } as popupMsg],
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
        messages: [{ text: "It's getting dark...", title: "NOTE" } as popupMsg],
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
        messages: [{ text: "Watch out for tunnels", title: "WARNING" } as popupMsg],
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
        messages: [{ text: "Mortar team positioning to provide flare rounds...", title: "NOTE" } as popupMsg],
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
        messages: [{ text: "Missile trucks prevent aircraft strikes", title: "WARNING" } as popupMsg],
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
