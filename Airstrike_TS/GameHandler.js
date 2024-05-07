class GameHandler {
    hud = new HudHandler(); //MESSY?
    weapon;
    contentEl;
    targets = [];
    newTargetFrequency;
    shotCount = 0;
    winLimit = 40;
    targetTimer;
    gameTimer;
    soundTimer;
    constructor(element) {
        this.contentEl = element;
        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.setEventListeners();
    }
    setEventListeners() {
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    menuSetup() {
        let container = document.getElementById("difficultiesContainer");
        let lis = container.getElementsByTagName('li');
        this.setIndivMenuDifficulty(normal, lis[0]);
        this.setIndivMenuDifficulty(hard, lis[1]);
        this.setIndivMenuDifficulty(chaos, lis[2]);
        document.getElementById("startbutton").addEventListener("click", () => this.newGame());
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
    }
    setIndivMenuDifficulty(dif, li) {
        let opt = li.getElementsByTagName('input')[0];
        opt.setAttribute("value", JSON.stringify(dif));
        let label = li.getElementsByTagName('label')[0];
        let span = document.createElement('span');
        span.innerText = dif.name;
        label.appendChild(span);
        span = document.createElement('span');
        span.innerText = dif.description;
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
    updateShotCounter() {
        this.hud.updateScore(this.shotCount);
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
    updateCursorPosition(event) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
    }
    positionElem(elem, pos) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }
    changeWeapon(wep) {
        if (!allWeaponTypes.includes(wep))
            return;
        this.weapon = wep;
        this.hud.selectBox(wep.name);
        this.weapon.setActiveInstance();
        let inst = this.weapon.activeInstance;
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.constructor.name) {
            let w = this.weapon;
            w.switchBlastIndicatorStyle(false, inst);
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
                //   newTarget = new TunnelTarget(regTunnelTarget)
                newTarget = new VehicleTarget(regTarget);
                break;
        }
        this.targets.push(newTarget);
        if (this.targets.length >= this.winLimit) {
            clearInterval(this.targetTimer);
            let int = setInterval(() => {
                if (this.checkGameEnd()) {
                    clearInterval(int);
                    this.endGame();
                }
            }, 100);
        }
    }
    showPopup(text) {
        let popup = document.getElementById("popupBox");
        document.getElementById("popupText").innerText = text;
        popup.classList.add("show");
        setTimeout(function () {
            popup.classList.remove("show");
        }, 3000);
    }
    endGame() {
        this.showPopup("Nice job!");
        this.nextWave();
    }
    nextWave() {
        setTimeout(() => {
            this.showPopup("Get ready, more coming!");
        }, 3000);
        setTimeout(() => {
            this.winLimit += this.winLimit;
            this.startTargetTimer();
        }, 3000);
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
        if (this.gameTimer) {
            this.stop();
        }
        else {
            if (this.targets.length) {
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
    }
    reset() {
        for (let x of this.targets) {
            x.getTargetEl().remove();
        }
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
    start() {
        this.changeWeapon(mortar);
        this.toggleModal();
        RandomSoundGen.playRandomSound(ambience);
        this.soundTimer = setInterval(() => {
            RandomSoundGen.playRandomSound(ambience);
        }, 35000);
        //this.newTarget();
        this.startTargetTimer();
        this.gameTimer = window.setInterval(() => {
            this.updateHudScore();
            this.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
//# sourceMappingURL=gameHandler.js.map