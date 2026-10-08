"use strict";
const warehouseBlueInfo = {
    undamaged: "Warehouse_blue_1.png",
    damaged: "Warehouse_blue_2.png",
    destroyed: "Warehouse_blue_3.png",
};
const warehouseBrownInfo = {
    undamaged: "Warehouse_brown_1.png",
    damaged: "Warehouse_brown_2.png",
    destroyed: "Warehouse_brown_3.png",
};
// Add new building types here to get them into the random rotation.
const allBuildingInfo = [warehouseBlueInfo, warehouseBrownInfo];
// Generic rubble chunks used as flying debris when a building is hit (see Building.debrisSources).
const buildingRuinSources = [
    assetsFolder + "ruin_1.png",
    assetsFolder + "ruin_2.png",
];
// Shared by Target and Building: both are sprites placed and repositioned within the content area.
class MapEntity {
    targetEl;
    picEl;
    baseImgEl;
    placeAt(left, top) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    getTargetEl() {
        return this.targetEl;
    }
    getPicEl() {
        return this.picEl;
    }
    // The part of this that a blast has to reach to hit it at all (page coordinates). By default
    // that's just its middle, which is stingy for anything wide, so those override it with an area.
    // It only decides whether a blast hits: how hard still depends on how close to the middle it was.
    hitBox() {
        const rect = this.targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return { left: x, top: y, right: x, bottom: y };
    }
    // Where a blast hit this, as an on-screen point: the blast's own position pulled back onto
    // the given area (the picture, unless told otherwise), so a near miss still comes from the
    // nearest edge. Without any collision info it's the middle of the area.
    impactPoint(collisionInfo, area = this.picEl.getBoundingClientRect()) {
        if (!collisionInfo) {
            return { X: (area.left + area.right) / 2, Y: (area.top + area.bottom) / 2 };
        }
        // the angle and distance run from the blast to the middle of the target, hence the minus
        const middle = CollisionDetection.getXYfromPoint(this.targetEl);
        const rad = collisionInfo.angle * Math.PI / 180;
        const blast = { X: middle.X - collisionInfo.dist * Math.cos(rad), Y: middle.Y - collisionInfo.dist * Math.sin(rad) };
        return CollisionDetection.nearestPointInBox(blast, area);
    }
    // Spawns a free-standing piece of debris, registers it for cleanup, and fades it out after a
    // while. It starts at the origin given (on-screen coordinates), or the top-left of this
    // entity's picture, which is fine for the small vehicles whose wheels it was written for.
    returnBit(imageSrc, parentClass, childClass, origin) {
        let bit = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), parentClass);
        ElementCreator.returnNewImageEl(bit, childClass, imageSrc);
        if (origin) {
            bit.style.position = "absolute";
            bit.style.left = `${origin.X + window.scrollX}px`;
            bit.style.top = `${origin.Y + window.scrollY}px`;
        }
        else {
            ElementCreator.positionAbsoluteAtElementRect(this.picEl, bit);
        }
        allObjects.push(bit);
        ContentElHandler.fadeRemoveItem(bit, itemStay, fadeAnimTime, allObjects);
        return bit;
    }
}
// Wraps the gif-based damage overlay (smoke/fire) that plays on a target's damageEl canvas.
class DamageOverlay {
    player;
    canvas;
    constructor(canvas) {
        this.canvas = canvas;
        this.player = new CanvasGifPlayer(canvas);
    }
    playLoop(frames) {
        this.player.pause();
        this.player.play(frames, true);
    }
    hide() {
        this.canvas.style.visibility = "hidden";
    }
}
class Building extends MapEntity {
    damageEl;
    damage = Damage.undamaged;
    info;
    static debrisSources = [
        ...buildingRuinSources,
        assetsFolder + "bit.png",
    ];
    static debrisPerHit = 2;
    // Enemies hiding inside, under the picture. The building's damage is what decides their fate.
    occupants = [];
    addOccupant(enemy) {
        this.occupants.push(enemy);
    }
    // Somewhere within the building's picture to hide (on the page). This is the area of the 100px
    // box that is solid in both the undamaged and the damaged pictures of every building type so far
    // (measured from the pngs), so that the enemy's square is never in a transparent gap where it
    // would show. Revisit if a new building's sprite isn't solid across it.
    randomHidingSpot() {
        return {
            X: parseInt(this.targetEl.style.left) + RandomNumberGen.randomNumBetween(21, 63),
            Y: parseInt(this.targetEl.style.top) + RandomNumberGen.randomNumBetween(14, 40),
        };
    }
    // Wrecking the building takes everyone in it with it. A significant hit that only damages it
    // (see Building.hit) gives each of them an even chance of being killed, every time, so a few such
    // shots can clear a building out without bringing it down.
    killOccupants(destroyed) {
        for (const enemy of this.occupants) {
            if (destroyed || RandomNumberGen.randomNumBetween(0, 1) === 1) {
                enemy.eliminate();
            }
        }
    }
    constructor(info) {
        super();
        this.info = info ? info : RandomNumberGen.returnRandomFromArray(allBuildingInfo);
        this.targetEl = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "building");
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", this.getSource());
        this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "", "", true);
        allTargets.push(this);
    }
    reAssignSrc() {
        this.baseImgEl.src = this.getSource();
    }
    getSource() {
        let filename;
        switch (this.damage) {
            case Damage.undamaged:
                filename = this.info.undamaged;
                break;
            case Damage.destroyed:
                filename = this.info.destroyed;
                break;
            default:
                filename = this.info.damaged;
                break;
        }
        return assetsFolder + "buildings/" + filename;
    }
    setPosition(position) {
        let x, y;
        x = position.X;
        y = position.Y;
        this.placeAt(x, y);
    }
    // Three stages (undamaged -> damaged -> destroyed), worn down cumulatively like the vehicles:
    // every hit adds damage points, and the building is destroyed once it has taken
    // hitPointsToDestroy. How many a hit adds depends on the weapon and on how close to the blast's
    // centre it landed (severity):
    //  - bullets do nothing
    //  - a direct hit from a mortar/howitzer shell is half of what it takes, so two destroy it
    //  - a direct hit from an airstrike or nuke is all of it
    //  - further out from the centre it counts for less (half, then a quarter at the edge), but it
    //    all adds up, so a few glancing blows do as much as a direct one
    // Any hit at all leaves it at least damaged.
    static hitPointsToDestroy = 100;
    damagePoints = 0;
    hitPoints(severity, wepName) {
        const flattening = wepName == weaponNames.airstrike || wepName == weaponNames.tactical_Nuke;
        const direct = flattening ? Building.hitPointsToDestroy : Building.hitPointsToDestroy / 2;
        switch (severity) {
            case strikeSeverity.light:
                return direct / 4;
            case strikeSeverity.medium:
                return direct / 2;
            default:
                return direct;
        }
    }
    hit(severity, wepName, collisionInfo) {
        if (wepName < weaponNames.mortar) {
            return;
        }
        this.damagePoints += this.hitPoints(severity, wepName);
        this.damage = this.damagePoints >= Building.hitPointsToDestroy ? Damage.destroyed : Damage.damaged;
        this.reAssignSrc();
        if (this.damage === Damage.destroyed) {
            this.killOccupants(true);
        }
        else if (severity >= strikeSeverity.medium) { // not just a glancing blow from the edge of a blast
            this.killOccupants(false);
        }
        this.throwDebris(collisionInfo);
    }
    // The pieces fly out from where the blast hit the building.
    throwDebris(collisionInfo) {
        const origin = this.impactPoint(collisionInfo);
        for (let i = 0; i < Building.debrisPerHit; i++) {
            this.throwDebrisPiece(origin);
        }
    }
    throwDebrisPiece(origin) {
        let imageSrc = RandomNumberGen.returnRandomFromArray(Building.debrisSources);
        let piece = this.returnBit(imageSrc, "wheel", "wheelPic", origin);
        piece.classList.add("buildingDebris");
        let direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
        ThrowHandler.flip(piece, direc, crashes, undefined, undefined, ThrowHandler.removeIfLandedInWater);
    }
}
class Target extends MapEntity {
    damageEl;
    //  protected damageEl: HTMLImageElement;
    lockonEl;
    destroyedSource = assetsFolder + 'fire_3.gif';
    onFireSource = assetsFolder + 'fire_1.gif';
    smokingSource = assetsFolder + 'smoke_3.gif';
    damageOverlay;
    //   protected damagedSource: Array<string> = smoke_Frames;
    speed;
    armour;
    startPosition;
    status = Status.active;
    health;
    damage = Damage.undamaged;
    movesAtBlast;
    info;
    constructor(info) {
        super();
        this.info = info;
        this.targetEl = document.createElement("div");
        this.targetEl.classList.add('target', 'flexCenter', 'smoothTransition');
        let picSrc = this.picSources.length ? assetsFolder + RandomNumberGen.returnRandomFromArray(this.picSources) : undefined; // some have no picture
        this.picEl = ElementCreator.returnNewDiv(this.targetEl, "picEl");
        this.baseImgEl = ElementCreator.returnNewImageEl(this.picEl, "", picSrc);
        this.damageEl = ElementCreator.returnNewCanvas(this.targetEl, "smallSquare", true);
        //   this.damageEl = ElementCreator.returnNewImageEl(this.targetEl, "smallSquare");
        this.lockonEl = ElementCreator.returnNewImageEl(this.targetEl, 'lockon', assetsSVGFolder + "target-box.svg");
        this.damageOverlay = new DamageOverlay(this.damageEl);
        ContentElHandler.addToContentEl(this.targetEl);
        //        console.log("POS_X: " + this.getTargetEl().clientWidth * -1);
        this.speed = RandomNumberGen.randomNumBetween(this.info.minSpeed, this.info.maxSpeed);
        this.armour = this.info.armour;
        //     this.health = this.info.health;
    }
    get picSources() {
        return [];
    }
    decidePosition(pos) {
        let x, y;
        if (pos) {
            x = pos.X;
            y = pos.Y;
        }
        else {
            x = this.getTargetEl().clientWidth * -1;
            this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
            y = window.innerHeight * this.startPosition / 100;
        }
        this.placeAt(x, y);
    }
    returnPosition() {
        let pos = { X: parseInt(this.targetEl.style.left), Y: parseInt(this.targetEl.style.top) };
        return pos;
    }
    moveFromBlast(severity, collisionInfo) {
        if (this.movesAtBlast) {
            if (this.armour >= Armour.moderate) {
                collisionInfo.radius /= 2; // hack to reduce punting armour about
            }
            severity > strikeSeverity.light ? ThrowHandler.moveAtAngle(collisionInfo) : "";
        }
    }
    hit(sev, wepName, collisionInfo) { }
    // Whether there's nothing more to be done about this one: it's destroyed
    isFinished() {
        return this.damage === Damage.destroyed;
    }
    // What a surveillance drone sees (see SurveillanceDrone): the area on the screen this gives off a
    // heat signature across, or null if it isn't giving one off at the moment. It shows when that area
    // is within the drone's scan, and is drawn by the 'heatSig' class.
    heatSignatureBox() {
        return null;
    }
    setHeatSignature(show) {
        this.targetEl.classList.toggle('heatSig', show);
    }
    // Called when a target is cleared away without having run its course (a new stage or a new game),
    // for any that has something of its own still going
    dispose() { }
    move(posX) {
        if (posX > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
            game.updateKillStats(killStatDisplayOptions.escaped);
        }
        this.targetEl.style.left = posX + this.speed + "px";
    }
    targetDisabled() {
        if (this.status != Status.disabled) {
            this.status = Status.disabled;
            game.updateKillStats(killStatDisplayOptions.disabled);
        }
    }
    targetDestroyed(priorStatus) {
        this.damage = Damage.destroyed;
        game.updateKillStats(killStatDisplayOptions.destroyed);
        if (priorStatus == Status.disabled) {
            game.updateKillStats(killStatDisplayOptions.disabled, -1);
        }
        this.removeFromArray();
    }
    removeFromArray() {
        setTimeout(() => {
            let arr = allTargets;
            let index = arr.indexOf(this);
            if (index >= 0) {
                arr.splice(index, 1);
            }
        }, damagedTargetStay + fadeAnimTime);
    }
    destructionBits() { }
    toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "lock_red.svg" + loadNewImage() : this.lockonEl.src = assetsSVGFolder + "target-box.svg";
    }
    toggleLockOn(bool) {
        bool ? this.lockonEl.style.visibility = 'visible' : this.lockonEl.style.visibility = 'hidden';
    }
    getLockOnStatus() {
        return this.lockonEl.style.visibility == 'visible' ? true : false;
    }
    action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
        }
    }
}
// A tiny enemy hiding in a building, with no picture of its own yet -- just a small square, under
// the building's picture. Nothing hits it directly; it's killed (see Building.hit) when the building
// is damaged or destroyed. It counts as a target like any other.
class BuildingEnemy extends Target {
    constructor() {
        super(buildingEnemyTarget);
        this.targetEl.classList.add('buildingEnemy');
    }
    action() { } // it stays put
    // Picked up through the building by a surveillance drone, as long as it's alive
    heatSignatureBox() {
        return this.damage === Damage.destroyed ? null : this.targetEl.getBoundingClientRect();
    }
    eliminate() {
        if (this.damage === Damage.destroyed)
            return;
        this.targetDisabled(); // so it scores as a plain kill, not a "direct hit" popup for each one
        const priorStatus = this.status;
        this.targetDestroyed(priorStatus);
        game.assessKillPoints(priorStatus, this.damage);
        this.setHeatSignature(false);
        ContentElHandler.removeFromContentEl(this.targetEl);
    }
}
class TunnelTarget extends Target {
    //protected trailBlast: string = assetsFolder + classicExplosion;
    damagedSource = assetsFolder + 'smoke_3.gif';
    //protected destroyedSource: string = assetsFolder + 'fire_1.gif';
    trailBlast = expl_small_imgs;
    //  protected destroyedSource: Array<string> = fire_1_frames;
    movesAtBlast = false;
    targetTimer;
    newTargetFrequency = 5000;
    trail;
    // The whole tunnel, from the head right back along the trail, for as long as it's still there
    heatSignatureBox() {
        if (this.damage === Damage.destroyed)
            return null;
        const head = this.targetEl.getBoundingClientRect();
        const trail = this.trail.getBoundingClientRect();
        return {
            left: Math.min(head.left, trail.left),
            top: Math.min(head.top, trail.top),
            right: Math.max(head.right, trail.right),
            bottom: Math.max(head.bottom, trail.bottom),
        };
    }
    constructor() {
        super(regTunnelTarget);
        this.targetEl.classList.add('smallSquare');
        this.trail = document.createElement('div');
        this.trail.className = 'trail';
        this.targetEl.classList.remove('flexCenter'); // MESSY
        this.targetEl.classList.add('flexEnd');
        this.targetEl.classList.add('tunnelHead');
        this.picEl.classList.add('tunnelFocus');
        this.targetEl.append(this.trail);
        this.setTargetProduction();
    }
    get picSources() {
        return ['trans.png'];
    }
    extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    produceTargetCheck() {
        if (!this.targetEl.isConnected) { // cleared off the screen: whatever's left of it mustn't keep producing
            this.stopTargetProduction();
            return;
        }
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 90) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos = { X: rect.x, Y: rect.y };
            let newTarget = new RegVehicleTarget();
            //     newTarget.setPosition(rect.x, rect.y);
            game.targetCreation(newTarget, pos);
            SoundPlayer.playSequentialSound(revs);
        }
    }
    setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            if (game.gameTimer) {
                this.produceTargetCheck();
            }
        }, this.newTargetFrequency);
    }
    stopTargetProduction() {
        clearInterval(this.targetTimer);
    }
    dispose() {
        this.stopTargetProduction();
    }
    hit(severity, wepName) {
        if (wepName < weaponNames.airstrike) {
            return;
        }
        let priorStatus = this.status;
        this.targetDisabled();
        if (severity >= strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.baseImgEl.src = this.damagedSource;
            this.targetEl.classList.remove('tunnelHead');
            this.stopTargetProduction();
            this.blowTunnel();
        }
        else {
        }
    }
    blowTunnel() {
        let numOfimgs = parseInt(this.trail.style.width) / 175;
        let imgArr = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let img in imgArr) {
            let indexNum = parseInt(img);
            setTimeout(() => {
                let blastCenter = CollisionDetection.getXYfromPoint(imgArr[img]);
                if (indexNum == 0) {
                    ExplosionHandler.basicExplosion(blastCenter, ExplSizes.XL, expl_med_imgs, weaponNames.airstrike);
                }
                ExplosionHandler.basicExplosion(blastCenter, ExplSizes.small, this.trailBlast, weaponNames.mortar);
            }, (indexNum + 1) * 150);
        }
        this.removeTunnel(imgArr.length);
    }
    removeTunnel(length) {
        this.trail.classList.add('hide');
        //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove(); }, 8000);
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
            this.extendTunnel();
        }
    }
}
class VehicleTarget extends Target {
    // A vehicle that's up and running is hot, one that's been disabled or wrecked isn't
    heatSignatureBox() {
        return this.status === Status.active && this.damage !== Damage.destroyed ? this.targetEl.getBoundingClientRect() : null;
    }
    wheelSource = assetsFolder + 'vehicles/wheel.png';
    wheelSizeClass;
    movesAtBlast = true;
    angle = 0;
    constructor(info) {
        super(info);
    }
    ricochetChance(num) {
        RandomNumberGen.randomNumBetween(1, 10) > num ? SoundPlayer.playRandomSound(ricochet) : "";
    }
    incrementDamageForArmour() {
        this.damage += 1;
        this.ricochetChance(7);
    }
    hit(severity, wepName, collisionInfo) {
        if (this.wrecked)
            return; // just a burning wreck now: nothing left to flip, shove or damage
        let direc;
        if (collisionInfo) {
            direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
            this.moveFromBlast(severity, collisionInfo);
        }
        if (this.armour == Armour.none) {
            if (wepName == weaponNames.sniper) {
                if (this.damage > Damage.undamaged) {
                    setTimeout(() => this.targetDisabled(), RandomNumberGen.randomNumBetween(200, 1200));
                }
                else {
                    this.lightDamage();
                }
            }
            if (wepName >= weaponNames.mortar) {
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
        if (this.armour == Armour.moderate) {
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.light) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        return;
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
        if (this.armour == Armour.heavy) {
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return;
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.medium) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        if (this.damage == Damage.badlyDented) {
                            this.lightDamage();
                        }
                        return;
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
    }
    removeFlip(elem) {
        elem.classList.remove('flip');
        ThrowHandler.cssRotateAngle(elem, 0);
    }
    hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                SoundPlayer.playRandomSound(acknowledge);
            }
        }
    }
    // A chance for a vehicle to treat a blow as harder (or softer) than the blast's distance alone says.
    adjustSeverity(severity) {
        return severity;
    }
    // Wear: every hit that gets past the armour adds to a running total, the stronger the hit the
    // more, and once a vehicle has taken all it can it's destroyed by the next one, whatever that
    // hit would have done alone. So it can be knocked about and flipped a few times, but a dozen
    // tiny blasts add up to a wreck. Heavier armour holds out longer.
    static wearPerSeverity = [1, 2, 3]; // light, medium, heavy
    static wearToDestroy = [10, 14, 20]; // by armour: none, moderate, heavy
    wear = 0;
    wearDown(severity) {
        if (severity >= strikeSeverity.catastrophic)
            return severity;
        this.wear += VehicleTarget.wearPerSeverity[severity];
        return this.wear >= VehicleTarget.wearToDestroy[this.armour] ? strikeSeverity.catastrophic : severity;
    }
    basicVehicleDamageModel(severity, direc, collisionInfo) {
        severity = this.wearDown(this.adjustSeverity(severity));
        let priorStatus = this.status;
        if (severity == strikeSeverity.light) {
            this.damage >= Damage.badlyDented ? severity = strikeSeverity.medium : "";
            this.lightDamage();
        }
        if (severity >= strikeSeverity.medium) {
            this.targetDisabled();
            this.hitAcknowledge(); /////// put with the other!!!
        }
        if (severity == strikeSeverity.medium) {
            this.damage = Damage.moderateDamaged;
            this.badDamage(direc, collisionInfo);
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc, collisionInfo);
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
        if (severity == strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.completeDestruction(collisionInfo);
            game.assessKillPoints(priorStatus, this.damage);
            return;
        }
    }
    lightDamage() {
        if (this.damage >= Damage.moderateDamaged) {
            return;
        }
        this.damage = Damage.damaged;
        this.smoking();
        //       this.damageEl.src = this.smokingSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    addSrc(src) {
        //return src + loadNewImage();
        return src;
    }
    smoking() {
        this.damageOverlay.playLoop(smoke_imgs);
        //   this.damageEl.src = this.addSrc(this.smokingSource);
    }
    // The glow cast over the dark overlay while this is on fire. One per vehicle however many times
    // it's set alight, and it goes out (see stopFireLight) when the fire does, not when the
    // vehicle is finally cleared away.
    fireLight;
    wrecked = false;
    startFireLight() {
        if (this.fireLight && fires.includes(this.fireLight)) { // still there, perhaps fading: light it again
            this.fireLight.burning = true;
            this.fireLight.fadeStep = undefined;
            return;
        }
        lightID++;
        this.fireLight = { id: lightID, pos: this.returnPosition(), opac: 1, size: ExplSizes.XL, fading: false, parent: this.getTargetEl(), burning: true };
        fires.push(this.fireLight);
    }
    // fadeOver is how long (ms) the glow takes to die away, otherwise it goes in a moment
    stopFireLight(fadeOver) {
        if (!this.fireLight)
            return;
        this.fireLight.burning = false;
        if (fadeOver)
            this.fireLight.fadeStep = 1 / (fadeOver / 100); // the game loop ticks every 100ms
    }
    badDamage(direc, collisionInfo) {
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.damageOverlay.playLoop(fire_1_imgs);
            //        this.damageEl.src = this.addSrc(this.onFireSource);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.startFireLight();
        setTimeout(() => {
            if (RandomNumberGen.randomNumBetween(0, 10) >= 8 && this.damageEl.classList.contains("badDamaged")) {
                this.completeDestruction();
            }
        }, itemStay / 2 + RandomNumberGen.randomNumBetween(0, 3000));
        setTimeout(() => {
            this.damageEl.classList.remove('badDamaged');
            this.damageEl.classList.add('lightDamaged');
            this.smoking();
            if (!this.wrecked)
                this.stopFireLight(); // it's smoke now, which gives no light. A wreck is still burning
        }, fireStay + RandomNumberGen.randomNumBetween(0, 3000));
        if (direc) {
            this.angle = ThrowHandler.flip(this.picEl, direc, crashes, this.targetEl, this.angle);
        }
        ContentElHandler.fadeRemoveItem(this.targetEl, damagedTargetStay, fadeAnimTime);
        this.removeFromArray();
    }
    // How long the burning wreck of a completely destroyed vehicle stays before it starts to fade.
    get destroyedStay() {
        return destroyedTargetStay;
    }
    completeDestruction(collisionInfo) {
        this.targetEl.classList.remove('smoothTransition');
        this.targetEl.classList.add('smoothFade');
        this.removeFlip(this.picEl);
        this.wrecked = true;
        this.startFireLight();
        this.baseImgEl.src = this.addSrc(this.destroyedSource);
        this.baseImgEl.className = 'destroyed';
        this.damageOverlay.hide();
        this.targetEl.classList.add('show');
        ContentElHandler.fadeRemoveItem(this.targetEl, this.destroyedStay, fadeAnimTime);
        SoundPlayer.playRandomSound(explosions);
        this.destructionBits();
    }
    lightOnFire(elem) {
        ElementCreator.returnNewImageEl(elem, 'wheelFire', this.onFireSource, true);
    }
    rollWheel() {
        let wheel = this.createWheel();
        wheel.classList.add("rollWheel");
    }
    createWheel() {
        let wheel = this.returnBit(this.wheelSource, "wheel", "wheelPic");
        wheel.classList.add(this.wheelSizeClass);
        return wheel;
    }
    throwWheel(direc) {
        let wheel = this.createWheel();
        this.lightOnFire(wheel);
        let wheelPic = wheel.querySelector(".wheelPic");
        ThrowHandler.flip(wheelPic, direc, null, wheel, undefined, ThrowHandler.removeIfLandedInWater);
    }
    destructionBits() {
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
    }
}
class WaterVehicleTarget extends VehicleTarget {
    static shoreMargin = 10; // how far inside the open water a boat has to stay
    static fireBeforeSinkMin = 2000;
    static fireBeforeSinkMax = 7000;
    static explodeChance = 15; // percent of burning boats that blow up rather than sink
    static sinkDuration = 6000;
    static tiltPause = 1500;
    static tiltSinkDuration = 7000;
    // The boat pictures, in AS_assets/vehicles. Ships are big and go down by the bow or stern; tugs are
    // the smaller sort (see .smallBoat in cssApp.css), unarmoured, and go straight down. A new boat is
    // as likely to be either sort, whatever the number of pictures of each.
    static shipPics = ['Ship_1.png', 'Ship_2.png', 'Ship_3.png', 'Ship_5.png', 'Ship_6.png', 'Ship_7.png', 'Ship_8.png', 'Ship_10.png', 'Ship_11.png', 'Ship_12.png', 'Ship_13.png'];
    static tugPics = ['Tug_1.png', 'Tug_2.png', 'Tug_3.png'];
    constructor() {
        super(boatTarget);
        this.targetEl.classList.add('longTarget');
        if (WaterVehicleTarget.tugPics.some(pic => this.baseImgEl.src.endsWith('/' + pic))) {
            this.targetEl.classList.add('smallBoat');
            this.armour = smallBoatTarget.armour;
        }
    }
    // Where the wreckage flies out from if it blows up: the point on the hull the blast struck,
    // remembered from when the boat was hit.
    strikePoint;
    createScrap() {
        return this.returnBit(assetsFolder + "bit.png", "wheel", "wheelPic", this.strikePoint);
    }
    throwBit(direc) {
        let bit = this.createScrap();
        ThrowHandler.flip(bit, direc, null, undefined, undefined, ThrowHandler.removeIfLandedInWater);
    }
    destructionBits() {
        this.throwBit(direction.forward);
        this.throwBit(direction.backward);
    }
    get picSources() {
        const sort = RandomNumberGen.randomNumBetween(0, 1) ? WaterVehicleTarget.tugPics : WaterVehicleTarget.shipPics;
        return ['vehicles/' + RandomNumberGen.returnRandomFromArray(sort)];
    }
    // A wrecked boat's fire burns out in half the time -- it's sitting on water.
    get destroyedStay() {
        return destroyedTargetStay / 2;
    }
    // The hull: the full length of the visible picture, lower half. The upper half is just the mast
    // and superstructure, so a blast landing up there is really a shot over the ship -- it only
    // counts if the blast's own area reaches down to the hull. Anywhere on the hull is a hit, but
    // a weak one out towards the ends: the strongest hits are still the ones nearest the middle.
    hitBox() {
        const rect = this.baseImgEl.getBoundingClientRect();
        return { left: rect.left, top: rect.top + rect.height / 2, right: rect.right, bottom: rect.bottom };
    }
    // A badly damaged boat always burns for a while and then sinks, rather than the generic
    // vehicle's chance of an early explosion or recovering back to just smoking. The strike that
    // first sets it ablaze decides how it goes down: struck near one end it sinks by that end
    // (bow first if the bow was hit, stern first if the stern was), struck amidships it goes
    // straight down.
    sinkScheduled = false;
    badDamage(direc, collisionInfo) {
        if (this.sinkScheduled)
            return; // already burning and on its way down
        this.sinkScheduled = true;
        this.strikePoint = this.impactPoint(collisionInfo, this.hitBox());
        if (!this.damageEl.classList.contains("badDamaged")) {
            this.damageOverlay.playLoop(fire_1_imgs);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.startFireLight();
        let tilt = this.tiltForStrike(collisionInfo);
        let fireDuration = RandomNumberGen.randomNumBetween(WaterVehicleTarget.fireBeforeSinkMin, WaterVehicleTarget.fireBeforeSinkMax);
        setTimeout(() => {
            if (this.damage === Damage.destroyed || !this.targetEl.isConnected)
                return; // already wrecked some other way while it burned, or cleared away with its game
            // Once the fire has done for it -- it's blowing up or going under -- it's destroyed. That
            // counts now, not when the sinking has finished playing out.
            let priorStatus = this.status;
            this.targetDestroyed(priorStatus);
            game.assessKillPoints(priorStatus, this.damage);
            if (RandomNumberGen.randomNumBetween(1, 100) <= WaterVehicleTarget.explodeChance) {
                this.completeDestruction(); // the same wreck and fireball as a direct hit
            }
            else {
                tilt === 0 ? this.sink() : this.tiltingSink(tilt);
            }
        }, fireDuration);
    }
    // A boat that's already burning can still be finished off: a heavy blow (a direct hit, or an
    // airstrike landing on it) sends it up in the full destruction fireball instead of just feeding
    // the fire. Gentler hits don't add anything, it's burning already. (Once the fire has done for
    // it and it's going down, it's destroyed, and hits no longer register.)
    adjustSeverity(severity) {
        return this.sinkScheduled && severity >= strikeSeverity.heavy ? strikeSeverity.catastrophic : severity;
    }
    // If that happens part way through the sinking, the boat's picture and fire are inside the sink
    // window (clipped, and moving down), so put them back where they belong first, otherwise the
    // fireball would be cut off by the waterline.
    completeDestruction(collisionInfo) {
        this.cancelSinking();
        if (collisionInfo || !this.strikePoint) {
            this.strikePoint = this.impactPoint(collisionInfo, this.hitBox());
        }
        super.completeDestruction(collisionInfo);
    }
    // Which way a strike should tip the boat: 1 for the bow going down, -1 for the stern, 0 for
    // straight down (hit in the middle third of the hull, nothing known about where it landed, or a
    // small boat -- the slow tilt is a big ship thing).
    // The sprite faces right, so a blast to the right of the boat's middle hit the bow.
    tiltForStrike(collisionInfo) {
        if (!collisionInfo || this.targetEl.classList.contains('smallBoat'))
            return 0; // a small boat just goes down
        // the angle and distance run from the blast to the boat, hence the minus
        const strikeX = -collisionInfo.dist * Math.cos(collisionInfo.angle * Math.PI / 180);
        const amidships = this.targetEl.offsetWidth / 6;
        return strikeX > amidships ? 1 : strikeX < -amidships ? -1 : 0;
    }
    // Puts the boat's image AND its fire/smoke canvas in one "group" inside a fixed, unrotated
    // overflow:hidden window. The window never moves or resizes -- its bottom edge is the waterline,
    // level with the bottom of the boat as it sits now -- it's the group that gets translated
    // downward and (optionally) rotated, disappearing as it's clipped by that edge, so the boat
    // (fire included) visibly sinks down into a block of water beneath it. The group rotates about
    // the middle of the bottom of the hull (see .sinkGroup), so a tilt dips one end straight into
    // the water rather than swinging about the middle of the boat; the window has room above and
    // to the sides so the end that lifts isn't cropped.
    sinkMask; // there once the sinking has started
    createSinkMask() {
        const targetRect = this.targetEl.getBoundingClientRect();
        const picRect = this.picEl.getBoundingClientRect();
        const damageRect = this.damageEl.getBoundingClientRect();
        const headroom = picRect.width / 2;
        const sideRoom = picRect.height;
        const mask = ElementCreator.returnNewDiv(this.targetEl, "sinkMask");
        this.sinkMask = mask;
        mask.style.left = (picRect.left - targetRect.left - sideRoom) + "px";
        mask.style.top = (picRect.top - targetRect.top - headroom) + "px";
        mask.style.width = (picRect.width + 2 * sideRoom) + "px";
        mask.style.height = (picRect.height + headroom) + "px";
        const group = ElementCreator.returnNewDiv(mask, "sinkGroup");
        group.style.left = sideRoom + "px";
        group.style.top = headroom + "px";
        group.style.width = picRect.width + "px";
        group.style.height = picRect.height + "px";
        group.appendChild(this.baseImgEl);
        this.baseImgEl.style.width = picRect.width + "px"; // picEl's CSS sized it via "width: 100%", which no longer applies once it's moved out of picEl
        this.picEl.style.visibility = "hidden";
        group.appendChild(this.damageEl);
        this.damageEl.style.position = "absolute";
        this.damageEl.style.left = (damageRect.left - picRect.left) + "px"; // damageEl was centered over picEl via flex layout -- pin that same spot explicitly now it's absolutely positioned inside the group
        this.damageEl.style.top = (damageRect.top - picRect.top) + "px";
        void group.offsetHeight; // lay it out now, so the transform changes that follow animate instead of jumping
        return { mask, group };
    }
    // Undoes createSinkMask: the picture and fire go back to where they were, and the window goes.
    cancelSinking() {
        if (!this.sinkMask)
            return;
        this.picEl.appendChild(this.baseImgEl);
        this.baseImgEl.style.width = "";
        this.picEl.style.visibility = "";
        this.targetEl.appendChild(this.damageEl);
        this.damageEl.style.position = "";
        this.damageEl.style.left = "";
        this.damageEl.style.top = "";
        this.sinkMask.remove();
        this.sinkMask = null;
    }
    sink() {
        let { mask, group } = this.createSinkMask();
        let sinkDistance = mask.getBoundingClientRect().height * 1.2; // overshoot a bit so it's fully clear of the window
        this.stopFireLight(WaterVehicleTarget.sinkDuration); // the fire goes down with the boat
        group.style.transition = `transform ${WaterVehicleTarget.sinkDuration / 1000}s ease-in`;
        group.style.transform = `translateY(${sinkDistance}px)`;
        setTimeout(() => this.finishSinking(), WaterVehicleTarget.sinkDuration);
    }
    // tilt is 1 to go down by the bow (the right-hand end), -1 for the stern
    tiltingSink(tilt) {
        let { mask, group } = this.createSinkMask();
        let sinkDistance = mask.getBoundingClientRect().height * 1.2;
        let tiltAngle = tilt * RandomNumberGen.randomNumBetween(20, 35);
        this.stopFireLight(WaterVehicleTarget.tiltSinkDuration);
        group.style.transition = `transform ${WaterVehicleTarget.tiltPause / 1000}s ease-in-out`;
        group.style.transform = `rotate(${tiltAngle}deg)`;
        setTimeout(() => {
            let submergeDuration = (WaterVehicleTarget.tiltSinkDuration - WaterVehicleTarget.tiltPause) / 1000;
            group.style.transition = `transform ${submergeDuration}s ease-in`;
            group.style.transform = `translateY(${sinkDistance}px) rotate(${tiltAngle}deg)`;
        }, WaterVehicleTarget.tiltPause);
        setTimeout(() => this.finishSinking(), WaterVehicleTarget.tiltSinkDuration);
    }
    // The boat has been destroyed since it started to go down (see badDamage), so this is just the
    // clearing away of it once it's out of sight.
    finishSinking() {
        this.damageOverlay.hide();
        ContentElHandler.removeFromContentEl(this.targetEl); // it's gone under the water: nothing left to throw about
    }
    // Anywhere in open water: the whole boat has to fit between the left of the water and the
    // start of the faded shallows at the shore (see Shoreline), not just its top-left corner.
    decidePosition() {
        const size = this.targetEl.getBoundingClientRect();
        const minY = Math.ceil(window.innerHeight * 0.1);
        const maxY = Math.floor(window.innerHeight * 0.9 - size.height);
        for (let attempt = 0; attempt < 50; attempt++) {
            const y = RandomNumberGen.randomNumBetween(minY, maxY);
            const span = Shoreline.waterSpan(y, y + size.height);
            if (!span)
                break; // no water showing at all
            const minX = Math.ceil(Math.max(span.left + WaterVehicleTarget.shoreMargin, 0));
            const maxX = Math.floor(Math.min(span.openRight - WaterVehicleTarget.shoreMargin - size.width, window.innerWidth - size.width));
            if (maxX >= minX) {
                this.placeAt(RandomNumberGen.randomNumBetween(minX, maxX), y);
                return;
            }
        }
        console.warn("no open water to place a boat in");
    }
}
class RegVehicleTarget extends VehicleTarget {
    wheelSizeClass = "smallWheel";
    constructor() {
        super(regTarget);
        this.targetEl.classList.add('smallSquare');
    }
    get picSources() {
        return ['Jeep__.png', 'Jeep__light.png', 'Jeep__grey.png', 'Jeep2__.png', 'Jeep2__light.png', 'Jeep2__lightgrey.png', 'Jeep2__tan.png'].map(pic => 'vehicles/' + pic); // 'Jeep2__grey.png', 
        //  return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    wheelSizeClass = "medWheel";
    constructor() {
        super(modTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    get picSources() {
        return ['vehicles/truck__tan2.png', 'vehicles/truck__green.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    wheelSizeClass = "medWheel";
    constructor() {
        super(heavyTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    get picSources() {
        return ['vehicles/truck__grey.png'];
    }
}
class RocketLauncher extends VehicleTarget {
    wheelSizeClass = "medWheel";
    stopPos;
    deployed = false;
    launcherEl;
    noStrikeZone;
    constructor() {
        super(rocketLauncher);
        this.targetEl.classList.add('medRectTarget');
        this.stopPos = RandomNumberGen.randomNumBetween(50, 200);
        this.launcherEl = ElementCreator.returnNewImageEl(this.picEl, 'rocketPack', assetsFolder + "vehicles/rockets.png");
    }
    get picSources() {
        return ['vehicles/launcher.png'];
        // return ['rocketVehicle.jpg'];
        //   picSources: ['rocketVehicle_undeployed.jpg']
    }
    move() {
        let x = parseInt(this.targetEl.style.left);
        this.targetEl.style.left = x + this.speed + "px";
    }
    hit(severity, wepName, collisionInfo) {
        super.hit(severity, wepName, collisionInfo);
        if (this.damage > Damage.badlyDented) {
            if (this.noStrikeZone) {
                this.removeNoStrikeZone();
            }
        }
        if (this.damage > Damage.damaged) {
            //this.flip(this.launcherEl, direc)
            //this.launcherEl.remove();
            this.throwRocketPack();
        }
    }
    throwRocketPack() {
        let pack = this.launcherEl;
        ElementCreator.positionAbsoluteAtElementRect(pack, pack);
        pack.remove();
        ContentElHandler.addToContentEl(pack);
        allObjects.push(pack);
        ThrowHandler.flip(pack, direction.backward, crashes, undefined, undefined, ThrowHandler.removeIfLandedInWater); /////////////////////////////////////////////////////////////////
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out'; }, itemStay); // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, itemStay, fadeAnimTime, allObjects);
    }
    inNoStrikeZone(target) {
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z;
                //if (CollisionDetection.checkCollisionWithElement(target.getTargetEl(), zone)) {
                if (CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl())) {
                    return true;
                }
            }
        }
        return false;
    }
    action() {
        if (this.status == Status.active) {
            let posX = parseInt(this.targetEl.style.left);
            if (posX < this.stopPos || this.inNoStrikeZone(this) && this.deployed == false) {
                this.move();
            }
            else {
                if (this.damage < Damage.badlyDented && this.deployed == false) {
                    this.deploy();
                    this.deployed = true;
                }
            }
        }
        else {
            if (this.noStrikeZone) {
                console.log("Hit ACTION nostrikezone remove");
                this.removeNoStrikeZone();
            }
        }
        //if (this.damage > Damage.badlyDented) {
        //    this.noStrikeZone.remove();
        //}
    }
    deploy() {
        let delay = 500;
        let zoneDelay = 1500;
        let _this = this;
        setTimeout(() => {
            SoundPlayer.playWithVolumeSet(activate);
            _this.launcherEl.classList.add('raiseLauncher');
        }, delay);
        setTimeout(() => {
            _this.setNoStrikeZone();
        }, delay + zoneDelay);
    }
    setNoStrikeZone() {
        this.noStrikeZone = ElementCreator.returnNewDiv(this.targetEl, 'noStrikeZone');
        this.noStrikeZone.addEventListener('mouseover', this.overNoStrikeZone.bind(this));
        this.noStrikeZone.addEventListener('mouseleave', this.leaveNoStrikeZone.bind(this));
    }
    removeNoStrikeZone() {
        this.noStrikeZone.remove();
        this.noStrikeZone = null;
    }
    overNoStrikeZone() {
        game.strikesRestricted = true;
    }
    leaveNoStrikeZone() {
        game.strikesRestricted = false;
    }
}
//# sourceMappingURL=target.js.map