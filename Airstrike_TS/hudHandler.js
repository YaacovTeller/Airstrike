var killStatDisplayOptions;
(function (killStatDisplayOptions) {
    killStatDisplayOptions["total"] = "Total";
    killStatDisplayOptions["disabled"] = "Disabled";
    killStatDisplayOptions["destroyed"] = "Destroyed";
    killStatDisplayOptions["escaped"] = "Escaped";
    killStatDisplayOptions["shots"] = "Shots";
})(killStatDisplayOptions || (killStatDisplayOptions = {}));
class HudHandler {
    hudElem;
    scoreBox;
    leftSideContainer;
    centerContainer;
    rightSideContainer;
    multiKillBox;
    constructor() {
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
        this.leftSideContainer.classList.add('leftContainer');
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
    drawWeaponDisplay() {
        this.createWeaponContainers(conventionalWeapons, "firstWepContainer");
        this.createWeaponContainers(extraWeapons, "secondWepContainer");
    }
    drawProgressBar() {
        let titleCont = document.createElement('div');
        let title = document.createElement('div');
        title.innerHTML = "UN DISAPPROVAL RATING:&nbsp";
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
        let boxId = wep.name <= weaponNames.drone ? "firstWepContainer" : "secondWepContainer";
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
        let name = weaponNames[num];
        numBox.className = "wepNum";
        numBox.innerText = num;
        wepBox.appendChild(numBox);
        wepBox.classList.add("wepBox");
        wepBox.dataset.name = num;
        let wepName = name.charAt(0).toUpperCase() + String(name).slice(1);
        wepBox.title = wepName;
        wepBox.style.backgroundImage = "url(" + wep.imageSource + ")";
        wepBox.onclick = (event) => { game.changeWeapon(wep); event.stopPropagation(); };
        let wepBoxContainerElem = this.getCorrectWepboxContainer(wep);
        wepBoxContainerElem.appendChild(wepBox);
        this.drawInstances(wep, wepBox);
        if (wep.name == weaponNames.flare) {
            game.level.currentWave.timeOfDay === Time.day ? wepBox.classList.add("displayNone") : wepBox.classList.remove("displayNone"); // DOUBLED with setWave in Levels. For all weps start.
        }
        if (wep.name == weaponNames.tactical_Nuke || wep.name == weaponNames.chopper) {
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
        let timerOverlay = document.createElement('div');
        timerOverlay.classList.add("timer-overlay");
        instBox.appendChild(timerOverlay);
        //   this.startTimer(5000, instBox);
        wepBox.appendChild(instBox);
    }
    drawInstances(wep, wepBox) {
        for (let y of wep.instances) {
            this.addInstance(wepBox);
        }
    }
    startTimer(duration, container) {
        const overlay = container.querySelector('.timer-overlay');
        let startTime = null;
        function animateOverlay(timestamp) {
            if (!startTime)
                startTime = timestamp;
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
        let numberAnimTime = 500;
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
    returnkillStatDisplayOptions() {
        return Object.values(killStatDisplayOptions);
    }
    drawScore() {
        this.scoreBox = document.createElement('div');
        this.scoreBox.classList.add('score');
        const optionsArray = this.returnkillStatDisplayOptions();
        for (let option of optionsArray) {
            this.drawScoreSpans(option, this.scoreBox);
        }
        let span = document.createElement('span');
        span.id = "scoreCounter";
        this.scoreBox.appendChild(span);
        this.rightSideContainer.appendChild(this.scoreBox);
        this.updateScore(game.killStats);
    }
    drawScoreSpans(title, scoreBox) {
        let span = document.createElement('span');
        span.id = title;
        scoreBox.appendChild(span);
        let br = document.createElement('br');
        scoreBox.appendChild(br);
    }
    updateScoreSpans(stats, title) {
        let span = document.getElementById(title);
        let num = stats[title.toLowerCase()];
        span.innerText = title + ": " + num;
        if (title === killStatDisplayOptions.escaped) {
            span.innerText += "/" + stats.failLimit;
            if (num > 0) {
                span.classList.add('red');
            }
            else
                span.classList.remove('red');
        }
        if (title === killStatDisplayOptions.total) {
        }
    }
    updateScore(stats) {
        //let span = document.getElementById('scoreCounter')
        //span.innerText = "Shots: " + stats.shots
        //    const optionsArray = this.returnkillStatDisplayOptions ();
        const optionsArray = this.returnkillStatDisplayOptions();
        for (let option of optionsArray) {
            this.updateScoreSpans(stats, option);
        }
    }
    hideWeapon(name, hide) {
        let box = this.returnWepBox(name);
        if (box) {
            hide ? box.classList.add("displayNone") : box.classList.remove("displayNone");
        }
    }
    removeWeapon(name) {
        let box = this.returnWepBox(name);
        if (box) {
            box.remove();
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
    genericChangeClass(num, name, action, classname, coolDown) {
        let wep = this.getWepboxByName(name);
        let instboxes = wep.getElementsByClassName('instBox');
        action === "add" ? instboxes[num].classList.add(classname) : instboxes[num].classList.remove(classname);
        if (coolDown) {
            this.startTimer(coolDown, instboxes[num]);
        }
    }
    selectInst(num, name) {
        this.genericChangeClass(num, name, "add", "instSelected");
    }
    deselectInst(num, name) {
        this.genericChangeClass(num, name, "remove", "instSelected");
    }
    unavailInst(num, name, coolDown) {
        this.genericChangeClass(num, name, "add", "instUnavailable", coolDown);
    }
    availInst(num, name) {
        this.genericChangeClass(num, name, "remove", "instUnavailable");
    }
}
//# sourceMappingURL=hudHandler.js.map