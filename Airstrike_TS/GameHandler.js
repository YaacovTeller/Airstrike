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
var allLevelClassesArray = [level_1, level_2, level_3, level_4, level_5, level_6];
var allWeaponTypes = [];
var allTargets = [];
class GameHandler {
    hud = new HudHandler();
    weapon;
    contentEl;
    progressBar;
    progressNumber;
    shotCount = 0;
    language = Languages.eng;
    difficulty;
    gameMode;
    masterTargets = [];
    sequentialHits = 0;
    level; // messy, fix
    gameTimer;
    soundTimer;
    gameInProgress = false;
    gameWasPlayed = false;
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
        //  document.getElementById("devDiff").onclick = () => { this.setDifficulty(dev); this.newGame(GameMode.regular); }
        this.setEventListeners();
        document.getElementById("loader").style.display = 'none';
    }
    newLevel(LevelClass, mode) {
        if (mode == GameMode.sandbox) {
        }
        let index = allLevelClassesArray.indexOf(LevelClass);
        let nextLevel = allLevelClassesArray[index + 1] ? allLevelClassesArray[index + 1] : allLevelClassesArray[index];
        this.level = new LevelClass(() => this.newLevel(nextLevel, mode));
        this.level.nextWave();
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
        elem.style.display = elem.style.display === "block" ? "none" : "block";
    }
    redrawHudWithWepSelectionChecked() {
        this.hud.drawHUD(this.weapon ? this.weapon.name : "");
    }
    fireFunc() {
        // this.weapon.fireFunc(this.level.targets);
        this.weapon.fireFunc(allTargets); // MESSY??
    }
    handleKeyPress(event) {
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        if (game.gameInProgress) {
            if (event.code === 'Space' || event.key === 'z' || event.key === 'Control') {
                this.fireFunc();
            }
            let int = parseInt(event.key);
            if (int && allWeaponTypes[int - 1]) {
                this.changeWeapon(allWeaponTypes[int - 1]);
            }
            //else if (event.shiftKey && event.key === 'N') { this.level.addNewWeapon(nukeInfo); }
            else if (event.key === 's') {
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
    }
    updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }
    changeWeapon(wep) {
        if (!allWeaponTypes.includes(wep))
            return;
        this.weapon = wep;
        this.hud.selectBox(wep.name);
        this.switchCursor();
        this.updateCursorPosition();
        allWeaponTypes.forEach((x) => {
            if (x !== wep) {
                x.switchFrom();
            }
        });
        this.weapon.switchTo(); // Main weapon switch func
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
        RandomSoundGen.playRandomSound(ambience);
        this.soundTimer = setInterval(() => {
            RandomSoundGen.playRandomSound(ambience);
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
                this.level.continueWave(); // UNPAUSE
            }
        }
    }
    pause() {
        this.toggleModal();
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        this.level.pauseWave();
        clearInterval(this.soundTimer);
        for (let a of ambience) {
            a.stop();
        }
    }
    reset() {
        console.log("RAN RESET");
        this.level.resetTargets();
        this.level.pauseWave();
        this.level = null;
        allWeaponTypes = [];
        this.redrawHudWithWepSelectionChecked();
        this.hud.resetStats();
        //if (this.weapon) {
        //    this.hud.selectBox(this.weapon.name);
        //}
    }
    newGame(mode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        if (mode == GameMode.regular) {
            this.newLevel(allLevelClassesArray[0], mode);
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(level_continuous, mode);
            this.addFullWeaponLoadout();
        }
        this.hud.drawHUD();
        this.hud.drawMultiKill();
        this.hud.killStats.failLimit = this.difficulty.failLimit; /// put with level
        this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);
        this.start_unpause();
    }
    start_unpause() {
        if (this.gameInProgress == false) { // NEW GAME
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
            this.level.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
//# sourceMappingURL=gameHandler.js.map