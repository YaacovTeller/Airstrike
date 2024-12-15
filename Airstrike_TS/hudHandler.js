var killStatsOptions;
(function (killStatsOptions) {
    killStatsOptions["total"] = "Total";
    killStatsOptions["disabled"] = "Disabled";
    killStatsOptions["destroyed"] = "Destroyed";
    killStatsOptions["escaped"] = "Escaped";
})(killStatsOptions || (killStatsOptions = {}));
class HudHandler {
    hudElem;
    scoreBox;
    rightSideContainer;
    leftSideContainer;
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
    drawHUD() {
        let hud = document.getElementById('hud');
        if (hud)
            hud.remove();
        let el = document.createElement('div');
        el.classList.add("hud");
        el.id = 'hud';
        ContentElHandler.addToContentWrapper(el);
        this.hudElem = el;
        this.leftSideContainer = document.createElement('div');
        this.leftSideContainer.style.display = "flex";
        this.hudElem.prepend(this.leftSideContainer);
        this.drawWeaponDisplay();
        this.rightSideContainer = document.createElement('div');
        this.hudElem.appendChild(this.rightSideContainer);
        this.drawScore();
    }
    drawWeaponDisplay() {
        this.createWeaponContainers(allWeaponTypes, "leftContainer");
        this.createWeaponContainers(extraWeaponTypes, "centerContainer");
    }
    createWeaponContainers(wepArray, contId) {
        let container = document.createElement('div');
        this.leftSideContainer.appendChild(container);
        container.classList.add('wepBoxContainer');
        container.id = contId;
        this.drawBoxes(container, wepArray);
    }
    drawBoxes(wepBoxContainerElem, wepArray) {
        for (let x in wepArray) {
            let wep = wepArray[x];
            this.addWeapon(wep);
        }
    }
    getCorrectWepboxContainer(wep) {
        let boxId = wep.name <= weaponNames.drone ? "leftContainer" : "centerContainer";
        return document.getElementById(boxId);
    }
    orderWeaponBoxes() {
        const containers = Array.from(this.leftSideContainer.getElementsByClassName("wepBoxContainer"));
        for (let c of containers) {
            this.orderBox(c);
        }
    }
    orderBox(container) {
        const divs = Array.from(container.children);
        divs.sort((a, b) => {
            const nameA = parseInt(a.dataset.name, 10);
            const nameB = parseInt(b.dataset.name, 10);
            return nameA - nameB;
        });
        divs.forEach(div => container.appendChild(div));
    }
    addWeapon(wep) {
        let wepBox = document.createElement('div');
        let numBox = document.createElement('span');
        let num = wep.name.toString();
        numBox.className = "wepNum";
        numBox.innerText = num;
        wepBox.appendChild(numBox);
        wepBox.classList.add("wepBox");
        wepBox.dataset.name = num;
        wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
        wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation(); };
        let wepBoxContainerElem = this.getCorrectWepboxContainer(wep);
        wepBoxContainerElem.appendChild(wepBox);
        this.drawInstances(wep, wepBox);
        if (wep.name == weaponNames.flare) {
            game.level.currentWave.timeOfDay === Time.day ? wepBox.classList.add("displayNone") : wepBox.classList.remove("displayNone"); // DOUBLED with setWave in Levels. For all weps start.
        }
        if (wep.name == weaponNames.nuke || wep.name == weaponNames.chopper) {
            wepBox.classList.add('specialWeapon');
        }
        this.orderWeaponBoxes();
    }
    addInstanceByWeapon(wep) {
        let wepBoxes = Array.from(this.leftSideContainer.querySelectorAll(".wepBox"));
        let wepBox = wepBoxes.find(wepBox => wepBox.dataset.name === wep.name.toString());
        this.addInstance(wepBox);
    }
    addInstance(wepBox) {
        let instBox = document.createElement('div');
        instBox.classList.add("instBox");
        wepBox.appendChild(instBox);
    }
    drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            this.addInstance(wepBox);
        }
    }
    drawMultiKill() {
        this.multiKillBox = document.createElement('div');
        this.multiKillBox.classList.add('multiKillBox', 'hide');
        ContentElHandler.addToContentWrapper(this.multiKillBox);
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
    buildLevelBar() {
        let levDivContainer = document.createElement('div');
        levDivContainer.className = 'levDivContainer';
        this.rightSideContainer.appendChild(levDivContainer);
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
        this.rightSideContainer.appendChild(this.scoreBox);
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
            //  span.innerText += "/" + game.returnLevelLimit();
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
    returnWepBox(wepName) {
        return this.hudElem.querySelector(`[data-name="${wepName}"]`); // DOUBLED --V
    }
    getWepboxByName(wepName, select) {
        let weps = this.hudElem.getElementsByClassName('wepBox');
        let wepBox = null;
        for (let x of weps) {
            select ? x.classList.remove("selected") : ""; // MESSY
            if (x.getAttribute('data-name') === wepName.toString()) {
                wepBox = x;
                if (select) {
                    wepBox.classList.add("selected");
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
//# sourceMappingURL=hudHandler.js.map