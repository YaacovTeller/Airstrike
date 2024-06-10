enum Languages {
    'eng',
    'heb'
}
enum GameMode {
    'regular',
    'sandbox'
}

var allLevelClassesArray: Array<any> = [level_1, level_2, level_3, level_4, level_5]
var allWeaponTypes: Array<WeaponType> = []
var allTargets: Array<Target> = []

class GameHandler {
    public hud = new HudHandler();
    public weapon: WeaponType;
    private contentEl: HTMLElement;
    private progressBar: HTMLElement;
    private progressNumber: number;
    public shotCount: number = 0;
    private language: Languages = Languages.eng;
    public difficulty: difficultyLevelInfo;
    public masterTargets: Array<Target> = []


    private level: level;
    private gameTimer: number;
    private soundTimer: number;
    private gameInProgress: boolean = false;
    private gameWasPlayed: boolean = false;

    constructor(element: HTMLElement) {
        this.contentEl = element;
        this.progressBar = document.getElementById('progress');

        this.progressNumber = 30;
        this.updateProgressBar();

        this.menuSetup();
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        document.getElementById("devDiff").onclick = () => { this.setDifficulty(dev); this.newGame(GameMode.regular); }
        this.setEventListeners();
        document.getElementById("loader").style.display = 'none';
    }

    private newLevel(LevelClass) {
        let index = allLevelClassesArray.indexOf(LevelClass);
        let nextLevel = allLevelClassesArray[index + 1] ? allLevelClassesArray[index + 1] : allLevelClassesArray[index]
        this.level = new LevelClass(() => this.newLevel(nextLevel));
        this.level.nextWave();
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
        elem.style.display = elem.style.display === "block" ? "none" : "block";
    }
  
    public redrawHudWithWepSelectionChecked() {
        this.hud.drawHUD(this.weapon ? this.weapon.name : "");
    }

    private fireFunc() {
       // this.weapon.fireFunc(this.level.targets);
        this.weapon.fireFunc(allTargets); // MESSY??
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
        else if (event.shiftKey && event.key === 'N') { this.level.addNewWeapon(ExplosiveWeaponType, nukeInfo); }
        else if (event.shiftKey && event.key === 'A') {
            this.addAllWeapons();
        }
    }
    private addAllWeapons() {
        this.level.addNewWeapon(BulletWeaponType, sniperInfo);
        this.level.addNewWeapon(ChargeWeaponType, chargeInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, mortarInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, howitzerInfo);
        this.level.addNewWeapon(ExplosiveWeaponType, airstrikeInfo);
        this.level.addNewWeapon(DroneWeaponType, droneInfo);
        if (!allWeaponTypes[weaponNames.nuke-1]) {
            this.level.addNewWeapon(ExplosiveWeaponType, nukeInfo);
        }
    }
    private positionElem(elem: HTMLElement, pos: position) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }

    public updateCursorPosition(event?: MouseEvent) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance && this.weapon.activeInstance.blastRadElement) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
    }
    public updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }
    public changeWeapon(wep: WeaponType) {
        if (!allWeaponTypes.includes(wep))
            return;
        this.weapon = wep;
        this.weapon.select.play();
        this.hud.selectBox(wep.name);
        this.weapon.setActiveInstance();
        let inst = this.weapon.activeInstance;
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.name) {
            let w = this.weapon as ExplosiveWeaponType;
            w.switchBlastIndicatorStyle(false, inst as weaponInstance);
        }
        const root: HTMLElement = document.querySelector(':root');
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

    private switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }

    public targetCreation(newTarget: Target) {
        this.level.produceSingleTarget(newTarget);
    }

    public returnLevelLimit() {
        return this.level.currentLimit
    }

    private startAmbience() {
        RandomSoundGen.playRandomSound(ambience);
        this.soundTimer = setInterval(() => {
            RandomSoundGen.playRandomSound(ambience);
        }, 35000);
    }
    private updateProgressBar() {
        if (parseInt(this.progressBar.style.width) != this.progressNumber) {
            this.progressBar.style.width = this.progressNumber + '%';
        }
    }
   
    private updateHudScore() {
        let targets = allTargets;
        let stats = this.hud.killStats;
        stats.disabled = targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.destroyed = targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.escaped = this.level.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            } else
                return acc;
        }, 0);
        stats.total = targets.length || 0;

        this.hud.updateScore();
    }
    public checkEnd() {
        let stats = this.hud.killStats;
        if (stats.escaped >= stats.failLimit) {
            this.pause();
            this.gameInProgress = false;
            PopupHandler.addToArray("", "Game Over!", msgLength.long);
        }
    }

    public toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {

                this.pause();
            }
            else {
                this.start_unpause();
            }
        }
    }
    private wave_gradual() {

    }
    private wave_sudden() {

    }
    public pause() {
        this.toggleModal();
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;

        this.level.pauseWave();

        clearInterval(this.soundTimer);
        for (let a of ambience) {
            a.stop();
        }
    }
    public reset() {
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
    public newGame(mode: GameMode) {
        if (this.gameWasPlayed) {
            this.reset();
        }
        PopupHandler.addToArray(game.difficulty.eng.name);
        if (mode == GameMode.regular) {
            this.newLevel(allLevelClassesArray[0])
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(allLevelClassesArray[4])
            this.addAllWeapons();
            this.addAllWeapons();
            this.addAllWeapons();
        }
        this.hud.drawHUD();
        this.hud.killStats.failLimit = this.difficulty.failLimit; /// put with level
        this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);

        this.start_unpause();
    }

    public start_unpause() {
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
