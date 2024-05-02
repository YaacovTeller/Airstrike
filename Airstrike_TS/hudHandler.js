var killStatsOptions;
(function (killStatsOptions) {
    killStatsOptions["total"] = "Total";
    killStatsOptions["disabled"] = "Disabled";
    killStatsOptions["destroyed"] = "Destroyed";
    killStatsOptions["escaped"] = "Escaped";
})(killStatsOptions || (killStatsOptions = {}));
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
        ContentElHandler.addToContentEl(el);
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
            wepBox.dataset.name = wep.name.toString();
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
        const optionsArray = Object.values(killStatsOptions);
        for (let option of optionsArray) {
            this.drawScoreSpans(option, this.scoreBox);
        }
        let span = document.createElement('span');
        span.id = "scoreCounter";
        this.scoreBox.appendChild(span);
        this.hud.appendChild(this.scoreBox);
        this.updateScore();
    }
    drawScoreSpans(title, scoreBox) {
        let span = document.createElement('span');
        span.id = title;
        scoreBox.appendChild(span);
        let br = document.createElement('br');
        scoreBox.appendChild(br);
    }
    updateScoreSpans(title) {
        let span = document.getElementById(title);
        let num = this.killStats[title.toLowerCase()];
        span.innerText = title + ": " + num;
        if (title === killStatsOptions.escaped) {
            if (num > 0) {
                span.classList.add('red');
            }
            else
                span.classList.remove('red');
        }
    }
    updateScore(shots) {
        if (shots) {
            let span = document.getElementById('scoreCounter');
            span.innerText = "Shots: " + shots;
        }
        const optionsArray = Object.values(killStatsOptions);
        for (let option of optionsArray) {
            this.updateScoreSpans(option);
        }
    }
    selectBox(wepName) {
        this.getWepboxByName(wepName, true);
    }
    getWepboxByName(wepName, select) {
        let weps = this.hud.getElementsByClassName('wepBox');
        let wepBox = null;
        for (let x of weps) {
            select ? x.classList.remove("selected") : ""; // MESSY
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
    genericChangeClass(num, name, action, classname) {
        let wep = this.getWepboxByName(name);
        let insts = wep.getElementsByClassName('instBox');
        action === "add" ? insts[num].classList.add(classname) : insts[num].classList.remove(classname);
    }
    selectInst(num, name) {
        this.genericChangeClass(num, name, "add", "instSelected");
    }
    deselectInst(num, name) {
        this.genericChangeClass(num, name, "remove", "instSelected");
    }
    unavailInst(num, name) {
        this.genericChangeClass(num, name, "add", "instUnavailable");
    }
    availInst(num, name) {
        this.genericChangeClass(num, name, "remove", "instUnavailable");
    }
}
//# sourceMappingURL=hudHandler.js.map