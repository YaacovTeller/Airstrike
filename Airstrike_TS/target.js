"use strict";
// The little shards in AS_assets/bits (Bit_<name>.png): chunks cut from roofs and domes, and from cars and boats
function bitPath(name) {
    return assetsFolder + "bits/Bit_" + name + ".png";
}
// A type made of the pictures Structure_<code>_1, _2 and _3 (undamaged, damaged, destroyed)
function structureInfo(code, width, height, hide) {
    const name = (stage) => "Structure_" + code + "_" + stage + ".png";
    // the warehouses (rows 1 and 2) throw chunks of their own coloured roofs
    const bits = /^r[12]c\d$/.test(code) ? [bitPath("roof_" + code)] : undefined;
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: bits };
}
// Add new building types here to get them into the random rotation. Enemies can hide in all of them but the two
// fences (r5c4 and r5c7), which are open mesh the picture wouldn't hide anyone behind -- a `hide` of undefined
// is what says so. (The sizes are the pictures' at
// 0.4 of their natural size. Warehouse_blue_* and Warehouse_brown_* are the older pictures of
// Structure_r1c1 and Structure_r1c5, and aren't used now.)
const allBuildingInfo = [
    structureInfo("r1c1", 107, 98, { x: [15, 80], y: [23, 81] }),
    structureInfo("r1c2", 95, 91, { x: [16, 73], y: [23, 74] }),
    structureInfo("r1c3", 112, 84, { x: [13, 86], y: [3, 66] }),
    structureInfo("r1c4", 109, 84, { x: [15, 78], y: [9, 65] }),
    structureInfo("r1c5", 146, 98, { x: [14, 114], y: [23, 79] }),
    structureInfo("r2c1", 98, 76, { x: [16, 71], y: [4, 60] }),
    structureInfo("r2c2", 86, 76, { x: [18, 54], y: [17, 60] }),
    structureInfo("r2c3", 90, 76, { x: [9, 69], y: [20, 60] }),
    structureInfo("r2c4", 96, 69, { x: [12, 68], y: [4, 54] }),
    structureInfo("r2c5", 113, 80, { x: [10, 89], y: [20, 64] }),
    structureInfo("r2c6", 99, 68, { x: [22, 63], y: [12, 49] }),
    structureInfo("r3c1", 62, 57, { x: [10, 38], y: [15, 42] }),
    structureInfo("r3c2", 57, 54, { x: [8, 33], y: [13, 39] }),
    structureInfo("r3c3", 70, 54, { x: [18, 42], y: [11, 39] }),
    structureInfo("r3c4", 62, 55, { x: [13, 34], y: [12, 40] }),
    structureInfo("r3c5", 60, 50, { x: [13, 37], y: [11, 35] }),
    structureInfo("r3c6", 55, 50, { x: [10, 31], y: [10, 35] }),
    structureInfo("r3c7", 57, 52, { x: [13, 30], y: [17, 35] }),
    structureInfo("r3c8", 50, 52, { x: [9, 27], y: [17, 35] }),
    structureInfo("r3c9", 66, 50, { x: [14, 37], y: [16, 34] }),
    structureInfo("r4c1", 71, 52, { x: [13, 48], y: [3, 37] }),
    structureInfo("r4c2", 66, 56, { x: [8, 44], y: [5, 40] }),
    structureInfo("r4c3", 67, 57, { x: [9, 44], y: [10, 41] }),
    structureInfo("r4c4", 70, 54, { x: [10, 49], y: [5, 39] }),
    structureInfo("r4c5", 73, 56, { x: [9, 48], y: [5, 40] }),
    structureInfo("r4c6", 66, 57, { x: [7, 46], y: [15, 42] }),
    structureInfo("r4c7", 56, 56, { x: [8, 35], y: [11, 42] }),
    structureInfo("r4c8", 78, 59, { x: [7, 55], y: [16, 44] }),
    structureInfo("r5c1", 55, 60, { x: [15, 23], y: [15, 43] }),
    structureInfo("r5c2", 48, 61, { x: [11, 20], y: [7, 45] }),
    structureInfo("r5c3", 54, 55, { x: [13, 27], y: [13, 39] }),
    structureInfo("r5c4", 71, 46, undefined),
    structureInfo("r5c5", 66, 57, { x: [11, 42], y: [11, 41] }),
    structureInfo("r5c6", 68, 46, { x: [16, 21], y: [11, 29] }),
    structureInfo("r5c7", 56, 45, undefined),
    structureInfo("r5c8", 63, 47, { x: [14, 27], y: [6, 32] }),
    structureInfo("r5c9", 66, 40, { x: [12, 26], y: [11, 24] }),
];
// The port buildings (AS_assets/buildings/port buildings): what the Coast level is built of. Each is a whole compound,
// with its own platform or fence, in its three states (Name_1 intact, _2 heavily damaged, _3 destroyed). Sizes are 0.36
// of natural. There's only ever the one of each of the lighthouses, towers, mosque and repair dock.
const waterfrontPortBuildings = ["Crane_Dockside", "Crane_Harbour", "Crane_Container", "Quay_Straight", "Quay_Corner", "Jetty",
    "Breakwater", "Repair_Dock", "Lighthouse", "Lighthouse_B"];
const singlePortBuildings = ["Lighthouse", "Lighthouse_B", "Comms_Tower", "Radio_Tower", "Port_Mosque"];
function portInfo(name, width, height, hide, folder = "") {
    const file = (stage) => "port buildings/" + folder + name + "_" + stage + ".png";
    return { undamaged: file(1), damaged: file(2), destroyed: file(3), width: width, height: height, hide: hide, single: singlePortBuildings.includes(name), waterfront: waterfrontPortBuildings.includes(name), group: name == "Port_Mosque" ? "mosque" : name.startsWith("Lighthouse") ? "lighthouse" : undefined };
}
const allPortBuildingInfo = [
    portInfo("Checkpoint", 77, 72, { x: [17, 44], y: [29, 49] }),
    portInfo("Comms_Tower", 72, 87, { x: [16, 43], y: [45, 66] }),
    portInfo("Customs", 101, 76, { x: [18, 63], y: [31, 52] }),
    portInfo("Customs_B", 120, 83, { x: [20, 74], y: [39, 59] }),
    portInfo("Fuel_Depot_B", 110, 64, { x: [22, 78], y: [22, 39] }),
    portInfo("Guard_Shack", 66, 52, { x: [21, 38], y: [12, 30] }),
    portInfo("Lighthouse", 76, 98, { x: [11, 43], y: [66, 77] }),
    portInfo("Lighthouse_B", 78, 101, { x: [20, 46], y: [68, 80] }),
    portInfo("Port_Mosque", 78, 83, { x: [14, 51], y: [34, 58] }),
    portInfo("Port_Office", 93, 81, { x: [13, 66], y: [27, 54] }),
    portInfo("Port_Office_B", 106, 83, { x: [22, 68], y: [30, 60] }),
    portInfo("Quay_Corner", 100, 61, undefined),
    portInfo("Quay_Straight", 133, 77, { x: [87, 98], y: [20, 25] }),
    portInfo("Quonset_Hut", 82, 57, { x: [18, 50], y: [16, 34] }),
    portInfo("Radio_Tower", 80, 88, { x: [22, 39], y: [62, 70] }),
    portInfo("Small_Warehouse", 85, 63, { x: [14, 58], y: [14, 36] }),
    portInfo("Utility_Shed", 69, 51, { x: [15, 43], y: [14, 29] }),
    portInfo("Warehouse_Adobe", 126, 88, { x: [22, 95], y: [24, 54] }),
    portInfo("Warehouse_Concrete_Metal", 130, 92, { x: [26, 100], y: [23, 57] }),
    portInfo("Warehouse_Concrete_Sloped", 127, 81, { x: [14, 89], y: [28, 51] }),
    portInfo("Warehouse_Metal_Rounded", 116, 77, { x: [24, 86], y: [22, 48] }),
    portInfo("Warehouse_Metal_Sloped", 134, 79, { x: [24, 95], y: [25, 50] }),
    portInfo("Warehouse_Plain", 86, 60, { x: [19, 60], y: [13, 34] }),
    portInfo("Warehouse_Quonset", 125, 89, { x: [25, 93], y: [23, 57] }),
    portInfo("Warehouse_Stone_Brick", 118, 86, { x: [15, 88], y: [19, 54] }),
    portInfo("Warehouse_Stone_Sloped", 113, 80, { x: [24, 87], y: [25, 49] }),
    portInfo("Workshop", 114, 80, { x: [14, 90], y: [22, 50] }),
    portInfo("Workshop_B", 128, 77, { x: [23, 94], y: [20, 50] }),
    portInfo("Workshop_Small", 82, 62, { x: [11, 53], y: [19, 37] }),
];
// The cranes, piers and dock that face the sea, which are drawn for one slant of coast or the other and kept in their own folders:
// coast NW (AS_assets/buildings/port buildings/coast NW) for the steep coast, with the sea to the upper left, whose piers run
// from the top left down to the shore at the bottom right, and coast SW for the sliced coast, with the sea below and to the left,
// whose piers run from the shore at the top right down to the left. SW is the NW set turned over, with the better first pictures
// the user redrew (and no jetty). Each state is the same size as its NW twin, and its hiding spots are mirrored.
const seaFacingNW = [
    portInfo("Breakwater", 118, 77, { x: [56, 70], y: [41, 47] }, "coast NW/"),
    portInfo("Crane_Container", 127, 99, { x: [28, 56], y: [14, 61] }, "coast NW/"),
    portInfo("Crane_Dockside", 108, 110, { x: [34, 59], y: [81, 89] }, "coast NW/"),
    portInfo("Crane_Harbour", 88, 102, { x: [25, 36], y: [70, 79] }, "coast NW/"),
    portInfo("Jetty", 102, 69, { x: [58, 70], y: [33, 37] }, "coast NW/"),
    portInfo("Repair_Dock", 136, 95, { x: [52, 97], y: [51, 70] }, "coast NW/"),
];
const seaFacingSW = seaFacingNW.filter(info => !info.undamaged.includes("/Jetty_")).map(info => {
    const mirrored = info.hide ? { x: [info.width - info.hide.x[1], info.width - info.hide.x[0]], y: info.hide.y } : undefined;
    const sw = (file) => file.replace("coast NW/", "coast SW/");
    return { ...info, undamaged: sw(info.undamaged), damaged: sw(info.damaged), destroyed: sw(info.destroyed), hide: mirrored };
});
// Industrial odds and ends (AS_assets/buildings/industrial misc): the fuel station and depot, storage shed and pad, the
// water tank, four water towers and four container yards. The Hills level uses all but the yards, the Coast level the lot.
// Sizes are 0.36 of natural, but the yards 0.5 (they're a low, wide thing: the sizes are set here, the pictures aren't resaved).
function industrialInfo(name, width, height, hide) {
    const file = (stage) => "industrial misc/" + name + "_" + stage + ".png";
    return { undamaged: file(1), damaged: file(2), destroyed: file(3), width: width, height: height, hide: hide, noParking: name.startsWith("Water_Tower") };
}
const allIndustrialInfo = [
    industrialInfo("Container_Yard_Circular", 132, 66, { x: [27, 101], y: [20, 45] }),
    industrialInfo("Container_Yard_Large", 144, 76, { x: [34, 86], y: [25, 44] }),
    industrialInfo("Container_Yard_Rail", 154, 68, { x: [29, 83], y: [30, 44] }),
    industrialInfo("Container_Yard_Small", 124, 66, { x: [27, 82], y: [15, 40] }),
    industrialInfo("Container_Yard_B1", 130, 63, { x: [39, 81], y: [23, 40] }),
    industrialInfo("Container_Yard_B2", 128, 61, { x: [42, 77], y: [21, 38] }),
    industrialInfo("Container_Yard_B3", 123, 59, { x: [34, 77], y: [16, 36] }),
    industrialInfo("Container_Yard_B4", 118, 57, { x: [30, 77], y: [17, 34] }),
    industrialInfo("Water_Tower_B1", 81, 86, { x: [29, 45], y: [11, 69] }),
    industrialInfo("Water_Tower_B2", 80, 89, { x: [33, 42], y: [15, 73] }),
    industrialInfo("Water_Tower_B3", 80, 86, { x: [25, 45], y: [13, 68] }),
    industrialInfo("Water_Tower_B4", 81, 89, { x: [32, 41], y: [13, 72] }),
    industrialInfo("Fuel_Depot", 100, 68, { x: [13, 72], y: [19, 38] }),
    industrialInfo("Fuel_Station", 80, 68, { x: [20, 50], y: [24, 45] }),
    industrialInfo("Storage_Pad", 89, 55, { x: [21, 56], y: [16, 31] }),
    industrialInfo("Storage_Shed", 113, 65, { x: [27, 69], y: [22, 42] }),
    industrialInfo("Water_Tank", 79, 57, { x: [17, 48], y: [18, 35] }),
    industrialInfo("Water_Tower_Box", 83, 78, { x: [28, 41], y: [9, 61] }),
    industrialInfo("Water_Tower_Concrete", 83, 81, { x: [29, 43], y: [11, 65] }),
    industrialInfo("Water_Tower_Conical", 82, 80, { x: [30, 42], y: [11, 64] }),
    industrialInfo("Water_Tower_Metal", 79, 81, { x: [30, 41], y: [11, 65] }),
];
function industrialByName(name) {
    return allIndustrialInfo.find(info => info.undamaged === "industrial misc/" + name + "_1.png");
}
// A copy of a building type at another scale, hiding spots and all
function scaledBuildingInfo(info, factor) {
    const hide = info.hide ? { x: [Math.round(info.hide.x[0] * factor), Math.round(info.hide.x[1] * factor)], y: [Math.round(info.hide.y[0] * factor), Math.round(info.hide.y[1] * factor)] } : undefined;
    return { ...info, width: Math.round(info.width * factor), height: Math.round(info.height * factor), hide: hide };
}
// The villas (AS_assets/buildings/villas) are building types too, but aren't in the usual rotation:
// the Hills level uses them. Their destroyed picture is one of the generic ruins. Sizes are 0.28 of natural.
function villaInfo(letter, width, height, hide) {
    const name = (stage) => "villas/Villa_" + letter + "_" + stage + ".png";
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: [bitPath("roof_red")] };
}
// The mosques (AS_assets/buildings/mosques): three of them, a village has one. Undamaged, damaged (the tower half
// broken) and destroyed (the tower gone); there's also a complete ruin, _4, that nothing uses yet. Sizes are 0.36
// of natural.
function mosqueInfo(letter, width, height, hide, folder = "mosques/") {
    const name = (stage) => folder + "Mosque_" + letter + "_" + stage + ".png";
    const bit = bitPath("mosque_" + (folder.endsWith("fancy/") ? "fancy_" : "") + letter); // a piece of its dome
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: [bit] };
}
const allMosqueInfo = [
    mosqueInfo("A", 76, 101, { x: [42, 50], y: [48, 76] }),
    mosqueInfo("B", 76, 107, { x: [20, 51], y: [49, 77] }),
    mosqueInfo("C", 81, 109, { x: [18, 50], y: [52, 72] }),
];
// The other mosques, for the bigger villages: the second sheet's small and medium for the medium ones, and for the
// large ones its large and the grander pictures in mosques/fancy (the fancy large is too much to use). Sizes are
// each picture's own scale, from 0.3 to 0.42 of natural.
const mediumMosqueInfo = [
    mosqueInfo("Small", 87, 101, { x: [44, 58], y: [47, 65] }),
    mosqueInfo("Medium", 76, 102, { x: [29, 52], y: [56, 68] }),
];
const largeMosqueInfo = [
    mosqueInfo("Large", 124, 136, { x: [49, 69], y: [82, 92] }),
    mosqueInfo("Small", 95, 94, { x: [18, 62], y: [44, 69] }, "mosques/fancy/"),
    mosqueInfo("Medium", 113, 115, { x: [17, 80], y: [47, 84] }, "mosques/fancy/"),
];
// What the Coast level is built of: the port buildings, the industrial ones, and the bigger mosques (one mosque to a layout,
// whichever)
const coastBuildingInfo = [
    ...allPortBuildingInfo,
    ...seaFacingNW,
    ...seaFacingSW,
    ...allIndustrialInfo,
    ...largeMosqueInfo.map(info => ({ ...info, single: true, group: "mosque" })),
];
// The apartment blocks (AS_assets/buildings/blocks): four kinds, each intact, really damaged and destroyed.
// Sizes are 0.4 of natural: they're meant to tower over the villas (0.28).
function blockInfo(number, width, height, hide) {
    const name = (stage) => "blocks/Block_" + number + "_" + stage + ".png";
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide };
}
const allBlockInfo = [
    blockInfo(1, 124, 124, { x: [20, 92], y: [28, 88] }),
    blockInfo(2, 115, 122, { x: [19, 84], y: [20, 92] }),
    blockInfo(3, 136, 126, { x: [14, 113], y: [29, 84] }),
    blockInfo(4, 164, 130, { x: [27, 125], y: [28, 92] }),
    // the newer pictures: 5-8 are the low two-storey ones (0.32 of natural), 9-12 the tall ones (0.36)
    blockInfo(5, 116, 83, { x: [20, 86], y: [26, 50] }),
    blockInfo(6, 115, 85, { x: [16, 74], y: [29, 57] }),
    blockInfo(7, 103, 78, { x: [15, 78], y: [20, 55] }),
    blockInfo(8, 124, 90, { x: [19, 96], y: [22, 57] }),
    blockInfo(9, 111, 114, { x: [18, 78], y: [17, 85] }),
    blockInfo(10, 110, 117, { x: [20, 80], y: [23, 90] }),
    blockInfo(11, 123, 109, { x: [14, 96], y: [23, 75] }),
    blockInfo(12, 146, 121, { x: [15, 115], y: [27, 82] }),
];
// The smaller apartment blocks: 1 and 2, and the low ones, 5 to 8
const smallBlockInfo = [1, 2, 5, 6, 7, 8].map(n => allBlockInfo.find(info => info.undamaged === "blocks/Block_" + n + "_1.png"));
// A copy of a building type at a different size (the pictures are the same, so only the box changes). No enemies
// hide in it, as the hiding spots were measured at the original size.
function resizedBuildingInfo(info, factor) {
    return { ...info, width: Math.round(info.width * factor), height: Math.round(info.height * factor), hide: undefined };
}
const allVillaInfo = [
    villaInfo("A", 68, 59, { x: [15, 44], y: [10, 39] }),
    villaInfo("B", 64, 62, { x: [11, 40], y: [10, 39] }),
    villaInfo("C", 85, 63, { x: [10, 54], y: [15, 40] }),
    villaInfo("D", 76, 67, { x: [10, 53], y: [11, 44] }),
    villaInfo("E", 71, 66, { x: [9, 46], y: [12, 42] }),
    villaInfo("F", 74, 65, { x: [12, 49], y: [12, 45] }),
];
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
    static debrisOnNewStage = 8; // when a hit takes it down a stage (undamaged to damaged, damaged to destroyed)
    static debrisWhenGone = 18;
    // A blast that brings down a lot of buildings would throw hundreds of pieces and bog the game down, so the more buildings
    // that have thrown debris in the last moment, the fewer each throws (half, then a third), and there is a limit to how many
    // pieces there can be in all
    static recentDebris = [];
    static maxBits = 170; // when it's brought down completely: a lot of pieces, three times what it used to be
    static loudPieces = 4; // of which only this many make a noise landing
    static ownBitChance = 60; // percent of the pieces, for the buildings that have bits of their own
    // A bunker beneath it (see Bunker), if it has one
    bunker;
    // Enemies hiding inside, under the picture. The building's damage is what decides their fate.
    occupants = [];
    addOccupant(enemy) {
        this.occupants.push(enemy);
    }
    // Somewhere within the building's picture to hide (on the page): anywhere its type says the picture
    // covers an enemy's square in both its undamaged and damaged states.
    randomHidingSpot() {
        const hide = this.info.hide;
        return {
            X: parseInt(this.targetEl.style.left) + RandomNumberGen.randomNumBetween(hide.x[0], hide.x[1]),
            Y: parseInt(this.targetEl.style.top) + RandomNumberGen.randomNumBetween(hide.y[0], hide.y[1]),
        };
    }
    canHideEnemies() {
        return !!this.info.hide;
    }
    // A water tower and the like: nothing parks beside it
    isTall() {
        return !!this.info.noParking;
    }
    // Wrecking the building takes everyone in it with it. A significant hit that only damages it
    // (see Building.hit) gives each of them an even chance of being killed, every time, so a few such
    // shots can clear a building out without bringing it down.
    // A strike that takes someone out with the building gets a 'good hit' voice, one of the acknowledge sounds (not every
    // building in a blast all at once, though)
    static goodHitAt = 0;
    static goodHitGap = 900; // ms
    static goodHitDelay = 1300; // ms after the strike
    killOccupants(destroyed) {
        let killed = 0;
        for (const enemy of this.occupants) {
            if (destroyed || RandomNumberGen.randomNumBetween(0, 1) === 1) {
                const wasLive = !enemy.isFinished();
                enemy.eliminate();
                if (wasLive && enemy.isFinished())
                    killed++;
            }
        }
        if (killed && performance.now() - Building.goodHitAt > Building.goodHitGap) {
            Building.goodHitAt = performance.now();
            // a moment later, so it comes after the noise of the explosion that did it instead of being lost in it
            setTimeout(() => SoundPlayer.playRandomSound(acknowledge), Building.goodHitDelay);
        }
    }
    constructor(info) {
        super();
        this.info = info ? info : RandomNumberGen.returnRandomFromArray(allBuildingInfo);
        this.targetEl = ElementCreator.returnNewDiv(ContentElHandler.returnContentEl(), "building");
        this.targetEl.style.width = this.info.width + "px";
        this.targetEl.style.height = this.info.height + "px";
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
    // Rubble is still a target: it goes on taking damage until it's gone
    hitWhenDestroyed() {
        return !this.removed;
    }
    // Stages (undamaged -> damaged -> destroyed -> gone), worn down cumulatively like the vehicles:
    // every hit adds damage points, the building is destroyed once it has taken hitPointsToDestroy,
    // and what's left of it is cleared away altogether once it has taken hitPointsToObliterate. How
    // many a hit adds depends on the weapon, on how close to the blast's centre it landed (severity),
    // and on how big the blast is:
    //  - bullets do nothing
    //  - a direct hit from a mortar/howitzer shell is half of what it takes, so two destroy it
    //  - a direct hit from an airstrike or nuke is all of it
    //  - further out from the centre it counts for less (half, then a quarter at the edge), but it
    //    all adds up, so a few glancing blows do as much as a direct one
    //  - a blast bigger than an airstrike's counts for more in proportion to its size, so a direct hit
    //    from a really big bomb takes it from standing to gone in one
    // Any hit at all leaves it at least damaged. Rubble can be hit again, throwing more debris on every hit, and
    // stays as it is until the damage reaches hitPointsToObliterate, when it's gone.
    static hitPointsToDestroy = 100;
    static hitPointsToObliterate = 200;
    static standardBlastRadius = 100; // an airstrike's; smaller blasts are already allowed for above
    damagePoints = 0;
    removed = false;
    hitPoints(severity, wepName, blastRadius) {
        const flattening = wepName == weaponNames.airstrike || wepName == weaponNames.tactical_Nuke;
        const direct = flattening ? Building.hitPointsToDestroy : Building.hitPointsToDestroy / 2;
        const bigger = blastRadius ? Math.max(1, blastRadius / Building.standardBlastRadius) : 1;
        switch (severity) {
            case strikeSeverity.light:
                return direct / 4 * bigger;
            case strikeSeverity.medium:
                return direct / 2 * bigger;
            default:
                return direct * bigger;
        }
    }
    hit(severity, wepName, collisionInfo) {
        if (wepName < weaponNames.mortar || this.removed) {
            return;
        }
        const stageBefore = this.damage;
        this.damagePoints += this.hitPoints(severity, wepName, collisionInfo ? collisionInfo.radius : undefined);
        this.damage = this.damagePoints >= Building.hitPointsToDestroy ? Damage.destroyed : Damage.damaged;
        if (this.damagePoints >= Building.hitPointsToObliterate) {
            this.killOccupants(true);
            this.throwDebris(collisionInfo, Building.debrisWhenGone);
            this.clearAway();
            return;
        }
        this.reAssignSrc();
        if (this.damage === Damage.destroyed) {
            this.killOccupants(true);
        }
        else if (severity >= strikeSeverity.medium) { // not just a glancing blow from the edge of a blast
            this.killOccupants(false);
        }
        // a hit that's taken it down a stage breaks a lot more off than one that only knocks at what's there
        this.throwDebris(collisionInfo, this.damage !== stageBefore ? Building.debrisOnNewStage : Building.debrisPerHit);
    }
    // Brought down completely and at once, whatever state it was in, with everyone in it: what a bunker buster does
    obliterate() {
        if (this.removed)
            return;
        this.damagePoints = Building.hitPointsToObliterate;
        this.damage = Damage.destroyed;
        this.killOccupants(true);
        this.throwDebris(undefined, Building.debrisWhenGone);
        this.clearAway();
    }
    isStanding() {
        return !this.removed;
    }
    // Takes the sprite off the map altogether, at once: it's all been blown to pieces
    clearAway() {
        this.removed = true;
        const index = allTargets.indexOf(this);
        if (index >= 0)
            allTargets.splice(index, 1); // nothing's left for blasts to hit
        ContentElHandler.removeFromContentEl(this.targetEl);
    }
    // The pieces fly out from where the blast hit the building.
    throwDebris(collisionInfo, pieces = Building.debrisPerHit) {
        const origin = this.impactPoint(collisionInfo);
        const flattened = pieces >= Building.debrisWhenGone;
        const now = performance.now();
        Building.recentDebris = Building.recentDebris.filter(t => now - t < 900);
        Building.recentDebris.push(now);
        const crowd = Building.recentDebris.length; // buildings throwing at once, this one included
        const share = crowd <= 1 ? 1 : crowd <= 4 ? 0.5 : 0.33;
        let room = Building.maxBits - document.querySelectorAll(".buildingDebris, .buildingChunk").length;
        const count = Math.min(Math.max(1, Math.round(pieces * share)), Math.max(0, room));
        for (let i = 0; i < count; i++) {
            this.throwDebrisPiece(origin, crowd <= 1 ? i < Building.loudPieces : i < 1);
        }
        room -= count;
        if (flattened) { // brought down completely: some big pieces as well, one of each of the generic ones (fewer in a crowd, and quietly)
            const chunks = Building.debrisSources.slice(0, Math.min(room, crowd <= 1 ? 3 : crowd <= 4 ? 2 : 1));
            for (const source of chunks) {
                this.throwChunk(origin, source, crowd <= 1);
            }
        }
    }
    throwChunk(origin, imageSrc, loud = true) {
        const chunk = this.returnBit(imageSrc, "wheel", "wheelPic", origin);
        chunk.classList.add("buildingChunk");
        const direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
        ThrowHandler.lob(chunk, direc, loud ? crashes : null, ThrowHandler.removeIfLandedInWater);
    }
    throwDebrisPiece(origin, loud = true) {
        // a building with bits of its own throws them more often than not, and the generic ones the rest of the time
        // (a building that's been brought down has no roof or dome left to throw, so only the generic rubble)
        const own = this.info.bits && this.info.bits.length && this.damage !== Damage.destroyed && RandomNumberGen.randomNumBetween(1, 100) <= Building.ownBitChance;
        let imageSrc = RandomNumberGen.returnRandomFromArray(own ? this.info.bits : Building.debrisSources);
        let piece = this.returnBit(imageSrc, "wheel", "wheelPic", origin);
        piece.classList.add("buildingDebris");
        let direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
        ThrowHandler.lob(piece, direc, loud ? crashes : null, ThrowHandler.removeIfLandedInWater);
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
    // around and radius say where the scan is, for something it only lights the part of
    setHeatSignature(show, around, radius) {
        this.targetEl.classList.toggle('heatSig', show);
    }
    // How far a scan point is from where this gives off heat, or null if it isn't giving any off. Most
    // things give it off across their box; a tunnel along its whole length.
    heatDistanceFrom(p) {
        const box = this.heatSignatureBox();
        if (!box)
            return null;
        const nearest = CollisionDetection.nearestPointInBox(p, box);
        return Math.hypot(nearest.X - p.X, nearest.Y - p.Y);
    }
    // For something that isn't a single place (a tunnel): the point of it that a blast at this position is
    // measured from, if it isn't to be measured to its middle
    blastFocus(blastCenter) {
        return null;
    }
    // Whether a tunnel charge can be set on this
    takesCharge() {
        return false;
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
        game.assessKillPoints(priorStatus, this.damage, true, this); // (a hit on a building)
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
    takesCharge() {
        return this.damage !== Damage.destroyed;
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
// A tunnel you can't see. It has a head on the screen -- which is all there is to hover over with a tunnel
// charge -- and runs from there under the ground, with a turn or two, and off the edge of the screen. The
// path only shows on a surveillance drone's scan (the 'heatSig' class), which lights the whole of it.
// It's finished with a tunnel charge on its head, or a direct hit from a really big blast, and then it goes
// up along its whole length, turns and all.
class HiddenTunnel extends Target {
    static legMin = 110; // how long each straight run is, before it turns
    static legMax = 240;
    static edgeMargin = 70; // it doesn't turn closer than this to the edge of the screen
    static explosionSpacing = 150;
    static bigBlastRadius = 140; // a blast this big (an airstrike's is 100) set off right on it does for it
    path = []; // where it runs, in page coordinates, from the head to well off the screen
    pathEl;
    constructor() {
        super(hiddenTunnelTarget);
        this.targetEl.classList.add('smallSquare', 'tunnelHead', 'hiddenTunnel');
        this.targetEl.classList.remove('flexCenter');
    }
    get picSources() {
        return ['trans.png'];
    }
    decidePosition(pos) {
        this.placeAt(pos.X, pos.Y);
        const head = { X: pos.X + this.targetEl.offsetWidth / 2, Y: pos.Y + this.targetEl.offsetHeight / 2 };
        this.path = HiddenTunnel.makePath(head, window.innerWidth, window.innerHeight, RandomNumberGen.randomNumBetween(0, 2));
        this.drawPath(pos);
    }
    action() { } // it stays put
    // The head, then a straight run, and so on with `turns` right-angle turns, and a last run that carries on off the screen
    static makePath(head, width, height, turns) {
        const margin = HiddenTunnel.edgeMargin;
        const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
        // how far it can go from here in a direction before it's near the edge
        const room = (p, d) => {
            if (d.x > 0)
                return width - margin - p.X;
            if (d.x < 0)
                return p.X - margin;
            if (d.y > 0)
                return height - margin - p.Y;
            return p.Y - margin;
        };
        let here = head;
        const roomy = directions.filter(d => room(here, d) >= HiddenTunnel.legMin);
        let dir = RandomNumberGen.returnRandomFromArray(roomy.length ? roomy : directions);
        const points = [head];
        for (let t = 0; t < turns; t++) {
            const available = room(here, dir);
            if (available < HiddenTunnel.legMin)
                break;
            const length = RandomNumberGen.randomNumBetween(HiddenTunnel.legMin, Math.min(HiddenTunnel.legMax, available));
            here = { X: here.X + dir.x * length, Y: here.Y + dir.y * length };
            points.push(here);
            const turnsAvailable = [{ x: -dir.y, y: dir.x }, { x: dir.y, y: -dir.x }].filter(d => room(here, d) >= HiddenTunnel.legMin);
            if (!turnsAvailable.length)
                break;
            dir = RandomNumberGen.returnRandomFromArray(turnsAvailable);
        }
        const far = width + height; // far enough to be off the screen from anywhere on it
        points.push({ X: here.X + dir.x * far, Y: here.Y + dir.y * far });
        return points;
    }
    drawPath(headPos) {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("class", "tunnelPath");
        // the picture is laid over the whole screen, whatever it's a child of, so the points are page coordinates
        svg.style.left = -headPos.X + "px";
        svg.style.top = -headPos.Y + "px";
        svg.style.width = window.innerWidth + "px";
        svg.style.height = window.innerHeight + "px";
        const line = document.createElementNS(ns, "polyline");
        line.setAttribute("points", this.path.map(p => p.X + "," + p.Y).join(" "));
        svg.appendChild(line);
        this.targetEl.appendChild(svg);
        this.pathEl = svg;
    }
    // A scan only picks up the section of tunnel beneath it: the path is drawn through a soft-edged circle at the
    // scan (the picture is laid over the whole screen, so the circle's position is the scan's own)
    setHeatSignature(show, around, radius) {
        super.setHeatSignature(show);
        if (show && around && radius && this.pathEl) {
            const mask = "radial-gradient(circle at " + around.X + "px " + around.Y + "px, black " + Math.round(radius * 0.65) + "px, transparent " + radius + "px)";
            this.pathEl.style.maskImage = mask;
            this.pathEl.style.webkitMaskImage = mask;
        }
    }
    // The nearest point to p on the path (the part that's on the screen), and how far off that is
    nearestOnPath(p) {
        let best = { point: this.path[0], dist: Infinity };
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const dx = b.X - a.X, dy = b.Y - a.Y;
            const lengthSquared = dx * dx + dy * dy;
            const along = lengthSquared ? Math.max(0, Math.min(1, ((p.X - a.X) * dx + (p.Y - a.Y) * dy) / lengthSquared)) : 0;
            const point = { X: a.X + dx * along, Y: a.Y + dy * along };
            const dist = Math.hypot(point.X - p.X, point.Y - p.Y);
            if (dist < best.dist)
                best = { point: point, dist: dist };
        }
        return best;
    }
    // Blasts are measured from the nearest part of the tunnel, not from its head
    blastFocus(blastCenter) {
        return this.damage === Damage.destroyed ? null : this.nearestOnPath(blastCenter).point;
    }
    // A scan lights the whole tunnel if it reaches any part of it
    heatDistanceFrom(p) {
        return this.damage === Damage.destroyed ? null : this.nearestOnPath(p).dist;
    }
    takesCharge() {
        return this.damage !== Damage.destroyed;
    }
    hit(severity, wepName, collisionInfo) {
        if (this.damage === Damage.destroyed)
            return;
        const charge = wepName === weaponNames.tunnel_Charge;
        const bigDirectHit = severity >= strikeSeverity.catastrophic && !!collisionInfo && collisionInfo.radius >= HiddenTunnel.bigBlastRadius;
        if (charge || bigDirectHit) {
            this.blowUp();
        }
    }
    // Counts as destroyed straight away; the explosions follow along its length from the head, a string of
    // them, turns and all, and the tunnel is only seen for a moment at each, as a flash that dies away fast.
    blowUp() {
        this.targetDisabled(); // so it scores as a plain kill, not a "direct hit" popup
        const priorStatus = this.status;
        this.targetDestroyed(priorStatus);
        game.assessKillPoints(priorStatus, this.damage, false, this);
        this.targetEl.classList.remove('heatSig');
        this.pathEl.style.maskImage = "none"; // the flashes aren't confined to where a scan last was
        this.pathEl.style.webkitMaskImage = "none";
        const stops = this.stopsAlongPath();
        stops.forEach((stop, i) => {
            setTimeout(() => {
                if (i == 0) {
                    ExplosionHandler.basicExplosion(stop.point, ExplSizes.XL, expl_med_imgs, weaponNames.airstrike);
                }
                ExplosionHandler.basicExplosion(stop.point, ExplSizes.small, expl_small_imgs, weaponNames.mortar);
                // the stretch of tunnel the blast has just come along, and a little of what's next
                this.flashPath(i == 0 ? 0 : stops[i - 1].along, stop.along + HiddenTunnel.explosionSpacing / 3);
            }, (i + 1) * 150);
        });
        ContentElHandler.fadeRemoveItem(this.targetEl, stops.length * 150 + 1500, fadeAnimTime);
    }
    // A bright stretch of the path, between these distances from the head, that fades out at once
    flashPath(from, to) {
        const ns = "http://www.w3.org/2000/svg";
        const flash = document.createElementNS(ns, "polyline");
        flash.setAttribute("class", "tunnelFlash");
        flash.setAttribute("points", this.pathBetween(from, to).map(p => p.X + "," + p.Y).join(" "));
        flash.addEventListener("animationend", () => flash.remove());
        this.pathEl.appendChild(flash);
    }
    // The points of the path from one distance along it to another, corners included
    pathBetween(from, to) {
        const points = [];
        let walked = 0;
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const length = Math.hypot(b.X - a.X, b.Y - a.Y);
            const at = (d) => ({ X: a.X + (b.X - a.X) * d / length, Y: a.Y + (b.Y - a.Y) * d / length });
            if (walked + length > from && walked < to) {
                if (!points.length)
                    points.push(at(Math.max(0, from - walked)));
                if (to < walked + length) {
                    points.push(at(to - walked));
                    break;
                }
                points.push(b);
            }
            walked += length;
        }
        return points.length > 1 ? points : [this.path[0], this.path[0]];
    }
    // Stops all along the part of the path that's on the screen, from the head, and how far along each is
    stopsAlongPath() {
        const stops = [{ point: this.path[0], along: 0 }];
        const onScreen = (p) => p.X >= 0 && p.X <= window.innerWidth && p.Y >= 0 && p.Y <= window.innerHeight;
        let walked = 0;
        let carried = 0; // how far into the next gap we already are, so the spacing runs on round the corners
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const length = Math.hypot(b.X - a.X, b.Y - a.Y);
            for (let d = HiddenTunnel.explosionSpacing - carried; d < length; d += HiddenTunnel.explosionSpacing) {
                const p = { X: a.X + (b.X - a.X) * d / length, Y: a.Y + (b.Y - a.Y) * d / length };
                if (onScreen(p))
                    stops.push({ point: p, along: walked + d });
            }
            carried = (carried + length) % HiddenTunnel.explosionSpacing;
            walked += length;
        }
        return stops;
    }
}
class VehicleTarget extends Target {
    // A vehicle that's up and running is hot, one that's been disabled or wrecked isn't, and nor is one that
    // was only ever parked with its engine off (cold)
    heatSignatureBox() {
        return !this.cold && this.status === Status.active && this.damage !== Damage.destroyed ? this.targetEl.getBoundingClientRect() : null;
    }
    cold = false;
    // A vehicle that's up and running and could be driven off: not parked cold, not knocked out or burning
    isRunning() {
        return !this.cold && this.status === Status.active && this.damage !== Damage.destroyed && !this.wrecked && !this.fallen;
    }
    // The special enemy making off in it, if there is one: this vehicle is then the special target, and glows its
    // colour on a scan. It's driven off to the right at the speed given (px every 100ms); if it gets off the screen
    // that's the game lost, and if it's stopped (disabled or destroyed) that's him eliminated.
    specialName;
    specialPortrait;
    // Makes this the special target, whoever's driving: it glows his colour on a scan, and what happens to it is what happens to him
    makeSpecial(name, portrait) {
        this.specialName = name;
        this.specialPortrait = portrait;
        this.targetEl.classList.add('special');
    }
    startFleeing(name, speed, portrait) {
        this.makeSpecial(name, portrait);
        this.speed = speed;
        SoundPlayer.playSequentialSound(revs);
    }
    specialDown() {
        if (!this.specialName)
            return;
        const name = this.specialName;
        this.specialName = undefined;
        this.targetEl.classList.remove('special');
        announceElimination(name, this.specialPortrait);
    }
    targetDisabled() {
        super.targetDisabled();
        this.specialDown();
    }
    targetDestroyed(priorStatus) {
        super.targetDestroyed(priorStatus);
        this.specialDown();
    }
    move(posX) {
        if (this.specialName && (posX > ContentElHandler.contentElWidth() || posX + this.targetEl.offsetWidth < 0)) {
            this.status = Status.escaped;
            this.specialName = undefined;
            game.failGame("You shouldn't have let that one get away!");
            return;
        }
        super.move(posX);
    }
    // A vehicle that's just sitting there. It can still be hit, flipped and blown up like any other.
    park() {
        this.speed = 0;
    }
    // Parked ones count as done once they're knocked out, not only when they're wrecked
    finishedWhenDisabled = false;
    isFinished() {
        return super.isFinished() || (this.finishedWhenDisabled && this.status !== Status.active);
    }
    wheelSource = assetsFolder + 'vehicles/wheel.png';
    wheelSizeClass;
    movesAtBlast = true;
    angle = 0;
    constructor(info) {
        super(info);
    }
    // Driving over a crater. How far down a vehicle is, and which way it is tilted, comes from where it is on the crater's
    // profile and nothing else: not from timers or how long it has been there. So a slow one eases in and out as slowly as it is
    // going, a fast one drops in quickly, and one that stops in a crater stays where it has got to. The profile of a crater, along
    // the way a vehicle drives across it: a wall down at the edge of the picture, a flat bottom, and a wall up the other side.
    // A bigger crater is deeper, and a small one is hardly more than a dent.
    craterRolled = new WeakSet();
    craterPosed = false;
    // An airstrike's crater (the 4) gives a 15% chance of going over forward, anything bigger 30%, anything smaller none
    // and a faster one is a little likelier to go over (about a twelfth more for every step of speed above 4)
    static craterTumbleChance(size, speed) {
        const base = size > ExplSizes.XL ? 30 : size >= ExplSizes.XL ? 15 : 0;
        return base * Math.max(0.7, Math.min(1.4, 1 + (speed - 4) * 0.08));
    }
    // How deep the bottom is, as a share of the crater's half-height (its picture is the crater seen at a slant)
    static craterDepthShare(size) {
        return size <= ExplSizes.small ? 0.25 : size < ExplSizes.XL ? 0.4 : size <= ExplSizes.XL ? 0.5 : 0.55;
    }
    static craterWall = 0.35; // each wall's share of the way across
    // How far down (px) the ground is at this x, along a line at this height (y): zero off the edge of the crater's picture
    // How much of the crater's depth there is across a line at this height: none off the top or bottom of its picture, and the
    // lower edge of the picture (the near rim, which is shadow and spoil more than hole) is left out, shaved off at 0.78 of the way
    static craterLowerEdge = 0.78;
    static craterRim(c, y) {
        const across = (y - c.y) / c.ry;
        const scaled = across > 0 ? across / VehicleTarget.craterLowerEdge : across;
        return Math.abs(scaled) >= 1 ? 0 : Math.sqrt(1 - scaled * scaled);
    }
    // The depth (px) of the ground at this x along a line at this height (y): zero off the edge of the crater's picture
    static craterDepthAt(c, x, y) {
        const rim = VehicleTarget.craterRim(c, y);
        if (rim <= 0)
            return 0;
        const half = c.rx * rim; // the picture's width along this line: narrower towards its top and bottom
        const u = (x - (c.x - half)) / (2 * half); // 0 at its near edge, 1 at the far one
        if (u <= 0 || u >= 1)
            return 0;
        const wall = VehicleTarget.craterWall;
        const edge = u < wall ? u / wall : u > 1 - wall ? (1 - u) / wall : 1;
        const smooth = edge * edge * (3 - 2 * edge); // eased, so the lip and the base are rounded off
        return c.ry * VehicleTarget.craterDepthShare(c.size) * rim * smooth;
    }
    static visibleCraters() {
        return ExplosionHandler.liveCraters();
    }
    static craterTotalDepth(x, y) {
        let depth = 0;
        for (const c of VehicleTarget.visibleCraters()) {
            depth += VehicleTarget.craterDepthAt(c, x, y) * ExplosionHandler.strengthOf(c);
        }
        return depth;
    }
    pose(degrees, sink, seconds = 0.1) {
        this.baseImgEl.style.transition = "transform " + seconds + "s linear"; // just smooths the steps between one move and the next
        this.baseImgEl.style.transform = (sink ? "translateY(" + sink.toFixed(1) + "px) " : "") + "rotate(" + degrees.toFixed(1) + "deg)";
    }
    // A vehicle that has gone over: it carries on down the same profile, with what's left of its speed, while it flips onto its roof
    tumbling;
    // Fallen into a crater and on its roof: still a live target, still there to be hit and destroyed, but it goes no further, and
    // it stays just where it came to rest, whatever happens to the crater after (when that fades away, say)
    fallen = false;
    stepTumble() {
        const t = this.tumbling;
        const size = this.picEl.getBoundingClientRect();
        if (!size.width)
            return;
        t.age++;
        // it slides on: slowed by the ground and sped by the slope when it's on a wall, and stops when it has run out of speed
        const here = parseFloat(this.targetEl.style.left) || 0;
        const foot = (parseFloat(this.targetEl.style.top) || 0) + size.height * 0.85;
        const depth = (x) => VehicleTarget.craterDepthAt(t.crater, x, foot); // (its own crater, even if that has faded away since)
        const frontNow = depth(here + size.width * 0.88);
        const rearNow = depth(here + size.width * 0.12);
        const slope = (frontNow - rearNow) / (size.width * 0.76);
        t.vx = Math.max(0, t.vx * t.drag + slope * 0.9);
        const left = here + t.vx;
        this.targetEl.style.left = left + "px";
        const front = depth(left + size.width * 0.88);
        const rear = depth(left + size.width * 0.12);
        const middle = depth(left + size.width / 2);
        const pitch = Math.atan2(front - rear, size.width * 0.76) * 180 / Math.PI;
        // the nose goes down as it would going in, and then it's over
        if (t.age > 1 && t.flip < 180)
            t.flip = Math.min(180, t.flip + t.rate);
        const angle = t.flip > 0 ? t.flip + Math.max(-18, Math.min(18, pitch)) * (1 - t.flip / 180) : Math.max(-18, Math.min(18, pitch));
        this.pose(angle, middle);
        if (t.flip >= 180 && t.vx < t.stopAt) {
            this.tumbling = undefined; // it has come to rest, on its roof, wherever it has got to: part way down the side or at the bottom
        }
    }
    startTumble(crater) {
        this.craterPosed = true;
        this.fallen = true;
        // where it ends up is as random as how it goes over: some just fall down the edge, some slide on at the bottom
        const carried = Math.max(this.speed, 2) * (0.15 + Math.random() * 1.15);
        this.tumbling = { vx: carried, flip: 0, rate: 30 + Math.random() * 35, age: 0, drag: 0.6 + Math.random() * 0.26, stopAt: 0.2 + Math.random() * 0.85, crater: crater };
        this.lightDamage(); // smoking, but not out of it: it's still a live target
        this.speed = 0;
        SoundPlayer.playRandomSound(crashes);
    }
    craterEffects() {
        if (this.tumbling) {
            this.stepTumble();
            return;
        }
        if (this.fallen)
            return; // where it came to rest is where it stays
        if (this instanceof WaterVehicleTarget || this.status !== Status.active || this.wrecked || this.cold) {
            if (this.craterPosed && this.status === Status.active) {
                this.craterPosed = false;
                this.pose(0, 0);
            }
            return;
        }
        const size = this.picEl.getBoundingClientRect();
        if (!size.width)
            return;
        // from where it has been put, which is where it is going: the picture is on its way there, with a transition
        const left = parseFloat(this.targetEl.style.left) || 0;
        const foot = (parseFloat(this.targetEl.style.top) || 0) + size.height * 0.85;
        const frontX = left + size.width * 0.88, rearX = left + size.width * 0.12, middleX = left + size.width / 2;
        const front = VehicleTarget.craterTotalDepth(frontX, foot);
        const rear = VehicleTarget.craterTotalDepth(rearX, foot);
        const middle = VehicleTarget.craterTotalDepth(middleX, foot);
        if (front === 0 && rear === 0 && middle === 0) {
            if (this.craterPosed) {
                this.craterPosed = false;
                this.pose(0, 0, 0.2);
            }
            return;
        }
        // once it has dipped in and is well on its way down the wall (the middle of it less than halfway to the bottom, a bit over a third) it may go over
        if (front > 0) {
            for (const c of VehicleTarget.visibleCraters()) {
                if (this.craterRolled.has(c))
                    continue;
                if (ExplosionHandler.strengthOf(c) < 1)
                    continue; // (not into one that is going)
                const deepest = c.ry * VehicleTarget.craterDepthShare(c.size) * VehicleTarget.craterRim(c, foot);
                if (deepest <= 0 || VehicleTarget.craterDepthAt(c, middleX, foot) < deepest * 0.4)
                    continue;
                this.craterRolled.add(c);
                if (this.speed > 0 && RandomNumberGen.randomNumBetween(1, 100) <= VehicleTarget.craterTumbleChance(c.size, this.speed)) {
                    this.startTumble(c);
                    this.stepTumble();
                    return;
                }
            }
        }
        // it sits on the ground at its two ends, so it is tilted by the difference between them over its length
        const pitch = Math.atan2(front - rear, frontX - rearX) * 180 / Math.PI;
        this.craterPosed = true;
        this.pose(Math.max(-18, Math.min(18, pitch)), middle);
    }
    action() {
        super.action();
        this.craterEffects();
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
            game.assessKillPoints(priorStatus, this.damage, false, this);
            return;
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc, collisionInfo);
            game.assessKillPoints(priorStatus, this.damage, false, this);
            return;
        }
        if (severity == strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.completeDestruction(collisionInfo);
            game.assessKillPoints(priorStatus, this.damage, false, this);
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
    // Bits of bodywork, thrown as well as the wheels
    static bodyBits = [bitPath("car_1"), bitPath("car_2")];
    throwBodyBits(sources, sizeClass, origin) {
        const count = RandomNumberGen.randomNumBetween(1, 2);
        for (let i = 0; i < count; i++) {
            const bit = this.returnBit(RandomNumberGen.returnRandomFromArray(sources), "wheel", "wheelPic", origin);
            bit.classList.add(sizeClass);
            const direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
            ThrowHandler.lob(bit, direc, null, ThrowHandler.removeIfLandedInWater);
        }
    }
    destructionBits() {
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
        this.throwBodyBits(VehicleTarget.bodyBits, "vehicleBit");
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
    isFinished() {
        return this.damage === Damage.destroyed;
    }
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
    // A boat the special enemy in a bunker is making for. It goes slowly to the coast, where he gets aboard, and turns
    // (the picture flips) to run for the open sea, off the left of the screen, at the speed the difficulty gives. From
    // then on he is the special target, as well as the boat being just another target. If the boat is put out of action
    // on the way to the shore he's still to get away, and the level sends another.
    shoreRun;
    isRunningToShore() {
        return !!this.shoreRun;
    }
    runToShore(special, speed, onFail) {
        this.shoreRun = { special: special, speed: speed, onFail: onFail };
    }
    action() {
        if (this.shoreRun) {
            this.shoreStep();
            return;
        }
        super.action();
    }
    shoreStep() {
        const run = this.shoreRun;
        if (!this.isRunning()) { // knocked out before it got there
            this.shoreRun = undefined;
            run.onFail();
            return;
        }
        // (worked out from where it's been put, not from where it's drawn: a moving boat's picture is on its way there)
        const left = parseFloat(this.targetEl.style.left) || 0;
        const top = parseFloat(this.targetEl.style.top) || 0;
        const span = Shoreline.waterSpan(top, top + this.targetEl.offsetHeight);
        const landing = span ? span.openRight + (span.shoreRight - span.openRight) * 0.5 : window.innerWidth;
        if (left + this.targetEl.offsetWidth >= landing) {
            this.shoreRun = undefined;
            this.baseImgEl.style.transform = "scaleX(-1)"; // turns about
            run.special.board();
            this.startFleeing(run.special.name, -run.speed, run.special.portrait);
            return;
        }
        this.targetEl.style.left = left + run.speed * 0.9 + "px"; // (on its way to the coast it's not far off as quick as it will be)
    }
    static hullBits = [bitPath("boat_1"), bitPath("boat_2")];
    destructionBits() {
        this.throwBodyBits(WaterVehicleTarget.hullBits, "boatBit", this.strikePoint);
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
            game.assessKillPoints(priorStatus, this.damage, false, this);
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
    // Where a number of boats go, together: each at its own height on the screen, no two within 12px of each other (one that
    // would be is moved up to be 12 clear), and drawn so the lower ones are in front of the ones higher up. They're put
    // into the content lowest first, which is what puts the later (higher) ones behind.
    static arrange(boats) {
        const minY = Math.ceil(window.innerHeight * 0.1);
        const heights = boats.map(boat => boat.getTargetEl().getBoundingClientRect().height);
        // a height where there's room in the water for the boat (near the top of a sliced coast there's hardly any sea)
        const ys = boats.map((boat, i) => {
            const maxY = Math.max(minY, Math.floor(window.innerHeight * 0.9 - heights[i]));
            const width = boat.getTargetEl().getBoundingClientRect().width;
            let y = RandomNumberGen.randomNumBetween(minY, maxY);
            for (let attempt = 0; attempt < 40; attempt++) {
                const span = Shoreline.waterSpan(y, y + heights[i]);
                if (!span || span.openRight - WaterVehicleTarget.shoreMargin - width >= Math.max(span.left, 0) + WaterVehicleTarget.shoreMargin)
                    break;
                y = RandomNumberGen.randomNumBetween(minY, maxY);
            }
            return y;
        });
        const order = boats.map((_, i) => i).sort((p, q) => (ys[q] + heights[q]) - (ys[p] + heights[p])); // lowest first
        const spots = boats.map(() => null);
        let previous = Infinity;
        const content = ContentElHandler.returnContentEl();
        for (const i of order) {
            let y = ys[i];
            if (previous - y < 12)
                y = previous - 12; // too close to the one below it: a clear 12 above it
            y = Math.max(y, minY);
            previous = y;
            const span = Shoreline.waterSpan(y, y + heights[i]);
            if (!span) {
                spots[i] = { X: 0, Y: y };
                continue;
            }
            const size = boats[i].getTargetEl().getBoundingClientRect();
            const lowX = Math.ceil(Math.max(span.left + WaterVehicleTarget.shoreMargin, 0));
            const highX = Math.floor(Math.min(span.openRight - WaterVehicleTarget.shoreMargin - size.width, window.innerWidth - size.width));
            spots[i] = { X: highX >= lowX ? RandomNumberGen.randomNumBetween(lowX, highX) : lowX, Y: y };
            content.prepend(boats[i].getTargetEl()); // lowest first, so the higher ones end up behind
        }
        return spots;
    }
    decidePosition(pos) {
        if (pos) {
            this.placeAt(pos.X, pos.Y);
            return;
        }
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
// The special enemies: a name each, and a different colour on a scan. One hides in a building (Hills) or in a bunker
// under one (Coast). The Hills one tries to get away in a vehicle (see HillsLevel.startFlee), when he stops being
// a separate target and the vehicle is the special target.
class SpecialNames {
    static first = ["Abu", "Jabar", "Ali", "Amir", "Mahmoud", "Muhammad", "Omar", "Ahmed", "Abdul", "Hassan"];
    static last = ["Abbas", "Sinwar", "Deif", "Haniyeh", "ibn Rashid", "ibn Khalid", "ibn Walid", "ibn Tariq",
        "ibn Saleh", "ibn Mansour", "Haddad", "Hamdan", "Qasim", "Barakat", "Khalil", "Nasser"];
    // two to four first names and a last
    static random() {
        const pool = SpecialNames.first.slice();
        const count = RandomNumberGen.randomNumBetween(2, 4);
        const names = [];
        for (let i = 0; i < count; i++) {
            names.push(pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0]);
        }
        names.push(RandomNumberGen.returnRandomFromArray(SpecialNames.last));
        return names.join(" ");
    }
}
// A headshot (one of the 14 in AS_assets/portraits) for each special enemy, with a red ELIMINATED stamp over it when he's been dealt with
class SpecialPortraits {
    static count = 14;
    static random() {
        const n = RandomNumberGen.randomNumBetween(1, SpecialPortraits.count);
        return assetsFolder + "portraits/Portrait_" + (n < 10 ? "0" : "") + n + ".png";
    }
}
function announceElimination(name, portrait) {
    const text = "Well done, you eliminated " + name + "!";
    // the headshot with the stamp right across it, at the side of the text, which wraps if it has to
    const html = portrait
        ? '<div class="eliminatedMessage"><div class="eliminatedCard"><img class="eliminatedPortrait" src="' + portrait + '"><img class="eliminatedStamp" src="' + assetsFolder + 'portraits/Stamp_eliminated.png"></div><div class="eliminatedText">' + text + '</div></div>'
        : text;
    PopupHandler.addToArray(html, '<span class="eliminatedTitle">Target eliminated</span>', msgLength.long);
}
class SpecialEnemy extends BuildingEnemy {
    name = SpecialNames.random();
    portrait = SpecialPortraits.random();
    boarded = false; // he's got into a vehicle: that's the target now
    bunker;
    constructor() {
        super();
        this.targetEl.classList.add('special');
    }
    isFinished() {
        return this.boarded || super.isFinished();
    }
    heatSignatureBox() {
        return this.boarded ? null : super.heatSignatureBox();
    }
    eliminate() {
        if (this.boarded || this.damage === Damage.destroyed)
            return;
        super.eliminate();
        announceElimination(this.name, this.portrait);
    }
    // Down in a bunker, so he's only to be seen where a scan has found him
    goUnderground() {
        this.targetEl.classList.add('underground');
    }
    // Gets into a vehicle: he's out of the building, and no longer a target on his own
    board() {
        this.boarded = true;
        this.setHeatSignature(false);
        this.targetEl.style.display = "none";
    }
}
// A bunker under a building: a shaft down from the building to a square room, drawn only where a surveillance drone's
// scan reaches. Nothing that goes bang above ground touches it, or the one in it: only a bunker buster does anything,
// and brings it down with the building above it.
class Bunker extends Target {
    static shaftDrop = 55; // how far below the building's foot the room is
    static roomSize = 44;
    building;
    occupant;
    shaft;
    room;
    surfaceBox; // where its building stood: still there to be hit by a buster once the building has gone
    planEl;
    constructor(building) {
        super(hiddenTunnelTarget);
        this.building = building;
        building.bunker = this;
        this.targetEl.classList.add('smallSquare', 'bunker');
        this.targetEl.classList.remove('flexCenter');
        allTargets.push(this);
    }
    get picSources() {
        return ['trans.png'];
    }
    action() { }
    // Lays the bunker out beneath its building and draws it; returns the middle of the room
    setUp() {
        const rect = this.building.getTargetEl().getBoundingClientRect();
        const size = Bunker.roomSize;
        const centre = {
            X: Math.max(size, Math.min(window.innerWidth - size, rect.left + rect.width / 2)),
            Y: Math.min(window.innerHeight - size, rect.bottom + Bunker.shaftDrop),
        };
        // (the building's own box, which has its size from the start; its picture may not have loaded yet)
        this.surfaceBox = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        this.shaft = { from: { X: centre.X, Y: rect.top + rect.height * 0.6 }, to: centre };
        this.room = { left: centre.X - size / 2, top: centre.Y - size / 2, right: centre.X + size / 2, bottom: centre.Y + size / 2 };
        this.placeAt(this.room.left, this.room.top);
        this.draw();
        return centre;
    }
    draw() {
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("class", "bunkerPlan");
        // laid over the whole screen, whatever it's a child of, so everything's in page coordinates
        svg.style.left = -this.room.left + "px";
        svg.style.top = -this.room.top + "px";
        svg.style.width = window.innerWidth + "px";
        svg.style.height = window.innerHeight + "px";
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", String(this.shaft.from.X));
        line.setAttribute("y1", String(this.shaft.from.Y));
        line.setAttribute("x2", String(this.shaft.to.X));
        line.setAttribute("y2", String(this.shaft.to.Y));
        svg.appendChild(line);
        const room = document.createElementNS(ns, "rect");
        room.setAttribute("x", String(this.room.left));
        room.setAttribute("y", String(this.room.top));
        room.setAttribute("width", String(this.room.right - this.room.left));
        room.setAttribute("height", String(this.room.bottom - this.room.top));
        svg.appendChild(room);
        this.targetEl.appendChild(svg);
        this.planEl = svg;
    }
    // How far a point is from the shaft or the room, whichever is nearer
    distanceFrom(p) {
        const inRoom = CollisionDetection.nearestPointInBox(p, this.room);
        const a = this.shaft.from, b = this.shaft.to;
        const dx = b.X - a.X, dy = b.Y - a.Y;
        const lengthSquared = dx * dx + dy * dy;
        const along = lengthSquared ? Math.max(0, Math.min(1, ((p.X - a.X) * dx + (p.Y - a.Y) * dy) / lengthSquared)) : 0;
        const onShaft = Math.hypot(a.X + dx * along - p.X, a.Y + dy * along - p.Y);
        return Math.min(Math.hypot(inRoom.X - p.X, inRoom.Y - p.Y), onShaft);
    }
    heatDistanceFrom(p) {
        return this.damage === Damage.destroyed ? null : this.distanceFrom(p);
    }
    setHeatSignature(show, around, radius) {
        super.setHeatSignature(show);
        if (show && around && radius && this.planEl) {
            const mask = "radial-gradient(circle at " + around.X + "px " + around.Y + "px, black " + Math.round(radius * 0.65) + "px, transparent " + radius + "px)";
            this.planEl.style.maskImage = mask;
            this.planEl.style.webkitMaskImage = mask;
        }
    }
    // An invisible hitbox where the building above it stood (or still stands): that's what a bunker buster has to land on,
    // whether or not the building's still there. (The bunker as it's drawn on a scan is just where it is underground.)
    isUnder(p) {
        return this.damage !== Damage.destroyed && p.X >= this.surfaceBox.left && p.X <= this.surfaceBox.right && p.Y >= this.surfaceBox.top && p.Y <= this.surfaceBox.bottom;
    }
    // Nothing else does anything to it
    hit(severity, wepName, collisionInfo) { }
    // Brought down: whoever's in it goes too
    destroy() {
        if (this.damage === Damage.destroyed)
            return;
        this.damage = Damage.destroyed;
        this.setHeatSignature(false);
        const index = allTargets.indexOf(this);
        if (index >= 0)
            allTargets.splice(index, 1);
        if (this.occupant)
            this.occupant.eliminate();
        ContentElHandler.removeFromContentEl(this.targetEl);
    }
}
//# sourceMappingURL=target.js.map