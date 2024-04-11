type killStats = {
    total: number;
    disabled: number;
    destroyed: number;
    escaped: number;
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
            escaped: 0
        }
    }

    public drawHUD() {
        let hud = document.getElementById('hud');
        if (hud) hud.remove();

        let el = document.createElement('div')
        el.classList.add("hud")
        el.id = 'hud';
        addToContentEl(el)
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
            for (let y of wep.instances) {
                let instBox = document.createElement('div');
                instBox.classList.add("instBox");
                wepBox.appendChild(instBox);
            }
        }
        this.drawScore();
    }
    public drawScore() {
        this.scoreBox = document.createElement('div');
        this.scoreBox.classList.add('score');
        this.drawScoreSpans(killStatsOptions.disabled, this.scoreBox);
        this.drawScoreSpans(killStatsOptions.destroyed, this.scoreBox);
        this.drawScoreSpans(killStatsOptions.escaped, this.scoreBox);
        this.drawScoreSpans(killStatsOptions.total, this.scoreBox);

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
        span.innerText = title + ": " + this.killStats[title.toLowerCase()]
    }
    public updateScore() {
        this.updateScoreSpans(killStatsOptions.disabled);
        this.updateScoreSpans(killStatsOptions.destroyed);
        this.updateScoreSpans(killStatsOptions.escaped);
        this.updateScoreSpans(killStatsOptions.total);

        //this.scoreBox.innerText =
        //    "Disabled: " + this.killStats.disabled + '\r' +
        //"Destroyed: " + this.killStats.destroyed + '\r' +
        //"Escaped: " + this.killStats.escaped + '\r' +
        //"Total: " + this.killStats.total
    }
    public selectBox(wepName: weaponNames) {
        let weps: HTMLCollectionOf<Element> = this.hud.getElementsByClassName('wepBox');
        for (let x of weps) {
            if (x.getAttribute('data-name') == wepName.toString()) {
                x.classList.add("selected")
                this.selectedWep = x;
            }
            else x.classList.remove("selected");
        }
    }
    public selectInst() {
        let insts = this.selectedWep.getElementsByClassName('instBox');
        for (let x of insts) {

        }
    }
}