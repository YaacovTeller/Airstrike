type killStats = {
    total: number;
    disabled: number;
    destroyed: number;
    escaped: number;
    failLimit: number;
}
enum killStatsOptions {
    total = 'Total',
    disabled = 'Disabled',
    destroyed = 'Destroyed',
    escaped = 'Escaped'
}

class HudHandler {
    private hudElem: HTMLElement
    private scoreBox: HTMLElement
    private rightSideContainer: HTMLElement
    private leftSideContainer: HTMLElement
    public multiKillBox: HTMLElement
    public killStats: killStats

    constructor() {
        this.killStats = {
            total: 0,
            disabled: 0,
            destroyed: 0,
            escaped: 0,
            failLimit: 1
        }
    }
    public resetStats() {
        this.killStats.total = 0;
        this.killStats.disabled = 0;
        this.killStats.destroyed = 0;
        this.killStats.escaped = 0;
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
        this.leftSideContainer.style.display = "flex"
        this.hudElem.prepend(this.leftSideContainer);
        this.drawWeaponDisplay();

        this.rightSideContainer = document.createElement('div');
        this.hudElem.appendChild(this.rightSideContainer);
        this.drawScore();
    }

    public drawWeaponDisplay() {
        this.createWeaponContainers(allWeaponTypes, "leftContainer")
        this.createWeaponContainers(extraWeaponTypes, "centerContainer")
    }

    private createWeaponContainers(wepArray, contId) {
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
        let boxId: string = wep.name <= weaponNames.drone ? "leftContainer" : "centerContainer";
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
        let num = wep.name.toString();
        numBox.className = "wepNum";
        numBox.innerText = num;
        wepBox.appendChild(numBox);
        wepBox.classList.add("wepBox");
        wepBox.dataset.name = num;
        wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
        wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation() }

        let wepBoxContainerElem = this.getCorrectWepboxContainer(wep);
        wepBoxContainerElem.appendChild(wepBox);
        this.drawInstances(wep, wepBox);

        if (wep.name == weaponNames.flare) {
            game.level.currentWave.timeOfDay === Time.day ? wepBox.classList.add("displayNone") : wepBox.classList.remove("displayNone");  // DOUBLED with setWave in Levels. For all weps start.
        }
        if (wep.name == weaponNames.nuke) {
            wepBox.classList.add('specialWeapon')
        }

        this.orderWeaponBoxes();
    }
    public addInstanceByWeapon(wep: WeaponType) {
        let wepBoxes: Array<HTMLDivElement> = Array.from(this.leftSideContainer.querySelectorAll(".wepBox"));
        let wepBox = wepBoxes.find(wepBox => wepBox.dataset.name === wep.name.toString());
        this.addInstance(wepBox);
    }
    private addInstance(wepBox: HTMLElement) {
        let instBox = document.createElement('div');
        instBox.classList.add("instBox");
        wepBox.appendChild(instBox);
    }
    private drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            this.addInstance(wepBox);
        }
    }

    public drawMultiKill() {
        this.multiKillBox = document.createElement('div');
        this.multiKillBox.classList.add('multiKillBox', 'hide');
        ContentElHandler.addToContentWrapper(this.multiKillBox)
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
        let numberAnimTime = 1000;
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

    public drawScore() {
        this.scoreBox = document.createElement('div');
        this.scoreBox.classList.add('score');

        const optionsArray = Object.values(killStatsOptions);
        for (let option of optionsArray) {
            this.drawScoreSpans(option, this.scoreBox);
        }
        let span = document.createElement('span');
        span.id = "scoreCounter"
        this.scoreBox.appendChild(span);

        this.rightSideContainer.appendChild(this.scoreBox);

        this.updateScore();
    }
    private drawScoreSpans(title, scoreBox: HTMLElement) {
        let span = document.createElement('span');
        span.id = title;
        scoreBox.appendChild(span);
        let br = document.createElement('br');
        scoreBox.appendChild(br);
    }
    private updateScoreSpans(title) {
        let span = document.getElementById(title);
        let num = this.killStats[title.toLowerCase()]
        span.innerText = title + ": " + num;
        if (title === killStatsOptions.escaped) {
            span.innerText += "/" + this.killStats.failLimit;
            if (num > 0) {
                span.classList.add('red');
            }
            else span.classList.remove('red');
        }
        if (title === killStatsOptions.total) {

          //  span.innerText += "/" + game.returnLevelLimit();
        }
    }
    public updateScore(shots?) {
        if (shots) {
            let span = document.getElementById('scoreCounter')
            span.innerText = "Shots: " + shots
        }

        const optionsArray = Object.values(killStatsOptions);
        for (let option of optionsArray) {
            this.updateScoreSpans(option);
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
    public genericChangeClass(num: number, name: weaponNames, action: "add" | "remove", classname: string) {
        let wep = this.getWepboxByName(name)
        let instboxes = wep.getElementsByClassName('instBox');
        action === "add" ? instboxes[num].classList.add(classname) : instboxes[num].classList.remove(classname)
    }

    public selectInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "add", "instSelected")
    }
    public deselectInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "remove", "instSelected")
    }
    public unavailInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "add", "instUnavailable")
    }
    public availInst(num: number, name: weaponNames) {
        this.genericChangeClass(num, name, "remove", "instUnavailable")
    }
}