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
var allLevelClassesArray = [level_1, level_2, level_3, level_4, level_5];
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
    masterTargets = [];
    level;
    gameTimer;
    soundTimer;
    gameInProgress = false;
    gameWasPlayed = false;
    constructor(element) {
        this.contentEl = element;
        this.progressBar = document.getElementById('progress');
        this.progressNumber = 30;
        this.updateProgressBar();
        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        document.getElementById("devDiff").onclick = () => { this.setDifficulty(dev); this.newGame(GameMode.regular); };
        this.setEventListeners();
        document.getElementById("loader").style.display = 'none';
    }
    newLevel(LevelClass) {
        let index = allLevelClassesArray.indexOf(LevelClass);
        let nextLevel = allLevelClassesArray[index + 1] ? allLevelClassesArray[index + 1] : allLevelClassesArray[index];
        this.level = new LevelClass(() => this.newLevel(nextLevel));
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
        if (event.code === 'Space' || event.key === 'z' || event.key === 'Control') {
            this.fireFunc();
        }
        else if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        let int = parseInt(event.key);
        if (int && allWeaponTypes[int - 1]) {
            this.changeWeapon(allWeaponTypes[int - 1]);
        }
        else if (event.shiftKey && event.key === 'N') {
            this.level.addNewWeapon(ExplosiveWeaponType, nukeInfo);
        }
        else if (event.shiftKey && event.key === 'A') {
            this.addAllWeapons();
        }
    }
    addAllWeapons() {
        this.level.addNewWeapon(BulletWeaponType, sniperInfo);
        this.level.addNewWeapon(ChargeWeaponType, chargeInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, mortarInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
        this.level.addNewWeapon(DroneWeaponType, droneInfo);
        if (!allWeaponTypes[weaponNames.nuke - 1]) {
            this.level.addNewWeapon(ExplosiveWeaponType, nukeInfo);
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
        this.weapon.select.play();
        this.hud.selectBox(wep.name);
        this.weapon.setActiveInstance();
        let inst = this.weapon.activeInstance;
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.name) {
            let w = this.weapon;
            w.switchBlastIndicatorStyle(false, inst);
        }
        const root = document.querySelector(':root');
        if (inst && this.weapon.constructor.name === ChargeWeaponType.name) {
            root.style.setProperty('--chargeSelected', 'visible'); // :D change root css to get 'lockon' svg!
        }
        else {
            root.style.setProperty('--chargeSelected', 'hidden');
        }
        this.switchCursor();
        this.updateCursorPosition();
        allWeaponTypes.forEach((x) => {
            if (x !== wep) {
                if (x.instances.length && x.activeInstance) {
                    if (x.activeInstance.ready == true) {
                        x.activeInstance.blastRadElement.style.visibility = "hidden";
                    }
                }
            }
        });
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
    returnLevelLimit() {
        return this.level.currentLimit;
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
        }
    }
    toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.pause();
            }
            else {
                this.start_unpause();
            }
        }
    }
    wave_gradual() {
    }
    wave_sudden() {
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
        PopupHandler.addToArray(game.difficulty.eng.name);
        if (mode == GameMode.regular) {
            this.newLevel(allLevelClassesArray[0]);
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(allLevelClassesArray[4]);
            this.addAllWeapons();
            this.addAllWeapons();
            this.addAllWeapons();
        }
        this.hud.drawHUD();
        this.hud.killStats.failLimit = this.difficulty.failLimit; /// put with level
        this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);
        this.start_unpause();
    }
    start_unpause() {
        if (this.gameInProgress == false) {
            this.gameInProgress = true;
            this.gameWasPlayed = true;
            this.redrawHudWithWepSelectionChecked();
        }
        else {
            this.level.continueWave();
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