"use strict";
var Languages;
(function (Languages) {
    Languages[Languages["eng"] = 0] = "eng";
    Languages[Languages["heb"] = 1] = "heb";
})(Languages || (Languages = {}));
var GameMode;
(function (GameMode) {
    GameMode[GameMode["regular"] = 0] = "regular";
    GameMode[GameMode["sandbox"] = 1] = "sandbox";
    GameMode[GameMode["test_1"] = 2] = "test_1";
    GameMode[GameMode["coast"] = 3] = "coast";
    GameMode[GameMode["hills"] = 4] = "hills";
})(GameMode || (GameMode = {}));
var conventionalWeapons = [];
var extraWeapons = [];
var allTargets = [];
var allObjects = [];
var allBuildings = [];
var allLevelsArray = [];
const level_continuous = new Level(continuousInfo);
const level_weather = new Level(weatherTestInfo);
class GameHandler {
    hud = new HudHandler();
    weapon;
    contentEl;
    progressBar;
    darkOverlay;
    daytime = true; // the dark overlay is invisible by day, so its lights aren't drawn
    progressNumber = 0;
    shotCount = 0;
    language = Languages.eng;
    difficulty;
    gameMode;
    ambience;
    killStats;
    volume = 0;
    sequentialHits = 0;
    level; // messy, fix
    gameTimer;
    soundTimer;
    gameInProgress = false;
    gameWasPlayed = false;
    fullProgress = false;
    strikesRestricted = false;
    constructor(element) {
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
        };
    }
    resetStats() {
        this.killStats.total = 0;
        this.killStats.disabled = 0;
        this.killStats.destroyed = 0;
        this.killStats.escaped = 0;
        this.killStats.shots = 0;
    }
    addWeatherElements() {
        this.darkOverlay = document.createElement('div');
        this.darkOverlay.classList.add('darkOverlay');
        ContentElHandler.addToContentWrapper(this.darkOverlay);
        let rain = document.createElement('div');
        rain.classList.add('rain');
        ContentElHandler.addToContentWrapper(rain);
    }
    setRain(rain) {
        if (rain.ambience) {
            this.switchAmbience(rain.ambience);
        }
        WeatherHandler.createRain(rain);
    }
    setBackground(url) {
        let back = ContentElHandler.returnbackground();
        back.style.backgroundImage = url;
        back.style.backgroundSize = 'tile';
        //content.style.backgroundSize = 'cover';
    }
    handleBackgroundByLocation(num) {
        let url;
        if (num == Area.desert) {
            url = "url(./AS_assets/Sand.png)";
            this.extendWater(10, false);
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
    createWater() {
        let water = document.createElement('div');
        water.id = "water";
        water.classList.add('water');
        ContentElHandler.addToBackground(water);
    }
    extendWater(width, bool) {
        let water = document.getElementById("water");
        water.style.width = width + "%";
        if (bool) {
            water.classList.remove("displayNone");
        }
        else {
            water.classList.add('displayNone');
        }
    }
    changeTime(time) {
        this.daytime = time == Time.day;
        this.hideFlare(time);
        if (time == Time.day) {
            this.darkOverlay.style.opacity = '0';
            this.switchAmbience(regular_amb);
        }
        else {
            this.switchAmbience(night);
        }
        if (time == Time.dusk) {
            this.darkOverlay.style.opacity = '0.5';
        }
        else if (time == Time.night) {
            this.darkOverlay.style.opacity = '0.92';
        }
    }
    hideFlare(time) {
        let name = weaponNames.flare;
        let hide;
        let flareBox = this.hud.returnWepBox(name);
        if (flareBox) {
            if (time == Time.day) {
                hide = true;
            }
            else {
                hide = false;
            }
            this.hud.hideWeapon(name, hide);
        }
    }
    addAllLevels() {
        allLevelsArray = [];
        for (let i of allLevelInfo) {
            let lev = new Level(i);
            allLevelsArray.push(lev);
        }
    }
    //public newStaticLevel(level: Level_Static) {
    //    this.level = level;
    //    this.handleBackgroundByLocation(this.level.returnLocation());
    //}
    newLevel(level, mode) {
        if (level) {
            let nextLevel = level;
            if (mode == GameMode.sandbox) {
                nextLevel = level_continuous; // AWWKWARD? 
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
    endGame() {
        PopupHandler.addToArray("", "GAME COMPLETE", msgLength.long);
        PopupHandler.addToArray("That's the last of them, good work!", userHandler.addressed("You did it!"), msgLength.long);
        PopupHandler.addToArray(`Finished <strong>${GameMode[this.gameMode]}</strong> on ${this.difficulty.eng.name} difficulty with ${this.killStats.disabled} kills, and ${this.killStats.destroyed} pulverised!`, "", msgLength.long);
        cheer.play();
        this.gameInProgress = false; // HACKY??
        this.cutGameFuncs();
        setTimeout(() => {
            this.toggleModal();
        }, 10000);
    }
    setEventListeners() {
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    menuSetup() {
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
    setRadioButtons() {
        const radioButtons = document.querySelectorAll('#difficultiesContainer input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
    }
    setVolumeSlider() {
        const slider = document.getElementById("slider");
        slider.addEventListener("input", () => {
            this.setVolume(slider);
        });
        this.setVolume(slider);
    }
    setVolume(slider) {
        const sliderValue = document.getElementById("sliderValue");
        let vol = Math.round(parseFloat(slider.value) * 100);
        this.volume = vol / 100;
        sliderValue.textContent = `Volume: ${(vol)}%`;
    }
    setMenuDifficulty(liOptions, set) {
        for (let i = 0; i < set.length; i++) {
            this.setIndivMenuDifficulty(set[i], liOptions[i]);
        }
    }
    // The location choice: Desert is the regular game, Hills and Coast the levels made of stages. Each has its own
    // difficulties, so choosing one rewrites the difficulty options (keeping whichever of the three is picked).
    setLocationButtons(difficultyLis) {
        const radios = document.querySelectorAll('#locationContainer input[type="radio"]');
        radios.forEach(radio => radio.addEventListener('change', () => {
            const staged = this.selectedLocation() != "desert";
            for (const li of difficultyLis) {
                const label = li.getElementsByTagName('label')[0];
                label.innerHTML = "";
            }
            this.setMenuDifficulty(difficultyLis, staged ? [sceneNormal, sceneHard, sceneChaos] : [normal, hard, chaos]);
            const picked = document.querySelector('#difficultiesContainer input[type="radio"]:checked');
            if (picked)
                this.jsonParseRadioDifficulty(picked.value);
        }));
    }
    selectedLocation() {
        const picked = document.querySelector('#locationContainer input[type="radio"]:checked');
        return picked ? picked.value : "desert";
    }
    selectedMode() {
        const location = this.selectedLocation();
        return location == "hills" ? GameMode.hills : location == "coast" ? GameMode.coast : GameMode.regular;
    }
    getMenuLis() {
        let container = document.getElementById("difficultiesContainer");
        let lis = container.getElementsByTagName('li');
        return Array.from(lis);
    }
    setupInstructionsToggle() {
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
    toggleLang() {
        const root = document.querySelector(':root');
        if (this.language == Languages.heb) {
            this.language = Languages.eng;
            root.style.setProperty('--hebDisplay', 'none');
            root.style.setProperty('--engDisplay', 'block');
        }
        else {
            this.language = Languages.heb;
            root.style.setProperty('--hebDisplay', 'block');
            root.style.setProperty('--engDisplay', 'none');
        }
    }
    setIndivMenuDifficulty(dif, li) {
        let opt = li.getElementsByTagName('input')[0];
        opt.setAttribute("value", JSON.stringify(dif));
        this.createSpansByLanguage(dif, li, Languages.eng);
        this.createSpansByLanguage(dif, li, Languages.heb);
    }
    createSpansByLanguage(dif, li, lang) {
        let langString = Languages[lang];
        let label = li.getElementsByTagName('label')[0];
        let span = document.createElement('span');
        span.innerText = dif[langString].name;
        span.classList.add(langString);
        label.appendChild(span);
        span = document.createElement('span');
        span.innerHTML = dif[langString].description;
        span.classList.add(langString);
        label.appendChild(span);
    }
    handleOptionChange(event) {
        this.jsonParseRadioDifficulty(event.target.value);
    }
    jsonParseRadioDifficulty(value) {
        const selected = JSON.parse(value);
        this.setDifficulty(selected);
    }
    ////////
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.setSpeeds();
    }
    setSpeeds() {
        this.setIndivTargetSpeed(regTarget, this.difficulty.regTargetSpeed);
        this.setIndivTargetSpeed(modTarget, this.difficulty.modTargetSpeed);
        this.setIndivTargetSpeed(heavyTarget, this.difficulty.heavyTargetSpeed);
        this.setIndivTargetSpeed(regTunnelTarget, this.difficulty.tunnelTargetSpeed);
    }
    setIndivTargetSpeed(target, speed) {
        target.minSpeed = speed.min;
        target.maxSpeed = speed.max;
    }
    toggleModal() {
        this.toggleElem("overlay");
        this.toggleElem("modal");
    }
    toggleElem(id) {
        var elem = document.getElementById(id);
        elem.classList.contains("displayNone") ? elem.classList.remove("displayNone") : elem.classList.add("displayNone");
    }
    addHudInstance(wep) {
        this.hud.addInstanceByWeapon(wep);
    }
    addHudWeapon(wep) {
        this.hud.addWeapon(wep);
    }
    fireFunc() {
        if (!game.gameInProgress || this.paused || StageTransition.active) { // no shooting at the ground as it rushes past
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            SoundPlayer.playWithVolumeSet(bleep_neg);
            return;
        }
        this.weapon.fireFunc(); // MESSY??
    }
    handleKeyPress(event) {
        if (this.paused) { // nothing else works while paused
            if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
                this.togglePause();
            }
            return;
        }
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        else if (event.key.toLowerCase() === 'p') {
            this.togglePause();
        }
        if (this.menuIsOpen())
            return; // the game's keys don't work while the menu's up
        if (game.gameInProgress) {
            if (event.code === 'Space' || event.key.toLowerCase() === 'z' || event.key === 'Control') {
                this.fireFunc();
            }
            const beyondNine = { '0': 10, '-': 11, '=': 12 }; // the weapons after 9 are on the keys that follow it
            let int = beyondNine[event.key] || parseInt(event.key);
            if (int) {
                if (conventionalWeapons[int]) {
                    this.changeWeapon(conventionalWeapons[int]);
                }
                else if (extraWeapons[int]) {
                    this.changeWeapon(extraWeapons[int]);
                }
            }
            else if (event.shiftKey && event.key === 'S') {
                this.level.showActiveTargets();
            } // a cheat, like Shift+A: marks every active target
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
    addStarterWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
    }
    addFullWeaponLoadout() {
        this.addAllWeapons();
        this.addAllWeapons();
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
    }
    // The coast level's own weapons instead of the standard ones. Every game starts from empty weapon lists
    // (see reset()), so going back to any other mode gets the standard set again.
    addScaledWeaponSet() {
        // three of each, but more of the small and fewer of the big ones
        const howMany = { 1: 4, 4: 2, 5: 1, 6: 2, 7: 1 };
        scaledWeapons.forEach(info => {
            const count = howMany[info.slot] || 3;
            for (let i = 0; i < count; i++)
                this.level.addNewWeapon(info, false);
        });
        this.level.addNewWeapon(surveillanceInfo, false);
        this.level.addNewWeapon(surveillanceInfo, false);
    }
    returnOneSuperWeapon() {
        let supers = [chopperInfo, nukeInfo, carpetBombInfo];
        let unowned = supers.filter(info => !extraWeapons[slotOf(info)]);
        return RandomNumberGen.returnRandomFromArray(unowned.length ? unowned : supers);
    }
    addAllWeapons() {
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
    onlyOneSuperInst(info) {
        if (!extraWeapons[slotOf(info)]) {
            this.level.addNewWeapon(info, true);
        }
    }
    positionElem(elem, pos) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }
    updateCursorPosition(event) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (!this.weapon) { // NEEDED? FROM SHIFTING ARMING LATER IN WAVE SETUP
            return;
        }
        if (this.weapon.activeInstance && this.weapon.activeInstance.blastRadElement) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
        if (event) {
            const target = event.target; // FAILSAFE FOR REMOVING NO STRIKE ZONES
            if (!target.classList.contains('noStrikeZone')) {
                if (game.strikesRestricted == true) {
                    console.log("hit residual strike zone");
                    game.strikesRestricted = false;
                }
            }
        }
    }
    changeWeapon(wep) {
        if (this.paused)
            return;
        let wepArr = wep.getWeaponArray();
        if (!wepArr.includes(wep) || wep.name == weaponNames.flare && this.level.currentWave.timeOfDay == Time.day)
            return;
        if (this.weapon) {
            this.weapon.switchFrom();
        }
        this.weapon = wep;
        this.hud.selectBox(wep.slot);
        this.switchCursor();
        this.updateCursorPosition();
        this.weapon.switchTo(); // Main weapon switch func
    }
    switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }
    targetCreation(newTarget, pos) {
        this.level.produceSingleTarget(newTarget, pos);
    }
    updateProgressBar() {
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
            text += "!";
        }
        if (this.progressNumber > 80) {
            text += "!!";
        }
        span.innerText = text;
    }
    fullProgressBar() {
        this.progressBar.classList.add("full");
        let special = this.returnOneSuperWeapon();
        if (!extraWeapons[slotOf(special)]) {
            this.level.addNewWeapon(special, false);
        }
    }
    drainProgressBar() {
        this.progressNumber = 0;
        this.fullProgress = false;
        this.updateProgressBar();
        this.progressBar.classList.remove("full");
    }
    assessKillPoints(priorStatus, damage) {
        this.sequentialHits += 1;
        if (this.sequentialHits === 1) {
            this.timeOutForMoreHits(this.sequentialHits);
        }
        this.calcScore(priorStatus, damage);
    }
    timeOutForMoreHits(prevSequentialHits) {
        setTimeout(() => {
            if (this.sequentialHits > prevSequentialHits) {
                this.timeOutForMoreHits(this.sequentialHits);
            }
            else {
                this.sequentialHits > 1 ? this.hud.updateMultiKillBox(this.sequentialHits) : "";
                this.calcScore(this.sequentialHits);
                this.sequentialHits = 0;
            }
        }, 500);
    }
    calcScore(arg1, arg2) {
        let directHitReward = 3;
        let destroyReward = 2;
        let prog = 1;
        if (typeof arg1 === 'number') {
            prog = arg1;
        }
        else {
            if (arg1 === Status.active && arg2 === Damage.destroyed) {
                PopupHandler.addToArray("Direct Hit!", "", msgLength.short);
                prog = directHitReward;
            }
            else if (arg2 === Damage.destroyed) {
                prog = destroyReward;
            }
        }
        this.progressNumber += prog;
        this.updateProgressBar();
    }
    updateKillStats(stat, num) {
        if (stat) {
            num = num ? num : 1;
            this.killStats[stat.toLowerCase()] += num;
        }
        this.hud.updateScore(this.killStats);
    }
    updateLights() {
        const darkBlueVal = 40;
        let defaultRGB = `rgb(0, 0, ${darkBlueVal})`;
        var lightsString = this.returnLightString(lights, "255, 255, 255");
        var flaresString = this.returnLightString(flares, "255, 255, 50");
        var firesString = this.returnLightString(fires, "255, 255, 255");
        var gradientsString = [lightsString, flaresString, firesString]
            .filter(str => str)
            .join(', ');
        this.darkOverlay.style.background = gradientsString ? gradientsString : defaultRGB; // Fallback to full darkness if no lights
        this.darkOverlay.style.backgroundColor = defaultRGB;
    }
    returnLightString(arr, rbgString) {
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
    fadeAllLights() {
        const anyLights = lights.length || flares.length || fires.length;
        this.fadeLights(lights, 200);
        this.fadeLights(flares, flareFade);
        this.fadeFires();
        // redraw while anything was around, including the tick that removes the last of it,
        // otherwise its final faint glow would be left painted on the overlay (not by day, when
        // the overlay can't be seen -- the lights still fade and clear, they just aren't drawn)
        anyLights && !this.daytime ? this.updateLights() : "";
    }
    fadeLights(arr, baseFadeDelay) {
        if (!arr.length)
            return;
        arr.forEach(light => {
            if (light.fading === false) {
                light.fading = null;
                setTimeout(() => { light.fading = true; }, baseFadeDelay + light.size);
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
    fadeFires() {
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
    removeFaded(arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i].opac <= 0)
                arr.splice(i, 1);
        }
    }
    // Everything on the ground that a stage leaves behind (craters, splashes, thrown debris, anything in
    // flight, the glow of its fires), so the next stage starts on bare ground
    // the weapons' aiming circles live in the content too, and have to stay: they belong to the weapons, not the stage
    aimingCircles() {
        const aimers = new Set();
        for (const weapons of [conventionalWeapons, extraWeapons]) {
            for (const weapon of weapons) {
                if (!weapon)
                    continue;
                for (const inst of weapon.instances) {
                    if (inst.blastRadElement)
                        aimers.add(inst.blastRadElement);
                }
            }
        }
        return aimers;
    }
    clearStageLeftovers() {
        const aimers = this.aimingCircles();
        for (const el of Array.from(ContentElHandler.returnContentEl().children)) {
            if (!aimers.has(el))
                el.remove();
        }
        allObjects = [];
        this.clearLights();
    }
    // Everything of the stage that's ending (its buildings, craters, wrecks, debris) goes into a layer of its own, which
    // the rush between stages carries off the screen along with the ground (see StageTransition), instead of it vanishing
    moveStageToExit() {
        const content = ContentElHandler.returnContentEl();
        const exiting = document.createElement("div");
        exiting.id = "exitingStage";
        content.parentElement.appendChild(exiting);
        const aimers = this.aimingCircles();
        for (const el of Array.from(content.children)) {
            if (!aimers.has(el))
                exiting.appendChild(el);
        }
        StageTransition.exiting = exiting;
    }
    clearLights() {
        lights.length = 0;
        flares.length = 0;
        fires.length = 0;
        this.darkOverlay.style.background = "";
    }
    checkEnd() {
        let stats = this.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.failGame("");
        }
    }
    // The game's lost, with a message as to why if there is one
    failGame(message) {
        if (!this.gameInProgress)
            return;
        this.pause();
        this.gameInProgress = false;
        PopupHandler.addToArray(message, userHandler.addressed("Game Over!"), msgLength.long);
        SoundPlayer.playWithVolumeSet(alarm3);
    }
    // The menu (Escape) freezes the whole game the way the P key does -- every timer, sound and animation --
    // and when it's closed again the game carries on from that moment.
    toggleGamePause() {
        if (this.gameInProgress) {
            this.freeze(!this.menuIsOpen());
            this.toggleModal();
        }
        else if (this.gameWasPlayed) { // FOR WHAT SITU??
            this.pause();
        }
    }
    switchAmbience(amb) {
        this.stopAmbience();
        let divisor = 1;
        switch (amb) {
            case storm_amb:
                divisor = 8;
                break;
            case heavyRain_amb:
                divisor = 4;
                break;
            case rain_amb:
                divisor = 2;
                break;
            default:
                divisor = 1;
        }
        fireStay = itemStay / divisor;
        destroyedTargetStay = destroyedTargetStayConst / divisor;
        this.ambience = amb;
        this.startAmbience();
    }
    startAmbience() {
        SoundPlayer.playThroughArray(this.ambience.primary);
        if (this.ambience.secondary.length) {
            this.soundTimer = setInterval(() => {
                if (!this.ambience.secondary.length)
                    return;
                SoundPlayer.playRandomSound(this.ambience.secondary);
            }, 15000);
        }
    }
    stopAmbience() {
        clearInterval(this.soundTimer);
        if (this.ambience) {
            for (let a of this.ambience.primary) {
                a.stop();
            }
        }
    }
    cutGameFuncs() {
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        this.level.pauseWave();
        this.stopAmbience();
    }
    pause() {
        this.cutGameFuncs();
        this.toggleModal();
    }
    // Clears the last game right out, so nothing of it carries into the next: every pending timer (a
    // tunnel still producing cars, a weapon in flight, the game loop, flyovers, messages...), every
    // sound, the targets and what they own, the messages, weather, lights, and the state of the screen.
    reset() {
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
    resetScreenEffects() {
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
    paused = false;
    togglePause() {
        if (!this.gameInProgress || this.menuIsOpen())
            return; // nothing's running to pause (the menu is open, or the game's over)
        this.paused = !this.paused;
        this.freeze(this.paused);
        this.showPauseDisplay(this.paused);
    }
    menuIsOpen() {
        return !document.getElementById("modal").classList.contains("displayNone");
    }
    // Stops (or sets going again) everything that's running: timers, sounds and CSS animations
    freeze(on) {
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
    showPauseDisplay(show) {
        document.getElementById("overlay").classList.toggle("displayNone", !show);
        document.getElementById("pauseBox").classList.toggle("displayNone", !show);
    }
    hidePauseDisplay() {
        if (this.paused) {
            this.paused = false;
            this.showPauseDisplay(false);
        }
        document.body.classList.remove("gamePaused"); // as it is if it was the menu that had frozen the game
    }
    resetBuildings() {
        for (let x of allBuildings) {
            x.remove();
        }
        allBuildings = [];
    }
    // Whether this mode is a series of stages of targets to clear, rather than targets that cross the
    // screen and can escape -- the HUD shows progress through the stage instead of the escape limit.
    hasStages() {
        return this.gameMode == GameMode.coast || this.gameMode == GameMode.hills;
    }
    newGame(mode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        if (userHandler.userName)
            PopupHandler.addToArray(userHandler.addressed("Good luck!"));
        this.hud.drawHUD();
        this.progressBar = document.getElementById('progress');
        this.updateProgressBar();
        this.updateKillStats();
        if (mode == GameMode.regular) {
            this.addAllLevels();
            this.hud.buildLevelBar();
            this.newLevel(allLevelsArray[0], mode);
        }
        else if (mode == GameMode.sandbox) {
            this.newLevel(level_continuous, mode);
            this.addFullWeaponLoadout();
        }
        else if (mode == GameMode.test_1) {
            this.newLevel(level_weather, mode);
            this.addStarterWeapons();
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
            if (w == undefined)
                continue;
            if (!startWeapon || w.name == weaponNames.mortar) {
                startWeapon = w;
            }
        }
        this.changeWeapon(startWeapon);
        this.start_unpause();
    }
    drawAllBuildings() {
        return this.streetBlockSlots(60).map(slot => {
            const building = new Building(slot.info);
            building.setPosition(slot);
            return building;
        });
    }
    // How far clear of the water's faded shallows a building has to stay.
    static shoreMargin = 10;
    // Left-most x for a block of this height starting at topY that is clear of the water across all
    // of its rows.
    firstDryX(topY, height) {
        const span = Shoreline.waterSpan(topY, topY + height);
        return span ? span.shoreRight + GameHandler.shoreMargin : 0;
    }
    // The sea gets a different width, and the coast a different slant, each time
    shapeCoast() {
        const water = document.getElementById("water");
        if (!water)
            return;
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
    // Where to put up to maxCount buildings, none of them in the water, laid out in close-packed rows that run along
    // the shore, so they go diagonally across the screen the way the coast does. The rows start at the shore and go
    // inland, each a row of one size class of the port buildings (the biggest compounds, the middling or the
    // smallest), stood in a line from the bottom of the screen up, each overlapping the one before a little; how far
    // apart the rows are depends on how wide the buildings in them are. No building is the same as the one before it
    // in its row, and there's one lighthouse, not several.
    streetBlockSlots(maxCount, options) {
        const { rowCount = 7, padding = 30 } = options || {};
        const slots = [];
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const top = 110; // clear of the HUD
        const bottom = screenHeight - 40;
        // the port buildings, by how big they are
        const large = allPortBuildingInfo.filter(info => info.width >= 110);
        const medium = allPortBuildingInfo.filter(info => info.width >= 80 && info.width < 110);
        const small = allPortBuildingInfo.filter(info => info.width < 80);
        const usedSingles = []; // there's one lighthouse, say, not four
        // what each row is made of, and how wide the widest of it is
        const rows = [];
        for (let i = 0; i < rowCount; i++) {
            const roll = RandomNumberGen.randomNumBetween(1, 100);
            const pool = roll <= 30 ? large : roll <= 70 ? medium : small;
            rows.push({ pool: pool, width: Math.max(...pool.map(info => info.width)) });
        }
        // the middle of each row, how far in from the shore: next to the one before, packed close
        const centres = [];
        rows.forEach((row, i) => {
            centres.push(i == 0 ? row.width / 2 + 6 : centres[i - 1] + (rows[i - 1].width + row.width) / 2 * 0.95);
        });
        const perRow = Math.ceil(maxCount / rowCount); // so the rows furthest inland aren't the ones that run short
        rows.forEach((row, k) => {
            let footY = bottom - RandomNumberGen.randomNumBetween(0, 22); // where the next building's foot goes, working up the screen
            let previous = null;
            let placed = 0;
            for (let tries = 0; placed < perRow && slots.length < maxCount && tries < 40; tries++) {
                const choices = row.pool.filter(info => info !== previous && !(info.single && usedSingles.includes(info)));
                const anyLeft = row.pool.filter(info => !(info.single && usedSingles.includes(info)));
                const info = RandomNumberGen.returnRandomFromArray(choices.length ? choices : anyLeft.length ? anyLeft : row.pool);
                const blockTop = footY - info.height;
                if (blockTop < top - 20)
                    break; // the top of the screen
                // the row follows the shore, so this one's as far from the shore here as the row is
                const left = this.firstDryX(blockTop, info.height) + centres[k] - info.width / 2 + RandomNumberGen.randomNumBetween(-4, 4);
                footY -= info.height * 0.78; // the next goes a little over the top of this one
                if (left + info.width + padding > screenWidth)
                    continue; // no room this far inland, this high up
                if (info.single)
                    usedSingles.push(info);
                slots.push({ X: left, Y: blockTop, info: info });
                previous = info;
                placed++;
            }
        });
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
    start_unpause() {
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
    static rains = [noRain, lightRain, medRain, heavyRain];
    static weatherTest() {
        this.createRain(lightRain);
        setTimeout(() => {
            this.createRain(this.rains[0]);
        }, 2000);
        setTimeout(() => {
            this.createRain(this.rains[3]);
        }, 4000);
        setTimeout(() => {
            this.createRain(this.rains[0]);
        }, 6000);
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
    static createRain(rainType) {
        const rainContainer = document.querySelector(".rain");
        rainContainer.className = "rain";
        const excess = Array.from(rainContainer.children).slice(0, rainContainer.children.length - rainType.drops);
        excess.forEach(node => rainContainer.removeChild(node));
        rainContainer.classList.add(rainType.className);
        var dropArray = [];
        const root = document.querySelector(':root');
        root.style.setProperty('--rainFallHeight', rainType.height);
        if (rainType.drops) {
            this.createRaindrop(rainContainer, dropArray, rainType.drops);
        }
    }
    static createRaindrop(rainContainer, dropArray, limit) {
        const raindrop = document.createElement("div");
        raindrop.className = "raindrop";
        raindrop.style.left = Math.random() * 100 + "vw";
        let duration = Math.random() * 0.5 + 0.5;
        raindrop.style.animationDuration = duration + "s";
        rainContainer.appendChild(raindrop);
        dropArray.push(raindrop);
        if (dropArray.length < limit) {
            setTimeout(() => {
                this.createRaindrop(rainContainer, dropArray, limit);
            }, 10);
        }
    }
}
//# sourceMappingURL=gameHandler.js.map