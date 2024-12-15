enum Languages {
    'eng',
    'heb'
}
enum GameMode {
    'regular',
    'sandbox'
}


var allWeaponTypes: Array<WeaponType> = [];
var extraWeaponTypes: Array<WeaponType> = [];
var allTargets: Array<Target> = [];
var allObjects: Array<HTMLElement> = [];
var allLevelsArray: Array<Level> = [];
const level_continuous: Level = new Level(continuousInfo);

class GameHandler {
    public hud = new HudHandler();
    public weapon: WeaponType;
    private contentEl: HTMLElement;
    private progressBar: HTMLElement;
    private darkOverlay: HTMLElement;
    private progressNumber: number;
    public shotCount: number = 0;
    private language: Languages = Languages.eng;
    public difficulty: difficultyLevelInfo;
    public gameMode: GameMode;
    private ambience: AmbienceSet;

    public killStats: killStats;

    private sequentialHits: number = 0;
    public level: Level;   // messy, fix
    public gameTimer: number;
    private soundTimer: number;
    private gameInProgress: boolean = false;
    private gameWasPlayed: boolean = false;
    public strikesRestricted: boolean = false;

    constructor(element: HTMLElement) {
        this.contentEl = element;
        this.progressBar = document.getElementById('progress');
        userHandler.getUserInfo();
        if (userHandler.userName) {
            userHandler.displayName();
        }

        this.progressNumber = 30;
        this.updateProgressBar();

        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        //  document.getElementById("devDiff").onclick = () => { this.setDifficulty(dev); this.newGame(GameMode.regular); }
        this.setEventListeners();
        document.getElementById("loader").style.display = 'none';
        this.addWeather();
//        WeatherHandler.weatherTest();
        this.darkOverlay.style.opacity = '0.5';

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
    private addWeather() {
        this.darkOverlay = document.createElement('div');
        this.darkOverlay.classList.add('darkOverlay')
        ContentElHandler.addToContentWrapper(this.darkOverlay);

        let rain = document.createElement('div');
        rain.classList.add('rain')
        ContentElHandler.addToContentWrapper(rain);
    }
    public setRain(rain: Rain) {
        if (rain.ambience) {
            this.switchAmbience(rain.ambience)
        }
        WeatherHandler.createRain(rain);
    }

    public changeTime(time: Time) {
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
        let flareBox = this.hud.returnWepBox(weaponNames.flare) as HTMLElement
        if (flareBox) {
            if (time == Time.day) {
                flareBox.classList.add("displayNone");
            }
            else {
                flareBox.classList.remove("displayNone");
            }
        }
    }

    private addAllLevels() {
        allLevelsArray = [];
        for (let i of allLevelInfo) {
            let lev = new Level(i)
            allLevelsArray.push(lev);
        }
    }

    public newLevel(level: Level, mode: GameMode) {
        if (level) {
            let nextLevel = level;
            if (mode == GameMode.sandbox) {
                nextLevel = level_continuous;   /// AWWKWARD? 
            }
            this.level = nextLevel;
            this.level.setAsLevel(); // NEEDED?
            this.level.nextWave();
        }
        else {
            this.endGame();
        }
    }
    private endGame() {
        PopupHandler.addToArray("", "GAME COMPLETE", msgLength.long);
        PopupHandler.addToArray("That's the last of them, good work!", "You did it!", msgLength.long);
        PopupHandler.addToArray(`Finished on ${this.difficulty.eng.name} difficulty with ${this.killStats.disabled} kills, and ${this.killStats.destroyed} pulverised!`, "", msgLength.long);
        cheer.play();
        this.gameInProgress = false // HACKY??
        this.cutGameFuncs();
        setTimeout(() => {
            this.toggleModal();
        }, 10000)
    }

    private setEventListeners() {
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    public menuSetup() {
        let arr = this.getMenuLis();
        document.getElementById("startbutton").onclick = () => this.newGame(GameMode.regular);
        document.getElementById("startbuttonSandbox").onclick = () => this.newGame(GameMode.sandbox);
        document.getElementById("langbutton").onclick = () => this.toggleLang();
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();

        this.setMenuDifficulty(arr);
        this.toggleLang();
        this.toggleModal();

        const radioButtons = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
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
        span.innerText = dif[langString].description;
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
    //public redrawHudWithWepSelectionChecked() {
    //    this.hud.drawWeaponDisplay(this.weapon ? this.weapon.name : "");
    //}

    private fireFunc() {
        if (!game.gameInProgress) {
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            bleep_neg.play();
            return
        }
        this.weapon.fireFunc(); // MESSY??
    }

    private handleKeyPress(event) {
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        if (game.gameInProgress) {

            if (event.code === 'Space' || event.key.toLowerCase() === 'z' || event.key === 'Control') { this.fireFunc(); }

            let int = parseInt(event.key);
            if (int) {

                if (allWeaponTypes[int - 1]) {
                    this.changeWeapon(allWeaponTypes[int - 1]);
                }     
                else if (extraWeaponTypes[int - 1]) {
                    this.changeWeapon(extraWeaponTypes[int - 1])
                }
            }

            //else if (event.shiftKey && event.key === 'N') { this.level.addNewWeapon(nukeInfo); }
            else if (event.key.toLowerCase() === 's') { this.level.showActiveTargets(); }
            else if (event.shiftKey && event.key === 'A') {
                this.addAllWeapons();
            }
        }
    }

    private addFullWeaponLoadout() {
        this.addAllWeapons();
        this.addAllWeapons();
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
    }
    private returnOneSuperWeapon() {
        let rand = RandomNumberGen.randomNumBetween(1, 2);
        switch (rand) {
            case (1):
                return chopperInfo
            case (2):
                return nukeInfo
            default:
        }
    }

    private addAllWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(chargeInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        this.level.addNewWeapon(droneInfo, false);
        this.level.addNewWeapon(flareInfo, false);

        let special = this.returnOneSuperWeapon();
     //   this.level.addNewWeapon(chopperInfo, false);

        if (!extraWeaponTypes[special.name - 1]) {
            this.level.addNewWeapon(special, false);
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
        if (wep == null) {
            debugger
        }
        let wepArr = wep.getWeaponArray();
        if (!wepArr.includes(wep) || wep.name == weaponNames.flare && this.level.currentWave.timeOfDay == Time.day)
            return
        if (this.weapon) {
            this.weapon.switchFrom();
        }
        this.weapon = wep;
        this.hud.selectBox(wep.name);

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

    public targetCreation(newTarget: Target) {
        this.level.produceSingleTarget(newTarget);
        this.killStats.total++;
    }

    private updateProgressBar() {
        if (parseInt(this.progressBar.style.width) != this.progressNumber) {
            this.progressBar.style.width = this.progressNumber + '%';
        }
    }
    public updateHudMultiKill() {
        this.sequentialHits += 1;
        setTimeout(() => {
            if (this.sequentialHits >= 2) {
                this.hud.updateMultiKillBox(this.sequentialHits);
            }
            this.sequentialHits = 0;
        }, 400)
    }
    public updateKillStats(stat?: killStatDisplayOptions, num?: number) {
        if (stat) {
            num = num ? num : 1;
            this.killStats[stat.toLowerCase()] += num;
        }
        this.hud.updateScore(this.killStats);
    }
   
    //private updateHudScore() {
        

    //    //stats.disabled = targets.reduce((acc, target) => {
    //    //    if (target.status === Status.disabled) {
    //    //        return acc + 1;
    //    //    } else
    //    //        return acc;
    //    //}, 0);
    //    //stats.destroyed = targets.reduce((acc, target) => {
    //    //    if (target.damage >= Damage.moderateDamaged) {
    //    //        return acc + 1;
    //    //    } else
    //    //        return acc;
    //    //}, 0);
    //    //stats.escaped = this.level.targets.reduce((acc, target) => {
    //    //    if (target.status === Status.escaped) {
    //    //        return acc + 1;
    //    //    } else
    //    //        return acc;    
    //    //}, 0);

    ////    stats.total = targets.length || 0;

    //  //  this.updateLights();
    //}

    private updateLights() {
        const darkBlueVal = 40;
        let defaultRGB = `rgb(0, 0, ${darkBlueVal})`;

        var lightsString: string = this.returnLightString(lights, "255, 255, 255")
        var flaresString: string = this.returnLightString(flares, "255, 255, 50")
        var gradientsString: string = [lightsString, flaresString]
            .filter(str => str) 
            .join(', ');
        this.darkOverlay.style.background = gradientsString ? gradientsString : defaultRGB; // Fallback to full darkness if no lights
        this.darkOverlay.style.backgroundColor = defaultRGB;
    }

    private returnLightString(arr: Array<light>, rbgString): string {
        return arr
            .filter(light => light.opac > 0)
            .map(light => {
                let brightRange = light.size / 12;
                let featherRange = light.size / 12 + 30;
                return `radial-gradient(circle at ${light.pos.X}px ${light.pos.Y}px, rgba(${rbgString}, ${light.opac}) ${brightRange}%, rgba(0, 0, 0, 0) ${featherRange}%)`;
            })
            .join(', ');
    }
    private fadeAllLights() {
        this.fadeLights(lights, 200);
        this.fadeLights(flares, flareFade);
        lights.length || flares.length ? this.updateLights() : "";
    }
    private fadeLights(arr: Array<light>, baseFadeDelay: number) {
        if (!arr.length) return

        arr.forEach(light => {
            if (light.fading === false) {
                light.fading = null
                setTimeout(() => { light.fading = true }, baseFadeDelay + light.size)
            }
            if (light.opac > 0 && light.fading) {
                light.opac -= 0.15; // Reduce opacity
            }
            else if (light.opac == 0){
                let index = arr.indexOf(light);
                arr.splice(index, 1);
            }
        });
    }

    public checkEnd() {
        let stats = this.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.pause();
            this.gameInProgress = false;
            PopupHandler.addToArray("", "Game Over!", msgLength.long);
            alarm3.play();
        }
    }

    public toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.pause();
            }
            else {
                this.start_unpause();
                this.level.continueWave(); // UNPAUSE
            }
        }
        else if (this.gameWasPlayed) {  // FOR WHAT SITU??
            this.pause();
        }
    }
    public switchAmbience(amb: AmbienceSet) {
        this.stopAmbience();
        this.ambience = amb;
        this.startAmbience();
    }
    private startAmbience() {
        RandomSoundGen.playThroughArray(this.ambience.primary);
        if (this.ambience.secondary.length) {
            this.soundTimer = setInterval(() => {
                if (!this.ambience.secondary.length) return
                RandomSoundGen.playRandomSound(this.ambience.secondary);
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
    public reset() {
        this.level.resetTargets();
        this.level.pauseWave();
        this.level = null;
        ContentElHandler.clearContent();

        allWeaponTypes = [];
        extraWeaponTypes = [];
        this.resetStats();
    }

    public newGame(mode: GameMode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        this.hud.drawHUD();
        this.updateKillStats();
        if (mode == GameMode.regular) {
            this.addAllLevels();
            this.hud.buildLevelBar();
            this.newLevel(allLevelsArray[0], mode)
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(level_continuous, mode)
            this.addFullWeaponLoadout();
        }
        this.hud.drawMultiKill();
        this.killStats.failLimit = this.difficulty.failLimit; /// put with level
        let startWeapon;
        for (let w of allWeaponTypes) {
            if (w == undefined) continue
            if (!startWeapon || w.name == weaponNames.mortar) {
                startWeapon = w;
            }
        }
        //if (allWeaponTypes[weaponNames.mortar - 1]) {
        //    this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);
        //}
        this.changeWeapon(startWeapon);

        this.start_unpause();
    }

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
            this.level.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
        
    }
}
//function heavyRain(300,) {
//    createRain(300, )
//}

class WeatherHandler {
    private static rains: Array<Rain> = [noRain, lightRain, medRain, heavyRain];
    public static weatherTest() {
        this.createRain(lightRain);
        let index = 0;
        
        //setTimeout(() => {
        //    this.createRain(this.rains[index])
        //    index++
        //    index == this.rains.length ? index = 0 : "";
        //}, 2000)
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
        else {
            //    PopupHandler.addToArray("finished rain create")
        }
    }
}