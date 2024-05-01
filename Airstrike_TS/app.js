class GameHandler {
    targets = [];
    contentEl;
    hud = new HudHandler(); //MESSY?
    shotCount = 0;
    targetTimer;
    gameTimer;
    weapon;
    constructor(element) {
        this.contentEl = element;
        this.contentEl.addEventListener("click", (event) => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.hud.drawHUD();
        this.changeWeapon(mortar);
        if (this.weapon.constructor.name === ExplosiveWeaponType.constructor.name) {
            let w = this.weapon;
            w.switchBlastIndicatorStyle(false, null);
        }
    }
    updateShotCounter() {
        this.hud.updateScore(this.shotCount);
    }
    fireFunc() {
        this.weapon.fireFunc(this.targets);
    }
    handleKeyPress(event) {
        console.log(event.key);
        if (event.key === 'Control') {
            this.fireFunc();
        }
        let int = parseInt(event.key);
        if (int && allWeaponTypes[int - 1]) {
            this.changeWeapon(allWeaponTypes[int - 1]);
        }
        else if (event.shiftKey && event.key === 'N') {
            this.addNuke();
        }
    }
    updateCursorPosition(event) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance) {
            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos);
        }
    }
    positionElem(elem, pos) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }
    changeWeapon(wep) {
        if (!allWeaponTypes.includes(wep))
            return;
        this.weapon = wep;
        this.hud.selectBox(wep.name);
        this.weapon.switchTo();
        let inst = this.weapon.getAvailableInstance();
        if (inst && this.weapon.constructor.name === ExplosiveWeaponType.constructor.name) {
            let w = this.weapon;
            w.switchBlastIndicatorStyle(false, inst);
        }
        this.switchCursor();
        this.updateCursorPosition();
        allWeaponTypes.forEach((x) => {
            if (x !== wep) {
                if (x.instances.length && x.activeInstance) {
                    if (x.activeInstance.ready != false) {
                        x.instances.forEach((inst) => { inst.blastRadElement.style.visibility = "hidden"; });
                    }
                }
            }
        });
    }
    switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }
    newTarget() {
        let newTarget;
        let rand = RandomNumberGen.randomNumBetween(1, 21);
        switch (true) {
            case (rand >= 18):
                newTarget = new TunnelTarget(regTunnelTarget);
                break;
            case (rand >= 16):
                newTarget = new VehicleTarget(heavyTarget);
                break;
            case (rand >= 12):
                newTarget = new VehicleTarget(modTarget);
                break;
            default:
                newTarget = new VehicleTarget(regTarget);
                break;
        }
        this.targets.push(newTarget);
    }
    addNuke() {
        if (allWeaponTypes.includes(nuke))
            return;
        nuke = new ExplosiveWeaponType(nukeInfo);
        allWeaponTypes.push(nuke);
        this.hud.drawHUD();
    }
    updateHudScore() {
        this.hud.killStats.disabled = this.targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        this.hud.killStats.destroyed = this.targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        this.hud.killStats.escaped = this.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            }
            else
                return acc;
        }, 0);
        this.hud.killStats.total = this.targets.length || 0;
        this.hud.updateScore();
    }
    start() {
        this.newTarget();
        this.targetTimer = window.setInterval(() => {
            this.newTarget();
        }, 3000);
        this.gameTimer = window.setInterval(() => {
            this.updateHudScore();
            this.targets.forEach((trg) => {
                trg.action();
            });
        }, 100);
    }
}
function loadNewImage() {
    return '?' + new Date().getTime();
}
class ContentElHandler {
    static addToContentEl(elem) {
        let contentEl = document.getElementById("content");
        contentEl.appendChild(elem);
    }
    static contentElWidth() {
        return document.getElementById("content").clientWidth;
    }
}
class MouseHandler {
    static mousePos = { X: '', Y: '' };
    static updateMousePos(event) {
        if (event) {
            this.mousePos.X = event.clientX;
            this.mousePos.Y = event.clientY;
        }
        return this.mousePos;
    }
}
class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
var charge;
var sniper;
var mortar;
var howitzer;
var airstrike;
var nuke;
var allWeaponTypes;
var game;
window.onload = () => {
    const contentEl = document.getElementById("content");
    charge = new ChargeWeaponType(chargeInfo);
    sniper = new ExplosiveWeaponType(sniperInfo);
    mortar = new ExplosiveWeaponType(mortarInfo);
    howitzer = new ExplosiveWeaponType(howitzerInfo);
    airstrike = new ExplosiveWeaponType(airstrikeInfo);
    allWeaponTypes = [sniper, mortar, howitzer, airstrike, charge];
    //charge.pushNewWeaponInstance();
    //charge.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    airstrike.pushNewWeaponInstance();
    airstrike.pushNewWeaponInstance();
    airstrike.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
    game = new GameHandler(contentEl);
    loadSound();
    game.start();
};
//# sourceMappingURL=app.js.map