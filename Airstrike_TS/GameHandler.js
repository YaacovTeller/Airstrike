const winLimit = 10;
var Languages;
(function (Languages) {
    Languages[Languages["eng"] = 0] = "eng";
    Languages[Languages["heb"] = 1] = "heb";
})(Languages || (Languages = {}));
class GameHandler {
    hud = new HudHandler(); //MESSY?
    weapon;
    contentEl;
    targets = [];
    progressBar;
    progressNumber;
    newTargetFrequency;
    shotCount = 0;
    winLimit;
    language = Languages.eng;
    targetTimer;
    gameTimer;
    soundTimer;
    gameInProgress;
    constructor(element) {
        this.contentEl = element;
        this.progressBar = document.getElementById('progress');
        this.progressNumber = 30;
        this.updateProgressBar();
        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.setEventListeners();
    }
    setEventListeners() {
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    menuSetup() {
        let arr = this.getMenuLis();
        document.getElementById("startbutton").onclick = () => this.newGame();
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
        let heb = document.getElementsByClassName('heb');
        let eng = document.getElementsByClassName('eng');
        if (this.language == Languages.heb) {
            this.language = Languages.eng;
            for (let x of heb) {
                x.classList.add("displayNone");
            }
            for (let x of eng) {
                x.classList.remove("displayNone");
            }
        }
        else {
            this.language = Languages.heb;
            for (let x of eng) {
                x.classList.add("displayNone");
            }
            for (let x of heb) {
                x.classList.remove("displayNone");
            }
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
    setDifficulty(difficulty) {
        this.newTargetFrequency = difficulty.newTargetEvery;
        this.setIndivTargetSpeed(regTarget, difficulty.regTargetSpeed);
        this.setIndivTargetSpeed(modTarget, difficulty.modTargetSpeed);
        this.setIndivTargetSpeed(heavyTarget, difficulty.heavyTargetSpeed);
        this.setIndivTargetSpeed(regTunnelTarget, difficulty.tunnelTargetSpeed);
        this.hud.killStats.failLimit = difficulty.failLimit;
    }
    setIndivTargetSpeed(target, speed) {
        target.minSpeed = speed.min;
        target.maxSpeed = speed.max;
    }
    jsonParseRadioDifficulty(value) {
        const selected = JSON.parse(value);
        this.setDifficulty(selected);
    }
    toggleModal() {
        this.toggleElem("overlay");
        this.toggleElem("modal");
    }
    toggleElem(id) {
        var elem = document.getElementById(id);
        elem.style.display = elem.style.display === "block" ? "none" : "block";
    }
    fireFunc() {
        this.weapon.fireFunc(this.targets);
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
            this.addNuke();
        }
    }
    positionElem(elem, pos) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }
    updateCursorPosition(event) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance) {
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
        this.weapon.setActiveInstance();
        let inst = this.weapon.activeInstance;
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.name) {
            let w = this.weapon;
            w.switchBlastIndicatorStyle(false, inst);
        }
        const root = document.querySelector(':root');
        if (inst && this.weapon.constructor.name === ChargeWeaponType.name) {
            root.style.setProperty('--chargeSelected', 'visible');
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
    newTarget() {
        let newTarget;
        let rand = RandomNumberGen.randomNumBetween(1, 100);
        switch (true) {
            case (rand >= 92):
                newTarget = new TunnelTarget(regTunnelTarget);
                break;
            case (rand >= 85):
                newTarget = new VehicleTarget(heavyTarget);
                break;
            case (rand >= 75):
                newTarget = new VehicleTarget(modTarget);
                break;
            default:
                //    newTarget = new TunnelTarget(regTunnelTarget)
                newTarget = new VehicleTarget(regTarget);
                //     newTarget = new VehicleTarget(heavyTarget);
                break;
        }
        this.targetCreation(newTarget);
    }
    targetCreation(newTarget) {
        this.targets.push(newTarget);
        this.winLimitCheck();
    }
    winLimitCheck() {
        if (this.targets.length >= this.winLimit) {
            clearInterval(this.targetTimer);
            let int = setInterval(() => {
                if (this.checkGameEnd()) {
                    clearInterval(int);
                    this.endWave();
                }
            }, 100);
        }
    }
    showPopup(text) {
        let popup = document.getElementById("popupBox");
        document.getElementById("popupText").innerText = text;
        popup.classList.remove("hide");
        setTimeout(function () {
            popup.classList.add("hide");
        }, 3000);
    }
    endWave() {
        this.showPopup("Nice job!");
        this.nextWave();
    }
    nextWave() {
        setTimeout(() => {
            this.showPopup("Get ready, more coming!");
        }, 3500);
        setTimeout(() => {
            let halfCurrentProgress = this.winLimit / 2;
            this.winLimit += winLimit > halfCurrentProgress ? winLimit : halfCurrentProgress;
            this.winLimit = Math.ceil(this.winLimit / 10) * 10;
            this.startTargetTimer();
        }, 5000);
    }
    checkGameEnd() {
        let fin = true;
        for (let t of this.targets) {
            if (t.status === Status.active) {
                fin = false;
            }
        }
        return fin;
    }
    addNuke() {
        if (allWeaponTypes.includes(nuke))
            return;
        nuke = new ExplosiveWeaponType(nukeInfo);
        allWeaponTypes.push(nuke);
        this.hud.drawHUD();
    }
    updateHudScore() {
        let stats = this.hud.killStats;
        stats.disabled = this.targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.destroyed = this.targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.escaped = this.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        stats.total = this.targets.length || 0;
        if (stats.escaped >= stats.failLimit) {
            this.stop();
            this.showPopup("Oh No! Try again.");
        }
        this.hud.updateScore();
    }
    toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.stop();
            }
            else {
                this.start();
            }
        }
    }
    stop() {
        this.toggleModal();
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        clearInterval(this.targetTimer);
        clearInterval(this.soundTimer);
        for (let a of ambience) {
            a.stop();
        }
    }
    reset() {
        for (let x of this.targets) {
            x.getTargetEl().remove();
        }
        this.winLimit = winLimit;
        this.targets = [];
        this.hud.drawHUD();
        this.hud.resetStats();
    }
    newGame() {
        this.reset();
        this.start();
    }
    startTargetTimer() {
        this.targetTimer = window.setInterval(() => {
            this.newTarget();
        }, this.newTargetFrequency);
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
    start() {
        this.gameInProgress = true;
        this.changeWeapon(mortar);
        this.startAmbience();
        this.toggleModal();
        this.startTargetTimer();
        //this.newTarget();
        this.gameTimer = window.setInterval(() => {
            this.updateHudScore();
            this.updateProgressBar();
            this.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
//# sourceMappingURL=gameHandler.js.map