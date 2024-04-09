class HudHandler {
    hud;
    selectedWep;
    scoreBox;
    killStats;
    constructor() {
        this.killStats = {
            total: 0,
            disabled: 0,
            destroyed: 0,
            escaped: 0
        };
    }
    drawHUD() {
        let hud = document.getElementById('hud');
        if (hud)
            hud.remove();
        let el = document.createElement('div');
        el.classList.add("hud");
        el.id = 'hud';
        addToContentEl(el);
        this.hud = el;
        let wepBoxContainer = document.createElement('div');
        wepBoxContainer.classList.add('wepBoxContainer');
        this.hud.appendChild(wepBoxContainer);
        for (let x in allWeaponTypes) {
            let wep = allWeaponTypes[x];
            let wepBox = document.createElement('div');
            let num = document.createElement('span');
            num.className = "wepNum";
            num.innerText = (parseInt(x) + 1).toString();
            wepBox.appendChild(num);
            wepBox.classList.add("wepBox");
            wepBox.dataset.name = wep.name;
            wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
            wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation(); };
            wepBoxContainer.appendChild(wepBox);
            for (let y of wep.instances) {
                let instBox = document.createElement('div');
                instBox.classList.add("instBox");
                wepBox.appendChild(instBox);
            }
        }
        this.drawScore();
    }
    drawScore() {
        this.scoreBox = document.createElement('div');
        this.scoreBox.classList.add('score');
        this.hud.appendChild(this.scoreBox);
        this.updateScore();
    }
    updateScore() {
        this.scoreBox.innerText =
            "Disabled: " + this.killStats.disabled + '\r' +
                "Destroyed: " + this.killStats.destroyed + '\r' +
                "Escaped: " + this.killStats.escaped + '\r' +
                "Total: " + this.killStats.total;
    }
    selectBox(wepName) {
        let weps = this.hud.getElementsByClassName('wepBox');
        for (let x of weps) {
            if (x.getAttribute('data-name') == wepName) {
                x.classList.add("selected");
                this.selectedWep = x;
            }
            else
                x.classList.remove("selected");
        }
    }
    selectInst() {
        let insts = this.selectedWep.getElementsByClassName('instBox');
        for (let x of insts) {
        }
    }
}
//# sourceMappingURL=hudHandler.js.map