var Languages;
(function (Languages) {
    Languages[Languages["eng"] = 0] = "eng";
    Languages[Languages["heb"] = 1] = "heb";
})(Languages || (Languages = {}));
var GameMode;
(function (GameMode) {
    GameMode[GameMode["regular"] = 0] = "regular";
    GameMode[GameMode["sandbox"] = 1] = "sandbox";
})(GameMode || (GameMode = {}));
var allWeaponTypes = [];
var extraWeaponTypes = [];
var allTargets = [];
var allObjects = [];
var allLevelsArray = [];
const level_continuous = new Level(continuousInfo);
class GameHandler {
    hud = new HudHandler();
    weapon;
    contentEl;
    progressBar;
    darkOverlay;
    progressNumber;
    shotCount = 0;
    language = Languages.eng;
    difficulty;
    gameMode;
    ambience = [];
    sequentialHits = 0;
    level;
    gameTimer;
    soundTimer;
    gameInProgress = false;
    gameWasPlayed = false;
    strikesRestricted = false;
    constructor(element) {
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
        this.setEventListeners();
        document.getElementById("loader").style.display = 'none';
        this.addDark();
    }
    addDark() {
        this.darkOverlay = document.createElement('div');
        this.darkOverlay.classList.add('darkOverlay');
        ContentElHandler.addToContentWrapper(this.darkOverlay);
    }
    changeTime(time) {
        if (time == Time.day) {
            this.darkOverlay.style.opacity = '0';
            this.ambience = ambience_1;
        }
        else {
            this.level.addNewWeapon(flareInfo, true);
            this.ambience = ambience_2;
        }
        if (time == Time.dusk) {
            this.darkOverlay.style.opacity = '0.5';
        }
        else if (time == Time.night) {
            this.darkOverlay.style.opacity = '0.92';
        }
    }
    addAllLevels() {
        allLevelsArray = [];
        for (let i of allLevelInfo) {
            let lev = new Level(i);
            allLevelsArray.push(lev);
        }
    }
    newLevel(level, mode) {
        if (level) {
            let nextLevel = level;
            if (mode == GameMode.sandbox) {
                nextLevel = level_continuous;
            }
            this.level = nextLevel;
            this.level.setAsLevel();
            this.level.nextWave();
        }
        else {
            this.endGame();
        }
    }
    endGame() {
        PopupHandler.addToArray("", "GAME COMPLETE", msgLength.long);
        PopupHandler.addToArray("That's the last of them, good work!", "You did it!", msgLength.long);
        PopupHandler.addToArray(`Finished on ${this.difficulty.eng.name} difficulty with ${this.hud.killStats.destroyed} kills!`, "", msgLength.long);
        cheer.play();
        this.gameInProgress = false;
        this.cutGameFuncs();
        setTimeout(() => {
            this.toggleModal();
        }, 10000);
    }
    setEventListeners() {
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    menuSetup() {
        let arr = this.getMenuLis();
        document.getElementById("startbutton").onclick = () => this.newGame(GameMode.regular);
        document.getElementById("startbuttonSandbox").onclick = () => this.newGame(GameMode.sandbox);
        document.getElementById("langbutton").onclick = () => this.toggleLang();
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();
        this.setMenuDifficulty(arr);
        this.toggleLang();
        this.toggleModal();
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
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
        span.innerText = dif[langString].description;
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
    redrawHudWithWepSelectionChecked() {
        this.hud.drawWeaponDisplay(this.weapon ? this.weapon.name : "");
    }
    fireFunc() {
        if (!game.gameInProgress) {
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            bleep_neg.play();
            return;
        }
        this.weapon.fireFunc();
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
                if (allWeaponTypes[int - 1]) {
                    this.changeWeapon(allWeaponTypes[int - 1]);
                }
                else if (extraWeaponTypes[int - 1]) {
                    this.changeWeapon(extraWeaponTypes[int - 1]);
                }
            }
            else if (event.key.toLowerCase() === 's') {
                this.level.showActiveTargets();
            }
            else if (event.shiftKey && event.key === 'A') {
                this.addAllWeapons();
            }
        }
    }
    addFullWeaponLoadout() {
        this.addAllWeapons();
        this.addAllWeapons();
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
    }
    addAllWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(chargeInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        this.level.addNewWeapon(droneInfo, false);
        this.level.addNewWeapon(flareInfo, false);
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.level.addNewWeapon(nukeInfo, false);
        }
    }
    positionElem(elem, pos) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }
    updateCursorPosition(event) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance && this.weapon.activeInstance.blastRadElement) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
        if (event) {
            const target = event.target;
            if (!target.classList.contains('noStrikeZone')) {
                if (game.strikesRestricted == true) {
                    console.log("hit residual strike zone");
                    game.strikesRestricted = false;
                }
            }
        }
    }
    updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }
    changeWeapon(wep) {
        let wepArr = allWeaponTypes.includes(wep) ? allWeaponTypes : extraWeaponTypes;
        if (!wepArr.includes(wep))
            return;
        this.weapon = wep;
        this.hud.selectBox(wep.name);
        this.switchCursor();
        this.updateCursorPosition();
        wepArr.forEach((x) => {
            if (x !== wep) {
                x.switchFrom();
            }
        });
        this.weapon.switchTo();
    }
    switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }
    targetCreation(newTarget) {
        this.level.produceSingleTarget(newTarget);
    }
    startAmbience() {
        RandomSoundGen.playRandomSound(this.ambience);
        this.soundTimer = setInterval(() => {
            RandomSoundGen.playRandomSound(this.ambience);
        }, 35000);
    }
    updateProgressBar() {
        if (parseInt(this.progressBar.style.width) != this.progressNumber) {
            this.progressBar.style.width = this.progressNumber + '%';
        }
    }
    updateHudMultiKill() {
        this.sequentialHits += 1;
        setTimeout(() => {
            if (this.sequentialHits >= 2) {
                this.hud.updateMultiKillBox(this.sequentialHits);
            }
            this.sequentialHits = 0;
        }, 400);
    }
    updateHudScore() {
        let targets = allTargets;
        let stats = this.hud.killStats;
        stats.disabled = targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.destroyed = targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.escaped = this.level.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.total = targets.length || 0;
        this.hud.updateScore();
    }
    updateLights() {
        const darkBlueVal = 40;
        let defaultRGB = `rgb(0, 0, ${darkBlueVal})`;
        let overlay = document.querySelector('.darkOverlay');
        var lightsString = this.returnLightString(lights, "255, 255, 255");
        var flaresString = this.returnLightString(flares, "255, 255, 50");
        var gradientsString = [lightsString, flaresString]
            .filter(str => str)
            .join(', ');
        overlay.style.background = gradientsString ? gradientsString : defaultRGB;
        overlay.style.backgroundColor = defaultRGB;
    }
    returnLightString(arr, rbgString) {
        return arr
            .filter(light => light.opac > 0)
            .map(light => {
            let brightRange = light.size / 12;
            let featherRange = light.size / 12 + 30;
            return `radial-gradient(circle at ${light.pos.X}px ${light.pos.Y}px, rgba(${rbgString}, ${light.opac}) ${brightRange}%, rgba(0, 0, 0, 0) ${featherRange}%)`;
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
                light.opac -= 0.15;
            }
            else if (light.opac == 0) {
                let index = arr.indexOf(light);
                arr.splice(index, 1);
            }
        });
    }
    checkEnd() {
        let stats = this.hud.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.pause();
            this.gameInProgress = false;
            PopupHandler.addToArray("", "Game Over!", msgLength.long);
            alarm3.play();
        }
    }
    toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.pause();
            }
            else {
                this.start_unpause();
                this.level.continueWave();
            }
        }
        else if (this.gameWasPlayed) {
            this.pause();
        }
    }
    stopAmbience() {
        clearInterval(this.soundTimer);
        for (let a of this.ambience) {
            a.stop();
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
        this.level.pauseWave();
        this.level = null;
        ContentElHandler.clearContent();
        allWeaponTypes = [];
        extraWeaponTypes = [];
        this.redrawHudWithWepSelectionChecked();
        this.hud.resetStats();
    }
    newGame(mode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        this.hud.drawHUD();
        if (mode == GameMode.regular) {
            this.addAllLevels();
            this.hud.buildLevelBar();
            this.newLevel(allLevelsArray[0], mode);
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(level_continuous, mode);
            this.addFullWeaponLoadout();
        }
        this.hud.drawMultiKill();
        this.hud.killStats.failLimit = this.difficulty.failLimit;
        this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);
        this.start_unpause();
    }
    start_unpause() {
        if (this.gameInProgress == false) {
            this.gameInProgress = true;
            this.gameWasPlayed = true;
            this.redrawHudWithWepSelectionChecked();
        }
        this.startAmbience();
        this.toggleModal();
        this.gameTimer = window.setInterval(() => {
            this.checkEnd();
            this.updateHudScore();
            this.updateProgressBar();
            this.fadeAllLights();
            this.level.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
