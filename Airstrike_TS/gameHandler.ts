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
    public setRain(rain: Rain) {
        if (rain.ambience) {
            this.switchAmbience(rain.ambience)
        }
        WeatherHandler.createRain(rain);
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
        if (time == Time.day) {
            this.darkOverlay.style.opacity = '0';
            this.switchAmbience(regular_amb)
        }
        else {
            this.switchAmbience(night)
        }
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
                WeatherHandler.createRain(allRains[RandomNumberGen.randomNumBetween(0, 3)]);
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
    public assessKillPoints(priorStatus: Status, damage: Damage) {
        this.sequentialHits += 1;
        if (this.sequentialHits === 1) {
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
                this.sequentialHits > 1 ? this.hud.updateMultiKillBox(this.sequentialHits): "";
                this.calcScore(this.sequentialHits);
                this.sequentialHits = 0;
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
        var gradientsString: string = [lightsString, flaresString, firesString]
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
    private fadeAllLights() {
        const anyLights = lights.length || flares.length || fires.length;
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
        StageTransition.exiting = exiting;
    }
    private clearLights() {
        lights.length = 0;
        flares.length = 0;
        fires.length = 0;
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
        WeatherHandler.createRain(noRain);
        this.resetScreenEffects();

        fireStay = itemStay; // the weather changes these
        destroyedTargetStay = destroyedTargetStayConst;
        this.weapon = null;
        this.strikesRestricted = false;
        this.sequentialHits = 0;
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
        // lower ones, are made first)
        return this.streetBlockSlots(240).reverse().map(slot => {
            const building = new Building(slot.info);
            building.setPosition(slot);
            return building;
        });
    }

    // How far clear of the water's faded shallows a building has to stay.
    private static shoreMargin = 10;

    // Left-most x for a block of this height starting at topY that is clear of the water across all
    // of its rows.
    private firstDryX(topY: number, height: number): number {
        const span = Shoreline.waterSpan(topY, topY + height);
        return span ? span.shoreRight + GameHandler.shoreMargin : 0;
    }

    // The sea gets a different width, and the coast a different slant, each time
    public shapeCoast() {
        const water = document.getElementById("water");
        if (!water) return;
        // The shore leans to the right (the top of it further right than the bottom): the water is skewed that way about the
        // middle of its box (which is half as tall again as the screen), and placed so its edge is where it's meant to be across
        // the middle of the screen, and so it still reaches the left of the screen at the top
        const lean = RandomNumberGen.randomNumBetween(18, 38);
        const t = Math.tan(lean * Math.PI / 180);
        const width = window.innerWidth, height = window.innerHeight;
        const shoreAtMiddle = width * RandomNumberGen.randomNumBetween(30, 44) / 100;
        const left = -(t * height * 0.75 + 60);
        water.style.left = left + "px";
        water.style.width = (shoreAtMiddle - t * height * 0.25 - left) + "px";
        water.style.transform = "skewX(" + -lean + "deg)";
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
        slantDegrees = 18,
        padding = 12,
        road = 1.0,                      // the road between blocks, in building widths
        aboveCorner = 420                // how far the first line is above the one that runs from the corner of the land
    } = options || {};
    const slots: Array<BuildingSlot> = [];

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
    const cranes = coastBuildingInfo.filter(info => info.undamaged.includes("/Crane_"));
    const seaKinds = coastBuildingInfo.filter(info => info.undamaged.includes("/Jetty_") || info.undamaged.includes("/Breakwater_"));
    const lighthouses = coastBuildingInfo.filter(info => info.undamaged.includes("/Lighthouse"));
    const crane = RandomNumberGen.returnRandomFromArray(cranes);
    const seaKind = RandomNumberGen.returnRandomFromArray(seaKinds);
    const shoreOf = (topY: number, height: number) => {
        const span = Shoreline.waterSpan(topY + height * 0.55, topY + height);
        return span ? (span.openRight + span.shoreRight) / 2 : 0;
    };
    const quaySide = crane.width + 6; // how far in from the shore the town starts: the crane's width and a road's worth
    const seaCount = RandomNumberGen.randomNumBetween(3, 6);
    const seaRanges: Array<{ top: number, bottom: number }> = [];
    for (let n = 0; n < seaCount; n++) {
        for (let attempt = 0; attempt < 30; attempt++) {
            const topY = RandomNumberGen.randomNumBetween(top + 20, bottom - seaKind.height - 10);
            if (seaRanges.some(r => topY < r.bottom - 6 && topY + seaKind.height > r.top + 6)) continue;
            // the pieces run from the top left to the bottom right: the bottom right end is the one on the shore
            slots.push({ X: shoreOf(topY, seaKind.height) - seaKind.width + 16, Y: topY, info: seaKind });
            seaRanges.push({ top: topY, bottom: topY + seaKind.height });
            break;
        }
    }
    {
        const craneCount = RandomNumberGen.randomNumBetween(3, 6);
        const first = top + 100, step = (bottom - first) / craneCount;
        const lightAt = RandomNumberGen.randomNumBetween(0, craneCount - 1);
        for (let n = 0; n < craneCount; n++) {
            let info = crane;
            if (n == lightAt) {
                const lights = lighthouses.filter(i => !singleTaken(i));
                if (lights.length) { info = RandomNumberGen.returnRandomFromArray(lights); usedSingles.push(info); }
            }
            const foot = first + step * n + RandomNumberGen.randomNumBetween(0, Math.floor(step * 0.35));
            const topY = foot - info.height;
            const left = shoreOf(topY, info.height) + 2 + RandomNumberGen.randomNumBetween(-3, 3);
            if (left + info.width + padding > screenWidth) continue;
            slots.push({ X: left, Y: topY, info: info });
        }
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
    const intercepts: Array<number> = [(top + 85) - slope * (this.firstDryX(top, 80) + 60) - aboveCorner];
    for (let k = 1; k < lines; k++) {
        intercepts.push(intercepts[k - 1] + (classes[k - 1].width + classes[k].width) / 2 * slope * (blockDepth + road));
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
    const tryBlock = (k: number, grid: Array<Array<BuildingInfo>>, from: number): { slots: Array<BuildingSlot>, end: number } | null => {
        const cell = Math.max(...grid.map(col => Math.max(...col.map(info => info.width))));
        for (let x0 = from; x0 < screenWidth; x0 += 12) {
            const placed: Array<BuildingSlot> = [];
            let tooHigh = false;
            for (let i = 0; i < grid.length && !tooHigh; i++) {
                for (let j = 0; j < blockDepth; j++) {
                    const info = grid[i][j];
                    // the middle of its platform: along the row, a half cell for each step along it, and for each step back
                    const cx = x0 + (i - j) * cell / 2;
                    const cy = intercepts[k] + slope * x0 + (i + j) * slope * cell / 2;
                    const footBottom = cy + footRise * info.width;
                    const left = cx - info.width / 2;
                    const placedTop = footBottom - info.height;
                    if (left + info.width + padding > screenWidth || footBottom > bottom) return null;
                    if (placedTop < top - 20 || left < this.firstDryX(placedTop, info.height) + quaySide) { tooHigh = true; break; }
                    placed.push({ X: left, Y: placedTop, info: info });
                }
            }
            if (!tooHigh) return { slots: placed, end: x0 + grid.length * cell / 2 + road * cell * 0.6 };
        }
        return null;
    };

    // the lines take it in turns to have a block put on them, so no one line gets all of them
    const next: Array<number> = classes.map(() => 40);
    const finished: Array<boolean> = classes.map(() => false);
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
            next[k] = block.end;
            blocks++;
        }
    }
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
        this.createRain(lightRain);
        
        setTimeout(() => {
            this.createRain(this.rains[0])
        }, 2000)
        setTimeout(() => {
            this.createRain(this.rains[3])
        }, 4000)
        setTimeout(() => {
            this.createRain(this.rains[0])
        }, 6000)
        //setTimeout(() => {
        //    this.createRain(this.rains[0])
        //}, 8000)
        //setTimeout(() => {
        //    this.createRain(this.rains[3])
        //}, 12000)
        //setTimeout(() => {
        //    this.createRain(this.rains[0])
        //}, 15000)
    }

    public static createRain(rainType: Rain) {
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