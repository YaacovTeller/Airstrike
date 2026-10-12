type killStats = {
    total: number;
    disabled: number;
    destroyed: number;
    escaped: number;
    shots: number;
    failLimit: number;
}
enum killStatDisplayOptions {
    total = 'Total',
    disabled = 'Disabled',
    destroyed = 'Destroyed',
    escaped = 'Escaped',
    targets = 'Targets', // stage progress, shown instead of escaped by modes with stages
    shots = 'Shots',
}

class HudHandler {
    private hudElem: HTMLElement
    private scoreBox: HTMLElement
    private leftSideContainer: HTMLElement
    private centerContainer: HTMLElement
    private rightSideContainer: HTMLElement
    public multiKillBox: HTMLElement

    constructor() {

    }

    public drawHUD() {
        let hud = document.getElementById('hud');
        if (hud) hud.remove();

        let el = document.createElement('div')
        el.classList.add("hud")
        el.id = 'hud';
        ContentElHandler.addToContentWrapper(el)
        this.hudElem = el;

        this.leftSideContainer = document.createElement('div');
        this.leftSideContainer.classList.add('leftContainer')
        this.hudElem.append(this.leftSideContainer);
        this.drawWeaponDisplay();

        this.centerContainer = document.createElement('div');
        this.centerContainer.classList.add('centerContainer');
        this.hudElem.append(this.centerContainer);
        this.drawProgressBar();

        this.rightSideContainer = document.createElement('div');
        this.hudElem.append(this.rightSideContainer);
        this.drawScore();
    }

    private drawWeaponDisplay() {
        this.createWeaponContainers(conventionalWeapons, "firstWepContainer")
        this.createWeaponContainers(extraWeapons, "secondWepContainer")
    }
    private drawProgressBar() {
        let titleCont = document.createElement('div');
        let title = document.createElement('div');
        title.innerHTML = "UN DISAPPROVAL RATING:&nbsp"
        let span = document.createElement('span');
        span.id = "UNdescription";

        titleCont.appendChild(title);
        titleCont.appendChild(span);
        titleCont.classList.add("paddingBottom10");
        titleCont.style.display = "flex";

        let cont = document.createElement('div');
        cont.classList.add("container");
        cont.appendChild(titleCont);

        let progCont = document.createElement('div');
        progCont.classList.add("progress-container");
        let bar = document.createElement('div');
        bar.classList.add("progress-bar");
        bar.id = "progress";

   //     this.centerContainer.prepend(span);
        this.centerContainer.appendChild(cont);
        cont.appendChild(progCont);
        progCont.appendChild(bar);
    }

    private createWeaponContainers(wepArray, contId: string) {
        let container = document.createElement('div');
        this.leftSideContainer.appendChild(container);
        container.classList.add('wepBoxContainer');
        container.id = contId;
        this.drawBoxes(container, wepArray);
    }

    private drawBoxes(wepBoxContainerElem: HTMLElement, wepArray) {
        for (let x in wepArray) {
            let wep = wepArray[x]
            this.addWeapon(wep);
        }
    }
    private getCorrectWepboxContainer(wep: WeaponType) {
        let boxId: string = wep.name <= weaponNames.drone ? "firstWepContainer" : "secondWepContainer";
        return document.getElementById(boxId);
    }

    private orderWeaponBoxes() {
        const containers = Array.from(this.leftSideContainer.getElementsByClassName("wepBoxContainer"));
        for (let c of containers) {
            this.orderBox(c);
        }
    }
    private orderBox(container: Element) {
        const divs: Array<HTMLDivElement> = Array.from(container.children) as Array<HTMLDivElement>;
        divs.sort((a, b) => {
            const nameA = parseInt(a.dataset.name, 10);
            const nameB = parseInt(b.dataset.name, 10);
            return nameA - nameB;
        });
        divs.forEach(div => container.appendChild(div));
    }
    public addWeapon(wep: WeaponType) {
        let wepBox = document.createElement('div');
        let numBox = document.createElement('span');
        let num = wep.slot.toString();
        let name = weaponNames[wep.name];
        numBox.className = "wepNum";
        numBox.innerText = num;
        wepBox.appendChild(numBox);
        wepBox.classList.add("wepBox");
        wepBox.dataset.name = num;
        let wepName = name.charAt(0).toUpperCase() + String(name).slice(1);
        wepBox.title = wep.displayName || wepName
        wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
        wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation() }

        let wepBoxContainerElem = this.getCorrectWepboxContainer(wep);
        wepBoxContainerElem.appendChild(wepBox);
        this.drawInstances(wep, wepBox);

        if (wep.name == weaponNames.flare) {
            game.level.currentWave.timeOfDay === Time.day ? wepBox.classList.add("displayNone") : wepBox.classList.remove("displayNone");  // DOUBLED with setWave in Levels. For all weps start.
        }
        if (wep.name == weaponNames.tactical_Nuke || wep.name == weaponNames.chopper || wep.name == weaponNames.carpet_bomb) {
            wepBox.classList.add('specialWeapon')
        }

        this.orderWeaponBoxes();
    }
    public addInstanceByWeapon(wep: WeaponType) {
        let wepBoxes: Array<HTMLDivElement> = Array.from(this.leftSideContainer.querySelectorAll(".wepBox"));
        let wepBox = wepBoxes.find(wepBox => wepBox.dataset.name === wep.slot.toString());
        this.addInstance(wepBox);
    }
    private addInstance(wepBox: HTMLElement) {
        let instBox = document.createElement('div');
        instBox.classList.add("instBox");

        let timerOverlay = document.createElement('div');
        timerOverlay.classList.add("timer-overlay");
        instBox.appendChild(timerOverlay);

     //   this.startTimer(5000, instBox);

        wepBox.appendChild(instBox);

    }
    private drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            this.addInstance(wepBox);
        }
    }

    private startTimer(duration: number, container: HTMLElement): void {
        const overlay = container.querySelector('.timer-overlay') as HTMLElement | null;
        let startTime: number | null = null;

        function animateOverlay(timestamp: number): void {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            const progress = Math.min(elapsed / duration, 1);
            const heightPercentage = (1 - progress) * 100;

            overlay.style.height = `${heightPercentage}%`;

            if (progress < 1) {
                requestAnimationFrame(animateOverlay);
            }
        }
        requestAnimationFrame(animateOverlay);
    }

    public drawMultiKill() {
        this.multiKillBox = document.createElement('div');
        this.multiKillBox.classList.add('multiKillBox', 'hide');
        ContentElHandler.addToContentWrapper(this.multiKillBox)
    }
    // The number that comes up from where the shot landed when it's taken out more than one (or "Hit!"): big, bright and outlined,
    // bigger and hotter with the count, popping up and rising away as it fades
    private static popColours: Array<string> = ["#7de3ff", "#7de3ff", "#ffe14a", "#ff9d2e", "#ff5a2e", "#ff2e8a", "#c13dff", "#ffffff"];
    public popKillNumber(text: string, count: number, origin: position | null) {
        const pop = document.createElement("div");
        pop.className = "killPop";
        pop.innerText = text + (count > 6 ? "!" : "") + (count > 10 ? "!" : "");
        const colour = HudHandler.popColours[Math.min(count, HudHandler.popColours.length - 1)];
        pop.style.color = colour;
        pop.style.fontSize = Math.min(150, 46 + count * 16) + "px";
        pop.style.setProperty("--popGlow", colour);
        const x = Math.max(80, Math.min(window.innerWidth - 80, origin ? origin.X : window.innerWidth / 2));
        const y = Math.max(120, Math.min(window.innerHeight - 40, origin ? origin.Y : window.innerHeight / 2));
        pop.style.left = x + "px";
        pop.style.top = y + "px";
        ContentElHandler.addToContentWrapper(pop);
        setTimeout(() => pop.remove(), 1700);
    }
    public updateMultiKillBox(num: number) {
        let txt = ""
        if (num > 6) {
            txt = "!";
        }
        if (num > 10) {
            txt = "!!";
        }
        let textOption = multiKillText[num] ? multiKillText[num] : multiKillText[14];
        this.multiKillBox.innerText = "x" + num + txt;
        this.multiKillBox.style.fontSize = textOption.size + "px";
        this.multiKillBox.style.color = textOption.colour;
        this.multiKillBox.classList.remove('hide');
        let numberAnimTime = 500;
        this.multiKillBox.style.animation = `slamNumber ${numberAnimTime}ms ease-out`;
        setTimeout(() => {
            this.multiKillBox.classList.add('hide');
            this.multiKillBox.style.removeProperty('animation');
        }, numberAnimTime)
    }

    public buildLevelBar() {
        let levDivContainer = document.createElement('div');
        levDivContainer.className = 'levDivContainer';
        this.rightSideContainer.appendChild(levDivContainer)

        for (let lev of allLevelInfo) {
            let levDiv = document.createElement('div');
            levDiv.className = 'levDiv';
            levDivContainer.appendChild(levDiv);
            levDiv.innerText = lev.number + "";
            levDiv.id = "levDiv_" + lev.number;
            for (let wav of lev.waves) {
                let wavDiv = document.createElement('div');
                wavDiv.innerText = WaveType[wav.type].charAt(0).toLocaleUpperCase();
                wavDiv.id = "wavDiv_" + lev.waves.indexOf(wav);
                wavDiv.className = 'wavDiv';
                levDiv.appendChild(wavDiv);
            }
        }
    }
    // Modes with stages have no escapes to count, so they get the stage's target count in its place.
    private returnkillStatDisplayOptions() {
        const staged = game.hasStages();
        return Object.values(killStatDisplayOptions).filter(option =>
            option === killStatDisplayOptions.targets ? staged : !(staged && option === killStatDisplayOptions.escaped));
    }

    public drawScore() {
        this.scoreBox = document.createElement('div');
        this.scoreBox.classList.add('score');

        const optionsArray = this.returnkillStatDisplayOptions();
        for (let option of optionsArray) {
            this.drawScoreSpans(option, this.scoreBox);
        }
        let span = document.createElement('span');
        span.id = "scoreCounter"
        this.scoreBox.appendChild(span);
        if (game.hasStages()) { // the levels with stages are against the clock
            this.scoreBox.appendChild(document.createElement('br'));
            const timer = document.createElement('span');
            timer.id = "stageTimer";
            this.scoreBox.appendChild(timer);
        }

        this.rightSideContainer.appendChild(this.scoreBox);

        this.updateScore(game.killStats);
    }
    private drawScoreSpans(title, scoreBox: HTMLElement) {
        let span = document.createElement('span');
        span.id = title;
        scoreBox.appendChild(span);
        let br = document.createElement('br');
        scoreBox.appendChild(br);
    }
    private updateScoreSpans(stats, title) {
        let span = document.getElementById(title);
        if (title === killStatDisplayOptions.targets) {
            const progress = game.level ? game.level.stageProgress() : null;
            span.innerText = title + ": " + (progress ? progress.done : 0) + "/" + (progress ? progress.total : 0);
            return;
        }
        let num = stats[title.toLowerCase()]
        span.innerText = title + ": " + num;

        if (title === killStatDisplayOptions.escaped) {
            span.innerText += "/" + stats.failLimit;
            if (num > 0) {
                span.classList.add('red');
            }
            else span.classList.remove('red');
        }
        if (title === killStatDisplayOptions.total) {

        }
    }
    // The stage clock, in the score box: counts up, and goes red (and keeps counting) once it's over the stage's par
    public updateStageTimer(elapsedMs: number, parMs: number) {
        const timer = document.getElementById("stageTimer");
        if (!timer) return;
        const clock = (ms: number) => {
            const seconds = Math.floor(ms / 1000);
            return Math.floor(seconds / 60) + ":" + (seconds % 60 < 10 ? "0" : "") + (seconds % 60);
        };
        timer.innerText = "Time: " + clock(elapsedMs) + " / " + clock(parMs);
        timer.classList.toggle('red', elapsedMs > parMs);
    }
    public updateScore(stats: killStats) {
            //let span = document.getElementById('scoreCounter')
            //span.innerText = "Shots: " + stats.shots

        //    const optionsArray = this.returnkillStatDisplayOptions ();
          const optionsArray = this.returnkillStatDisplayOptions ();
        for (let option of optionsArray) {
            this.updateScoreSpans(stats, option);
        }
    }
    public hideWeapon(name: weaponNames, hide: boolean) {
        let box = this.returnWepBox(name) as HTMLElement
        if (box) {
            hide ? box.classList.add("displayNone") : box.classList.remove("displayNone");
        }
    }
    public removeWeapon(name: weaponNames) {
        let box = this.returnWepBox(name) as HTMLElement
        if (box) {
            box.remove();
        }
    }

    public selectBox(wepName: weaponNames) {
        this.getWepboxByName(wepName, true)      
    }
    public returnWepBox(wepName: weaponNames) {
        return this.hudElem.querySelector(`[data-name="${wepName}"]`); // DOUBLED --V
    }
    private getWepboxByName(wepName: weaponNames, select?: boolean) {
        let weps: HTMLCollectionOf<Element> = this.hudElem.getElementsByClassName('wepBox');
        let wepBox: Element = null;
        for (let x of weps) {
            select ? x.classList.remove("selected"): "";   // MESSY
            if (x.getAttribute('data-name') === wepName.toString()) {
                wepBox = x;
                if (select) {
                    wepBox.classList.add("selected");
                }
            }
        }
        return wepBox;
    }
    private genericChangeClass(num: number, name: weaponNames, action: "add" | "remove", classname: string, coolDown?: number) {
        let wep = this.getWepboxByName(name);
        let instboxes = wep.getElementsByClassName('instBox');
        action === "add" ? instboxes[num].classList.add(classname) : instboxes[num].classList.remove(classname);

        if (coolDown) {
            this.startTimer(coolDown, instboxes[num] as HTMLElement);
        }
    }

    public selectInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "add", "instSelected")
    }
    public deselectInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "remove", "instSelected")
    }
    public unavailInst(num: number, name: weaponNames, coolDown: number) {
        this.genericChangeClass(num, name, "add", "instUnavailable", coolDown);

    }
    public availInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "remove", "instUnavailable")
    }
}
