enum Languages {
    'eng',
    'heb'
}
enum GameMode {
    'regular',
    'sandbox',
    'test_1',
    'coast',
    'hills'
}

// Where a building goes, and which type it is
type BuildingSlot = position & { info: BuildingInfo };


var conventionalWeapons: Array<WeaponType> = [];
var extraWeapons: Array<WeaponType> = [];
var allTargets: Array<any> = [];
var allObjects: Array<HTMLElement> = [];
var allBuildings: Array<HTMLElement> = [];
var allLevelsArray: Array<Level> = [];
const level_continuous: Level = new Level(continuousInfo);
const level_weather: Level = new Level(weatherTestInfo);

// The power: a substation, with lines leading from it off the map, and the lights after dark that go with it. If the substation or any
// stretch of its lines is brought down the lights go out.
class PowerGrid {
    public static parts: Array<Building> = [];
    public static reset() {
        PowerGrid.parts = [];
    }
    public static add(building: Building) {
        PowerGrid.parts.push(building);
    }
    // (a stage with no grid has no power to lose)
    public static isUp(): boolean {
        return PowerGrid.parts.every(part => !part.isWrecked());
    }

    // Where to put a substation near the edge of the screen and the pylons that lead away from it, and clear off the edge: up and to the right from one on
    // the top or the right edge, down and to the left from one on the bottom or the left, which is the way they're drawn. The boxes are
    // checked with accept (which is told only the part of each that's on the screen). Returns the slots, or none if there was no room.
    public static plan(edges: Array<"top" | "right" | "bottom" | "left">, accept: (box: Box) => boolean): Array<BuildingSlot> {
        const width = window.innerWidth, height = window.innerHeight;
        const hud = 125;   // clear of the HUD
        const inside = (box: Box): Box => ({ left: Math.max(0, box.left), top: Math.max(0, box.top), right: Math.min(width, box.right), bottom: Math.min(height, box.bottom) });
        for (let attempt = 0; attempt < 120; attempt++) {
            const edge = RandomNumberGen.returnRandomFromArray(edges);
            const sub = RandomNumberGen.returnRandomFromArray(substationInfo);
            let x: number, y: number;
            const near = () => RandomNumberGen.randomNumBetween(18, 70);
            switch (edge) {
                case "right": x = width - sub.width - RandomNumberGen.randomNumBetween(50, 280); y = RandomNumberGen.randomNumBetween(hud + 40, height - sub.height - 30); break;
                case "left": x = RandomNumberGen.randomNumBetween(50, 280); y = RandomNumberGen.randomNumBetween(hud + 40, height - sub.height - 30); break;
                case "top": y = hud + RandomNumberGen.randomNumBetween(0, 50); x = RandomNumberGen.randomNumBetween(60, width - sub.width - 60); break;
                default: y = height - sub.height - near(); x = RandomNumberGen.randomNumBetween(60, width - sub.width - 60); break;
            }
            const subBox = { left: x, top: y, right: x + sub.width, bottom: y + sub.height };
            if (!accept(subBox)) continue;
            const slots: Array<BuildingSlot> = [{ X: x, Y: y, info: sub }];
            const boxes: Array<Box> = [subBox];
            const upRight = edge == "top" || edge == "right";
            const line = RandomNumberGen.randomNumBetween(1, 100) <= 70 ? powerLineInfo[0] : powerLineInfo[1];
            const step = { x: line.rightBase[0] - line.leftBase[0], y: line.rightBase[1] - line.leftBase[1] }; // (from one pylon to the next, up and to the right: y is negative)
            // the first pylon stands at the substation's corner, and the others follow
            let base = upRight ? { x: x + sub.width * 0.88, y: y + sub.height * 0.5 } : { x: x + sub.width * 0.12, y: y + sub.height * 0.85 };
            let ok = true;
            for (let i = 0; i < 9; i++) {
                const left = upRight ? base.x - line.leftBase[0] : base.x - line.rightBase[0];
                const top = upRight ? base.y - line.leftBase[1] : base.y - line.rightBase[1];
                const box = { left: left, top: top, right: left + line.info.width, bottom: top + line.info.height };
                const seen = inside(box);
                if (seen.right - seen.left < 20 || seen.bottom - seen.top < 20) break; // it's right off the screen: that's the end of it
                if (!accept(seen)) { ok = false; break; }
                slots.push({ X: left, Y: top, info: line.info });
                boxes.push(box);
                base = upRight ? { x: base.x + step.x, y: base.y + step.y } : { x: base.x - step.x, y: base.y - step.y };
            }
            if (ok && slots.length >= 2) return slots;
        }
        return [];
    }
}

class GameHandler {
    public hud = new HudHandler();
    public weapon: WeaponType;
    private contentEl: HTMLElement;
    private progressBar: HTMLElement;
    private darkOverlay: HTMLElement;
    private daytime: boolean = true; // the dark overlay is invisible by day, so its lights aren't drawn
    private progressNumber: number = 0;
    public shotCount: number = 0;
    private language: Languages = Languages.eng;
    public difficulty: difficultyLevelInfo;
    public gameMode: GameMode;
    public ambience: AmbienceSet;

    public killStats: killStats;

    public volume: number = 0;
    private sequentialHits: number = 0;
    public level: Level;   // messy, fix
    public gameTimer: number;
    private soundTimer: number;
    private gameInProgress: boolean = false;
    private gameWasPlayed: boolean = false;
    private fullProgress: boolean = false;
    public strikesRestricted: boolean = false;

    constructor(element: HTMLElement) {
        this.contentEl = element;
        userHandler.getUserInfo();
        if (userHandler.userName) {
            userHandler.displayName();
        }

        this.menuSetup();
        this.setEventListeners();

        document.getElementById("loader").style.display = 'none';
        this.addWeatherElements();
        this.darkOverlay.style.opacity = '0.5';
        this.createWater();

        this.handleBackgroundByLocation(Area.desert);

        this.killStats = {
            total: 0,
            disabled: 0,
            destroyed: 0,
            escaped: 0,
            shots: 0,
            failLimit: 1,
        }
    }
    private resetStats() {
        this.killStats.total = 0;
        this.killStats.disabled = 0;
        this.killStats.destroyed = 0;
        this.killStats.escaped = 0;
        this.killStats.shots = 0;
    }
    private addWeatherElements() {
        this.darkOverlay = document.createElement('div');
        this.darkOverlay.classList.add('darkOverlay')
        ContentElHandler.addToContentWrapper(this.darkOverlay);

        let rain = document.createElement('div');
        rain.classList.add('rain');
        
        ContentElHandler.addToContentWrapper(rain);
    }
    // The weather and the time of day together decide what's heard: rain (or a storm) over everything else, otherwise the day's
    // sounds or the night's. Changing either one goes through here, so none of them leaves a stale sound playing (the rain
    // carrying on once it's stopped, or going back to the day's sounds while it's still raining).
    private rain: Rain = noRain;
    private nightSounds: boolean = false;
    private updateAmbience() {
        const wanted = this.rain.ambience ? this.rain.ambience : this.nightSounds ? night : regular_amb;
        if (wanted !== this.ambience) {
            this.switchAmbience(wanted);
        }
    }
    public setRain(rain: Rain) {
        this.rain = rain;
        WeatherHandler.createRain(rain);
        this.updateAmbience();
    }

    private setBackground(url: string) {
        let back = ContentElHandler.returnbackground();
        back.style.backgroundImage = url;
        back.style.backgroundSize = 'tile';
        //content.style.backgroundSize = 'cover';
    }
    private handleBackgroundByLocation(num: Area) {
        let url: string;
        if (num == Area.desert) {
            url = "url(./AS_assets/Sand.png)";
            this.extendWater(10, false)
        }
        else if (num == Area.port) {
            url = "url(./AS_assets/Sand.png)"; // SAME so far
            this.extendWater(50, true);
        }
        else if (num == Area.hills) {
            url = "url(./AS_assets/Sand_scrub.png)";
            this.extendWater(0, false);
        }
        this.setBackground(url);
        document.getElementById("contentWrapper").style.backgroundImage = url;

    }

    private createWater() {
        let water = document.createElement('div');
        water.id = "water";
        water.classList.add('water');
        ContentElHandler.addToBackground(water);
    }

    private extendWater(width, bool) {
        let water = document.getElementById("water")
        water.style.width = width + "%";
        if (bool) {
            water.classList.remove("displayNone");
        }
        else {
            water.classList.add('displayNone');
        }
    }

    public changeTime(time: Time) {
        this.daytime = time == Time.day;
        this.hideFlare(time);
        this.nightSounds = time != Time.day;
        if (time == Time.day) {
            this.darkOverlay.style.opacity = '0';
        }
        this.updateAmbience();
        if (time == Time.dusk) {
            this.darkOverlay.style.opacity = '0.5';
        }
        else if (time == Time.night) {
            this.darkOverlay.style.opacity = '0.92';
        }
    }
    private hideFlare(time: Time) {
        let name = weaponNames.flare;
        let hide: boolean;
        let flareBox = this.hud.returnWepBox(name) as HTMLElement
        if (flareBox) {
            if (time == Time.day) {
                hide = true;
            }
            else {
                hide = false;
            }
            this.hud.hideWeapon(name, hide)
        }
    }

    private addAllLevels() {
        allLevelsArray = [];
        for (let i of allLevelInfo) {
            let lev = new Level(i)
            allLevelsArray.push(lev);
        }
    }

    //public newStaticLevel(level: Level_Static) {
    //    this.level = level;
    //    this.handleBackgroundByLocation(this.level.returnLocation());
    //}

    public newLevel(level: Level, mode: GameMode) {
            if (level) {
            let nextLevel = level;
            if (mode == GameMode.sandbox) {
                nextLevel = level_continuous;   // AWWKWARD? 
            }
            this.level = nextLevel;
            this.level.setAsLevel(); // NEEDED?

            this.handleBackgroundByLocation(this.level.returnLocation());
            this.level.nextWave();
        }
        else {
            this.endGame();
        }
    }
    private endGame() {
        PopupHandler.addToArray("", "GAME COMPLETE", msgLength.long);
        PopupHandler.addToArray("That's the last of them, good work!", userHandler.addressed("You did it!"), msgLength.long);
        PopupHandler.addToArray(`Finished <strong>${GameMode[this.gameMode]}</strong> on ${this.difficulty.eng.name} difficulty with ${this.killStats.disabled} kills, and ${this.killStats.destroyed} pulverised!`, "", msgLength.long);
        cheer.play();
        this.gameInProgress = false // HACKY??
        this.cutGameFuncs();
        setTimeout(() => {
            this.toggleModal();
        }, 10000)
    }

    private setEventListeners() {
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    public menuSetup() {
        let arr = this.getMenuLis();
        document.getElementById("startbutton").onclick = () => this.newGame(this.selectedMode());
        document.getElementById("startbutton_sandbox").onclick = () => this.newGame(GameMode.sandbox);
        document.getElementById("startbutton_WeatherTest").onclick = () => this.newGame(GameMode.test_1);
        document.getElementById("langbutton").onclick = () => this.toggleLang();
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();

        this.setMenuDifficulty(arr, [normal, hard, chaos]);
        this.setLocationButtons(arr);
        this.toggleModal();

        this.setRadioButtons();
        this.setVolumeSlider();
        this.setupInstructionsToggle();
    }
    private setRadioButtons() {
        const radioButtons = document.querySelectorAll<HTMLInputElement>('#difficultiesContainer input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
    }
    private setVolumeSlider() {
        const slider: HTMLInputElement = document.getElementById("slider") as HTMLInputElement;
        slider.addEventListener("input", () => {
            this.setVolume(slider);
        });
        this.setVolume(slider);
    }
    private setVolume(slider) {
        const sliderValue = document.getElementById("sliderValue");
        let vol = Math.round(parseFloat(slider.value)*100);
        this.volume = vol / 100;
        sliderValue.textContent = `Volume: ${(vol)}%`;
    }
    private setMenuDifficulty(liOptions, set: Array<difficultyLevelInfo>) {
        for (let i = 0; i < set.length; i++) {
            this.setIndivMenuDifficulty(set[i], liOptions[i]);
        }
    }
    // The location choice: Desert is the regular game, Hills and Coast the levels made of stages. Each has its own
    // difficulties, so choosing one rewrites the difficulty options (keeping whichever of the three is picked).
    private setLocationButtons(difficultyLis) {
        const radios = document.querySelectorAll<HTMLInputElement>('#locationContainer input[type="radio"]');
        radios.forEach(radio => radio.addEventListener('change', () => {
            const staged = this.selectedLocation() != "desert";
            for (const li of difficultyLis) {
                const label = li.getElementsByTagName('label')[0];
                label.innerHTML = "";
            }
            this.setMenuDifficulty(difficultyLis, staged ? [sceneNormal, sceneHard, sceneChaos] : [normal, hard, chaos]);
            const picked = document.querySelector<HTMLInputElement>('#difficultiesContainer input[type="radio"]:checked');
            if (picked) this.jsonParseRadioDifficulty(picked.value);
        }));
    }
    private selectedLocation(): string {
        const picked = document.querySelector<HTMLInputElement>('#locationContainer input[type="radio"]:checked');
        return picked ? picked.value : "desert";
    }
    private selectedMode(): GameMode {
        const location = this.selectedLocation();
        return location == "hills" ? GameMode.hills : location == "coast" ? GameMode.coast : GameMode.regular;
    }
    private getMenuLis() {
        let container = document.getElementById("difficultiesContainer");
        let lis = container.getElementsByTagName('li');
        return Array.from(lis);
    }
    private setupInstructionsToggle() {
        const button = document.getElementById("instructionsToggle");
        const content = document.getElementById("instructionsContent");

        button.addEventListener("click", () => {
            content.classList.toggle("open");
            button.classList.toggle("active");
            const open = content.classList.contains("open");
            // rotate arrow
            if (open) {
                button.querySelector(".eng").innerHTML = "▼ Instructions";
                button.querySelector(".heb").innerHTML = "הנחיות ▼";
            }
            else {
                button.querySelector(".eng").innerHTML = "▶ Instructions";
                button.querySelector(".heb").innerHTML = "◀ הנחיות";
            }
        });
    }

    private toggleLang() { // CLEAN UP
        const root: HTMLElement = document.querySelector(':root');
        if (this.language == Languages.heb) {
            this.language = Languages.eng
            root.style.setProperty('--hebDisplay', 'none');
            root.style.setProperty('--engDisplay', 'block');
        }
        else {
            this.language = Languages.heb
            root.style.setProperty('--hebDisplay', 'block');
            root.style.setProperty('--engDisplay', 'none');
        }
    }

    private setIndivMenuDifficulty(dif: difficultyLevelInfo, li: Element) {
        let opt = li.getElementsByTagName('input')[0];
        opt.setAttribute("value", JSON.stringify(dif));

        this.createSpansByLanguage(dif, li, Languages.eng);
        this.createSpansByLanguage(dif, li, Languages.heb);
    }
    private createSpansByLanguage(dif: difficultyLevelInfo, li: Element, lang: Languages) {
        let langString = Languages[lang];
        let label = li.getElementsByTagName('label')[0];
        let span = document.createElement('span');
        span.innerText = dif[langString].name;
        span.classList.add(langString)
        label.appendChild(span);
        span = document.createElement('span');
        span.innerHTML = dif[langString].description;
        span.classList.add(langString)
        label.appendChild(span);
    }
    public handleOptionChange(event: Event) {
        this.jsonParseRadioDifficulty((event.target as HTMLInputElement).value);
    }
    private jsonParseRadioDifficulty(value) {
        const selected = JSON.parse(value) as difficultyLevelInfo;
        this.setDifficulty(selected);
    }

    ////////
    private setDifficulty(difficulty: difficultyLevelInfo) {
        this.difficulty = difficulty
        this.setSpeeds();
    }
    private setSpeeds() {
        this.setIndivTargetSpeed(regTarget, this.difficulty.regTargetSpeed);
        this.setIndivTargetSpeed(modTarget, this.difficulty.modTargetSpeed);
        this.setIndivTargetSpeed(heavyTarget, this.difficulty.heavyTargetSpeed);
        this.setIndivTargetSpeed(regTunnelTarget, this.difficulty.tunnelTargetSpeed);
    }
    private setIndivTargetSpeed(target: TargetInfo, speed: speedRange) {
        target.minSpeed = speed.min;
        target.maxSpeed = speed.max;
    }
    private toggleModal() {
        this.toggleElem("overlay");
        this.toggleElem("modal");
    }
    private toggleElem(id: string) {
        var elem = document.getElementById(id);
        elem.classList.contains("displayNone") ? elem.classList.remove("displayNone") : elem.classList.add("displayNone");
    }

    public addHudInstance(wep: WeaponType) {
        this.hud.addInstanceByWeapon(wep);
    }
    public addHudWeapon(wep: WeaponType) {
        this.hud.addWeapon(wep);
    }

    private fireFunc() {
        if (!game.gameInProgress || this.paused || StageTransition.active) { // no shooting at the ground as it rushes past
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            SoundPlayer.playWithVolumeSet(bleep_neg);
            return
        }
        this.weapon.fireFunc(); // MESSY??
    }

    private handleKeyPress(event) {
        if (this.paused) { // nothing else works while paused
            if (event.key.toLowerCase() === 'p' || event.key === 'Escape') { this.togglePause(); }
            return;
        }
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        else if (event.key.toLowerCase() === 'p') {
            this.togglePause();
        }
        if (this.menuIsOpen()) return; // the game's keys don't work while the menu's up
        if (game.gameInProgress) {
            if (event.code === 'Space' || event.key.toLowerCase() === 'z' || event.key === 'Control') { this.fireFunc(); }

            const beyondNine = { '0': 10, '-': 11, '=': 12 }; // the weapons after 9 are on the keys that follow it
            let int = beyondNine[event.key] || parseInt(event.key);
            if (int) {
                if (conventionalWeapons[int]) {
                    this.changeWeapon(conventionalWeapons[int]);
                }     
                else if (extraWeapons[int]) {
                    this.changeWeapon(extraWeapons[int])
                }
            }
            else if (event.shiftKey && event.key === 'S') { this.level.showActiveTargets(); } // a cheat, like Shift+A: marks every active target
            else if (event.key.toLowerCase() === 't') {
                game.changeTime(RandomNumberGen.randomNumBetween(0, 2));
            }
            else if (event.key.toLowerCase() === 'w') {
                this.setRain(allRains[RandomNumberGen.randomNumBetween(0, 3)]); // the whole weather: the sound and how long things burn too
            }
            else if (event.shiftKey && event.key === 'A') {
                if (this.gameMode == GameMode.coast) { // its own weapons (a charge would land on the bomb's key), and the supers
                    this.addScaledWeaponSet();
                    this.onlyOneSuperInst(chopperInfo);
                    this.onlyOneSuperInst(nukeInfo);
                    this.onlyOneSuperInst(carpetBombInfo);
                }
                else {
                    this.addAllWeapons();
                }
            }
            else if (event.shiftKey && event.key === 'Q') {
                this.progressNumber += 32;
            }
        }
    }
    private addStarterWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
    }

    private addFullWeaponLoadout() {
        this.addAllWeapons();
        this.addAllWeapons();
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        
    }
    // The coast level's own weapons instead of the standard ones. Every game starts from empty weapon lists
    // (see reset()), so going back to any other mode gets the standard set again.
    private addScaledWeaponSet() {
        // three of each, but more of the small and fewer of the big ones
        const howMany: { [slot: number]: number } = { 1: 4, 4: 2, 5: 1, 6: 2, 7: 1 };
        scaledWeapons.forEach(info => {
            const count = howMany[info.slot] || 3;
            for (let i = 0; i < count; i++) this.level.addNewWeapon(info, false);
        });
        this.level.addNewWeapon(surveillanceInfo, false);
        this.level.addNewWeapon(surveillanceInfo, false);
    }
    private returnOneSuperWeapon() {
        let supers = [chopperInfo, nukeInfo, carpetBombInfo];
        let unowned = supers.filter(info => !extraWeapons[slotOf(info)]);
        return RandomNumberGen.returnRandomFromArray(unowned.length ? unowned : supers);
    }

    private addAllWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(chargeInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        this.level.addNewWeapon(droneInfo, false);
        this.level.addNewWeapon(flareInfo, false);

        this.level.addNewWeapon(surveillanceInfo, false);
        this.onlyOneSuperInst(chopperInfo);
        this.onlyOneSuperInst(nukeInfo);
        this.onlyOneSuperInst(carpetBombInfo);

        //this.level.addNewWeapon(chopperInfo, true);
        //this.level.addNewWeapon(nukeInfo, true);

     //   let special = this.returnOneSuperWeapon();
     ////   this.level.addNewWeapon(chopperInfo, false);

    }
    private onlyOneSuperInst(info) {
        if (!extraWeapons[slotOf(info)]) {
            this.level.addNewWeapon(info, true);
        }
    }

    private positionElem(elem: HTMLElement, pos: position) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }

    public updateCursorPosition(event?: MouseEvent) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (!this.weapon) {                     // NEEDED? FROM SHIFTING ARMING LATER IN WAVE SETUP
            return
        }
        if (this.weapon.activeInstance && this.weapon.activeInstance.blastRadElement) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
        if (event) {

            const target = event.target as HTMLElement;     // FAILSAFE FOR REMOVING NO STRIKE ZONES
            if (!target.classList.contains('noStrikeZone')) {
                if (game.strikesRestricted == true) {
                    console.log("hit residual strike zone")
                    game.strikesRestricted = false;
                }
            }
        }
    }

    public changeWeapon(wep: WeaponType) {
        if (this.paused) return;
        let wepArr = wep.getWeaponArray();
        if (!wepArr.includes(wep) || wep.name == weaponNames.flare && this.level.currentWave.timeOfDay == Time.day)
            return
        if (this.weapon) {
            this.weapon.switchFrom();
        }
        this.weapon = wep;
        this.hud.selectBox(wep.slot);

        this.switchCursor();
        this.updateCursorPosition();
        this.weapon.switchTo(); // Main weapon switch func
    }

    private switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }

    public targetCreation(newTarget: Target, pos?: position) {
        this.level.produceSingleTarget(newTarget, pos);
    }

    private updateProgressBar() {
        if (this.progressNumber >= 100) {
            this.progressNumber = 100;
            if (this.fullProgress === false) {
                this.fullProgressBar();
                this.fullProgress = true;
            }
        }
        if (parseInt(this.progressBar.style.width) != this.progressNumber) {
            this.progressBar.style.width = this.progressNumber + '%';
        }
        let span = document.getElementById('UNdescription');
        let text = progressMarkers[Math.floor(this.progressNumber / 10) * 10];
        if (this.progressNumber > 50) {
            text += "!"
        }
        if (this.progressNumber > 80) {
            text += "!!"
        }
        span.innerText = text;
    }
    private fullProgressBar() {
        this.progressBar.classList.add("full");
        let special = this.returnOneSuperWeapon();
        if (!extraWeapons[slotOf(special)]) {
            this.level.addNewWeapon(special, false);
        }
    }
    public drainProgressBar() {
        this.progressNumber = 0;
        this.fullProgress = false;
        this.updateProgressBar();
        this.progressBar.classList.remove("full");
    }
    // Where the latest shot landed, which is where the multi-kill number comes up from
    public lastStrike: position = null;
    private sequenceOrigin: position = null;
    private sequenceBuilding: boolean = false;
    // The targets in the chain so far: a target that is hit twice (disabled, then destroyed) is still the one target, and what is
    // counted is real targets, not how many times they were scored
    private sequenceTargets: Set<object> = new Set();
    public assessKillPoints(priorStatus: Status, damage: Damage, fromBuilding: boolean = false, target?: object) {
        const first = this.sequenceTargets.size === 0;
        this.sequenceTargets.add(target || {});
        this.sequentialHits = this.sequenceTargets.size;
        if (fromBuilding) this.sequenceBuilding = true;
        if (first) {
            this.sequenceOrigin = this.lastStrike ? { X: this.lastStrike.X, Y: this.lastStrike.Y } : null;
            this.timeOutForMoreHits(this.sequentialHits);
        }
        this.calcScore(priorStatus, damage);
    }

    private timeOutForMoreHits(prevSequentialHits: number) {
        setTimeout(() => {
            if (this.sequentialHits > prevSequentialHits) {
                this.timeOutForMoreHits(this.sequentialHits);
            }
            else {
                if (this.sequentialHits > 1) {
                    this.hud.popKillNumber("x" + this.sequentialHits, this.sequentialHits, this.sequenceOrigin);
                }
                else if (this.sequenceBuilding) { // a strike on a building that got just the one: still worth a mention
                    this.hud.popKillNumber("Hit!", 1, this.sequenceOrigin);
                }
                this.calcScore(this.sequentialHits);
                this.sequentialHits = 0;
                this.sequenceTargets.clear();
                this.sequenceBuilding = false;
            }
        }, 500);
    }
    private calcScore(priorStatus: Status, damage: Damage): void;
    private calcScore(multiKill: number): void;
    private calcScore(arg1: Status | number, arg2?: Damage): void {
        let directHitReward = 3;
        let destroyReward = 2;
        let prog = 1;
        if (typeof arg1 === 'number') {
            prog = arg1;
        }
        else {
            if (arg1 as Status === Status.active && arg2 === Damage.destroyed) {
                PopupHandler.addToArray("Direct Hit!", "", msgLength.short)
                prog = directHitReward
            }
            else if (arg2 === Damage.destroyed) {
                prog = destroyReward
            }
        }
        this.progressNumber += prog;
        this.updateProgressBar();
    }

    public updateKillStats(stat?: killStatDisplayOptions, num?: number) {
        if (stat) {
            num = num ? num : 1;
            this.killStats[stat.toLowerCase()] += num;
        }
        this.hud.updateScore(this.killStats);
    }

    private updateLights() {
        const darkBlueVal = 40;
        let defaultRGB = `rgb(0, 0, ${darkBlueVal})`;

        var lightsString: string = this.returnLightString(lights, "255, 255, 255");
        var flaresString: string = this.returnLightString(flares, "255, 255, 50");
        var firesString: string = this.returnLightString(fires, "255, 255, 255");
        if (this.glowDirty) {
            this.glowString = this.returnLightString(glows, "255, 205, 120");
            this.glowDirty = false;
        }
        var gradientsString: string = [lightsString, flaresString, firesString, this.glowString]
            .filter(str => str) 
            .join(', ');
        this.darkOverlay.style.background = gradientsString ? gradientsString : defaultRGB; // Fallback to full darkness if no lights
        this.darkOverlay.style.backgroundColor = defaultRGB;
    }

    private returnLightString(arr: Array<light>, rbgString): string {
        return arr
            .filter(light => light.opac > 0)
            .map(light => {
                let radius = light.reach || light.size;
                let brightRange = light.reach ? 20 : light.size / 12;
                let featherRange = light.reach ? 100 : light.size / 12 + 30;
                if (light.parent) { // centred on the thing that's burning
                    light.pos.X = parseInt(light.parent.style.left) + light.parent.offsetWidth / 2;
                    light.pos.Y = parseInt(light.parent.style.top) + light.parent.offsetHeight / 2;
                }
                return `radial-gradient(circle ${radius}px at ${light.pos.X}px ${light.pos.Y}px,
                        rgba(${rbgString}, ${light.opac}) ${brightRange}%,
                        rgba(0, 0, 0, 0) ${featherRange}%)`;
            })
            .join(', ');
    }
    // The glows of the buildings after dark (see lightStage). Static, so the string for them is only made again when something about them changes.
    private glowString: string = "";
    private glowDirty: boolean = true;
    private static glowOpacity: number = 0.62;
    // After dark each building has a glow, like a fire's; on the coast, where they're packed so close together, there's one big one over the
    // town instead. They all go out when the power does (see PowerGrid), and the glow of a building that's brought down goes with it.
    public lightStage(area: Area) {
        glows.length = 0;
        this.glowDirty = true;
        if (this.daytime) return;
        const buildings = allTargets.filter(t => t instanceof Building) as Array<Building>;
        const homes = buildings.filter(b => !b.isElectric() && !b.isWrecked());
        if (area == Area.port) {
            const town = homes.filter(b => b.isTown());
            if (town.length) {
                const rects = town.map(b => b.getTargetEl());
                const left = Math.min(...rects.map(e => parseInt(e.style.left))), right = Math.max(...rects.map(e => parseInt(e.style.left) + e.offsetWidth));
                const top = Math.min(...rects.map(e => parseInt(e.style.top))), bottom = Math.max(...rects.map(e => parseInt(e.style.top) + e.offsetHeight));
                lightID++;
                glows.push({ id: lightID, pos: { X: (left + right) / 2, Y: (top + bottom) / 2 }, opac: GameHandler.glowOpacity, size: ExplSizes.XL, fading: false, reach: Math.max(right - left, bottom - top) * 0.62 });
            }
        }
        else {
            for (const b of homes) {
                const el = b.getTargetEl();
                lightID++;
                glows.push({ id: lightID, pos: { X: 0, Y: 0 }, opac: GameHandler.glowOpacity, size: ExplSizes.small, fading: false, reach: Math.max(el.offsetWidth, el.offsetHeight) * 1.1, parent: el, owner: b });
            }
        }
        this.updateLights();
    }
    private fadeGlows() {
        if (!glows.length) return;
        const down = !PowerGrid.isUp();
        for (const glow of glows) {
            if (down || (glow.owner && glow.owner.isWrecked())) {
                if (glow.fadeStep === undefined) glow.fadeStep = RandomNumberGen.randomNumBetween(5, 30) / 100; // (they don't all go at once)
                glow.opac = Math.max(0, glow.opac - glow.fadeStep);
                this.glowDirty = true;
            }
        }
        this.removeFaded(glows);
    }
    private fadeAllLights() {
        const glowsChanging = glows.length && (!PowerGrid.isUp() || glows.some(g => g.owner && g.owner.isWrecked()));
        this.fadeGlows();
        const anyLights = lights.length || flares.length || fires.length || glowsChanging || this.glowDirty;
        this.fadeLights(lights, 200);
        this.fadeLights(flares, flareFade);
        this.fadeFires();
        // redraw while anything was around, including the tick that removes the last of it,
        // otherwise its final faint glow would be left painted on the overlay (not by day, when
        // the overlay can't be seen -- the lights still fade and clear, they just aren't drawn)
        anyLights && !this.daytime ? this.updateLights() : "";
    }
    private fadeLights(arr: Array<light>, baseFadeDelay: number) {
        if (!arr.length) return

        arr.forEach(light => {
            if (light.fading === false) {
                light.fading = null
                setTimeout(() => { light.fading = true }, baseFadeDelay + light.size)
            }
            if (light.fading) {
                light.opac = Math.max(0, light.opac - 0.15); // Reduce opacity, and don't overshoot zero
            }
        });
        this.removeFaded(arr);
    }
    // A fire glows as brightly as whatever is burning is visible, so it fades out along with it
    // (a wreck fades away before it's finally removed), and once the fire is out -- or what was
    // burning is gone -- it dies away by its fadeStep. Fires nobody removes would pile up.
    private fadeFires() {
        fires.forEach(fire => {
            if (fire.burning && fire.parent && fire.parent.isConnected) {
                const visible = parseFloat(getComputedStyle(fire.parent).opacity);
                fire.opac = isNaN(visible) ? 1 : visible;
            }
            else {
                fire.opac = Math.max(0, fire.opac - (fire.fadeStep || 0.15));
            }
        });
        this.removeFaded(fires);
    }
    private removeFaded(arr: Array<light>) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i].opac <= 0) arr.splice(i, 1);
        }
    }
    // Everything on the ground that a stage leaves behind (craters, splashes, thrown debris, anything in
    // flight, the glow of its fires), so the next stage starts on bare ground
    // the weapons' aiming circles live in the content too, and have to stay: they belong to the weapons, not the stage
    private aimingCircles(): Set<Element> {
        const aimers = new Set<Element>();
        for (const weapons of [conventionalWeapons, extraWeapons]) {
            for (const weapon of weapons) {
                if (!weapon) continue;
                for (const inst of weapon.instances) {
                    if (inst.blastRadElement) aimers.add(inst.blastRadElement);
                }
            }
        }
        return aimers;
    }
    public clearStageLeftovers() {
        const aimers = this.aimingCircles();
        for (const el of Array.from(ContentElHandler.returnContentEl().children)) {
            if (!aimers.has(el)) el.remove();
        }
        allObjects = [];
        this.clearLights();
    }
    // Everything of the stage that's ending (its buildings, craters, wrecks, debris) goes into a layer of its own, which
    // the rush between stages carries off the screen along with the ground (see StageTransition), instead of it vanishing
    public moveStageToExit() {
        const content = ContentElHandler.returnContentEl();
        const exiting = document.createElement("div");
        exiting.id = "exitingStage";
        content.parentElement.appendChild(exiting);
        const aimers = this.aimingCircles();
        for (const el of Array.from(content.children)) {
            if (!aimers.has(el)) exiting.appendChild(el);
        }
        // the sea, as it was, washes away to the left (the next stage's has a new shape: it comes back in from the left at the end,
        // see .water in cssAnims.css)
        const water = document.getElementById("water");
        if (water && !water.classList.contains("displayNone")) {
            const old = water.cloneNode(true) as HTMLElement;
            old.removeAttribute("id");
            old.classList.add("oldSea");
            water.parentElement.insertBefore(old, water);
            StageTransition.oldSea = old;
        }
        StageTransition.exiting = exiting;
    }
    private clearLights() {
        lights.length = 0;
        flares.length = 0;
        fires.length = 0;
        glows.length = 0;
        this.glowDirty = true;
        this.darkOverlay.style.background = "";
    }

    public checkEnd() {
        let stats = this.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.failGame("");
        }
    }
    // The game's lost, with a message as to why if there is one
    public failGame(message: string) {
        if (!this.gameInProgress) return;
        this.pause();
        this.gameInProgress = false;
        PopupHandler.addToArray(message, userHandler.addressed("Game Over!"), msgLength.long);
        SoundPlayer.playWithVolumeSet(alarm3);
    }

    // The menu (Escape) freezes the whole game the way the P key does -- every timer, sound and animation --
    // and when it's closed again the game carries on from that moment.
    public toggleGamePause() {
        if (this.gameInProgress) {
            this.freeze(!this.menuIsOpen());
            this.toggleModal();
        }
        else if (this.gameWasPlayed) {  // FOR WHAT SITU??
            this.pause();
        }
    }
    public switchAmbience(amb: AmbienceSet) {
        this.stopAmbience();
        let divisor = 1;
        switch (amb) {
            case storm_amb:
                divisor = 8
                break;
            case heavyRain_amb:
                divisor = 4
                break;
            case rain_amb:
                divisor = 2
                break;
            default:
                divisor = 1
        }
        fireStay = itemStay / divisor;
        destroyedTargetStay = destroyedTargetStayConst / divisor;
        this.ambience = amb;
        this.startAmbience();
    }
    private startAmbience() {
        SoundPlayer.playThroughArray(this.ambience.primary);
        if (this.ambience.secondary.length) {
            this.soundTimer = setInterval(() => {
                if (!this.ambience.secondary.length) return
                SoundPlayer.playRandomSound(this.ambience.secondary);
            }, 15000);
        }
    }
    private stopAmbience() {
        clearInterval(this.soundTimer);
        if (this.ambience) {
            for (let a of this.ambience.primary) {
                a.stop();
            }
        }
    }
    public cutGameFuncs() {
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        this.level.pauseWave();
        this.stopAmbience();
    }

    public pause() {
        this.cutGameFuncs();
        this.toggleModal();
    }
    // Clears the last game right out, so nothing of it carries into the next: every pending timer (a
    // tunnel still producing cars, a weapon in flight, the game loop, flyovers, messages...), every
    // sound, the targets and what they own, the messages, weather, lights, and the state of the screen.
    public reset() {
        GameTimers.clearAll();
        Sound.stopAll();
        StageTransition.cancel();
        this.hidePauseDisplay();
        this.gameTimer = undefined;
        this.soundTimer = undefined;

        this.level.resetState(); // also clears away the targets, with anything of their own that was running
        this.resetBuildings();
        this.level = null;
        ContentElHandler.clearContent();
        this.clearLights();
        allObjects = [];

        PopupHandler.reset();
        this.rain = noRain;
        this.resetCoastKind();
        WeatherHandler.createRain(noRain);
        this.resetScreenEffects();

        fireStay = itemStay; // the weather changes these
        destroyedTargetStay = destroyedTargetStayConst;
        this.weapon = null;
        this.strikesRestricted = false;
        this.sequentialHits = 0;
        this.sequenceTargets.clear();
        this.progressNumber = 0;
        this.fullProgress = false;
        this.daytime = true;
        conventionalWeapons = [];
        extraWeapons = [];
        this.resetStats();
    }
    private resetScreenEffects() {
        const overlay = document.getElementById("overlay");
        overlay.classList.remove("flash");
        const shaken = ContentElHandler.returnContentEl().parentElement;
        for (const shake of [screenShakeTimeouts.shake_1, screenShakeTimeouts.shake_2, screenShakeTimeouts.shake_3]) {
            shaken.classList.remove(screenShakeTimeouts[shake]);
        }
        if (this.progressBar) {
            this.progressBar.classList.remove("full");
        }
    }

    // ---- Pause (the P key): everything freezes, the screen is shaded and PAUSED is shown ----
    private paused: boolean = false;

    public togglePause() {
        if (!this.gameInProgress || this.menuIsOpen()) return; // nothing's running to pause (the menu is open, or the game's over)
        this.paused = !this.paused;
        this.freeze(this.paused);
        this.showPauseDisplay(this.paused);
    }
    private menuIsOpen(): boolean {
        return !document.getElementById("modal").classList.contains("displayNone");
    }
    // Stops (or sets going again) everything that's running: timers, sounds and CSS animations
    private freeze(on: boolean) {
        if (on) {
            GameTimers.pause();
            Sound.pauseAll();
        }
        else {
            GameTimers.resume();
            Sound.resumeAll();
        }
        document.body.classList.toggle("gamePaused", on);
    }
    // The shade and the PAUSED message that go with the P key (the menu has its own)
    private showPauseDisplay(show: boolean) {
        document.getElementById("overlay").classList.toggle("displayNone", !show);
        document.getElementById("pauseBox").classList.toggle("displayNone", !show);
    }
    private hidePauseDisplay() {
        if (this.paused) {
            this.paused = false;
            this.showPauseDisplay(false);
        }
        document.body.classList.remove("gamePaused"); // as it is if it was the menu that had frozen the game
    }
    private resetBuildings() {
        for (let x of allBuildings) {
            x.remove();
        }
        allBuildings = [];
    }

    // Whether this mode is a series of stages of targets to clear, rather than targets that cross the
    // screen and can escape -- the HUD shows progress through the stage instead of the escape limit.
    public hasStages(): boolean {
        return this.gameMode == GameMode.coast || this.gameMode == GameMode.hills;
    }

    public newGame(mode: GameMode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        if (userHandler.userName) PopupHandler.addToArray(userHandler.addressed("Good luck!"));
        this.hud.drawHUD();
        this.progressBar = document.getElementById('progress');
        this.updateProgressBar();

        this.updateKillStats();
        if (mode == GameMode.regular) {
            this.addAllLevels();
            this.hud.buildLevelBar();
            this.newLevel(allLevelsArray[0], mode)
        }
        else if (mode == GameMode.sandbox) {
            this.newLevel(level_continuous, mode);
            this.addFullWeaponLoadout();
        }
        else if (mode == GameMode.test_1) {
            this.newLevel(level_weather, mode);
            this.addStarterWeapons()
            this.level.addNewWeapon(mortarInfo, false);
            this.level.addNewWeapon(mortarInfo, false);
            this.level.addNewWeapon(airstrikeInfo, true);
            this.level.addNewWeapon(airstrikeInfo, false);
            this.level.addNewWeapon(airstrikeInfo, false);
            this.level.addNewWeapon(flareInfo, true);
            this.level.addNewWeapon(flareInfo, false);
            this.level.addNewWeapon(flareInfo, false);
        }
        else if (mode == GameMode.coast) {
            this.newLevel(new SceneLevel(sceneInfo), mode); // fresh each time: it holds the stage's targets, and draws the buildings
            this.addScaledWeaponSet();
        }
        else if (mode == GameMode.hills) {
            this.newLevel(new HillsLevel(hillsInfo), mode);
            this.addStarterWeapons(); // the standard weapons here: the gun, mortars, tank, airstrike, tunnel charge and the drone
            this.level.addNewWeapon(howitzerInfo, false);
            this.level.addNewWeapon(howitzerInfo, false);
            for (let i = 0; i < 3; i++) {
                this.level.addNewWeapon(airstrikeInfo, false);
                this.level.addNewWeapon(chargeInfo, false);
            }
            this.level.addNewWeapon(surveillanceInfo, false);
            this.level.addNewWeapon(surveillanceInfo, false);
        }

        this.hud.drawMultiKill();
        this.killStats.failLimit = this.difficulty.failLimit; // put with level
        let startWeapon;
        for (let w of conventionalWeapons) {
            if (w == undefined) continue
            if (!startWeapon || w.name == weaponNames.mortar) {
                startWeapon = w;
            }
        }
        this.changeWeapon(startWeapon);

        this.start_unpause();
    }
    public drawAllBuildings(): Array<Building> {
        // (New elements go in at the front of the content, behind the ones before, so the ones that should be in front, the
        // lower ones, are made first). Twelve blocks at most: a roomy coast would take far more, and a stage would never end.
        const buildings = this.streetBlockSlots(96).reverse().map(slot => {
            const building = new Building(slot.info);
            building.setPosition(slot);
            if (slot.info.electric) PowerGrid.add(building);
            return building;
        });
        this.drawRoads();
        return buildings;
    }

    // How far clear of the water's faded shallows a building has to stay.
    private static shoreMargin = 10;

    // Left-most x for a block of this height starting at topY that is clear of the water across all
    // of its rows.
    private firstDryX(topY: number, height: number): number {
        const span = Shoreline.waterSpan(topY, topY + height);
        return span ? span.shoreRight + GameHandler.shoreMargin : 0;
    }

    // As above, but for a building's picture, which is a diamond: it's the middle of it that's nearest the shore, so it's the rows
    // from near the top of its middle to near the foot that have to be clear, not its whole height
    private firstDryXFor(topY: number, height: number): number {
        const span = Shoreline.waterSpan(topY + height * 0.3, topY + height * 0.75);
        return span ? span.shoreRight + GameHandler.shoreMargin : 0;
    }

    // The coast comes in two kinds, which take it in turns from one stage to the next:
    //  - "lean": the sea is down the left and the shore goes down and to the left at a good angle (not far off the way the ends of
    //    the blocks of buildings run), the land open to the top right
    //  - "slice": the shore comes down from around the top left corner, down and to the right, along the way the rows of buildings
    //    run, so the town lies along it with the sea beneath
    // Either way the sea is to the left of the shore, which is a straight line across the screen: the water is a box a half taller
    // than the screen, skewed about its middle so its right edge is the shore, and placed so that edge is where it's meant to be.
    public coastKind: "lean" | "slice" = "lean";
    private nextCoastKind: "lean" | "slice" = RandomNumberGen.randomNumBetween(0, 1) ? "lean" : "slice";
    public coastRowSlant: number = 18;                 // how steeply down to the right the rows of buildings go, in degrees
    public coastShoreK: number = 0;                    // how far right the shore goes for each px down the screen (negative on the steep coast)
    public coastShoreIntercept: number = 0;            // the shore as y = intercept + slope * x (for the sliced coast, where that's a slope down to the right)
    public coastShoreSlope: number = 0;
    public resetCoastKind() {
        this.nextCoastKind = RandomNumberGen.randomNumBetween(0, 1) ? "lean" : "slice";
    }
    public shapeCoast() {
        const water = document.getElementById("water");
        if (!water) return;
        const width = window.innerWidth, height = window.innerHeight;
        this.coastKind = this.nextCoastKind;
        this.nextCoastKind = this.coastKind == "lean" ? "slice" : "lean";
        let k: number;          // how far right the shore goes for each px down the screen
        let shoreAtMiddle: number;
        if (this.coastKind == "lean") {
            const lean = RandomNumberGen.randomNumBetween(44, 54);
            k = -Math.tan(lean * Math.PI / 180);
            shoreAtMiddle = width * RandomNumberGen.randomNumBetween(34, 44) / 100;   // (rolled back: not much more than a third of the way across)
            this.coastRowSlant = 18;
            this.coastShoreSlope = 0;
        }
        else {
            const angle = RandomNumberGen.randomNumBetween(22, 28);    // down from the horizontal; the rows are put to match it
            k = 1 / Math.tan(angle * Math.PI / 180);
            const topLeft = RandomNumberGen.randomNumBetween(60, 200);  // where it comes in at the top of the land
            shoreAtMiddle = topLeft + (height / 2 - 100) * k;
            this.coastRowSlant = angle;
            this.coastShoreSlope = 1 / k;
            this.coastShoreIntercept = height / 2 - shoreAtMiddle / k;
        }
        this.coastShoreK = k;
        const left = -(Math.abs(k) * height * 0.75 + 60);
        water.style.left = left + "px";
        water.style.width = (shoreAtMiddle + 0.25 * height * k - left) + "px";
        water.style.transform = "skewX(" + Math.atan(k) * 180 / Math.PI + "deg)";
    }

    // The roads of the coast: a picture of road (AS_assets/buildings/roads), stretched into place. It's drawn on the slant of the buildings, which
    // is not quite the slant it was drawn at, so each is given a matrix: the road's own two edges (along it, and across it) are what it maps
    // from, and `along` and `across` are what they're to become on the screen (px, as a vector from one end to the other).
    public coastRoads: Array<{ cx: number, cy: number, along: [number, number], across: [number, number], mirrored: boolean }> = [];
    private static roadArt = { width: 362, height: 176, centre: [181, 88], along: [295.5, -125], across: [69.5, 49] };
    public drawRoads() {
        const art = GameHandler.roadArt;
        for (const road of this.coastRoads) {
            const u = road.mirrored ? [art.along[0], -art.along[1]] : art.along;     // the picture's edges, as vectors
            const v = road.mirrored ? [-art.across[0], art.across[1]] : art.across;
            const det = u[0] * v[1] - v[0] * u[1];
            const inv = [[v[1] / det, -v[0] / det], [-u[1] / det, u[0] / det]];       // (the inverse of the matrix with u and v as its columns)
            const t = [[road.along[0], road.across[0]], [road.along[1], road.across[1]]];
            const m = [
                [t[0][0] * inv[0][0] + t[0][1] * inv[1][0], t[0][0] * inv[0][1] + t[0][1] * inv[1][1]],
                [t[1][0] * inv[0][0] + t[1][1] * inv[1][0], t[1][0] * inv[0][1] + t[1][1] * inv[1][1]],
            ];
            const img = document.createElement("img");
            img.className = "coastRoad";
            img.src = assetsFolder + "buildings/roads/" + (road.mirrored ? "Road_Straight_TLBR_1.png" : "Road_Straight_1.png");
            img.style.left = road.cx - art.centre[0] + "px";
            img.style.top = road.cy - art.centre[1] + "px";
            img.style.width = art.width + "px";
            img.style.height = art.height + "px";
            img.style.transform = `matrix(${m[0][0]}, ${m[1][0]}, ${m[0][1]}, ${m[1][1]}, 0, 0)`;
            ContentElHandler.addToContentEl(img);
        }
    }

    // Where to put up to maxCount buildings, none of them in the water, laid out as blocks: two rows of buildings of
    // similar size, four long, packed edge to edge. The ground runs on a slant in the pictures, so a row goes down the
    // screen as it goes right, and the second row of a block is a half-step back along the other slope (down and to the
    // left) so each building sits against the one beside it and the one behind it, like tiles. The blocks stand in lines
    // from the shore inland with a narrow street between them, a few lines one below the next. Every building in a block
    // is its own type, from the same size class, and there's one lighthouse, not several.
    public streetBlockSlots(
    maxCount: number,
    options?: {
        blockLength?: number;  // buildings long
        lines?: number;        // how many lines of blocks
        slantDegrees?: number; // how far a row goes down as it goes right
        padding?: number;      // kept clear at the screen edge
        road?: number;         // the road between one block and the next, in building widths
        aboveCorner?: number;  // how much of the town is above the line that runs from the corner of the land
    }
): Array<BuildingSlot> {
    const {
        blockLength = 4,
        lines = 10,
        slantDegrees = this.coastRowSlant,
        padding = 12,
        road = 1.0,                      // the road between blocks, in building widths
        aboveCorner = 420                // how far the first line is above the one that runs from the corner of the land
    } = options || {};
    const slots: Array<BuildingSlot> = [];
    this.coastRoads = [];

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const top = 110;                   // clear of the HUD
    const bottom = screenHeight - 40;
    const slope = Math.tan(slantDegrees * Math.PI / 180);
    const blockDepth = 2;              // rows to a block
    const footRise = 0.25;             // the middle of a building's platform is this share of its width above the bottom of its picture

    // the port buildings, by how big they are
    const town = coastBuildingInfo.filter(info => !info.waterfront);
    const large = town.filter(info => info.width >= 110);
    const medium = town.filter(info => info.width >= 80 && info.width < 110);
    const small = town.filter(info => info.width < 80);
    const usedSingles: Array<BuildingInfo> = []; // there's one lighthouse, say, not four, and one mosque
    const singleTaken = (info: BuildingInfo) => !!info.single && usedSingles.some(u => u === info || (!!u.group && u.group === info.group));

    const blocksWanted = Math.floor(maxCount / (blockLength * blockDepth));

    // The waterfront: one kind of crane, three to six of them, stand along the shore, and one kind of jetty or breakwater, three
    // to six of those, goes out into the sea, with the one lighthouse among the cranes. Where the water's faded edge is is the
    // shore: a crane's near corner is put there and a jetty's landward end. The town starts just behind the cranes, a road away.
    // (the ones drawn for this slant of coast: the pier a steep coast's runs down to the shore from the top left, a sliced one's from the top right)
    const seaSet = this.coastKind == "slice" ? seaFacingSW : seaFacingNW;
    const cranes = seaSet.filter(info => info.undamaged.includes("/Crane_"));
    const seaKinds = seaSet.filter(info => info.undamaged.includes("/Jetty_") || info.undamaged.includes("/Breakwater_"));
    const lighthouses = coastBuildingInfo.filter(info => info.undamaged.includes("/Lighthouse"));
    const crane = RandomNumberGen.returnRandomFromArray(cranes);
    const seaKind = RandomNumberGen.returnRandomFromArray(seaKinds);
    const shoreOf = (topY: number, height: number) => {
        const span = Shoreline.waterSpan(topY + height * 0.55, topY + height);
        return span ? (span.openRight + span.shoreRight) / 2 : 0;
    };
    let quaySide = crane.width + 6; // how far in from the shore the town starts: the cranes' depth and a road's worth
    let roadOffset = crane.width + 22; // where the road along the shore is, from the shore (the middle of it)
    const seaCount = RandomNumberGen.randomNumBetween(3, 6);
    const seaRanges: Array<{ top: number, bottom: number }> = [];
    for (let n = 0; n < seaCount; n++) {
        for (let attempt = 0; attempt < 30; attempt++) {
            const topY = RandomNumberGen.randomNumBetween(top + 20, bottom - seaKind.height - 10);
            if (seaRanges.some(r => topY < r.bottom - 6 && topY + seaKind.height > r.top + 6)) continue;
            // the steep coast's pieces run from the top left to the bottom right, and the bottom right end is the one on the shore. The
            // sliced coast's run from the top right to the bottom left: the top right end is on the shore, which is further along
            // lower down, so the whole piece is out in the sea
            const shoreAtEnd = this.coastKind == "slice" ? shoreOf(topY - seaKind.height * 0.5, seaKind.height) : shoreOf(topY, seaKind.height);
            if (shoreAtEnd + 16 + padding > screenWidth) continue; // (on a sliced coast the shore is off the screen low down)
            slots.push({ X: shoreAtEnd - seaKind.width + 16, Y: topY, info: seaKind });
            seaRanges.push({ top: topY, bottom: topY + seaKind.height });
            break;
        }
    }
    {
        // The cranes stand in a few groups along the shore, close together: each group has a front row on the shore, with the
        // others in a row behind it, inland, like the rows of the town
        const craneCount = RandomNumberGen.randomNumBetween(3, 6);
        const groupCount = craneCount <= 3 ? 1 : craneCount <= 5 ? 2 : RandomNumberGen.randomNumBetween(2, 3);
        const along = crane.height * 0.55;                 // how far down the shore the next in a row is
        const inland = crane.width * 0.7;                  // and how far in the row behind is: across, and (along the slant of the rows) down or up
        const inlandDrop = this.coastKind == "slice" ? -slope * inland : slope * inland;
        // down the shore as far as there's room: a sliced coast's shore runs off the right of the screen part of the way down
        const first = top + (this.coastKind == "slice" ? 150 : 100);
        const last = this.coastKind == "slice"
            ? Math.min(bottom, this.coastShoreIntercept + this.coastShoreSlope * (screenWidth - padding - crane.width - inland - 40))
            : bottom - 60;
        const groupStep = Math.max(60, (last - first) / groupCount);
        const light = RandomNumberGen.returnRandomFromArray(lighthouses);
        const placedCranes: Array<BuildingSlot> = [];
        const frontRow: Array<BuildingSlot> = [];
        let behind = false;
        for (let g = 0, remaining = craneCount; g < groupCount; g++) {
            const size = Math.ceil(remaining / (groupCount - g));
            remaining -= size;
            const groupFoot = first + groupStep * g + RandomNumberGen.randomNumBetween(0, Math.floor(groupStep * 0.25));
            for (let i = 0; i < size; i++) {
                const row = i % 2, col = Math.floor(i / 2);   // (the second of a group is behind the first, the third next to it)
                const foot = groupFoot + col * along + (row ? inlandDrop : 0);
                const topY = foot - crane.height;
                const x = shoreOf(topY, crane.height) + 2 + RandomNumberGen.randomNumBetween(-3, 3) + (row ? inland : 0);
                if (x + crane.width + padding > screenWidth || foot > bottom || topY < top - 20) continue; // (on a sliced coast the shore is off the screen low down)
                const slot = { X: x, Y: topY, info: crane };
                placedCranes.push(slot);
                if (row) behind = true; else frontRow.push(slot);
            }
        }
        const craneBack = behind ? crane.width + inland : crane.width; // how far in from the shore the cranes go
        quaySide = craneBack + 46;                                       // and the town starts a road beyond that
        roadOffset = craneBack + 22;
        const step = groupStep;
        // the lighthouse is one of the front row: put on the shore in place of one of those cranes, or, if none are on screen, by itself
        if (light && !singleTaken(light)) {
            usedSingles.push(light);
            const pick = frontRow.length ? RandomNumberGen.returnRandomFromArray(frontRow) : null;
            const foot = pick ? pick.Y + crane.height : first + step;
            const topY = foot - light.height;
            const left = shoreOf(topY, light.height) + 2;
            if (left + light.width + padding <= screenWidth) {
                if (pick) placedCranes.splice(placedCranes.indexOf(pick), 1);
                placedCranes.push({ X: left, Y: topY, info: light });
            }
        }
        slots.push(...placedCranes);
    }

    // each line is one size class: how wide its widest building is says how far it is from the line above
    const classes = [];
    // at least two of the lines are the big compounds and warehouses, not all little things; the rest are whatever
    const kinds = [large, large];
    for (let k = 2; k < lines; k++) {
        const roll = RandomNumberGen.randomNumBetween(1, 100);
        kinds.push(roll <= 30 ? large : roll <= 70 ? medium : small);
    }
    for (let i = kinds.length - 1; i > 0; i--) { // in a random order down the screen
        const j = RandomNumberGen.randomNumBetween(0, i);
        [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    for (const pool of kinds) {
        classes.push({ pool: pool, width: Math.max(...pool.map(info => info.width)) });
    }
    // where each line is, as how far down the screen it would be at the left edge (y = intercept + slope * x): the first
    // at the top of the land, the others a block's depth and a street below the one before
    // (the first line is well above the top of the land's corner, so the lines above the corner start further along the top
    // and fill the top right, and the ones below it the bottom left, like the streets of a town)
    const spacingAt = (k: number) => (classes[k - 1].width + classes[k].width) / 2 * slope * (blockDepth + road);
    const intercepts: Array<number> = [];
    if (this.coastKind == "slice") {
        // the rows run along the shore: the first just behind the waterfront and the others further inland, up and to the right
        // (the first row of a block is the one by the sea: the line is far enough from the waterfront for half a building and a gap)
        const back = classes[0].width / 2 + 45;
        intercepts.push(this.coastShoreIntercept - slope * (quaySide + 10 + back));
        for (let k = 1; k < lines; k++) intercepts.push(intercepts[k - 1] - spacingAt(k));
    }
    else {
        intercepts.push((top + 85) - slope * (this.firstDryX(top, 80) + 60) - aboveCorner);
        for (let k = 1; k < lines; k++) intercepts.push(intercepts[k - 1] + spacingAt(k));
    }

    // the buildings for a block: a grid of them, none the same as the one beside or behind it
    const chooseBlock = (pool: Array<BuildingInfo>, length: number): Array<Array<BuildingInfo>> => {
        const grid: Array<Array<BuildingInfo>> = [];
        for (let i = 0; i < length; i++) {
            grid.push([]);
            for (let j = 0; j < blockDepth; j++) {
                const beside = i > 0 ? grid[i - 1][j] : null;
                const behind = j > 0 ? grid[i][j - 1] : null;
                const taken = (info: BuildingInfo) => singleTaken(info) || (!!info.single && grid.some(col => col.some(i => i === info || (!!i.group && i.group === info.group))));
                // (there are a lot of water towers, which would crowd the rest out: they're picked a third as often)
                const wantTower = RandomNumberGen.randomNumBetween(1, 100) <= 30;
                const choices = pool.filter(info => info !== beside && info !== behind && !taken(info) && (wantTower || !info.undamaged.includes("Water_Tower")));
                const anyLeft = pool.filter(info => !taken(info));
                grid[i].push(RandomNumberGen.returnRandomFromArray(choices.length ? choices : anyLeft.length ? anyLeft : pool));
            }
        }
        return grid;
    };

    // Tries a block on a line with its first building's middle at x0, working along the line from x0 until it's clear of
    // the water and the top of the screen. Returns the slots, or null if it runs out of room (the edge, or the bottom).
    const tryBlock = (k: number, grid: Array<Array<BuildingInfo>>, from: number): { slots: Array<BuildingSlot>, end: number, centres: Array<position>, cell: number, start: number } | null => {
        const cell = Math.max(...grid.map(col => Math.max(...col.map(info => info.width))));
        for (let x0 = from; x0 < screenWidth; x0 += 12) {
            const placed: Array<BuildingSlot> = [];
            const centres: Array<position> = [];
            let tooHigh = false;
            for (let i = 0; i < grid.length && !tooHigh; i++) {
                for (let j = 0; j < blockDepth; j++) {
                    const info = grid[i][j];
                    // the middle of its platform: along the row, a half cell for each step along it, and for each step back
                    // (the second row goes back towards the sea, down and to the left, except along a sliced coast, where the sea is
                    // that way and it goes back inland instead)
                    const back = this.coastKind == "slice" ? -j : j;
                    const cx = x0 + (i - back) * cell / 2;
                    const cy = intercepts[k] + slope * x0 + (i + back) * slope * cell / 2;
                    const footBottom = cy + footRise * info.width;
                    const left = cx - info.width / 2;
                    const placedTop = footBottom - info.height;
                    if (left + info.width + padding > screenWidth || footBottom > bottom) return null;
                    if (placedTop < top - 20 || left < this.firstDryXFor(placedTop, info.height) + quaySide) { tooHigh = true; break; }
                    placed.push({ X: left, Y: placedTop, info: info });
                    centres.push({ X: cx, Y: cy });
                }
            }
            if (!tooHigh) return { slots: placed, end: x0 + grid.length * cell / 2 + road * cell * 0.6, centres: centres, cell: cell, start: x0 };
        }
        return null;
    };

    // the lines take it in turns to have a block put on them, so no one line gets all of them
    const next: Array<number> = classes.map(() => 40);
    const finished: Array<boolean> = classes.map(() => false);
    const previous: Array<{ centres: Array<position> } | null> = classes.map(() => null);
    const rowStep = Math.sqrt(1 + slope * slope);   // along a row (or back from one), for each px across
    const slantRad = slantDegrees * Math.PI / 180;
    let blocks = 0;
    while (blocks < blocksWanted && finished.some(f => !f)) {
        for (let k = 0; k < lines && blocks < blocksWanted; k++) {
            if (finished[k]) continue;
            // a block of the full length if it fits, and if not a shorter one in what's left of the line, out to the edge of the screen
            let block = null;
            for (let length = blockLength; length >= 2 && !block; length--) {
                block = tryBlock(k, chooseBlock(classes[k].pool, length), next[k]);
            }
            if (!block) { finished[k] = true; continue; }
            block.slots.forEach(slot => {
                if (slot.info.single) usedSingles.push(slot.info);
                slots.push(slot);
            });
            // a street across the gap between this block and the one before it on the line: its middle is the middle of the four building
            // centres round it (the last two of the one before and the first two of this), and it runs along the way a block goes back
            const before = previous[k];
            if (before && block.start - next[k] <= 30) {
                const around = [before.centres[before.centres.length - 2], before.centres[before.centres.length - 1], block.centres[0], block.centres[1]];
                const cx = around.reduce((a, p) => a + p.X, 0) / 4, cy = around.reduce((a, p) => a + p.Y, 0) / 4;
                const step = block.cell / 2 * rowStep;
                const lengthAlong = (blockDepth + 0.7) * step, widthAcross = 0.44 * block.cell;
                this.coastRoads.push({ cx: cx, cy: cy, along: [Math.cos(slantRad) * lengthAlong, -Math.sin(slantRad) * lengthAlong], across: [Math.cos(slantRad) * widthAcross, Math.sin(slantRad) * widthAcross], mirrored: false });
            }
            previous[k] = { centres: block.centres };
            next[k] = block.end;
            blocks++;
        }
    }
    // there's always the one mosque: if the blocks didn't happen to draw it, it takes the place of the building closest to it in size
    const mosques = town.filter(info => info.group === "mosque");
    if (mosques.length && blocksWanted > 0 && !slots.some(s => s.info.group === "mosque")) {
        const mosque = RandomNumberGen.returnRandomFromArray(mosques);
        let best = -1;
        slots.forEach((s, i) => {
            if (s.info.single || s.info.waterfront || /Crane_|Jetty_|Breakwater_/.test(s.info.undamaged)) return;
            if (best < 0 || Math.abs(s.info.width - mosque.width) < Math.abs(slots[best].info.width - mosque.width)) best = i;
        });
        if (best >= 0) {
            const old = slots[best];
            slots[best] = { X: old.X + old.info.width / 2 - mosque.width / 2, Y: old.Y + old.info.height - mosque.height, info: mosque };
        }
    }
    // the road along the shore, behind the cranes and in front of the town: pieces end to end down the line of the shore (on the steep coast the
    // road drawn rising to the right is turned to the shore's slope, on the sliced one the same turned over, falling to the right)
    {
        const pieceLength = 200, pieceWidth = 34;
        const norm = Math.hypot(this.coastShoreK, 1);
        const down = { x: this.coastShoreK / norm, y: 1 / norm };            // down the shore
        const sliced = this.coastKind == "slice";
        const along = sliced ? [down.x * pieceLength, down.y * pieceLength] : [-down.x * pieceLength, -down.y * pieceLength];
        const across = sliced ? [-Math.cos(slantRad) * pieceWidth, Math.sin(slantRad) * pieceWidth] : [Math.cos(slantRad) * pieceWidth, Math.sin(slantRad) * pieceWidth];
        let y = top - 20, x = shoreOf(y, 10) + roadOffset;
        let count = 0;
        while (y < bottom + 60 && count++ < 20) {
            if (x > -pieceLength && x < screenWidth + pieceLength * 0.4) {
                this.coastRoads.push({ cx: x + down.x * pieceLength * 0.5, cy: y + down.y * pieceLength * 0.5, along: along as [number, number], across: across as [number, number], mirrored: sliced });
            }
            x += down.x * pieceLength * 0.94;
            y += down.y * pieceLength * 0.94;
        }
    }

    // the substation, near the right or the top of the screen where the land is, with the lines leading off the map from it
    const boxOf = (slot: BuildingSlot): Box => ({ left: slot.X, top: slot.Y, right: slot.X + slot.info.width, bottom: slot.Y + slot.info.height });
    const clearOfTheTown = (box: Box) => {
        if (box.left < this.firstDryXFor(box.top, box.bottom - box.top) + 24) return false;
        return !slots.some(slot => {
            const other = boxOf(slot);
            return box.left < other.right + 10 && box.right > other.left - 10 && box.top < other.bottom + 6 && box.bottom > other.top - 6;
        });
    };
    let power = PowerGrid.plan(["right", "top"], clearOfTheTown);
    if (!power.length) power = PowerGrid.plan(["right", "top", "bottom"], clearOfTheTown); // (if the town has taken all of those edges)
    slots.push(...power);
    // back to front: the nearer ones (lower down) are the ones that go over the ones behind them
    slots.sort((a, b) => (a.Y + a.info.height) - (b.Y + b.info.height));
    return slots;
}

    //public layoutStreetBlocks(
    //    buildings: Building[],
    //    startX: number,
    //    startY: number,
    //    buildingSpacingX = 120,
    //    buildingSpacingY = 120,
    //    streetWidth = 300
    //) {
    //    let buildingIndex = 0;

    //    // Block patterns
    //    const blockTypes = [
    //        { rows: 2, cols: 6 },
    //        { rows: 2, cols: 4 },
    //        { rows: 2, cols: 6 },
    //        { rows: 2, cols: 4 }
    //    ];

    //    // Arrange blocks in a grid
    //    const blocksPerRow = 2;

    //    for (let blockIndex = 0; blockIndex < blockTypes.length; blockIndex++) {
    //        const block = blockTypes[blockIndex];

    //        const blockGridX = blockIndex % blocksPerRow;
    //        const blockGridY = Math.floor(blockIndex / blocksPerRow);

    //        // Size of this block
    //        const blockWidth =
    //            (block.cols - 1) * buildingSpacingX;

    //        const blockHeight =
    //            (block.rows - 1) * buildingSpacingY;

    //        // Position of block itself
    //        const blockStartX =
    //            startX +
    //            blockGridX * (blockWidth + streetWidth);

    //        const blockStartY =
    //            startY +
    //            blockGridY * (blockHeight + streetWidth);

    //        // Place buildings inside block
    //        for (let row = 0; row < block.rows; row++) {
    //            for (let col = 0; col < block.cols; col++) {
    //                if (buildingIndex >= buildings.length) return;

    //                const building = buildings[buildingIndex];

    //                const x =
    //                    blockStartX + col * buildingSpacingX;

    //                const y =
    //                    blockStartY + row * buildingSpacingY;

    //                building.setPosition({
    //                    X: x,
    //                    Y: y
    //                });

    //                buildingIndex++;
    //            }
    //        }
    //    }
    //}

    public start_unpause() {
        if (this.gameInProgress == false) { // NEW GAME
            this.gameInProgress = true;
            this.gameWasPlayed = true;
        }
        this.startAmbience();
        this.toggleModal();

        this.gameTimer = window.setInterval(() => {
            this.checkEnd();
            this.updateProgressBar();
            this.fadeAllLights();
            WeatherHandler.tick();
            this.level.tickClock();
            this.level.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
        
    }
}

class WeatherHandler {
    private static rains: Array<Rain> = [noRain, lightRain, medRain, heavyRain];
    public static weatherTest() {
        game.setRain(lightRain);
        
        setTimeout(() => {
            game.setRain(this.rains[0])
        }, 2000)
        setTimeout(() => {
            game.setRain(this.rains[3])
        }, 4000)
        setTimeout(() => {
            game.setRain(this.rains[0])
        }, 6000)
        //setTimeout(() => {
        //    game.setRain(this.rains[0])
        //}, 8000)
        //setTimeout(() => {
        //    game.setRain(this.rains[3])
        //}, 12000)
        //setTimeout(() => {
        //    game.setRain(this.rains[0])
        //}, 15000)
    }

    // How long it's been raining hard (medium or heavy rain), in ms of game time: after a few seconds of it the craters fill with water
    private static current: Rain = noRain;
    private static hardRainMs: number = 0;
    private static static_ticks: number = 0;
    public static tick() {
        const hard = this.current === medRain || this.current === heavyRain;
        this.hardRainMs = hard ? this.hardRainMs + 100 : 0;
        if (hard && this.hardRainMs >= 4000 && ++this.static_ticks % 5 == 0) {
            ExplosionHandler.fillCratersWithRain();
        }
    }

    public static createRain(rainType: Rain) {
        this.current = rainType;
        const rainContainer = document.querySelector(".rain");
        rainContainer.className = "rain"
        const excess = Array.from(rainContainer.children).slice(0, rainContainer.children.length - rainType.drops);
        excess.forEach(node => rainContainer.removeChild(node));

        rainContainer.classList.add(rainType.className);
        var dropArray: Array<HTMLElement> = [];

        const root: HTMLElement = document.querySelector(':root');
        root.style.setProperty('--rainFallHeight', rainType.height);

        if (rainType.drops) {
            this.createRaindrop(rainContainer, dropArray, rainType.drops);
        }
    }

    private static createRaindrop(rainContainer, dropArray, limit) {
        const raindrop = document.createElement("div");
        raindrop.className = "raindrop";
        raindrop.style.left = Math.random() * 100 + "vw";
        let duration: number = Math.random() * 0.5 + 0.5
        raindrop.style.animationDuration = duration + "s";
        rainContainer.appendChild(raindrop);
        dropArray.push(raindrop);
        if (dropArray.length < limit) {
            setTimeout(() => {
                this.createRaindrop(rainContainer, dropArray, limit);
            }, 10)
        }
    }
}