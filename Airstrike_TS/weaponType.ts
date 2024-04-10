
class WeaponType {
    public name: string;
    public blastRadius: number;
    public speed: number;
    public cursor: string;
    public sound: Array<Sound>;
    public cooldown: number;

    public imageSource: string;
    private explosionInfo: explosionInfo;

    public activeInstance: weaponInstance;
    public instances: Array<weaponInstance> = [];

    constructor(info: weaponInfo) {
        this.name = info.name;
        this.blastRadius = info.blastRadius;
        this.speed = info.speed;
        this.cursor = info.cursor;
        this.sound = info.sound;
        this.cooldown = info.cooldown;
        this.explosionInfo = info.explosionInfo;
        this.imageSource = info.imageSource;

        this.pushNewWeaponInstance();
    }
    public switchTo() {
        this.activeInstance = this.getAvailableInstance();
    }

    public pushNewWeaponInstance() {
        let el = document.createElement('div');
        el.classList.add('blastRadius');
        el.classList.add('preFire');
        this.name == weaponNames.nuke ? el.classList.add('nukeIndicator') : "";

        el.classList.add('circle' + this.instances.length);
        el.style.width = el.style.height = this.blastRadius * 2 + 'px';
        el.style.visibility = "hidden";

        let explosion = document.createElement('img');
        explosion.classList.add('explosion');

        var timestamp = new Date().getTime();
        explosion.src = this.explosionInfo.imageSource + '?' + timestamp;
        addToContentEl(explosion);

        if (this.name == weaponNames.nuke) {
        }

        let inst: weaponInstance = {
            ready: true,
            blastRadElement: el,
            explosion
        };
        this.instances.push(inst);
        addToContentEl(el);
    }
    public getAvailableInstance() {
        let current = this.activeInstance;
        let nextReady = this.instances.find(inst => inst.ready == true) || null;
        if (nextReady != null) {

            nextReady.blastRadElement.style.visibility = "visible";
        }
        //    nextReady === current ? console.log("SAME!") : console.log("DIFF!")
        return nextReady;
    }

    public fireFunc(targets: Array<Target>) {
        if (this.activeInstance == null) {
            console.log("hit NULL inst");
            return;
        }

        let inst = this.activeInstance;
        let blastRadiusEl = inst.blastRadElement;

        this.prepFire(true, inst);

        let explosion = inst.explosion;
        let blastRect = blastRadiusEl.getBoundingClientRect();
        explosion.style.width = blastRect.width + 'px';
        explosion.style.height = blastRect.height + 'px';

        let blastCenter = CollisionDetection.getXYfromPoint(blastRadiusEl);
        explosion.style.left = blastCenter.X - explosion.clientWidth / 2 + 'px';
        explosion.style.top = blastCenter.Y - explosion.clientHeight * 0.9 + 'px';

        this.activeInstance = this.getAvailableInstance();

        setTimeout(() => {
            this.explosion_targetCheck(targets, inst);
            this.prepFire(false, inst);
            inst.ready = true;
            this.activeInstance = this.activeInstance == null ? this.getAvailableInstance() : this.activeInstance;
        }, this.speed);
    }
    private explosion_targetCheck(targets: Array<Target>, inst: weaponInstance) {

        let explosion = inst.explosion;
        explosion.style.visibility = 'visible';

        setTimeout(() => {
            explosion.style.visibility = 'hidden';
        }, this.explosionInfo.length);

        for (let target of targets) {
            let collisionInfo = CollisionDetection.checkPos(inst.blastRadElement, target.getTargetEl());
            if (collisionInfo) {
                let fraction = collisionInfo.dist / collisionInfo.radius;
                let severity: strikeSeverity;
                if (this.name === weaponNames.gun) {
                    severity = strikeSeverity.light;
                }
                else {
                    switch (true) {
                        case (fraction > 0.9):
                            severity = strikeSeverity.light;
                            break;
                        case (fraction <= 0.9 && fraction >= 0.5):
                            severity = strikeSeverity.medium;
                            break;
                        case (fraction < 0.5 && fraction >= 0.2):
                            severity = strikeSeverity.heavy;
                            break;
                        case (fraction < 0.2):
                            severity = strikeSeverity.catastrophic;
                            break;
                        default:
                            severity = strikeSeverity.light;
                    }
                }
                //   console.log("SEV: "+strikeSeverity[severity]);
                if (target.armour == Armour.moderate && severity < strikeSeverity.heavy) return;
                severity > strikeSeverity.light ? CollisionDetection.moveAtAngle(collisionInfo) : "";

                console.log("ANGLE: " + collisionInfo.angle);
                let angle = collisionInfo.angle;
                let direc: direction;
                if (angle > 300 && angle < 360 || angle > 0 && angle < 60) {
                    direc = direction.forward;
                }
                else if (angle > 150 && angle < 210) {
                    direc = direction.backward;
                    console.log("DIREC: " + direction.backward);
                }

                if (target.damage != Damage.destroyed) {
                    target.hit(severity, direc);
                    this.bonusHitSound();
                }
            }
        }
    }
    private prepFire(bool: boolean, inst: weaponInstance) {
        this.switchBlastIndicatorStyle(bool, inst);
        if (bool) {
            this.rippleEffect(inst);
            RandomSoundGen.playNotSoRandomSound(this.sound);

            if (this.explosionInfo.sound.length) {
                setTimeout(() => RandomSoundGen.playNotSoRandomSound(this.explosionInfo.sound), this.explosionInfo.soundDelay || 100);
            }
        }
        inst.ready = !bool;
    }

    public switchBlastIndicatorStyle(bool: boolean, inst: weaponInstance) {
        if (inst == null)
            return;
        let blastRadiusEl = inst.blastRadElement;
        if (bool) {
            blastRadiusEl.classList.remove("preFire");
            blastRadiusEl.classList.add("firing");
        }
        else {
            blastRadiusEl.classList.add("preFire");
            blastRadiusEl.classList.remove("firing");
        }
    }

    private rippleEffect(inst: weaponInstance) {
        let blastRadiusEl = inst.blastRadElement;
        const circle = document.createElement("span");
        const diameter = blastRadiusEl.clientWidth;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = blastRadiusEl.clientLeft + 'px';
        circle.style.top = blastRadiusEl.clientTop + 'px';
        circle.classList.add("ripple");

        const ripple = blastRadiusEl.getElementsByClassName("ripple")[0];
        ripple ? ripple.remove() : () => { };

        blastRadiusEl.appendChild(circle);
    }
    private bonusHitSound() {
        RandomNumberGen.randomNumBetween(1, 8) == 8 ? pgia.play() : "";
    }
}
