enum Languages {
    'eng',
    'heb'
}
enum GameMode {
    'regular',
    'sandbox'
}

var allWeaponTypes: Array<WeaponType> = []
var allTargets: Array<Target> = [];
var allObjects: Array<HTMLElement> = [];
var allLevelsArray: Array<Level> = []//[level_1, level_2, level_3, level_4, level_5, level_6, level_7, level_8]
const level_continuous: Level = new Level(continuousInfo);

class GameHandler {
    public hud = new HudHandler();
    public weapon: WeaponType;
    private contentEl: HTMLElement;
    private progressBar: HTMLElement;
    private progressNumber: number;
    public shotCount: number = 0;
    private language: Languages = Languages.eng;
    public difficulty: difficultyLevelInfo;
    public gameMode: GameMode;
   // public masterTargets: Array<Target> = [];
    //public masterObjects: Array<HTMLElement> = [];

    private sequentialHits: number = 0;
    public level: Level;   // messy, fix
    public gameTimer: number;
    private soundTimer: number;
    private gameInProgress: boolean = false;
    private gameWasPlayed: boolean = false;
    public strikesRestricted: boolean = false;

    constructor(element: HTMLElement) {
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

    private addAllLevels() {
        allLevelsArray = [];
        for (let i of allLevelInfo) {
            let lev = new Level(i)
            allLevelsArray.push(lev);
        }
    }

    public newLevel(level: Level, mode: GameMode) {
        if (level) {
            let nextLevel = level;
            if (mode == GameMode.sandbox) {
                nextLevel = level_continuous;   /// AWWKWARD? 
            }
            this.level = nextLevel;
            this.level.setAsLevel(); // NEEDED?

            this.level.nextWave();
        }
        else {
            this.endGame();
        }
    }
    private endGame() {
        PopupHandler.addToArray("", "GAME COMPLETE", msgLength.long);
        PopupHandler.addToArray("That's the last of them, good work!", "You did it!", msgLength.long);
        PopupHandler.addToArray(`Finished on ${this.difficulty.eng.name} difficulty with ${this.hud.killStats.destroyed} kills!`, "", msgLength.long);
        cheer.play();
        this.gameInProgress = false // HACKY??
        this.cutGameFuncs();
        setTimeout(() => {
            this.toggleModal();
        }, 10000)
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
        document.getElementById("userInput").onclick = () => userHandler.setUserInfo();

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
        elem.classList.contains("displayNone") ? elem.classList.remove("displayNone") : elem.classList.add("displayNone");
       // elem.style.display = elem.style.display === "block" ? "none" : "block";
    }
  
    public redrawHudWithWepSelectionChecked() {
        this.hud.drawWeaponDisplay(this.weapon ? this.weapon.name : "");
     //   this.hud.drawHUD(this.weapon ? this.weapon.name : "");
    }

    private fireFunc() {
        if (!game.gameInProgress) {
            return;
        }
        if (this.strikesRestricted && this.weapon.name > weaponNames.tank) {
            bleep_neg.play();
            return
        }
        this.weapon.fireFunc(allTargets); // MESSY??
    }

    private handleKeyPress(event) {
        if (event.key === 'Escape') {
            this.toggleGamePause();
        }
        if (game.gameInProgress) {

            if (event.code === 'Space' || event.key === 'z' || event.key === 'Control') { this.fireFunc(); }

            let int = parseInt(event.key);
            if (int && allWeaponTypes[int - 1]) {
                this.changeWeapon(allWeaponTypes[int - 1]);
            }
            //else if (event.shiftKey && event.key === 'N') { this.level.addNewWeapon(nukeInfo); }
            else if (event.key === 's') { this.level.showActiveTargets(); }
            else if (event.shiftKey && event.key === 'A') {
                this.addAllWeapons();
            }
        }
    }

    private addFullWeaponLoadout() {
        this.addAllWeapons();
        this.addAllWeapons();
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
    }

    private addAllWeapons() {
        this.level.addNewWeapon(sniperInfo, false);
        this.level.addNewWeapon(chargeInfo, false);
        this.level.addNewWeapon(mortarInfo, false);
        this.level.addNewWeapon(howitzerInfo, false);
        this.level.addNewWeapon(airstrikeInfo, false);
        this.level.addNewWeapon(droneInfo, false);
        if (!allWeaponTypes[weaponNames.nuke-1]) {
            this.level.addNewWeapon(nukeInfo, false);
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
        if (event) {

            const target = event.target as HTMLElement;     // FAILSAFE FOR REMOVING NO STRIKE ZONES
            if (!target.classList.contains('noStrikeZone')) {
                if (game.strikesRestricted == true) {
                    console.log("hit residual strike zone")
                    game.strikesRestricted = false;
                }
            }
        }
    }
    public updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }
    public changeWeapon(wep: WeaponType) {
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

    private switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }

    public targetCreation(newTarget: Target) {
        this.level.produceSingleTarget(newTarget);
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
    public updateHudMultiKill() {
        this.sequentialHits += 1;
        setTimeout(() => {
            if (this.sequentialHits >= 2) {
                this.hud.updateMultiKillBox(this.sequentialHits);
            }
            this.sequentialHits = 0;
        }, 400)
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
            alarm3.play();
        }
    }

    public toggleGamePause() {
        if (this.gameInProgress) {
            if (this.gameTimer) {
                this.pause();
            }
            else {
                this.start_unpause();
                this.level.continueWave(); // UNPAUSE
            }
        }
        else if (this.gameWasPlayed) {  // FOR WHAT SITU??
            this.pause();
        }
    }
    private stopAmbience() {
        clearInterval(this.soundTimer);
        for (let a of ambience) {
            a.stop();
        }
    }
    public cutGameFuncs() {
        clearInterval(this.gameTimer);
        this.gameTimer = undefined;
        this.level.pauseWave();
        this.stopAmbience();
    }

    public pause() {
        this.cutGameFuncs();
        this.toggleModal();
    }
    public reset() {
        this.level.resetTargets();
        this.level.pauseWave();
        this.level = null;
        ContentElHandler.clearContent();

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
        this.gameMode = mode;
        PopupHandler.addToArray(game.difficulty.eng.name);
        this.hud.drawHUD();
        if (mode == GameMode.regular) {
            this.addAllLevels();
            this.hud.buildLevelBar();
            this.newLevel(allLevelsArray[0], mode)
        }
        else if (mode = GameMode.sandbox) {
            this.newLevel(level_continuous, mode)
            this.addFullWeaponLoadout();
        }
        this.hud.drawMultiKill();
        this.hud.killStats.failLimit = this.difficulty.failLimit; /// put with level
        this.changeWeapon(allWeaponTypes[weaponNames.mortar - 1]);

        this.start_unpause();
    }

    public start_unpause() {
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
