class GameHandler {
    public targets: Array<Target> = [];
    private contentEl: HTMLElement;
    private newTargetFrequency: number;
    public hud = new HudHandler(); //MESSY?
    public shotCount: number = 0;

    private targetTimer: number;
    private gameTimer: number;
    private weapon: WeaponType;

    constructor(element: HTMLElement) {
        this.contentEl = element;

        document.getElementById("startbutton").addEventListener("click", (event) => this.start());
        document.getElementById("option1").setAttribute("value", JSON.stringify(normal));
        document.getElementById("option2").setAttribute("value", JSON.stringify(hard));
        document.getElementById("option3").setAttribute("value", JSON.stringify(chaos));
        const radioButtons = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', (event) => this.handleOptionChange(event));
            if (radioButton.checked) {
                this.jsonParseRadioDifficulty(radioButton.value);
            }
        });
        this.contentEl.addEventListener("click", () => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);

        //if (this.weapon.constructor.name === ExplosiveWeaponType.constructor.name) {
        //    let w = this.weapon as ExplosiveWeaponType
        //    w.switchBlastIndicatorStyle(false, null);
        //}
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
        var overlay = document.getElementById("overlay");
        var modal = document.getElementById("modal");

        overlay.style.display = overlay.style.display === "block" ? "none" : "block";
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }
    public updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }

    private fireFunc() {
        this.weapon.fireFunc(this.targets);
    }

    private handleKeyPress(event) {
        console.log(event.key);
        if (event.code === 'Space' || event.key === 'z' || event.key === 'Control') { this.fireFunc(); }
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
                    if (x.activeInstance.ready != false) {
                        x.instances.forEach((inst) => { inst.blastRadElement.style.visibility = "hidden"; });

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
        let rand = RandomNumberGen.randomNumBetween(1, 21);

        switch (true) {
            case (rand >= 18):
                newTarget = new TunnelTarget(regTunnelTarget);
                break;
            //case (rand >= 16):
            //    newTarget = new VehicleTarget(heavyTarget);
            //    break;
            //case (rand >= 12):
            //    newTarget = new VehicleTarget(modTarget);
            //    break;
            default:
                newTarget = new VehicleTarget(regTarget);
                break;
        }
        this.targets.push(newTarget);
    }

    private addNuke() {
        if (allWeaponTypes.includes(nuke))
            return;

        nuke = new ExplosiveWeaponType(nukeInfo);
        allWeaponTypes.push(nuke);
        this.hud.drawHUD();
    }
    private updateHudScore() {
        this.hud.killStats.disabled = this.targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        this.hud.killStats.destroyed = this.targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        this.hud.killStats.escaped = this.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        this.hud.killStats.total = this.targets.length || 0;
        this.hud.updateScore();
    }

    public start() {
        this.toggleModal();
        RandomSoundGen.playRandomSound(ambience);
        setInterval(() => {
            RandomSoundGen.playRandomSound(ambience);
        }, 35000);
        this.newTarget();
        this.targetTimer = window.setInterval(() => {
            this.newTarget();

        }, this.newTargetFrequency);
        this.gameTimer = window.setInterval(() => {
            this.updateHudScore();
            this.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
