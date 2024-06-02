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
    private hud: HTMLElement
    private selectedWep: Element
    private scoreBox: HTMLElement
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
    public drawHUD(wepname?) {
        let hud = document.getElementById('hud');
        if (hud) hud.remove();

        let el = document.createElement('div')
        el.classList.add("hud")
        el.id = 'hud';
        ContentElHandler.addToContentEl(el)
        this.hud = el;
        let wepBoxContainer = document.createElement('div');
        wepBoxContainer.classList.add('wepBoxContainer');
        this.hud.appendChild(wepBoxContainer);

        for (let x in allWeaponTypes) {
            let wep = allWeaponTypes[x]
            let wepBox = document.createElement('div');
            let num = document.createElement('span');
            num.className = "wepNum";
            num.innerText = (parseInt(x) + 1).toString();
            wepBox.appendChild(num);
            wepBox.classList.add("wepBox");
            wepBox.dataset.name = wep.name.toString();
            wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
            wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation() }
            wepBoxContainer.appendChild(wepBox);
            this.drawInstances(wep, wepBox)
        }
        if (wepname) {
            this.selectBox(wepname)
        }
        this.drawScore();
    }
    public drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            let instBox = document.createElement('div');
            instBox.classList.add("instBox");
            wepBox.appendChild(instBox);
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

        this.hud.appendChild(this.scoreBox);

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
            span.innerText += "/" + game.returnLevelLimit();
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
    private getWepboxByName(wepName: weaponNames, select?: boolean) {
        let weps: HTMLCollectionOf<Element> = this.hud.getElementsByClassName('wepBox');
        let wepBox: Element = null;
        for (let x of weps) {
            select ? x.classList.remove("selected"): "";   // MESSY
            if (x.getAttribute('data-name') === wepName.toString()) {
                wepBox = x;
                if (select) {
                    wepBox.classList.add("selected");
                    this.selectedWep = wepBox;
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