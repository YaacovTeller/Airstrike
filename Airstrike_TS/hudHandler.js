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
    multiKillBox;
    killStats;
    constructor() {
        this.killStats = {
            total: 0,
            disabled: 0,
            destroyed: 0,
            escaped: 0,
            failLimit: 1
        };
    }
    resetStats() {
        this.killStats.total = 0;
        this.killStats.disabled = 0;
        this.killStats.destroyed = 0;
        this.killStats.escaped = 0;
    }
    drawHUD(wepname) {
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
            this.drawInstances(wep, wepBox);
        }
        if (wepname) {
            this.selectBox(wepname);
        }
        this.drawScore();
    }
    drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            let instBox = document.createElement('div');
            instBox.classList.add("instBox");
            wepBox.appendChild(instBox);
        }
    }
    drawMultiKill() {
        this.multiKillBox = document.createElement('div');
        this.multiKillBox.classList.add('multiKillBox', 'hide');
        ContentElHandler.addToContentEl(this.multiKillBox);
    }
    updateMultiKillBox(num) {
        let txt = "";
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
        }, numberAnimTime);
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
            span.innerText += "/" + this.killStats.failLimit;
            if (num > 0) {
                span.classList.add('red');
            }
            else
                span.classList.remove('red');
        }
        if (title === killStatsOptions.total) {
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
            select ? x.classList.remove("selected") : "";
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
        let instboxes = wep.getElementsByClassName('instBox');
        action === "add" ? instboxes[num].classList.add(classname) : instboxes[num].classList.remove(classname);
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
