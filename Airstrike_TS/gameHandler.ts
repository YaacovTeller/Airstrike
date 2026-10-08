enum Languages {
    'eng',
    'heb'
}
enum GameMode {
    'regular',
    'sandbox',
    'test_1',
    'test_3',
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
        PopupHandler.addToArray("That's the last of them, good work!", "You did it!", msgLength.long);
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
        document.getElementById("startbutton").onclick = () => this.newGame(GameMode.regular);
        document.getElementById("startbutton_sandbox").onclick = () => this.newGame(GameMode.sandbox);
        document.getElementById("startbutton_WeatherTest").onclick = () => this.newGame(GameMode.test_1);
        document.getElementById("startbutton_test_3").onclick = () => this.newGame(GameMode.test_3);
        document.getElementById("startbutton_hills").onclick = () => this.newGame(GameMode.hills);
        document.getElementById("langbutton").onclick = () => this.toggleLang();
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();

        this.setMenuDifficulty(arr);
        this.toggleLang();
        this.toggleModal();

        this.setRadioButtons();
        this.setVolumeSlider();
        this.setupInstructionsToggle();
    }
    private setRadioButtons() {
        const radioButtons = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
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
    private setMenuDifficulty(liOptions) {
        this.setIndivMenuDifficulty(normal, liOptions[0]);
        this.setIndivMenuDifficulty(hard, liOptions[1]);
        this.setIndivMenuDifficulty(chaos, liOptions[2]);
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
        if (!game.gameInProgress || this.paused) {
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

            let int = event.key === '0' ? weaponNames.surveillance : event.key === '-' ? weaponNames.carpet_bomb : parseInt(event.key); // the tenth and eleventh weapons are on the 0 and - keys
            if (int) {
                if (conventionalWeapons[int]) {
                    this.changeWeapon(conventionalWeapons[int]);
                }     
                else if (extraWeapons[int]) {
                    this.changeWeapon(extraWeapons[int])
                }
            }
            else if (event.key.toLowerCase() === 's') { this.level.showActiveTargets(); }
            else if (event.key.toLowerCase() === 't') {
                game.changeTime(RandomNumberGen.randomNumBetween(0, 2));
            }
            else if (event.key.toLowerCase() === 'w') {
                WeatherHandler.createRain(allRains[RandomNumberGen.randomNumBetween(0, 3)]);
            }
            else if (event.shiftKey && event.key === 'A') {
                this.addAllWeapons();
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
    // Test_3's own weapons instead of the standard ones. Every game starts from empty weapon lists
    // (see reset()), so going back to any other mode gets the standard set again.
    private addScaledWeaponSet() {
        for (let i = 0; i < 3; i++) {
            scaledWeapons.forEach(info => this.level.addNewWeapon(info, false));
        }
        this.level.addNewWeapon(surveillanceInfo, false);
        this.level.addNewWeapon(surveillanceInfo, false);
    }
    private returnOneSuperWeapon() {
        let supers = [chopperInfo, nukeInfo, carpetBombInfo];
        let unowned = supers.filter(info => !extraWeapons[info.slot !== undefined ? info.slot : info.name]);
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
        if (!extraWeapons[info.name]) {
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
        if (!extraWeapons[special.name]) {
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
    private clearLights() {
        lights.length = 0;
        flares.length = 0;
        fires.length = 0;
        this.darkOverlay.style.background = "";
    }

    public checkEnd() {
        let stats = this.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.pause();
            this.gameInProgress = false;
            PopupHandler.addToArray("", "Game Over!", msgLength.long);
            SoundPlayer.playWithVolumeSet(alarm3);
        }
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
        return this.gameMode == GameMode.test_3 || this.gameMode == GameMode.hills;
    }

    public newGame(mode: GameMode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
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
        else if (mode == GameMode.test_3) {
            this.newLevel(new SceneLevel(sceneInfo), mode); // fresh each time: it holds the stage's targets, and draws the buildings
            this.addScaledWeaponSet();
        }
        else if (mode == GameMode.hills) {
            this.newLevel(new HillsLevel(hillsInfo), mode);
            this.addScaledWeaponSet();
            for (let i = 0; i < 3; i++) {
                this.level.addNewWeapon(tunnelChargeInfoForHills, false);
            }
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
        return this.streetBlockSlots(40).map(slot => {
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

    // Where to put up to maxCount buildings, none of them in the water, laid out like city blocks:
    // buildings tucked up together in blocks 2 or 3 across and 2 or 3 deep, with a road's width
    // between blocks. Every building in a block is the same type (and so the same size, which the type
    // says -- they aren't all alike). The blocks run along in lines, but each sits a little higher or
    // lower than its neighbours rather than all on the same level.
    public streetBlockSlots(
    maxCount: number,
    options?: {
        startX?: number;
        startY?: number;
        buildingGap?: number; // between buildings side by side in a block, as a share of a building's width (negative to overlap their empty margins)
        rowGap?: number;      // likewise, between the rows in a block, as a share of a building's height
        roadWidth?: number;   // between blocks
        minRows?: number;
        maxRows?: number;
        yVariation?: number;  // how much further down than its line a block can start
        padding?: number;     // kept clear at the screen edge
    }
): Array<BuildingSlot> {
    const {
        startX = 100,
        startY = 100,
        buildingGap = -0.06,
        rowGap = -0.12,
        roadWidth = 70,
        minRows = 2,
        maxRows = 3,
        yVariation = 50,
        padding = 50
    } = options || {};
    const slots: Array<BuildingSlot> = [];

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let currentX = startX;
    let lineY = startY;     // the top of this line of blocks
    let lineBottom = startY; // how far down the tallest block in the line reaches

    while (slots.length < maxCount) {
        const info = RandomNumberGen.returnRandomFromArray(allBuildingInfo);
        let rows = RandomNumberGen.randomNumBetween(minRows, maxRows);
        let cols = RandomNumberGen.randomNumBetween(2, 3);
        let dropY = RandomNumberGen.randomNumBetween(0, yVariation);

        // This type's buildings: how far apart they stand, and how far a run of them reaches, first edge to last edge
        const stepX = info.width * (1 + buildingGap);
        const stepY = info.height * (1 + rowGap);
        const widthOf = (n: number) => info.width + (n - 1) * stepX;
        const heightOf = (n: number) => info.height + (n - 1) * stepY;
        const fits = (x: number, n: number) => x + widthOf(n) + padding <= screenWidth;
        // A 3-wide block that won't fit can be squeezed in as a 2-wide one
        const fittingCols = (x: number, n: number) => !fits(x, n) && n == 3 ? 2 : n;

        // Right of the shore, for the rows this block would cover
        const dryX = () => Math.max(currentX, this.firstDryX(lineY + dropY, heightOf(rows)));
        let blockX = dryX();
        cols = fittingCols(blockX, cols);

        // WRAP TO THE NEXT LINE OF BLOCKS IF THIS ONE WOULD GO OFF SCREEN
        if (!fits(blockX, cols)) {
            currentX = startX;
            lineY = lineBottom + roadWidth;
            lineBottom = lineY;
            blockX = dryX();
            cols = fittingCols(blockX, cols);
            if (!fits(blockX, cols)) {
                console.warn("Not enough screen space for more blocks");
                return slots;
            }
        }

        // A block that would run off the bottom of the screen gets a shallower, level try first
        if (lineY + dropY + heightOf(rows) + padding > screenHeight) {
            rows = minRows;
            dropY = 0;
            blockX = dryX();
            if (lineY + heightOf(rows) + padding > screenHeight || !fits(blockX, cols)) {
                console.warn("Not enough screen space for more blocks");
                return slots;
            }
        }

        // Whole blocks only, so the last one isn't left half built
        if (slots.length + cols * rows > maxCount) {
            return slots;
        }

        const blockY = lineY + dropY;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                slots.push({
                    X: blockX + col * stepX,
                    Y: blockY + row * stepY,
                    info: info
                });
            }
        }

        // The road, then the next block
        currentX = blockX + widthOf(cols) + roadWidth;
        lineBottom = Math.max(lineBottom, blockY + heightOf(rows));
    }
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