class TargetHandler {
    private targets: Array<Target> = [];
    private contentEl: HTMLElement;
    private hud = new HudHandler();

    private targetTimer: number;
    private gameTimer: number;
    private weapon: WeaponType;

    constructor(element: HTMLElement) {
        this.contentEl = element;

        this.contentEl.addEventListener("click", (event) => this.fireFunc());
        this.contentEl.addEventListener('mousemove', (event) => this.updateCursorPosition(event));
        window.addEventListener('keydown', (event) => this.handleKeyPress(event), true);
        this.hud.drawHUD();

        this.changeWeapon(mortar);
        this.weapon.switchBlastIndicatorStyle(false, null);
    }

    private fireFunc() {
        this.weapon.fireFunc(this.targets);
    }

    private handleKeyPress(event) {
        console.log(event.key)
        if (event.key === 'Control') { this.fireFunc()}
        let int = parseInt(event.key);
        if (int && allWeaponTypes[int - 1]) {
            this.changeWeapon(allWeaponTypes[int - 1])
        }
        else if (event.shiftKey && event.key === 'N') { this.addNuke() }
    }
    private updateCursorPosition(event?: MouseEvent) {
        let newMousePos = MouseHandler.updateMousePos(event);
        if (this.weapon.activeInstance) {

            let blast = this.weapon.activeInstance.blastRadElement;
            this.positionElem(blast, newMousePos)
        }
    }

    private positionElem(elem: HTMLElement, pos: position) {
        elem.style.left = pos.X - elem.offsetWidth / 2 + 'px';
        elem.style.top = pos.Y - elem.offsetHeight / 2 + 'px';
    }

    public changeWeapon(wep: WeaponType) {
        if (!allWeaponTypes.includes(wep)) return
        this.weapon = wep;
        this.weapon.switchTo();
        let inst = this.weapon.getAvailableInstance()
        if (inst) {
            this.weapon.switchBlastIndicatorStyle(false, inst);
        }
        this.switchCursor();
        this.updateCursorPosition();
        allWeaponTypes.forEach((x) => {
            if (x !== wep) {
                if (x.instances.length && x.activeInstance) {
                    if (x.activeInstance.ready != false) {
                        x.instances.forEach((inst) => { inst.blastRadElement.style.visibility = "hidden" })

                    }
                }
            }
        })
        this.hud.selectBox(wep.name);
    }

    private switchCursor() { // broken?
        this.contentEl.classList.forEach((className) => {
            className.startsWith('cursor') ? this.contentEl.classList.remove(className) : "";
        })
        this.contentEl.classList.add(this.weapon.cursor);
    }

    public newTarget() {
        let newTarget: Target;
        let rand = RandomNumberGen.randomNumBetween(1, 6);
        if (rand === 6) {
            newTarget = new Target(this.contentEl, heavyTarget);
        }
        else {
            newTarget = new Target(this.contentEl, regTarget);
        }
        this.targets.push(newTarget)
    }

    private addNuke() {
        if (allWeaponTypes.includes(nuke)) return

        nuke = new WeaponType(nukeInfo);
        allWeaponTypes.push(nuke)
        this.hud.drawHUD();
    }
    private updateHudScore() {
        this.hud.killStats.disabled = this.targets.reduce((acc, target) => {
            if (target.status === Status.disabled && target.damage === Damage.damaged) {
                return acc + 1;
            }   else return acc;  
        }, 0);
        this.hud.killStats.destroyed = this.targets.reduce((acc, target) => {
            if (target.damage >= Damage.moderateDamaged) {
                return acc + 1;
            }   else return acc;
        }, 0);
        this.hud.killStats.escaped = this.targets.reduce((acc, target) => {
            if (target.status === Status.escaped) {
                return acc + 1;
            }   else return acc;
        }, 0);
        this.hud.killStats.total = this.targets.length || 0;
        this.hud.updateScore();
    }

    public start() {
        this.newTarget();
        this.targetTimer = window.setInterval(() => {
            this.newTarget();

        }, 3000);
        this.gameTimer = window.setInterval(() => {
            this.updateHudScore();
            this.targets.forEach((trg) => {
                trg.action();
            })
        }, 100);
    }
}

function addToContentEl(elem: HTMLElement) {
    let contentEl: HTMLElement = document.getElementById("content")!;
    contentEl.appendChild(elem);
}

class MouseHandler {
    static mousePos: position = { X: '', Y: '' };

    static updateMousePos(event?: MouseEvent) {
        if (event) {
            this.mousePos.X = event.clientX
            this.mousePos.Y = event.clientY
        }
        return this.mousePos
    }
}
class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
var sniper: WeaponType;
var mortar: WeaponType;
var howitzer: WeaponType;
var airstrike: WeaponType;
var nuke: WeaponType;
var allWeaponTypes: Array<WeaponType>

var game: TargetHandler
window.onload = () => {
    const contentEl: HTMLElement = document.getElementById("content")!;
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