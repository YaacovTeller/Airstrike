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
    GameMode[GameMode["test_2"] = 3] = "test_2";
    GameMode[GameMode["test_3"] = 4] = "test_3";
})(GameMode || (GameMode = {}));
var conventionalWeapons = [];
var extraWeapons = [];
var allTargets = [];
var allObjects = [];
var allBuildings = [];
var allLevelsArray = [];
const level_continuous = new Level(continuousInfo);
const level_weather = new Level(weatherTestInfo);
const level_static = new Level(staticInfo);
class GameHandler {
    hud = new HudHandler();
    weapon;
    contentEl;
    progressBar;
    darkOverlay;
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
    waterWidth;
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
        this.setBackground(url);
        document.getElementById("contentWrapper").style.backgroundImage = `url(./AS_assets/Sand.png)`;
    }
    createWater() {
        let water = document.createElement('div');
        water.id = "water";
        water.classList.add('water');
        ContentElHandler.addToBackground(water);
    }
    extendWater(width, bool) {
        this.waterWidth = width;
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
        PopupHandler.addToArray("That's the last of them, good work!", "You did it!", msgLength.long);
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
        document.getElementById("startbutton").onclick = () => this.newGame(GameMode.regular);
        document.getElementById("startbutton_sandbox").onclick = () => this.newGame(GameMode.sandbox);
        document.getElementById("startbutton_WeatherTest").onclick = () => this.newGame(GameMode.test_1);
        document.getElementById("startbutton_test_2").onclick = () => this.newGame(GameMode.test_2);
        document.getElementById("startbutton_test_3").onclick = () => this.newGame(GameMode.test_3);
        document.getElementById("langbutton").onclick = () => this.toggleLang();
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();
        this.setMenuDifficulty(arr);
        this.toggleLang();
        this.toggleModal();
        this.setRadioButtons();
        this.setVolumeSlider();
        this.setupInstructionsToggle();
    }
    setRadioButtons() {
        const radioButtons = document.querySelectorAll('input[type="radio"]');
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
    setMenuDifficulty(liOptions) {
        this.setIndivMenuDifficulty(normal, liOptions[0]);
        this.setIndivMenuDifficulty(hard, liOptions[1]);
        this.setIndivMenuDifficulty(chaos, liOptions[2]);
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
        if (!game.gameInProgress) {
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            SoundPlayer.playWithVolumeSet(bleep_neg);
            return;
        }
        this.weapon.fireFunc(); // MESSY??
    }
    handleKeyPress(event) {
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        if (game.gameInProgress) {
            if (event.code === 'Space' || event.key.toLowerCase() === 'z' || event.key === 'Control') {
                this.fireFunc();
            }
            let int = parseInt(event.key);
            if (int) {
                if (conventionalWeapons[int]) {
                    this.changeWeapon(conventionalWeapons[int]);
                }
                else if (extraWeapons[int]) {
                    this.changeWeapon(extraWeapons[int]);
                }
            }
            else if (event.key.toLowerCase() === 's') {
                this.level.showActiveTargets();
            }
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
    returnOneSuperWeapon() {
        let supers = [chopperInfo, nukeInfo];
        let rand = RandomNumberGen.randomNumBetween(0, 1);
        if (extraWeapons[supers[rand].name]) {
            rand = rand == 0 ? 1 : 0;
        }
        return supers[rand];
    }
    addAllWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(chargeInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        this.level.addNewWeapon(droneInfo, false);
        this.level.addNewWeapon(flareInfo, false);
        this.onlyOneSuperInst(chopperInfo);
        this.onlyOneSuperInst(nukeInfo);
        //this.level.addNewWeapon(chopperInfo, true);
        //this.level.addNewWeapon(nukeInfo, true);
        //   let special = this.returnOneSuperWeapon();
        ////   this.level.addNewWeapon(chopperInfo, false);
    }
    onlyOneSuperInst(info) {
        if (!extraWeapons[info.name]) {
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
        let wepArr = wep.getWeaponArray();
        if (!wepArr.includes(wep) || wep.name == weaponNames.flare && this.level.currentWave.timeOfDay == Time.day)
            return;
        if (this.weapon) {
            this.weapon.switchFrom();
        }
        this.weapon = wep;
        this.hud.selectBox(wep.name);
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
        if (!extraWeapons[special.name]) {
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
            let brightRange = light.size / 12;
            let featherRange = light.size / 12 + 30;
            if (light.parent) {
                light.pos.X = parseInt(light.parent.style.left);
                light.pos.Y = parseInt(light.parent.style.top);
            }
            return `radial-gradient(circle ${light.size}px at ${light.pos.X}px ${light.pos.Y}px,
                        rgba(${rbgString}, ${light.opac}) ${brightRange}%,
                        rgba(0, 0, 0, 0) ${featherRange}%)`;
        })
            .join(', ');
    }
    fadeAllLights() {
        this.fadeLights(lights, 200);
        this.fadeLights(flares, flareFade);
        lights.length || flares.length ? this.updateLights() : "";
    }
    fadeLights(arr, baseFadeDelay) {
        if (!arr.length)
            return;
        arr.forEach(light => {
            if (light.fading === false) {
                light.fading = null;
                setTimeout(() => { light.fading = true; }, baseFadeDelay + light.size);
            }
            if (light.opac > 0 && light.fading) {
                light.opac -= 0.15; // Reduce opacity
            }
            else if (light.opac == 0) {
                let index = arr.indexOf(light);
                arr.splice(index, 1);
            }
        });
    }
    checkEnd() {
        let stats = this.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.pause();
            this.gameInProgress = false;
            PopupHandler.addToArray("", "Game Over!", msgLength.long);
            SoundPlayer.playWithVolumeSet(alarm3);
        }
    }
    toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.pause();
            }
            else {
                this.start_unpause();
                this.level.continueWave(); // UNPAUSE
            }
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
    reset() {
        this.level.resetTargets();
        this.resetBuildings();
        this.level.pauseWave();
        this.level = null;
        ContentElHandler.clearContent();
        conventionalWeapons = [];
        extraWeapons = [];
        this.resetStats();
    }
    resetBuildings() {
        for (let x of allBuildings) {
            x.remove();
        }
        allBuildings = [];
    }
    newGame(mode) {
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
        else if (mode == GameMode.test_2) {
            this.newLevel(level_static, mode);
            this.level.addNewWeapon(airstrikeInfo, true);
            this.drawAllBuildings();
        }
        else if (mode == GameMode.test_3) {
            this.newLevel(new SceneLevel(sceneInfo), mode); // fresh each time: it holds the scene's targets
            this.addFullWeaponLoadout();
            this.drawAllBuildings();
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
        const buildings = [];
        for (let i = 0; i < 40; i++) {
            buildings.push(new Building());
        }
        this.layoutStreetBlocks(buildings);
    }
    layoutStreetBlocks(buildings, options) {
        const { startX = 100, startY = 100, buildingSpacingX = 120, buildingSpacingY = 120, streetWidth = 260, padding = 50 } = options || {};
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const blockTypes = [
            { rows: 2, cols: 6 },
            { rows: 2, cols: 4 },
            { rows: 2, cols: 6 },
            { rows: 2, cols: 4 },
            { rows: 2, cols: 6 }
        ];
        let currentX = startX;
        let currentY = startY;
        let tallestBlockInRow = 0;
        let buildingIndex = 0;
        for (const block of blockTypes) {
            const blockWidth = (block.cols - 1) * buildingSpacingX;
            const blockHeight = (block.rows - 1) * buildingSpacingY;
            // WRAP TO NEXT ROW IF BLOCK WOULD GO OFF SCREEN
            if (currentX + blockWidth + padding >
                screenWidth) {
                currentX = startX;
                currentY +=
                    tallestBlockInRow +
                        streetWidth;
                tallestBlockInRow = 0;
            }
            // STOP if block would exceed screen height
            if (currentY + blockHeight + padding >
                screenHeight) {
                console.warn("Not enough screen space for more blocks");
                return;
            }
            // Place buildings in this block
            for (let row = 0; row < block.rows; row++) {
                for (let col = 0; col < block.cols; col++) {
                    if (buildingIndex >= buildings.length)
                        return;
                    const x = currentX +
                        col * buildingSpacingX;
                    const y = currentY +
                        row * buildingSpacingY;
                    buildings[buildingIndex].setPosition({
                        X: x,
                        Y: y
                    });
                    buildingIndex++;
                }
            }
            // Move to next block position
            currentX += blockWidth + streetWidth;
            tallestBlockInRow = Math.max(tallestBlockInRow, blockHeight);
        }
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