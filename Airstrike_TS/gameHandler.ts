class GameHandler {
    public hud = new HudHandler(); //MESSY?
    public weapon: WeaponType;
    private contentEl: HTMLElement;
    public targets: Array<Target> = [];
    private newTargetFrequency: number;
    public shotCount: number = 0;
    public winLimit: number = 50;

    private targetTimer: number;
    private gameTimer: number;
    private soundTimer: number;

    constructor(element: HTMLElement) {
        this.contentEl = element;

        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.setEventListeners();
    }
    private setEventListeners() {
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
    }
    public menuSetup() {
        let container = document.getElementById("difficultiesContainer");
        let lis = container.getElementsByTagName('li');

        this.setIndivMenuDifficulty(normal, lis[0]);
        this.setIndivMenuDifficulty(hard, lis[1]);
        this.setIndivMenuDifficulty(chaos, lis[2]);
        document.getElementById("startbutton").addEventListener("click", () => this.newGame());
        const radioButtons = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
    }
    private setIndivMenuDifficulty(dif: difficultyLevelInfo, li: Element) {
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
    public handleOptionChange(event: Event) {
        this.jsonParseRadioDifficulty((event.target as HTMLInputElement).value);
    }
    public setDifficulty(difficulty: difficultyLevelInfo) {
        this.newTargetFrequency = difficulty.newTargetEvery;
        this.setIndivTargetSpeed(regTarget, difficulty.regTargetSpeed);
        this.setIndivTargetSpeed(modTarget, difficulty.modTargetSpeed);
        this.setIndivTargetSpeed(heavyTarget, difficulty.heavyTargetSpeed);
        this.setIndivTargetSpeed(regTunnelTarget, difficulty.tunnelTargetSpeed);
        this.hud.killStats.failLimit = difficulty.failLimit;
    }
    private setIndivTargetSpeed(target: targetInfo, speed: speedRange) {
        target.minSpeed = speed.min;
        target.maxSpeed = speed.max;
    }
    private jsonParseRadioDifficulty(value) {
        const selected = JSON.parse(value) as difficultyLevelInfo;
        this.setDifficulty(selected);
    }
    private toggleModal() {
        this.toggleElem("overlay");
        this.toggleElem("modal");
    }
    private toggleElem(id: string) {
        var elem = document.getElementById(id);
        elem.style.display = elem.style.display === "block" ? "none" : "block";
    }
    public updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }

    private fireFunc() {
        this.weapon.fireFunc(this.targets);
    }

    private handleKeyPress(event) {
        if (event.code === 'Space' || event.key === 'z' || event.key === 'Control') { this.fireFunc(); }
        else if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        let int = parseInt(event.key);
        if (int && allWeaponTypes[int - 1]) {
            this.changeWeapon(allWeaponTypes[int - 1]);
        }
        else if (event.shiftKey && event.key === 'N') { this.addNuke(); }
    }
    public updateCursorPosition(event?: MouseEvent) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance) {

            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
    }

    private positionElem(elem: HTMLElement, pos: position) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }

    public changeWeapon(wep: WeaponType) {
        if (!allWeaponTypes.includes(wep))
            return;
        this.weapon = wep;
        this.hud.selectBox(wep.name);
        this.weapon.setActiveInstance();
        let inst = this.weapon.activeInstance;
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.constructor.name) {
            let w = this.weapon as ExplosiveWeaponType;
            w.switchBlastIndicatorStyle(false, inst as ExplosiveWeaponInstance);
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

    private switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }

    private newTarget() {
        let newTarget: Target;
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
            }, 100)
        }
    }
    public showPopup(text) {
        let popup = document.getElementById("popupBox");
        document.getElementById("popupText").innerText = text;
        // popup.classList.add("show");
        popup.classList.remove("hide");
        setTimeout(function () {
        //    popup.classList.remove("show");
            popup.classList.add("hide");
        }, 3000); 
    }
    private endGame() {
        this.showPopup("Nice job!")
        this.nextWave();
    }
    private nextWave() {
        setTimeout(() => {
            this.showPopup("Get ready, more coming!")
        }, 3000)
        setTimeout(() => {
            this.winLimit += this.winLimit;
            this.startTargetTimer();
        },3000)
    }
    private checkGameEnd() {
        let fin: boolean = true;
        for (let t of this.targets) {
            if (t.status === Status.active) {
                fin = false;
            }
        }
        return fin;
    }

    private addNuke() {
        if (allWeaponTypes.includes(nuke))
            return;
        nuke = new ExplosiveWeaponType(nukeInfo);
        allWeaponTypes.push(nuke);
        this.hud.drawHUD();
    }
    private updateHudScore() {
        let stats = this.hud.killStats;
        stats.disabled = this.targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.destroyed = this.targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.escaped = this.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.total = this.targets.length || 0;
        if (stats.escaped >= stats.failLimit) {
            this.stop();
            this.showPopup("Oh No! Try again.")
        }
        this.hud.updateScore();
    }
    public toggleGamePause() {
        if (this.gameTimer) {
            this.stop();
        }
        else {
            if (this.targets.length) {
                this.start();
            }
        }
    }
    public stop() {
        this.toggleModal();
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        clearInterval(this.targetTimer);
        clearInterval(this.soundTimer);
    }
    public reset() {
        for (let x of this.targets) {
            x.getTargetEl().remove();
        }
        this.targets = [];
        this.hud.drawHUD();
        this.hud.resetStats();
    }
    public newGame() {
        this.reset();
        this.start();
    }
    private startTargetTimer() {
        this.targetTimer = window.setInterval(() => {
            this.newTarget();
        }, this.newTargetFrequency);
    }

    public start() {
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
