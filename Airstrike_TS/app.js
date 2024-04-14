class TargetHandler {
    targets = [];
    contentEl;
    hud = new HudHandler();
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
        this.weapon.switchBlastIndicatorStyle(false, null);
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
        this.weapon.switchTo();
        let inst = this.weapon.getAvailableInstance();
        if (inst) {
            this.weapon.switchBlastIndicatorStyle(false, inst);
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
        this.hud.selectBox(wep.name);
    }
    switchCursor() {
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        });
        this.contentEl.classList.add(this.weapon.cursor);
    }
    newTarget() {
        let newTarget;
        let rand = RandomNumberGen.randomNumBetween(1, 8);
        switch (true) {
            case (rand == 8):
                newTarget = new Target(this.contentEl, heavyTarget);
                break;
            case (rand >= 6):
                newTarget = new Target(this.contentEl, modTarget);
                break;
            default:
                newTarget = new Target(this.contentEl, regTarget);
                break;
        }
        this.targets.push(newTarget);
    }
    addNuke() {
        if (allWeaponTypes.includes(nuke))
            return;
        nuke = new WeaponType(nukeInfo);
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
function addToContentEl(elem) {
    let contentEl = document.getElementById("content");
    contentEl.appendChild(elem);
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
var sniper;
var mortar;
var howitzer;
var airstrike;
var nuke;
var allWeaponTypes;
var game;
window.onload = () => {
    const contentEl = document.getElementById("content");
    sniper = new WeaponType(sniperInfo);
    mortar = new WeaponType(mortarInfo);
    howitzer = new WeaponType(howitzerInfo);
    airstrike = new WeaponType(airstrikeInfo);
    allWeaponTypes = [sniper, mortar, howitzer, airstrike];
    mortar.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    game = new TargetHandler(contentEl);
    loadSound();
    game.start();
};
//# sourceMappingURL=app.js.map