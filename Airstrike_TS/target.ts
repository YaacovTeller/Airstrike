﻿// One building type: the filenames (all relative to assetsFolder + "buildings/") of its three stages, which
// are the same size so any one can stand in for another, how big that is on the screen, and where an
// enemy can hide under it.
type BuildingInfo = {
    undamaged: string,
    damaged: string,
    destroyed: string,
    width: number,  // on screen, in px
    height: number,
    // The top-left corners an enemy's square can be put at (within the building's box) and be hidden
    // by the picture, in both its undamaged and damaged states -- measured from the pictures
    hide?: { x: [number, number], y: [number, number] },
    noParking?: boolean, // nothing parks beside it (a water tower)
    single?: boolean, // only one of this to a layout (a lighthouse)
    waterfront?: boolean, // stands along the water's edge, not among the town (cranes, quays, a jetty)
    group?: string, // only one of a group to a layout (a mosque, whichever of the mosques it is)
    bits?: Array<string>, // pieces of its own it throws as debris (as well as the generic ones): a chunk of its roof, say
    electric?: "substation" | "line", // part of the power grid: the lights stay on while the substation and its lines stand
    flammable?: boolean, // has fuel in it: goes on fire when it's damaged, and blows up when it's brought down (or when it's burned a while)
    fireAt?: Array<[number, number]>, // where on it the fire burns, as shares of its width and height: on the tanks
}
// The little shards in AS_assets/bits (Bit_<name>.png): chunks cut from roofs and domes, and from cars and boats
function bitPath(name: string): string {
    return assetsFolder + "bits/Bit_" + name + ".png";
}
// A type made of the pictures Structure_<code>_1, _2 and _3 (undamaged, damaged, destroyed)
function structureInfo(code: string, width: number, height: number, hide?: BuildingInfo["hide"]): BuildingInfo {
    const name = (stage: number) => "Structure_" + code + "_" + stage + ".png";
    // the warehouses (rows 1 and 2) throw chunks of their own coloured roofs
    const bits = /^r[12]c\d$/.test(code) ? [bitPath("roof_" + code)] : undefined;
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: bits };
}
// Add new building types here to get them into the random rotation. Enemies can hide in all of them but the two
// fences (r5c4 and r5c7), which are open mesh the picture wouldn't hide anyone behind -- a `hide` of undefined
// is what says so. (The sizes are the pictures' at
// 0.4 of their natural size. Warehouse_blue_* and Warehouse_brown_* are the older pictures of
// Structure_r1c1 and Structure_r1c5, and aren't used now.)
const allBuildingInfo: Array<BuildingInfo> = [
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

// Where a fuel building's fire burns: on its two big tanks, or the one tank of the fuel station
function fuelFires(name: string): Array<[number, number]> | undefined {
    if (!name.startsWith("Fuel_")) return undefined;
    return name == "Fuel_Station" ? [[0.78, 0.5]] : [[0.3, 0.3], [0.6, 0.4]];
}
// The port buildings (AS_assets/buildings/port buildings): what the Coast level is built of. Each is a whole compound,
// with its own platform or fence, in its three states (Name_1 intact, _2 heavily damaged, _3 destroyed). Sizes are 0.36
// of natural. There's only ever the one of each of the lighthouses, towers, mosque and repair dock.
const waterfrontPortBuildings = ["Crane_Dockside", "Crane_Harbour", "Crane_Container", "Quay_Straight", "Quay_Corner", "Jetty",
    "Breakwater", "Repair_Dock", "Lighthouse", "Lighthouse_B"];
const singlePortBuildings = ["Lighthouse", "Lighthouse_B", "Comms_Tower", "Radio_Tower", "Port_Mosque"];
function portInfo(name: string, width: number, height: number, hide?: BuildingInfo["hide"], folder: string = ""): BuildingInfo {
    const file = (stage: number) => "port buildings/" + folder + name + "_" + stage + ".png";
    return { undamaged: file(1), damaged: file(2), destroyed: file(3), width: width, height: height, hide: hide, flammable: name.startsWith("Fuel_"), fireAt: fuelFires(name), single: singlePortBuildings.includes(name), waterfront: waterfrontPortBuildings.includes(name), group: name == "Port_Mosque" ? "mosque" : name.startsWith("Lighthouse") ? "lighthouse" : undefined };
}
const allPortBuildingInfo: Array<BuildingInfo> = [
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
    portInfo("Quay_Straight", 133, 77, undefined),
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
const seaFacingNW: Array<BuildingInfo> = [
    portInfo("Breakwater", 118, 77, undefined, "coast NW/"),
    portInfo("Crane_Container", 127, 99, { x: [28, 56], y: [14, 61] }, "coast NW/"),
    portInfo("Crane_Dockside", 108, 110, { x: [34, 59], y: [81, 89] }, "coast NW/"),
    portInfo("Crane_Harbour", 88, 102, { x: [25, 36], y: [70, 79] }, "coast NW/"),
    portInfo("Jetty", 102, 69, undefined, "coast NW/"),
    portInfo("Repair_Dock", 136, 95, { x: [52, 97], y: [51, 70] }, "coast NW/"),
];
const seaFacingSW: Array<BuildingInfo> = seaFacingNW.filter(info => !info.undamaged.includes("/Jetty_")).map(info => {
    const mirrored = info.hide ? { x: [info.width - info.hide.x[1], info.width - info.hide.x[0]] as [number, number], y: info.hide.y } : undefined;
    const sw = (file: string) => file.replace("coast NW/", "coast SW/");
    return { ...info, undamaged: sw(info.undamaged), damaged: sw(info.damaged), destroyed: sw(info.destroyed), hide: mirrored };
});

// Industrial odds and ends (AS_assets/buildings/industrial misc): the fuel station and depot, storage shed and pad, the
// water tank, four water towers and four container yards. The Hills level uses all but the yards, the Coast level the lot.
// Sizes are 0.36 of natural, but the yards 0.5 (they're a low, wide thing: the sizes are set here, the pictures aren't resaved).
function industrialInfo(name: string, width: number, height: number, hide?: BuildingInfo["hide"]): BuildingInfo {
    const file = (stage: number) => "industrial misc/" + name + "_" + stage + ".png";
    return { undamaged: file(1), damaged: file(2), destroyed: file(3), width: width, height: height, hide: hide, flammable: name.startsWith("Fuel_"), fireAt: fuelFires(name), noParking: name.startsWith("Water_Tower") };
}
const allIndustrialInfo: Array<BuildingInfo> = [
    industrialInfo("Container_Yard_Circular", 132, 66, { x: [27, 101], y: [20, 45] }),
    industrialInfo("Container_Yard_Large", 144, 76, { x: [34, 86], y: [25, 44] }),
    industrialInfo("Container_Yard_Rail", 154, 68, { x: [29, 83], y: [30, 44] }),
    industrialInfo("Container_Yard_Small", 124, 66, { x: [27, 82], y: [15, 40] }),
    industrialInfo("Container_Yard_B1", 130, 63, { x: [39, 81], y: [23, 40] }),
    industrialInfo("Container_Yard_B2", 128, 61, { x: [42, 77], y: [21, 38] }),
    industrialInfo("Container_Yard_B3", 123, 59, { x: [34, 77], y: [16, 36] }),
    industrialInfo("Container_Yard_B4", 118, 57, { x: [30, 77], y: [17, 34] }),
    industrialInfo("Water_Tower_B1", 81, 86, undefined),
    industrialInfo("Water_Tower_B2", 80, 89, undefined),
    industrialInfo("Water_Tower_B3", 80, 86, undefined),
    industrialInfo("Water_Tower_B4", 81, 89, undefined),
    industrialInfo("Fuel_Depot", 100, 68, { x: [13, 72], y: [19, 38] }),
    industrialInfo("Fuel_Station", 80, 68, { x: [20, 50], y: [24, 45] }),
    industrialInfo("Storage_Pad", 89, 55, { x: [21, 56], y: [16, 31] }),
    industrialInfo("Storage_Shed", 113, 65, { x: [27, 69], y: [22, 42] }),
    industrialInfo("Water_Tank", 79, 57, undefined),
    industrialInfo("Water_Tower_Box", 83, 78, undefined),
    industrialInfo("Water_Tower_Concrete", 83, 81, undefined),
    industrialInfo("Water_Tower_Conical", 82, 80, undefined),
    industrialInfo("Water_Tower_Metal", 79, 81, undefined),
];
function industrialByName(name: string): BuildingInfo {
    return allIndustrialInfo.find(info => info.undamaged === "industrial misc/" + name + "_1.png");
}
// A copy of a building type at another scale, hiding spots and all
function scaledBuildingInfo(info: BuildingInfo, factor: number): BuildingInfo {
    const hide = info.hide ? { x: [Math.round(info.hide.x[0] * factor), Math.round(info.hide.x[1] * factor)] as [number, number], y: [Math.round(info.hide.y[0] * factor), Math.round(info.hide.y[1] * factor)] as [number, number] } : undefined;
    return { ...info, width: Math.round(info.width * factor), height: Math.round(info.height * factor), hide: hide };
}

// The villas (AS_assets/buildings/villas) are building types too, but aren't in the usual rotation:
// the Hills level uses them. Their destroyed picture is one of the generic ruins. Sizes are 0.28 of natural.
function villaInfo(letter: string, width: number, height: number, hide?: BuildingInfo["hide"]): BuildingInfo {
    const name = (stage: number) => "villas/Villa_" + letter + "_" + stage + ".png";
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: [bitPath("roof_red")] };
}
// The mosques (AS_assets/buildings/mosques): three of them, a village has one. Undamaged, damaged (the tower half
// broken) and destroyed (the tower gone); there's also a complete ruin, _4, that nothing uses yet. Sizes are 0.36
// of natural.
function mosqueInfo(letter: string, width: number, height: number, hide?: BuildingInfo["hide"], folder: string = "mosques/"): BuildingInfo {
    const name = (stage: number) => folder + "Mosque_" + letter + "_" + stage + ".png";
    const bit = bitPath("mosque_" + (folder.endsWith("fancy/") ? "fancy_" : "") + letter); // a piece of its dome
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide, bits: [bit] };
}
const allMosqueInfo: Array<BuildingInfo> = [
    mosqueInfo("A", 76, 101, { x: [42, 50], y: [48, 76] }),
    mosqueInfo("B", 76, 107, { x: [20, 51], y: [49, 77] }),
    mosqueInfo("C", 81, 109, { x: [18, 50], y: [52, 72] }),
];
// The other mosques, for the bigger villages: the second sheet's small and medium for the medium ones, and for the
// large ones its large and the grander pictures in mosques/fancy (the fancy large is too much to use). Sizes are
// each picture's own scale, from 0.3 to 0.42 of natural.
const mediumMosqueInfo: Array<BuildingInfo> = [
    mosqueInfo("Small", 87, 101, { x: [44, 58], y: [47, 65] }),
    mosqueInfo("Medium", 76, 102, { x: [29, 52], y: [56, 68] }),
];
const largeMosqueInfo: Array<BuildingInfo> = [
    mosqueInfo("Large", 124, 136, { x: [49, 69], y: [82, 92] }),
    mosqueInfo("Small", 95, 94, { x: [18, 62], y: [44, 69] }, "mosques/fancy/"),
    mosqueInfo("Medium", 113, 115, { x: [17, 80], y: [47, 84] }, "mosques/fancy/"),
];

// The explosives (AS_assets/buildings/explosives): stacks of ammunition crates and of rocket tubes and RPGs, each a single picture
// with no damaged state: anything that damages one sets it on fire, and it goes up (see ExplosiveTarget). Sizes are two thirds of
// what they were at first, 0.173 of natural for the messy stacks and 0.16 for the others (the explosions are as big as they were).
type ExplosiveInfo = { file: string, width: number, height: number, rockets: boolean };
function explosiveInfo(name: string, width: number, height: number, rockets: boolean): ExplosiveInfo {
    return { file: "explosives/" + name + ".png", width: width, height: height, rockets: rockets };
}
const allExplosiveInfo: Array<ExplosiveInfo> = [
    explosiveInfo("Ammo_Crates_1", 40, 28, false),
    explosiveInfo("Ammo_Crates_2", 47, 34, false),
    explosiveInfo("Ammo_Crates_3", 42, 36, false),
    explosiveInfo("Ammo_Crates_4", 51, 37, false),
    explosiveInfo("Ammo_Crates_5", 55, 32, false),
    explosiveInfo("Ammo_Crates_6", 47, 35, false),
    explosiveInfo("Ammo_Crates_7", 47, 34, false),
    explosiveInfo("Ammo_Crates_8", 52, 33, false),
    explosiveInfo("Ammo_Messy_1", 55, 44, false),
    explosiveInfo("Ammo_Messy_2", 54, 43, false),
    explosiveInfo("Ammo_Messy_3", 55, 43, false),
    explosiveInfo("Ammo_Messy_4", 58, 45, false),
    explosiveInfo("Ammo_Messy_5", 55, 44, false),
    explosiveInfo("Ammo_Messy_6", 55, 42, false),
    explosiveInfo("Ammo_Messy_7", 52, 43, false),
    explosiveInfo("Ammo_Messy_8", 56, 39, false),
    explosiveInfo("Rockets_Messy_1", 66, 49, true),
    explosiveInfo("Rockets_Messy_2", 61, 44, true),
    explosiveInfo("Rockets_Messy_3", 55, 49, true),
    explosiveInfo("Rockets_Messy_4", 59, 51, true),
    explosiveInfo("Rockets_Tubes_1", 36, 24, true),
    explosiveInfo("Rockets_Tubes_2", 43, 28, true),
    explosiveInfo("Rockets_Tubes_3", 43, 30, true),
    explosiveInfo("Rockets_Tubes_4", 50, 33, true),
    explosiveInfo("Rockets_Tubes_5", 40, 26, true),
    explosiveInfo("Rockets_Tubes_6", 49, 26, true),
    explosiveInfo("Rockets_Tubes_7", 37, 31, true),
    explosiveInfo("Rockets_Tubes_8", 48, 30, true),
];

// The power grid (AS_assets/buildings/electric): a substation, with a line of pylons leading from it off the map. The pictures are on the
// same canvas in all three states. Sizes are 0.36 of natural. A line of pylons is one picture, with a pylon at each end, so that a
// chain of them end to end looks like one run: leftBase and rightBase are where the feet of those two pylons are in the picture, in px
// (the chain steps from one to the next by the difference). The power plants and wind farms are cut out too, but nothing uses them yet.
function electricInfo(name: string, width: number, height: number, kind: "substation" | "line"): BuildingInfo {
    const file = (stage: number) => "electric/" + name + "_" + stage + ".png";
    return { undamaged: file(1), damaged: file(2), destroyed: file(3), width: width, height: height, electric: kind };
}
const substationInfo: Array<BuildingInfo> = [
    electricInfo("Substation_A", 196, 146, "substation"),
    electricInfo("Substation_B", 198, 159, "substation"),
];
type PowerLineInfo = { info: BuildingInfo, leftBase: [number, number], rightBase: [number, number] };
const powerLineInfo: Array<PowerLineInfo> = [
    { info: electricInfo("Power_Line_Straight", 151, 60, "line"), leftBase: [21, 60], rightBase: [134, 34] },
    { info: electricInfo("Power_Line_HV", 122, 60, "line"), leftBase: [21, 59], rightBase: [104, 46] },
];

// What the Coast level is built of: the port buildings, the industrial ones, and the bigger mosques (one mosque to a layout,
// whichever)
const coastBuildingInfo: Array<BuildingInfo> = [
    ...allPortBuildingInfo,
    ...seaFacingNW,
    ...seaFacingSW,
    ...allIndustrialInfo,
    ...largeMosqueInfo.map(info => ({ ...info, single: true, group: "mosque" })),
];

// The apartment blocks (AS_assets/buildings/blocks): four kinds, each intact, really damaged and destroyed.
// Sizes are 0.4 of natural: they're meant to tower over the villas (0.28).
function blockInfo(number: number, width: number, height: number, hide?: BuildingInfo["hide"]): BuildingInfo {
    const name = (stage: number) => "blocks/Block_" + number + "_" + stage + ".png";
    return { undamaged: name(1), damaged: name(2), destroyed: name(3), width: width, height: height, hide: hide };
}
const allBlockInfo: Array<BuildingInfo> = [
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
const smallBlockInfo: Array<BuildingInfo> = [1, 2, 5, 6, 7, 8].map(n => allBlockInfo.find(info => info.undamaged === "blocks/Block_" + n + "_1.png"));
// A copy of a building type at a different size (the pictures are the same, so only the box changes). No enemies
// hide in it, as the hiding spots were measured at the original size.
function resizedBuildingInfo(info: BuildingInfo, factor: number): BuildingInfo {
    return { ...info, width: Math.round(info.width * factor), height: Math.round(info.height * factor), hide: undefined };
}
const allVillaInfo: Array<BuildingInfo> = [
    villaInfo("A", 68, 59, { x: [15, 44], y: [10, 39] }),
    villaInfo("B", 64, 62, { x: [11, 40], y: [10, 39] }),
    villaInfo("C", 85, 63, { x: [10, 54], y: [15, 40] }),
    villaInfo("D", 76, 67, { x: [10, 53], y: [11, 44] }),
    villaInfo("E", 71, 66, { x: [9, 46], y: [12, 42] }),
    villaInfo("F", 74, 65, { x: [12, 49], y: [12, 45] }),
];

// Generic rubble chunks used as flying debris when a building is hit (see Building.debrisSources).
const buildingRuinSources: Array<string> = [
    assetsFolder + "ruin_1.png",
    assetsFolder + "ruin_2.png",
];

// Shared by Target and Building: both are sprites placed and repositioned within the content area.
class MapEntity {
    protected targetEl: HTMLElement;
    protected picEl: HTMLElement;
    protected baseImgEl: HTMLImageElement;

    protected placeAt(left: number, top?: number) {
        this.targetEl.style.top = top + 'px';
        this.targetEl.style.left = left + 'px';
    }
    public getTargetEl(): HTMLElement {
        return this.targetEl;
    }
    public getPicEl(): HTMLElement {
        return this.picEl;
    }

    // The part of this that a blast has to reach to hit it at all (page coordinates). By default
    // that's just its middle, which is stingy for anything wide, so those override it with an area.
    // It only decides whether a blast hits: how hard still depends on how close to the middle it was.
    public hitBox(): Box {
        const rect = this.targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return { left: x, top: y, right: x, bottom: y };
    }

    // Where a blast hit this, as an on-screen point: the blast's own position pulled back onto
    // the given area (the picture, unless told otherwise), so a near miss still comes from the
    // nearest edge. Without any collision info it's the middle of the area.
    protected impactPoint(collisionInfo?: vectorMoveObj, area: Box = this.picEl.getBoundingClientRect()): position {
        if (!collisionInfo) {
            return { X: (area.left + area.right) / 2, Y: (area.top + area.bottom) / 2 };
        }
        // the angle and distance run from the blast to the middle of the target, hence the minus
        const middle = CollisionDetection.getXYfromPoint(this.targetEl);
        const rad = collisionInfo.angle * Math.PI / 180;
        const blast: position = { X: middle.X - collisionInfo.dist * Math.cos(rad), Y: middle.Y - collisionInfo.dist * Math.sin(rad) };
        return CollisionDetection.nearestPointInBox(blast, area);
    }

    // Spawns a free-standing piece of debris, registers it for cleanup, and fades it out after a
    // while. It starts at the origin given (on-screen coordinates), or the top-left of this
    // entity's picture, which is fine for the small vehicles whose wheels it was written for.
    protected returnBit(imageSrc, parentClass, childClass, origin?: position): HTMLElement {
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
    private player: CanvasGifPlayer;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.player = new CanvasGifPlayer(canvas);
    }
    public playLoop(frames: Array<HTMLImageElement>) {
        this.player.pause();
        this.player.play(frames, true);
    }
    public hide() {
        this.canvas.style.visibility = "hidden";
    }
}

class Building extends MapEntity {
    protected damageEl: HTMLImageElement;
    public damage: number = Damage.undamaged;
    protected info: BuildingInfo;

    private static debrisSources: Array<string> = [
        ...buildingRuinSources,
        assetsFolder + "bit.png",
    ];
    private static debrisPerHit: number = 2;
    private static debrisOnNewStage: number = 8; // when a hit takes it down a stage (undamaged to damaged, damaged to destroyed)
    private static debrisWhenGone: number = 18;
    // A blast that brings down a lot of buildings would throw hundreds of pieces and bog the game down, so the more buildings
    // that have thrown debris in the last moment, the fewer each throws (half, then a third), and there is a limit to how many
    // pieces there can be in all
    private static recentDebris: Array<number> = [];
    private static maxBits: number = 170; // when it's brought down completely: a lot of pieces, three times what it used to be
    private static loudPieces: number = 4;      // of which only this many make a noise landing
    private static ownBitChance: number = 60; // percent of the pieces, for the buildings that have bits of their own

    // A bunker beneath it (see Bunker), if it has one
    public bunker?: Bunker;

    // Enemies hiding inside, under the picture. The building's damage is what decides their fate.
    private occupants: Array<BuildingEnemy> = [];
    public addOccupant(enemy: BuildingEnemy) {
        this.occupants.push(enemy);
    }
    // Somewhere within the building's picture to hide (on the page): anywhere its type says the picture
    // covers an enemy's square in both its undamaged and damaged states.
    public randomHidingSpot(): position {
        const hide = this.info.hide;
        return {
            X: parseInt(this.targetEl.style.left) + RandomNumberGen.randomNumBetween(hide.x[0], hide.x[1]),
            Y: parseInt(this.targetEl.style.top) + RandomNumberGen.randomNumBetween(hide.y[0], hide.y[1]),
        };
    }
    public canHideEnemies(): boolean {
        return !!this.info.hide;
    }
    // A building with fuel in it (see BuildingInfo.flammable) goes on fire when it's damaged, with the little fire burning on it and its
    // glow after dark, and when it's brought down (badly damaged) it detonates with a large explosion, which can take its neighbours with it
    private burning: boolean = false;
    private detonated: boolean = false;
    private fireCanvases: Array<HTMLCanvasElement> = [];
    private fireLight?: light;
    private static burnMs: speedRange = { min: 5000, max: 9000 }; // how long it burns before the fuel goes up
    private igniteFire() {
        if (this.burning || this.detonated) return;
        this.burning = true;
        const spots = this.info.fireAt || [[0.5, 0.35]];
        for (const spot of spots) { // a fire on each tank
            const canvas = ElementCreator.returnNewCanvas(this.targetEl, "buildingFire", true);
            canvas.style.left = this.info.width * spot[0] - 23 + "px";
            canvas.style.top = this.info.height * spot[1] - 34 + "px";
            canvas.style.transform = "none";
            new DamageOverlay(canvas).playLoop(fire_1_imgs);
            this.fireCanvases.push(canvas);
        }
        lightID++;
        this.fireLight = { id: lightID, pos: { X: 0, Y: 0 }, opac: 1, size: ExplSizes.large, fading: false, parent: this.targetEl, burning: true };
        fires.push(this.fireLight);
        setTimeout(() => this.burnDown(), RandomNumberGen.randomNumBetween(Building.burnMs.min, Building.burnMs.max));
    }
    // Left to burn, the fuel goes up and brings it down
    private burnDown() {
        if (this.detonated || this.removed || !this.targetEl.isConnected) return;
        this.damagePoints = Math.max(this.damagePoints, Building.hitPointsToDestroy);
        this.damage = Damage.destroyed;
        this.killOccupants(true);
        this.reAssignSrc();
        this.throwDebris(undefined, Building.debrisOnNewStage);
        this.detonate();
    }
    private detonate() {
        if (this.detonated) return;
        this.detonated = true;
        this.fireCanvases.forEach(c => c.remove());
        if (this.fireLight) {
            this.fireLight.burning = false;
            this.fireLight.fadeStep = 0.5;
        }
        const centre = CollisionDetection.getXYfromPoint(this.targetEl);
        SoundPlayer.playRandomSound(bigExplosions);
        ExplosionHandler.basicExplosion(centre, ExplSizes.XL, expl_med_imgs, weaponNames.mortar, 0.85); // (a bit bigger than a large one: the next size up, at 85%)
    }
    public blockId?: number; // which block of the coast's town it's in, if it's in one
    // A jetty or a breakwater, out into the sea
    public isPier(): boolean {
        return this.info.undamaged.includes("/Jetty_") || this.info.undamaged.includes("/Breakwater_");
    }
    // Among the town, not on the waterfront
    public isTown(): boolean {
        return !this.info.waterfront && !this.info.electric;
    }
    // Part of the power grid (a substation, or a stretch of its lines)
    public isElectric(): boolean {
        return !!this.info.electric;
    }
    // Brought down, or what's left of it is rubble: it doesn't do what it did
    public isWrecked(): boolean {
        return this.removed || this.damage === Damage.destroyed;
    }
    // A water tower and the like: nothing parks beside it
    public isTall(): boolean {
        return !!this.info.noParking;
    }
    // Wrecking the building takes everyone in it with it. A significant hit that only damages it
    // (see Building.hit) gives each of them an even chance of being killed, every time, so a few such
    // shots can clear a building out without bringing it down.
    // A strike that takes someone out with the building gets a 'good hit' voice, one of the acknowledge sounds (not every
    // building in a blast all at once, though)
    private static goodHitAt: number = 0;
    private static goodHitGap: number = 900; // ms
    private static goodHitDelay: number = 1300; // ms after the strike
    private killOccupants(destroyed: boolean) {
        let killed = 0;
        for (const enemy of this.occupants) {
            if (destroyed || RandomNumberGen.randomNumBetween(0, 1) === 1) {
                const wasLive = !enemy.isFinished();
                enemy.eliminate();
                if (wasLive && enemy.isFinished()) killed++;
            }
        }
        if (killed && performance.now() - Building.goodHitAt > Building.goodHitGap) {
            Building.goodHitAt = performance.now();
            // a moment later, so it comes after the noise of the explosion that did it instead of being lost in it
            setTimeout(() => SoundPlayer.playRandomSound(acknowledge), Building.goodHitDelay);
        }
    }

    constructor(info?: BuildingInfo) {
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
    protected reAssignSrc() {
        this.baseImgEl.src = this.getSource();
    }
    public getSource(): string {
        let filename: string;
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

    public setPosition(position?: position) {
        let x, y;
            x = position.X;
            y = position.Y;
        this.placeAt(x, y);
    }
    // Rubble is still a target: it goes on taking damage until it's gone
    public hitWhenDestroyed(): boolean {
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
    private static hitPointsToDestroy: number = 100;
    private static hitPointsToObliterate: number = 200;
    private static standardBlastRadius: number = 100; // an airstrike's; smaller blasts are already allowed for above
    private damagePoints: number = 0;
    private removed: boolean = false;

    private hitPoints(severity: strikeSeverity, wepName: weaponNames, blastRadius?: number): number {
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

    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        if (wepName < weaponNames.mortar || this.removed) {
            return;
        }
        const stageBefore = this.damage;
        this.damagePoints += this.hitPoints(severity, wepName, collisionInfo ? collisionInfo.radius : undefined);
        this.damage = this.damagePoints >= Building.hitPointsToDestroy ? Damage.destroyed : Damage.damaged;
        if (this.damagePoints >= Building.hitPointsToObliterate) {
            this.killOccupants(true);
            this.throwDebris(collisionInfo, Building.debrisWhenGone);
            if (this.info.flammable) this.detonate();
            this.clearAway();
            return;
        }
        this.reAssignSrc();
        if (this.info.flammable) {
            if (this.damage === Damage.destroyed) this.detonate();
            else this.igniteFire();
        }
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
    public obliterate() {
        if (this.removed) return;
        this.damagePoints = Building.hitPointsToObliterate;
        this.damage = Damage.destroyed;
        this.killOccupants(true);
        this.throwDebris(undefined, Building.debrisWhenGone);
        if (this.info.flammable) this.detonate();
        this.clearAway();
    }
    public isStanding(): boolean {
        return !this.removed;
    }

    // Takes the sprite off the map altogether, at once: it's all been blown to pieces
    private clearAway() {
        this.removed = true;
        const index = allTargets.indexOf(this);
        if (index >= 0) allTargets.splice(index, 1); // nothing's left for blasts to hit
        ContentElHandler.removeFromContentEl(this.targetEl);
    }

    // The pieces fly out from where the blast hit the building.
    private throwDebris(collisionInfo?: vectorMoveObj, pieces: number = Building.debrisPerHit) {
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
    private throwChunk(origin: position, imageSrc: string, loud: boolean = true) {
        const chunk = this.returnBit(imageSrc, "wheel", "wheelPic", origin);
        chunk.classList.add("buildingChunk");
        const direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
        ThrowHandler.lob(chunk, direc, loud ? crashes : null, ThrowHandler.removeIfLandedInWater);
    }
    private throwDebrisPiece(origin: position, loud: boolean = true) {
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
    protected damageEl: HTMLCanvasElement;
  //  protected damageEl: HTMLImageElement;
    protected lockonEl: HTMLImageElement;
    protected destroyedSource: string = assetsFolder + 'fire_3.gif';
    protected onFireSource: string = assetsFolder + 'fire_1.gif';
    protected smokingSource: string = assetsFolder + 'smoke_3.gif';
    protected damageOverlay: DamageOverlay;

     //   protected damagedSource: Array<string> = smoke_Frames;


    protected speed: number;
    public armour: Armour;

    protected startPosition: number;
    public status: number = Status.active;
    public health: number;
    public damage: number = Damage.undamaged;
    public movesAtBlast: boolean;
    protected info: TargetInfo;

    constructor(info: TargetInfo) {
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
    protected get picSources(): Array<string> {
        return [];
    }

    public decidePosition(pos: position) {
        let x, y;
        if (pos) {
            x = pos.X
            y = pos.Y
        }
        else {
            x = this.getTargetEl().clientWidth * -1;
            this.startPosition = RandomNumberGen.randomNumBetween(10, 90);
            y = window.innerHeight * this.startPosition / 100;
        }
        this.placeAt(x, y);
    }
    public returnPosition() {
        let pos: position = { X: parseInt(this.targetEl.style.left), Y: parseInt(this.targetEl.style.top) }
        return pos
    }

    protected moveFromBlast(severity: strikeSeverity, collisionInfo: vectorMoveObj) {
        if (this.movesAtBlast) {
            if (this.armour >= Armour.moderate) {
                collisionInfo.radius /= 2; // hack to reduce punting armour about
            }
            severity > strikeSeverity.light ? ThrowHandler.moveAtAngle(collisionInfo) : "";
        }
    }

    public hit(sev: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) { }

    // Whether there's nothing more to be done about this one: it's destroyed
    public isFinished(): boolean {
        return this.damage === Damage.destroyed;
    }

    // What a surveillance drone sees (see SurveillanceDrone): the area on the screen this gives off a
    // heat signature across, or null if it isn't giving one off at the moment. It shows when that area
    // is within the drone's scan, and is drawn by the 'heatSig' class.
    public heatSignatureBox(): Box | null {
        return null;
    }
    // around and radius say where the scan is, for something it only lights the part of
    public setHeatSignature(show: boolean, around?: position, radius?: number) {
        this.targetEl.classList.toggle('heatSig', show);
    }
    // How far a scan point is from where this gives off heat, or null if it isn't giving any off. Most
    // things give it off across their box; a tunnel along its whole length.
    public heatDistanceFrom(p: position): number | null {
        const box = this.heatSignatureBox();
        if (!box) return null;
        const nearest = CollisionDetection.nearestPointInBox(p, box);
        return Math.hypot(nearest.X - p.X, nearest.Y - p.Y);
    }
    // For something that isn't a single place (a tunnel): the point of it that a blast at this position is
    // measured from, if it isn't to be measured to its middle
    public blastFocus(blastCenter: position): position | null {
        return null;
    }
    // Whether a tunnel charge can be set on this
    public takesCharge(): boolean {
        return false;
    }

    // Called when a target is cleared away without having run its course (a new stage or a new game),
    // for any that has something of its own still going
    public dispose() { }

    protected move(posX: number) {
        if (posX > ContentElHandler.contentElWidth()) {
            this.status = Status.escaped;
            game.updateKillStats(killStatDisplayOptions.escaped)
        }
        this.targetEl.style.left = posX + this.speed + "px";
    }

    protected targetDisabled() {
        if (this.status != Status.disabled) {
            this.status = Status.disabled;
            game.updateKillStats(killStatDisplayOptions.disabled)
        }
    }

    protected targetDestroyed(priorStatus: Status) {
        this.damage = Damage.destroyed;
        game.updateKillStats(killStatDisplayOptions.destroyed)
        if (priorStatus == Status.disabled) {
            game.updateKillStats(killStatDisplayOptions.disabled, -1)
        }
        this.removeFromArray();
    }

    protected removeFromArray() {
        setTimeout(() => {
            let arr = allTargets;
            let index = arr.indexOf(this);
            if (index >= 0) {
                arr.splice(index, 1);
            }
        }, damagedTargetStay + fadeAnimTime);
    }
    protected destructionBits() {    }

    public toggleLockOnStrike(bool) {
        bool ? this.lockonEl.src = assetsSVGFolder + "lock_red.svg" + loadNewImage() : this.lockonEl.src = assetsSVGFolder + "target-box.svg"
    }
    public toggleLockOn(bool) { 
        bool ? this.lockonEl.style.visibility = 'visible' : this.lockonEl.style.visibility = 'hidden';
    }
    public getLockOnStatus() {
        return this.lockonEl.style.visibility == 'visible' ? true : false;
    }

    public action() {
        if (this.status == Status.active) {
            this.move(parseInt(this.targetEl.style.left));
        }
    }
}

// A stack of ammunition or of rockets, standing about for the taking out. It has no damaged picture: anything that damages it at all sets
// it on fire (the little fire burning on it, and its glow after dark), and anything more than light blows it up at once. Left burning,
// the ammunition crackles off a few seconds later, and a few more seconds after that it goes up with a very small explosion; the rockets
// say nothing, and go up with a large one. Either way the explosion can set off whatever is next to it.
class ExplosiveTarget extends Target {
    private static fuseMs: speedRange = { min: 3000, max: 5000 };   // the time it burns before each of its two stages
    private static crackles: number = 4;                            // gunfire noises in the ammunition's first stage
    private blast: ExplosiveInfo;
    private burning: boolean = false;
    private exploded: boolean = false;
    private fireLight: light;

    constructor(info?: ExplosiveInfo) {
        super(explosiveTargetInfo);
        this.blast = info ? info : RandomNumberGen.returnRandomFromArray(allExplosiveInfo);
        this.targetEl.classList.add("explosive");
        this.targetEl.classList.remove("smoothTransition");
        this.targetEl.style.width = this.blast.width + "px";
        this.targetEl.style.height = this.blast.height + "px";
        this.picEl.style.width = "100%";
        this.baseImgEl.src = assetsFolder + "buildings/" + this.blast.file;
    }
    public action() { } // it stays put

    // A drone's scan shows it up, in blue like a bunker, to say it's a target
    public heatSignatureBox(): Box | null {
        return this.exploded ? null : this.targetEl.getBoundingClientRect();
    }

    // Any of it that a blast reaches
    public hitBox(): Box {
        const rect = this.targetEl.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    }

    // Ammunition takes two hits from a gun to catch fire; rockets and RPGs don't catch from a gun at all, they need an explosion
    private gunHits: number = 0;
    private static gunHitsToIgnite: number = 2;
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        if (this.exploded || wepName == weaponNames.flare || wepName == weaponNames.surveillance) return;
        if (wepName == weaponNames.sniper) {
            if (!this.blast.rockets && ++this.gunHits >= ExplosiveTarget.gunHitsToIgnite) this.catchFire();
        }
        else if (severity <= strikeSeverity.light) {
            this.catchFire();
        }
        else {
            this.explode(true);
        }
    }

    private catchFire() {
        if (this.burning) return;
        this.burning = true;
        this.damage = Damage.damaged;
        this.damageOverlay.playLoop(fire_1_imgs);
        this.damageEl.classList.add('badDamaged');
        lightID++;
        this.fireLight = { id: lightID, pos: this.returnPosition(), opac: 1, size: ExplSizes.large, fading: false, parent: this.getTargetEl(), burning: true };
        fires.push(this.fireLight);
        const fuse = () => RandomNumberGen.randomNumBetween(ExplosiveTarget.fuseMs.min, ExplosiveTarget.fuseMs.max);
        setTimeout(() => {
            if (this.exploded || !this.targetEl.isConnected) return;
            if (!this.blast.rockets) this.crackle(ExplosiveTarget.crackles);
            setTimeout(() => this.explode(false), fuse());
        }, fuse());
    }
    // The ammunition going off in the fire: a run of gunfire
    private crackle(left: number) {
        if (this.exploded || !this.targetEl.isConnected || left <= 0) return;
        SoundPlayer.playRandomSound(gunSounds);
        setTimeout(() => this.crackle(left - 1), RandomNumberGen.randomNumBetween(180, 520));
    }

    // struck: a blast did it, so it counts as a direct hit; otherwise it went up in the fire
    private explode(struck: boolean) {
        if (this.exploded || !this.targetEl.isConnected) return;
        this.exploded = true;
        if (this.fireLight) {
            this.fireLight.burning = false;
            this.fireLight.fadeStep = 0.5;
        }
        const centre = CollisionDetection.getXYfromPoint(this.targetEl);
        const scoredFrom = struck ? this.status : Status.disabled; // (one that went up in the fire scores as a plain kill, not a "direct hit" popup)
        this.targetDisabled();
        this.targetDestroyed(this.status);
        game.assessKillPoints(scoredFrom, this.damage, false, this);
        ContentElHandler.removeFromContentEl(this.targetEl);
        if (this.blast.rockets) {
            SoundPlayer.playRandomSound(bigExplosions);
            ExplosionHandler.basicExplosion(centre, ExplSizes.XL, expl_med_imgs, weaponNames.mortar, 0.85); // (a little larger than a large explosion: the next size up, drawn at 85%)
        }
        else {
            SoundPlayer.playRandomSound(explosions);
            ExplosionHandler.basicExplosion(centre, ExplSizes.tiny, expl_small_imgs, weaponNames.mortar);
        }
    }
    public dispose() {
        this.exploded = true; // (cleared away with its stage: nothing more happens)
        if (this.fireLight) this.fireLight.burning = false;
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
    public action() { } // it stays put
    // Picked up through the building by a surveillance drone, as long as it's alive
    public heatSignatureBox(): Box | null {
        return this.damage === Damage.destroyed ? null : this.targetEl.getBoundingClientRect();
    }
    public eliminate() {
        if (this.damage === Damage.destroyed) return;
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
    protected damagedSource: string = assetsFolder + 'smoke_3.gif';
    //protected destroyedSource: string = assetsFolder + 'fire_1.gif';
    protected trailBlast: Array<HTMLImageElement> = expl_small_imgs;
  //  protected destroyedSource: Array<string> = fire_1_frames;
    public movesAtBlast: boolean = false;
    private targetTimer: number;
    private newTargetFrequency: number = 5000;

    private trail: HTMLElement;

    // The whole tunnel, from the head right back along the trail, for as long as it's still there
    public heatSignatureBox(): Box | null {
        if (this.damage === Damage.destroyed) return null;
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
    protected get picSources(): Array<string> {
        return ['trans.png'];
    }

    private extendTunnel() {
        this.trail.style.width = this.targetEl.getBoundingClientRect().width + parseInt(this.targetEl.style.left) + 'px';
    }
    private produceTargetCheck() {
        if (!this.targetEl.isConnected) { // cleared off the screen: whatever's left of it mustn't keep producing
            this.stopTargetProduction();
            return;
        }
        let num = RandomNumberGen.randomNumBetween(1, 100);
        if (num >= 90) {
            let rect = this.getTargetEl().getBoundingClientRect();
            let pos: position = { X: rect.x, Y: rect.y }
            let newTarget = new RegVehicleTarget();
       //     newTarget.setPosition(rect.x, rect.y);
            game.targetCreation(newTarget, pos);

            SoundPlayer.playSequentialSound(revs);
        }
    }
    private setTargetProduction() {
        this.targetTimer = window.setInterval(() => {
            if (game.gameTimer) {
                this.produceTargetCheck();
            }
        }, this.newTargetFrequency);
    }
    private stopTargetProduction() {
        clearInterval(this.targetTimer);
    }
    public dispose() {
        this.stopTargetProduction();
    }
    public takesCharge(): boolean {
        return this.damage !== Damage.destroyed;
    }

    public hit(severity: strikeSeverity, wepName: weaponNames) {
        if (wepName < weaponNames.airstrike) {
                return
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

    private blowTunnel() {
        let numOfimgs: number = parseInt(this.trail.style.width) / 175;
        let imgArr: Array<HTMLImageElement> = [];
        for (let x = 0; x <= numOfimgs; x++) {
            let img = document.createElement('img');
            this.trail.appendChild(img);
            img.style.width = this.targetEl.getBoundingClientRect().width + 'px';
            imgArr.unshift(img);
        }
        for (let img in imgArr) {
            let indexNum = parseInt(img);
            setTimeout(() => {
                let blastCenter: position = CollisionDetection.getXYfromPoint(imgArr[img])
                if (indexNum == 0) {
                    ExplosionHandler.basicExplosion(blastCenter, ExplSizes.XL, expl_med_imgs, weaponNames.airstrike)
                }
                ExplosionHandler.basicExplosion(blastCenter, ExplSizes.small, this.trailBlast, weaponNames.mortar)
            }, (indexNum + 1) * 150)
        }
        this.removeTunnel(imgArr.length);
    }
    private removeTunnel(length) {
        this.trail.classList.add('hide');
   //     setTimeout(() => { this.trail.remove() }, length * 250)
        setTimeout(() => { this.trail.remove() }, 8000);
        ContentElHandler.fadeRemoveItem(this.targetEl, destroyedTargetStay, fadeAnimTime);
    }
    public action() {
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
    private static legMin: number = 110;       // how long each straight run is, before it turns
    private static legMax: number = 240;
    private static edgeMargin: number = 70;    // it doesn't turn closer than this to the edge of the screen
    private static explosionSpacing: number = 150;
    private static bigBlastRadius: number = 140; // a blast this big (an airstrike's is 100) set off right on it does for it

    private path: Array<position> = [];        // where it runs, in page coordinates, from the head to well off the screen
    private pathEl: SVGSVGElement;

    constructor() {
        super(hiddenTunnelTarget);
        this.targetEl.classList.add('smallSquare', 'tunnelHead', 'hiddenTunnel');
        this.targetEl.classList.remove('flexCenter');
    }
    protected get picSources(): Array<string> {
        return ['trans.png'];
    }

    public decidePosition(pos: position) {
        this.placeAt(pos.X, pos.Y);
        const head: position = { X: pos.X + this.targetEl.offsetWidth / 2, Y: pos.Y + this.targetEl.offsetHeight / 2 };
        this.path = HiddenTunnel.makePath(head, window.innerWidth, window.innerHeight, RandomNumberGen.randomNumBetween(0, 2));
        this.drawPath(pos);
    }
    public action() { } // it stays put

    // The head, then a straight run, and so on with `turns` right-angle turns, and a last run that carries on off the screen
    private static makePath(head: position, width: number, height: number, turns: number): Array<position> {
        const margin = HiddenTunnel.edgeMargin;
        const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
        // how far it can go from here in a direction before it's near the edge
        const room = (p: position, d: { x: number, y: number }) => {
            if (d.x > 0) return width - margin - p.X;
            if (d.x < 0) return p.X - margin;
            if (d.y > 0) return height - margin - p.Y;
            return p.Y - margin;
        };
        let here = head;
        const roomy = directions.filter(d => room(here, d) >= HiddenTunnel.legMin);
        let dir = RandomNumberGen.returnRandomFromArray(roomy.length ? roomy : directions);
        const points: Array<position> = [head];
        for (let t = 0; t < turns; t++) {
            const available = room(here, dir);
            if (available < HiddenTunnel.legMin) break;
            const length = RandomNumberGen.randomNumBetween(HiddenTunnel.legMin, Math.min(HiddenTunnel.legMax, available));
            here = { X: here.X + dir.x * length, Y: here.Y + dir.y * length };
            points.push(here);
            const turnsAvailable = [{ x: -dir.y, y: dir.x }, { x: dir.y, y: -dir.x }].filter(d => room(here, d) >= HiddenTunnel.legMin);
            if (!turnsAvailable.length) break;
            dir = RandomNumberGen.returnRandomFromArray(turnsAvailable);
        }
        const far = width + height; // far enough to be off the screen from anywhere on it
        points.push({ X: here.X + dir.x * far, Y: here.Y + dir.y * far });
        return points;
    }

    private drawPath(headPos: position) {
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
        this.pathEl = svg as SVGSVGElement;
    }

    // A scan only picks up the section of tunnel beneath it: the path is drawn through a soft-edged circle at the
    // scan (the picture is laid over the whole screen, so the circle's position is the scan's own)
    public setHeatSignature(show: boolean, around?: position, radius?: number) {
        super.setHeatSignature(show);
        if (show && around && radius && this.pathEl) {
            const mask = "radial-gradient(circle at " + around.X + "px " + around.Y + "px, black " + Math.round(radius * 0.65) + "px, transparent " + radius + "px)";
            this.pathEl.style.maskImage = mask;
            this.pathEl.style.webkitMaskImage = mask;
        }
    }

    // The nearest point to p on the path (the part that's on the screen), and how far off that is
    private nearestOnPath(p: position): { point: position, dist: number } {
        let best = { point: this.path[0], dist: Infinity };
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const dx = b.X - a.X, dy = b.Y - a.Y;
            const lengthSquared = dx * dx + dy * dy;
            const along = lengthSquared ? Math.max(0, Math.min(1, ((p.X - a.X) * dx + (p.Y - a.Y) * dy) / lengthSquared)) : 0;
            const point = { X: a.X + dx * along, Y: a.Y + dy * along };
            const dist = Math.hypot(point.X - p.X, point.Y - p.Y);
            if (dist < best.dist) best = { point: point, dist: dist };
        }
        return best;
    }

    // Blasts are measured from the nearest part of the tunnel, not from its head
    public blastFocus(blastCenter: position): position | null {
        return this.damage === Damage.destroyed ? null : this.nearestOnPath(blastCenter).point;
    }
    // A scan lights the whole tunnel if it reaches any part of it
    public heatDistanceFrom(p: position): number | null {
        return this.damage === Damage.destroyed ? null : this.nearestOnPath(p).dist;
    }
    public takesCharge(): boolean {
        return this.damage !== Damage.destroyed;
    }

    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        if (this.damage === Damage.destroyed) return;
        const charge = wepName === weaponNames.tunnel_Charge;
        const bigDirectHit = severity >= strikeSeverity.catastrophic && !!collisionInfo && collisionInfo.radius >= HiddenTunnel.bigBlastRadius;
        if (charge || bigDirectHit) {
            this.blowUp();
        }
    }

    // Counts as destroyed straight away; the explosions follow along its length from the head, a string of
    // them, turns and all, and the tunnel is only seen for a moment at each, as a flash that dies away fast.
    private blowUp() {
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
    private flashPath(from: number, to: number) {
        const ns = "http://www.w3.org/2000/svg";
        const flash = document.createElementNS(ns, "polyline");
        flash.setAttribute("class", "tunnelFlash");
        flash.setAttribute("points", this.pathBetween(from, to).map(p => p.X + "," + p.Y).join(" "));
        flash.addEventListener("animationend", () => flash.remove());
        this.pathEl.appendChild(flash);
    }

    // The points of the path from one distance along it to another, corners included
    private pathBetween(from: number, to: number): Array<position> {
        const points: Array<position> = [];
        let walked = 0;
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const length = Math.hypot(b.X - a.X, b.Y - a.Y);
            const at = (d: number) => ({ X: a.X + (b.X - a.X) * d / length, Y: a.Y + (b.Y - a.Y) * d / length });
            if (walked + length > from && walked < to) {
                if (!points.length) points.push(at(Math.max(0, from - walked)));
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
    private stopsAlongPath(): Array<{ point: position, along: number }> {
        const stops: Array<{ point: position, along: number }> = [{ point: this.path[0], along: 0 }];
        const onScreen = (p: position) => p.X >= 0 && p.X <= window.innerWidth && p.Y >= 0 && p.Y <= window.innerHeight;
        let walked = 0;
        let carried = 0; // how far into the next gap we already are, so the spacing runs on round the corners
        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i], b = this.path[i + 1];
            const length = Math.hypot(b.X - a.X, b.Y - a.Y);
            for (let d = HiddenTunnel.explosionSpacing - carried; d < length; d += HiddenTunnel.explosionSpacing) {
                const p = { X: a.X + (b.X - a.X) * d / length, Y: a.Y + (b.Y - a.Y) * d / length };
                if (onScreen(p)) stops.push({ point: p, along: walked + d });
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
    public heatSignatureBox(): Box | null {
        return !this.cold && this.status === Status.active && this.damage !== Damage.destroyed ? this.targetEl.getBoundingClientRect() : null;
    }
    public cold: boolean = false;

    // A vehicle that's up and running and could be driven off: not parked cold, not knocked out or burning
    public isRunning(): boolean {
        return !this.cold && this.status === Status.active && this.damage !== Damage.destroyed && !this.wrecked && !this.fallen;
    }
    // The special enemy making off in it, if there is one: this vehicle is then the special target, and glows its
    // colour on a scan. It's driven off to the right at the speed given (px every 100ms); if it gets off the screen
    // that's the game lost, and if it's stopped (disabled or destroyed) that's him eliminated.
    public specialName?: string;
    public specialPortrait?: string;
    // Makes this the special target, whoever's driving: it glows his colour on a scan, and what happens to it is what happens to him
    public makeSpecial(name: string, portrait?: string) {
        this.specialName = name;
        this.specialPortrait = portrait;
        this.targetEl.classList.add('special');
    }
    // He doesn't take off at full speed: it builds up over the first second (ten ticks of the game loop) to the top speed given. Anything that
    // changes its speed meanwhile (being hit) is carried on in what it builds up to.
    private static fleeRampTicks: number = 10;
    private fleeRamp?: { top: number, last: number, tick: number, factor: number };
    public startFleeing(name: string, speed: number, portrait?: string) {
        this.makeSpecial(name, portrait);
        const first = speed * 0.05;
        this.fleeRamp = { top: speed, last: first, tick: 0, factor: 1 };
        this.speed = first;
        SoundPlayer.playSequentialSound(revs);
    }
    private stepFleeRamp() {
        const ramp = this.fleeRamp;
        if (!ramp) return;
        if (this.speed !== ramp.last) {
            if (this.speed === 0) { this.fleeRamp = undefined; return; } // stopped dead: nothing more to build up
            ramp.factor *= this.speed / ramp.last;
        }
        ramp.tick++;
        const next = ramp.top * ramp.factor * Math.min(1, ramp.tick / VehicleTarget.fleeRampTicks);
        this.speed = next;
        ramp.last = next;
        if (ramp.tick >= VehicleTarget.fleeRampTicks) this.fleeRamp = undefined;
    }
    private specialDown() {
        if (!this.specialName) return;
        const name = this.specialName;
        this.specialName = undefined;
        this.targetEl.classList.remove('special');
        announceElimination(name, this.specialPortrait);
        if (game.level) game.level.specialDown(); // (another one in the stage is spooked)
    }
    protected targetDisabled() {
        super.targetDisabled();
        this.specialDown();
    }
    protected targetDestroyed(priorStatus: Status) {
        super.targetDestroyed(priorStatus);
        this.specialDown();
    }
    protected move(posX: number) {
        if (this.specialName && (posX > ContentElHandler.contentElWidth() || posX + this.targetEl.offsetWidth < 0)) {
            const name = this.specialName, portrait = this.specialPortrait;
            this.status = Status.escaped;
            this.specialName = undefined;
            game.failGame(name + " got away!", portrait);
            return;
        }
        super.move(posX);
    }
    // A vehicle that's just sitting there. It can still be hit, flipped and blown up like any other.
    public park() {
        this.speed = 0;
    }
    // Parked ones count as done once they're knocked out, not only when they're wrecked
    public finishedWhenDisabled: boolean = false;
    public isFinished(): boolean {
        return super.isFinished() || (this.finishedWhenDisabled && this.status !== Status.active);
    }

    protected wheelSource: string = assetsFolder + 'vehicles/wheel.png';
    protected wheelSizeClass: string;
    public movesAtBlast: boolean = true;
    public angle: number = 0;

    constructor(info: TargetInfo) {
        super(info);
    }
    // Driving over a crater. How far down a vehicle is, and which way it is tilted, comes from where it is on the crater's
    // profile and nothing else: not from timers or how long it has been there. So a slow one eases in and out as slowly as it is
    // going, a fast one drops in quickly, and one that stops in a crater stays where it has got to. The profile of a crater, along
    // the way a vehicle drives across it: a wall down at the edge of the picture, a flat bottom, and a wall up the other side.
    // A bigger crater is deeper, and a small one is hardly more than a dent.
    private craterRolled: WeakSet<object> = new WeakSet();
    private craterPosed: boolean = false;
    // An airstrike's crater (the 4) gives a 15% chance of going over forward, anything bigger 30%, anything smaller none
    // and a faster one is a little likelier to go over (about a twelfth more for every step of speed above 4)
    private static craterTumbleChance(size: number, speed: number): number {
        const base = size > ExplSizes.XL ? 30 : size >= ExplSizes.XL ? 15 : 0;
        return base * Math.max(0.7, Math.min(1.4, 1 + (speed - 4) * 0.08));
    }
    // How deep the bottom is, as a share of the crater's half-height (its picture is the crater seen at a slant)
    private static craterDepthShare(size: number): number {
        return size <= ExplSizes.small ? 0.25 : size < ExplSizes.XL ? 0.4 : size <= ExplSizes.XL ? 0.5 : 0.55;
    }
    private static craterWall: number = 0.35; // each wall's share of the way across
    // How far down (px) the ground is at this x, along a line at this height (y): zero off the edge of the crater's picture
    // How much of the crater's depth there is across a line at this height: none off the top or bottom of its picture, and the
    // lower edge of the picture (the near rim, which is shadow and spoil more than hole) is left out, shaved off at 0.78 of the way
    private static craterLowerEdge: number = 0.78;
    private static craterRim(c: { y: number, ry: number }, y: number): number {
        const across = (y - c.y) / c.ry;
        const scaled = across > 0 ? across / VehicleTarget.craterLowerEdge : across;
        return Math.abs(scaled) >= 1 ? 0 : Math.sqrt(1 - scaled * scaled);
    }
    // The depth (px) of the ground at this x along a line at this height (y): zero off the edge of the crater's picture
    private static craterDepthAt(c: { x: number, y: number, rx: number, ry: number, size: number }, x: number, y: number): number {
        const rim = VehicleTarget.craterRim(c, y);
        if (rim <= 0) return 0;
        const half = c.rx * rim;                                    // the picture's width along this line: narrower towards its top and bottom
        const u = (x - (c.x - half)) / (2 * half);                  // 0 at its near edge, 1 at the far one
        if (u <= 0 || u >= 1) return 0;
        const wall = VehicleTarget.craterWall;
        const edge = u < wall ? u / wall : u > 1 - wall ? (1 - u) / wall : 1;
        const smooth = edge * edge * (3 - 2 * edge);                // eased, so the lip and the base are rounded off
        return c.ry * VehicleTarget.craterDepthShare(c.size) * rim * smooth;
    }
    private static visibleCraters() { // (one that is fading away still has some of its effect, see ExplosionHandler.strengthOf)
        return ExplosionHandler.liveCraters();
    }
    private static craterTotalDepth(x: number, y: number): number {
        let depth = 0;
        for (const c of VehicleTarget.visibleCraters()) {
            depth += VehicleTarget.craterDepthAt(c, x, y) * ExplosionHandler.strengthOf(c);
        }
        return depth;
    }
    private pose(degrees: number, sink: number, seconds: number = 0.1) {
        this.baseImgEl.style.transition = "transform " + seconds + "s linear"; // just smooths the steps between one move and the next
        this.baseImgEl.style.transform = (sink ? "translateY(" + sink.toFixed(1) + "px) " : "") + "rotate(" + degrees.toFixed(1) + "deg)";
    }
    // A vehicle that has gone over: it carries on down the same profile, with what's left of its speed, while it flips onto its roof
    private tumbling?: { vx: number, flip: number, rate: number, age: number, drag: number, stopAt: number, crater: { x: number, y: number, rx: number, ry: number, size: number } };
    // Fallen into a crater and on its roof: still a live target, still there to be hit and destroyed, but it goes no further, and
    // it stays just where it came to rest, whatever happens to the crater after (when that fades away, say)
    public fallen: boolean = false;
    private stepTumble() {
        const t = this.tumbling;
        const size = this.picEl.getBoundingClientRect();
        if (!size.width) return;
        t.age++;
        // it slides on: slowed by the ground and sped by the slope when it's on a wall, and stops when it has run out of speed
        const here = parseFloat(this.targetEl.style.left) || 0;
        const foot = (parseFloat(this.targetEl.style.top) || 0) + size.height * 0.85;
        const depth = (x: number) => VehicleTarget.craterDepthAt(t.crater, x, foot); // (its own crater, even if that has faded away since)
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
        if (t.age > 1 && t.flip < 180) t.flip = Math.min(180, t.flip + t.rate);
        const angle = t.flip > 0 ? t.flip + Math.max(-18, Math.min(18, pitch)) * (1 - t.flip / 180) : Math.max(-18, Math.min(18, pitch));
        this.pose(angle, middle);
        if (t.flip >= 180 && t.vx < t.stopAt) {
            this.tumbling = undefined; // it has come to rest, on its roof, wherever it has got to: part way down the side or at the bottom
        }
    }
    private startTumble(crater: { x: number, y: number, rx: number, ry: number, size: number }) {
        this.craterPosed = true;
        this.fallen = true;
        // where it ends up is as random as how it goes over: some just fall down the edge, some slide on at the bottom
        const carried = Math.max(this.speed, 2) * (0.15 + Math.random() * 1.15);
        this.tumbling = { vx: carried, flip: 0, rate: 30 + Math.random() * 35, age: 0, drag: 0.6 + Math.random() * 0.26, stopAt: 0.2 + Math.random() * 0.85, crater: crater };
        this.lightDamage(); // smoking, but not out of it: it's still a live target
        this.speed = 0;
        SoundPlayer.playRandomSound(crashes);
    }
    protected craterEffects() {
        if (this.tumbling) {
            this.stepTumble();
            return;
        }
        if (this.fallen) return; // where it came to rest is where it stays
        if (this instanceof WaterVehicleTarget || this.status !== Status.active || this.wrecked || this.cold) {
            if (this.craterPosed && this.status === Status.active) { this.craterPosed = false; this.pose(0, 0); }
            return;
        }
        const size = this.picEl.getBoundingClientRect();
        if (!size.width) return;
        // from where it has been put, which is where it is going: the picture is on its way there, with a transition
        const left = parseFloat(this.targetEl.style.left) || 0;
        const foot = (parseFloat(this.targetEl.style.top) || 0) + size.height * 0.85;
        const frontX = left + size.width * 0.88, rearX = left + size.width * 0.12, middleX = left + size.width / 2;
        const front = VehicleTarget.craterTotalDepth(frontX, foot);
        const rear = VehicleTarget.craterTotalDepth(rearX, foot);
        const middle = VehicleTarget.craterTotalDepth(middleX, foot);
        if (front === 0 && rear === 0 && middle === 0) {
            if (this.craterPosed) { this.craterPosed = false; this.pose(0, 0, 0.2); }
            return;
        }
        // once it has dipped in and is well on its way down the wall (the middle of it less than halfway to the bottom, a bit over a third) it may go over
        if (front > 0) {
            for (const c of VehicleTarget.visibleCraters()) {
                if (this.craterRolled.has(c)) continue;
                if (ExplosionHandler.strengthOf(c) < 1) continue; // (not into one that is going)
                const deepest = c.ry * VehicleTarget.craterDepthShare(c.size) * VehicleTarget.craterRim(c, foot);
                if (deepest <= 0 || VehicleTarget.craterDepthAt(c, middleX, foot) < deepest * 0.4) continue;
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
    public action() {
        this.stepFleeRamp();
        super.action();
        this.craterEffects();
    }

    private ricochetChance(num) {
        RandomNumberGen.randomNumBetween(1, 10) > num ? SoundPlayer.playRandomSound(ricochet) : "";
    }
    private incrementDamageForArmour() {
        this.damage += 1;
        this.ricochetChance(7);
    }

    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) {
        if (this.wrecked) return; // just a burning wreck now: nothing left to flip, shove or damage
        let direc: direction;
        if (collisionInfo) {
            direc = ThrowHandler.determineDirectionForFlip(collisionInfo);
            this.moveFromBlast(severity, collisionInfo)
        }

        if (this.armour == Armour.none) {
            if (wepName == weaponNames.sniper) {
                    if (this.damage > Damage.undamaged) {
                        setTimeout(() => this.targetDisabled(), RandomNumberGen.randomNumBetween(200, 1200))
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
                    return
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.heavy ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.light) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        return
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }

        if (this.armour == Armour.heavy) {
            if (wepName == weaponNames.sniper) {
                this.ricochetChance(0);
                return
            }
            if (wepName >= weaponNames.mortar) {
                if (wepName < weaponNames.airstrike && severity < strikeSeverity.catastrophic ||
                    wepName < weaponNames.tactical_Nuke && severity <= strikeSeverity.medium) {
                    if (this.damage < Damage.badlyDented) {
                        this.incrementDamageForArmour();
                        if (this.damage == Damage.badlyDented) {
                            this.lightDamage();
                        }
                        return
                    }
                }
                this.basicVehicleDamageModel(severity, direc, collisionInfo);
            }
        }
    }

    private removeFlip(elem) {
        elem.classList.remove('flip');
        ThrowHandler.cssRotateAngle(elem, 0);
    }

    private hitAcknowledge() {
        if (this.damage <= Damage.damaged) {
            let rollForHit = RandomNumberGen.randomNumBetween(1, 8);
            if (rollForHit == 8) {
                SoundPlayer.playRandomSound(acknowledge)
            }
        }
    }
    // A chance for a vehicle to treat a blow as harder (or softer) than the blast's distance alone says.
    protected adjustSeverity(severity: strikeSeverity): strikeSeverity {
        return severity;
    }

    // Wear: every hit that gets past the armour adds to a running total, the stronger the hit the
    // more, and once a vehicle has taken all it can it's destroyed by the next one, whatever that
    // hit would have done alone. So it can be knocked about and flipped a few times, but a dozen
    // tiny blasts add up to a wreck. Heavier armour holds out longer.
    private static wearPerSeverity: Array<number> = [1, 2, 3]; // light, medium, heavy
    private static wearToDestroy: Array<number> = [10, 14, 20]; // by armour: none, moderate, heavy
    private wear: number = 0;

    private wearDown(severity: strikeSeverity): strikeSeverity {
        if (severity >= strikeSeverity.catastrophic) return severity;
        this.wear += VehicleTarget.wearPerSeverity[severity];
        return this.wear >= VehicleTarget.wearToDestroy[this.armour] ? strikeSeverity.catastrophic : severity;
    }

    private basicVehicleDamageModel(severity: strikeSeverity, direc: direction, collisionInfo?: vectorMoveObj) {
        severity = this.wearDown(this.adjustSeverity(severity));
        let priorStatus = this.status;
        if (severity == strikeSeverity.light) {
            this.damage >= Damage.badlyDented ? severity = strikeSeverity.medium : "";
            this.lightDamage();
        }
        if (severity >= strikeSeverity.medium) {
            this.targetDisabled();
            this.hitAcknowledge();                 /////// put with the other!!!
        }
        if (severity == strikeSeverity.medium) {
            this.damage = Damage.moderateDamaged;
            this.badDamage(direc, collisionInfo);
            game.assessKillPoints(priorStatus, this.damage, false, this);
            return
        }
        if (severity == strikeSeverity.heavy) {
            this.damage = Damage.heavyDamaged;
            this.badDamage(direc, collisionInfo);
            game.assessKillPoints(priorStatus, this.damage, false, this);
            return
        }
        if (severity == strikeSeverity.catastrophic) {
            this.targetDestroyed(priorStatus);
            this.completeDestruction(collisionInfo);
            game.assessKillPoints(priorStatus, this.damage, false, this);
            return
        }
    }
    private lightDamage() {
        if (this.damage >= Damage.moderateDamaged) { return }
        this.damage = Damage.damaged;

        this.smoking();
 //       this.damageEl.src = this.smokingSource;
        this.damageEl.classList.add('lightDamaged');
        this.speed = this.speed / 3;
    }
    private addSrc(src) {
        //return src + loadNewImage();
        return src
    }
    private smoking() {
        this.damageOverlay.playLoop(smoke_imgs);
     //   this.damageEl.src = this.addSrc(this.smokingSource);
    }
    // The glow cast over the dark overlay while this is on fire. One per vehicle however many times
    // it's set alight, and it goes out (see stopFireLight) when the fire does, not when the
    // vehicle is finally cleared away.
    private fireLight: light;
    private wrecked: boolean = false;

    protected startFireLight() {
        if (this.fireLight && fires.includes(this.fireLight)) { // still there, perhaps fading: light it again
            this.fireLight.burning = true;
            this.fireLight.fadeStep = undefined;
            return;
        }
        lightID++
        this.fireLight = { id: lightID, pos: this.returnPosition(), opac: 1, size: ExplSizes.XL, fading: false, parent: this.getTargetEl(), burning: true };
        fires.push(this.fireLight);
    }
    // fadeOver is how long (ms) the glow takes to die away, otherwise it goes in a moment
    protected stopFireLight(fadeOver?: number) {
        if (!this.fireLight) return;
        this.fireLight.burning = false;
        if (fadeOver) this.fireLight.fadeStep = 1 / (fadeOver / 100); // the game loop ticks every 100ms
    }

    protected badDamage(direc?, collisionInfo?: vectorMoveObj) {
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
        }, itemStay / 2 + RandomNumberGen.randomNumBetween(0, 3000))

        setTimeout(() => {
            this.damageEl.classList.remove('badDamaged');
            this.damageEl.classList.add('lightDamaged');
            this.smoking();
            if (!this.wrecked) this.stopFireLight(); // it's smoke now, which gives no light. A wreck is still burning
        }, fireStay + RandomNumberGen.randomNumBetween(0,3000))

        if (direc) {
            this.angle = ThrowHandler.flip(this.picEl, direc, crashes, this.targetEl, this.angle);
        }
        ContentElHandler.fadeRemoveItem(this.targetEl, damagedTargetStay, fadeAnimTime);
        this.removeFromArray();
    }

    // How long the burning wreck of a completely destroyed vehicle stays before it starts to fade.
    protected get destroyedStay(): number {
        return destroyedTargetStay;
    }

    protected completeDestruction(collisionInfo?: vectorMoveObj) {
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

    private lightOnFire(elem) {
        ElementCreator.returnNewImageEl(elem, 'wheelFire', this.onFireSource, true);
    }
    private rollWheel() {
        let wheel = this.createWheel();
        wheel.classList.add("rollWheel");
    }
    private createWheel() {
        let wheel = this.returnBit(this.wheelSource, "wheel", "wheelPic");
        wheel.classList.add(this.wheelSizeClass);
        return wheel
    }

    protected throwWheel(direc: direction) {
        let wheel = this.createWheel();
        this.lightOnFire(wheel);
        let wheelPic = wheel.querySelector(".wheelPic") as HTMLElement;
        ThrowHandler.flip(wheelPic, direc, null, wheel, undefined, ThrowHandler.removeIfLandedInWater);
    }
    // Bits of bodywork, thrown as well as the wheels
    private static bodyBits: Array<string> = [bitPath("car_1"), bitPath("car_2")];
    protected throwBodyBits(sources: Array<string>, sizeClass: string, origin?: position) {
        const count = RandomNumberGen.randomNumBetween(1, 2);
        for (let i = 0; i < count; i++) {
            const bit = this.returnBit(RandomNumberGen.returnRandomFromArray(sources), "wheel", "wheelPic", origin);
            bit.classList.add(sizeClass);
            const direc = RandomNumberGen.randomNumBetween(0, 1) ? direction.forward : direction.backward;
            ThrowHandler.lob(bit, direc, null, ThrowHandler.removeIfLandedInWater);
        }
    }
    protected destructionBits() {
        this.rollWheel();
        this.throwWheel(direction.forward);
        this.throwWheel(direction.backward);
        this.throwBodyBits(VehicleTarget.bodyBits, "vehicleBit");
    }
}

class WaterVehicleTarget extends VehicleTarget {
    private static shoreMargin: number = 10; // how far inside the open water a boat has to stay
    private static fireBeforeSinkMin: number = 2000;
    private static fireBeforeSinkMax: number = 7000;
    private static explodeChance: number = 15; // percent of burning boats that blow up rather than sink
    private static sinkDuration: number = 6000;
    private static tiltPause: number = 1500;
    private static tiltSinkDuration: number = 7000;

    public isFinished(): boolean {
        return this.damage === Damage.destroyed;
    }

    // The boat pictures, in AS_assets/vehicles. Ships are big and go down by the bow or stern; tugs are
    // the smaller sort (see .smallBoat in cssApp.css), unarmoured, and go straight down. A new boat is
    // as likely to be either sort, whatever the number of pictures of each.
    private static shipPics: Array<string> = ['Ship_1.png', 'Ship_2.png', 'Ship_3.png', 'Ship_5.png', 'Ship_6.png', 'Ship_7.png', 'Ship_8.png', 'Ship_10.png', 'Ship_11.png', 'Ship_12.png', 'Ship_13.png'];
    private static tugPics: Array<string> = ['Tug_1.png', 'Tug_2.png', 'Tug_3.png'];

    constructor() {
        super(boatTarget);
        this.targetEl.classList.add('longTarget');
        if (WaterVehicleTarget.tugPics.some(pic => this.baseImgEl.src.endsWith('/' + pic))) {
            this.targetEl.classList.add('smallBoat');
            this.armour = smallBoatTarget.armour;
        }
        (this.targetEl as any).constrain = (x: number, y: number) => this.keepInWater(x, y); // however it's thrown, it stays in the sea
    }
    // Wherever a boat is pushed or thrown it's kept in the open water: along the shore it stops at the edge, and if there's no room at the height
    // it was going to, it stays at the height it was
    private keepInWater(x: number, y: number): position {
        const width = this.targetEl.offsetWidth, height = this.targetEl.offsetHeight;
        const span = Shoreline.waterSpan(y, y + height);
        if (!span) return { X: x, Y: y };
        const low = Math.max(span.left + WaterVehicleTarget.shoreMargin, 0), high = span.openRight - WaterVehicleTarget.shoreMargin - width;
        if (high < low) return { X: parseFloat(this.targetEl.style.left) || x, Y: parseFloat(this.targetEl.style.top) || y };
        return { X: Math.min(Math.max(x, low), high), Y: y };
    }
    // Where the wreckage flies out from if it blows up: the point on the hull the blast struck,
    // remembered from when the boat was hit.
    private strikePoint: position;

    // A boat the special enemy in a bunker is making for. It goes slowly to the coast, where he gets aboard, and turns
    // (the picture flips) to run for the open sea, off the left of the screen, at the speed the difficulty gives. From
    // then on he is the special target, as well as the boat being just another target. If the boat is put out of action
    // on the way to the shore he's still to get away, and the level sends another.
    private shoreRun?: { special: SpecialEnemy, speed: number, onFail: () => void };
    public isRunningToShore(): boolean {
        return !!this.shoreRun;
    }
    public runToShore(special: SpecialEnemy, speed: number, onFail: () => void) {
        this.shoreRun = { special: special, speed: speed, onFail: onFail };
    }
    // At the shore he boards, and the boat sits there for two seconds (twenty ticks) before it turns and makes for the open sea
    private static shoreWaitTicks: number = 20;
    private leaving?: { special: SpecialEnemy, speed: number, ticks: number };
    public action() {
        if (this.leaving) {
            this.waitAtShore();
            return;
        }
        if (this.shoreRun) {
            this.shoreStep();
            return;
        }
        super.action();
    }
    private waitAtShore() {
        const wait = this.leaving;
        if (!this.isRunning()) { // put out of action at the quay: it's him that's been taken out, as it's his boat now
            this.leaving = undefined;
            return;
        }
        if (--wait.ticks > 0) return;
        this.leaving = undefined;
        this.baseImgEl.style.transform = "scaleX(-1)"; // turns about
        this.startFleeing(wait.special.name, -wait.speed, wait.special.portrait);
    }
    private shoreStep() {
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
            run.special.board();
            this.makeSpecial(run.special.name, run.special.portrait); // (it's his boat from the moment he's aboard)
            this.leaving = { special: run.special, speed: run.speed, ticks: WaterVehicleTarget.shoreWaitTicks };
            return;
        }
        this.targetEl.style.left = left + run.speed * 0.9 + "px"; // (on its way to the coast it's not far off as quick as it will be)
    }

    private static hullBits: Array<string> = [bitPath("boat_1"), bitPath("boat_2")];
    protected destructionBits() {
        this.throwBodyBits(WaterVehicleTarget.hullBits, "boatBit", this.strikePoint);
    }
    protected get picSources(): Array<string> {
        const sort = RandomNumberGen.randomNumBetween(0, 1) ? WaterVehicleTarget.tugPics : WaterVehicleTarget.shipPics;
        return ['vehicles/' + RandomNumberGen.returnRandomFromArray(sort)];
    }

    // A wrecked boat's fire burns out in half the time -- it's sitting on water.
    protected get destroyedStay(): number {
        return destroyedTargetStay / 2;
    }

    // The hull: the full length of the visible picture, lower half. The upper half is just the mast
    // and superstructure, so a blast landing up there is really a shot over the ship -- it only
    // counts if the blast's own area reaches down to the hull. Anywhere on the hull is a hit, but
    // a weak one out towards the ends: the strongest hits are still the ones nearest the middle.
    public hitBox(): Box {
        const rect = this.baseImgEl.getBoundingClientRect();
        return { left: rect.left, top: rect.top + rect.height / 2, right: rect.right, bottom: rect.bottom };
    }

    // A badly damaged boat always burns for a while and then sinks, rather than the generic
    // vehicle's chance of an early explosion or recovering back to just smoking. The strike that
    // first sets it ablaze decides how it goes down: struck near one end it sinks by that end
    // (bow first if the bow was hit, stern first if the stern was), struck amidships it goes
    // straight down.
    private sinkScheduled: boolean = false;

    protected badDamage(direc?, collisionInfo?: vectorMoveObj) {
        if (this.sinkScheduled) return; // already burning and on its way down
        this.sinkScheduled = true;
        this.strikePoint = this.impactPoint(collisionInfo, this.hitBox());

        // A small boat is sometimes thrown over like a car, by a blast that's more than a small one (the first two missiles' don't), and then burns and goes
        // down like any other, over the way it landed
        if (this.targetEl.classList.contains('smallBoat') && direc && collisionInfo && collisionInfo.radius > WaterVehicleTarget.flipMinRadius
            && RandomNumberGen.randomNumBetween(1, 100) <= WaterVehicleTarget.flipChance) {
            this.angle = ThrowHandler.flip(this.picEl, direc, crashes, this.targetEl, this.angle, () => this.dipUpsideDown(), false); // (no sliding on once it's landed)
        }

        if (!this.damageEl.classList.contains("badDamaged")) {
            this.damageOverlay.playLoop(fire_1_imgs);
        }
        this.damageEl.classList.add('badDamaged');
        this.damageEl.classList.remove('lightDamaged');
        this.startFireLight();

        let tilt = this.tiltForStrike(collisionInfo);
        let fireDuration = RandomNumberGen.randomNumBetween(WaterVehicleTarget.fireBeforeSinkMin, WaterVehicleTarget.fireBeforeSinkMax);
        setTimeout(() => {
            if (this.damage === Damage.destroyed || !this.targetEl.isConnected) return; // already wrecked some other way while it burned, or cleared away with its game
            // Once the fire has done for it -- it's blowing up or going under -- it's destroyed. That
            // counts now, not when the sinking has finished playing out.
            let priorStatus = this.status;
            this.targetDestroyed(priorStatus);
            game.assessKillPoints(priorStatus, this.damage, false, this);

            if (RandomNumberGen.randomNumBetween(1, 100) <= WaterVehicleTarget.explodeChance) {
                this.completeDestruction(); // the same wreck and fireball as a direct hit
            }
            else {
                tilt === 0 ? this.sink(this.angle) : this.tiltingSink(tilt);
            }
        }, fireDuration);
    }

    // A boat that's already burning can still be finished off: a heavy blow (a direct hit, or an
    // airstrike landing on it) sends it up in the full destruction fireball instead of just feeding
    // the fire. Gentler hits don't add anything, it's burning already. (Once the fire has done for
    // it and it's going down, it's destroyed, and hits no longer register.)
    protected adjustSeverity(severity: strikeSeverity): strikeSeverity {
        return this.sinkScheduled && severity >= strikeSeverity.heavy ? strikeSeverity.catastrophic : severity;
    }

    // If that happens part way through the sinking, the boat's picture and fire are inside the sink
    // window (clipped, and moving down), so put them back where they belong first, otherwise the
    // fireball would be cut off by the waterline.
    protected completeDestruction(collisionInfo?: vectorMoveObj) {
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
    private tiltForStrike(collisionInfo?: vectorMoveObj): number {
        if (!collisionInfo || this.targetEl.classList.contains('smallBoat')) return 0; // a small boat just goes down
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
    private sinkMask: HTMLElement; // there once the sinking has started
    private sinkGroup: HTMLElement;
    // A boat that's been thrown over lies upside down in the water: the waterline (the edge of the sink mask) is already a way up it, so it's dipped
    // in, and goes on burning like that until it goes down
    private static dipShare: number = 0.3;
    private dipUpsideDown() {
        if (!this.targetEl.isConnected || this.sinkMask || this.damage === Damage.destroyed || !this.angle) return;
        const { group } = this.createSinkMask();
        group.style.transformOrigin = "50% 50%"; // (turned over about its middle: from the waterline at the foot of the hull it would swing right out of the mask, and vanish)
        group.style.transform = `rotate(${this.angle}deg)`;
        void group.offsetHeight;
        group.style.transition = "transform 0.6s ease-out";
        group.style.transform = `translateY(${group.offsetHeight * WaterVehicleTarget.dipShare}px) rotate(${this.angle}deg)`;
        this.damageEl.style.transform = `rotate(${-this.angle}deg)`; // (the flames still go up)
    }

    private createSinkMask(): { mask: HTMLElement, group: HTMLElement } {
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
        this.sinkGroup = group;
        return { mask, group };
    }

    // Undoes createSinkMask: the picture and fire go back to where they were, and the window goes.
    private cancelSinking() {
        if (!this.sinkMask) return;
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

    private static flipChance: number = 35;       // percent of the hits that could throw a small boat over that do
    private static flipMinRadius: number = 50;    // only from a blast with a radius bigger than this: not the light missile or the missile
    // A sinking boat makes ripples on the water under it: one as it starts to go, and more as it goes down
    private splashUnder(duration: number) {
        const ripple = () => {
            if (!this.targetEl.isConnected) return;
            const r = this.picEl.getBoundingClientRect();
            const width = r.width * 0.9;
            const at: position = { X: r.left + r.width / 2 + RandomNumberGen.randomNumBetween(-width / 3, width / 3), Y: r.bottom - r.height * 0.2 };
            ExplosionHandler.createSplash(at, Math.max(40, width * 0.7));
        };
        ripple();
        setTimeout(ripple, duration * 0.35);
        setTimeout(ripple, duration * 0.65);
    }

    private sink(turned: number = 0) {
        let { mask, group } = this.sinkMask ? { mask: this.sinkMask, group: this.sinkGroup } : this.createSinkMask(); // (one that's upside down is already in its mask)
        let sinkDistance = mask.getBoundingClientRect().height * 1.2; // overshoot a bit so it's fully clear of the window
        this.stopFireLight(WaterVehicleTarget.sinkDuration); // the fire goes down with the boat
        if (turned && !group.style.transform) { // (it goes down as it landed, over, not the right way up; one that was dipped in already is)
            group.style.transform = `rotate(${turned}deg)`;
            void group.offsetHeight;
        }
        group.style.transition = `transform ${WaterVehicleTarget.sinkDuration / 1000}s ease-in`;
        group.style.transform = `translateY(${sinkDistance}px)` + (turned ? ` rotate(${turned}deg)` : "");
        this.splashUnder(WaterVehicleTarget.sinkDuration);
        setTimeout(() => this.finishSinking(), WaterVehicleTarget.sinkDuration);
    }

    // tilt is 1 to go down by the bow (the right-hand end), -1 for the stern
    private tiltingSink(tilt: number) {
        let { mask, group } = this.createSinkMask();
        let sinkDistance = mask.getBoundingClientRect().height * 1.2;
        let tiltAngle = tilt * RandomNumberGen.randomNumBetween(20, 35);
        this.stopFireLight(WaterVehicleTarget.tiltSinkDuration);
        group.style.transition = `transform ${WaterVehicleTarget.tiltPause / 1000}s ease-in-out`;
        group.style.transform = `rotate(${tiltAngle}deg)`;
        this.splashUnder(WaterVehicleTarget.tiltSinkDuration);

        setTimeout(() => {
            let submergeDuration = (WaterVehicleTarget.tiltSinkDuration - WaterVehicleTarget.tiltPause) / 1000;
            group.style.transition = `transform ${submergeDuration}s ease-in`;
            group.style.transform = `translateY(${sinkDistance}px) rotate(${tiltAngle}deg)`;
        }, WaterVehicleTarget.tiltPause);

        setTimeout(() => this.finishSinking(), WaterVehicleTarget.tiltSinkDuration);
    }

    // The boat has been destroyed since it started to go down (see badDamage), so this is just the
    // clearing away of it once it's out of sight.
    private finishSinking() {
        this.damageOverlay.hide();
        ContentElHandler.removeFromContentEl(this.targetEl); // it's gone under the water: nothing left to throw about
    }
    // Anywhere in open water: the whole boat has to fit between the left of the water and the
    // start of the faded shallows at the shore (see Shoreline), not just its top-left corner.
    // Where a number of boats go, together: each at its own height on the screen, no two within 12px of each other (one that
    // would be is moved up to be 12 clear), and drawn so the lower ones are in front of the ones higher up. They're put
    // into the content lowest first, which is what puts the later (higher) ones behind.
    public static arrange(boats: Array<WaterVehicleTarget>): Array<position> {
        const minY = Math.ceil(window.innerHeight * 0.1);
        const heights = boats.map(boat => boat.getTargetEl().getBoundingClientRect().height);
        // a height where there's room in the water for the boat (near the top of a sliced coast there's hardly any sea)
        const ys = boats.map((boat, i) => {
            const maxY = Math.max(minY, Math.floor(window.innerHeight * 0.9 - heights[i]));
            const width = boat.getTargetEl().getBoundingClientRect().width;
            let y = RandomNumberGen.randomNumBetween(minY, maxY);
            for (let attempt = 0; attempt < 40; attempt++) {
                const span = Shoreline.waterSpan(y, y + heights[i]);
                if (!span || span.openRight - WaterVehicleTarget.shoreMargin - width >= Math.max(span.left, 0) + WaterVehicleTarget.shoreMargin) break;
                y = RandomNumberGen.randomNumBetween(minY, maxY);
            }
            return y;
        });
        const order = boats.map((_, i) => i).sort((p, q) => (ys[q] + heights[q]) - (ys[p] + heights[p])); // lowest first
        const spots: Array<position> = boats.map(() => null);
        let previous = Infinity;
        const content = ContentElHandler.returnContentEl();
        for (const i of order) {
            let y = ys[i];
            if (previous - y < 12) y = previous - 12;   // too close to the one below it: a clear 12 above it
            y = Math.max(y, minY);
            previous = y;
            const span = Shoreline.waterSpan(y, y + heights[i]);
            if (!span) { spots[i] = { X: 0, Y: y }; continue; }
            const size = boats[i].getTargetEl().getBoundingClientRect();
            const lowX = Math.ceil(Math.max(span.left + WaterVehicleTarget.shoreMargin, 0));
            const highX = Math.floor(Math.min(span.openRight - WaterVehicleTarget.shoreMargin - size.width, window.innerWidth - size.width));
            spots[i] = { X: highX >= lowX ? RandomNumberGen.randomNumBetween(lowX, highX) : lowX, Y: y };
            content.prepend(boats[i].getTargetEl()); // lowest first, so the higher ones end up behind
        }
        return spots;
    }
    public decidePosition(pos?: position) {
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
            if (!span) break; // no water showing at all
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
    protected get picSources(): Array<string> {
        return ['Jeep__.png', 'Jeep__light.png', 'Jeep__grey.png', 'Jeep2__.png', 'Jeep2__light.png', 'Jeep2__lightgrey.png', 'Jeep2__tan.png'].map(pic => 'vehicles/' + pic);// 'Jeep2__grey.png', 
      //  return ['jeep.png', 'jeep.png', 'jeep.png', 'jeep2.png', 'jeep2.png', 'jeep3.png', 'jeep3.png', 'jeep4_cres.png'];
    }
}
class ModVehicleTarget extends VehicleTarget {
    wheelSizeClass = "medWheel";
    constructor() {
        super(modTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    protected get picSources(): Array<string> {
        return ['vehicles/truck__tan2.png', 'vehicles/truck__green.png'];
    }
}
class HeavyVehicleTarget extends VehicleTarget {
    wheelSizeClass = "medWheel";
    constructor() {
        super(heavyTarget);
        this.targetEl.classList.add('medRectTarget');
    }
    protected get picSources(): Array<string> {
        return ['vehicles/truck__grey.png'];
    }
}

class RocketLauncher extends VehicleTarget {
    wheelSizeClass = "medWheel";
    stopPos: number;
    deployed: boolean = false;
    launcherEl: HTMLImageElement;
    noStrikeZone: HTMLElement;

    constructor() {
        super(rocketLauncher);
        this.targetEl.classList.add('medRectTarget');
        this.stopPos = RandomNumberGen.randomNumBetween(50, 200);
        this.launcherEl = ElementCreator.returnNewImageEl(this.picEl, 'rocketPack', assetsFolder + "vehicles/rockets.png");
    }
    protected get picSources(): Array<string> {
        return ['vehicles/launcher.png'];
       // return ['rocketVehicle.jpg'];
         //   picSources: ['rocketVehicle_undeployed.jpg']
    }
    protected move() {
        let x = parseInt(this.targetEl.style.left);
        this.targetEl.style.left = x + this.speed + "px";
    }
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo: vectorMoveObj) {
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
    private throwRocketPack() {
        let pack = this.launcherEl;
        ElementCreator.positionAbsoluteAtElementRect(pack, pack);
        pack.remove();
        ContentElHandler.addToContentEl(pack);
        allObjects.push(pack);

        ThrowHandler.flip(pack, direction.backward, crashes, undefined, undefined, ThrowHandler.removeIfLandedInWater); /////////////////////////////////////////////////////////////////
        //setTimeout(() => { pack.classList.remove('raiseLauncher', 'flip') }, packStay)
        setTimeout(() => { pack.style.transition = 'opacity 8s ease-in-out' }, itemStay)   // AWFUL !!!
        ContentElHandler.fadeRemoveItem(pack, itemStay, fadeAnimTime, allObjects);
    }

    public inNoStrikeZone(target: Target) {
        let noStrikeZones = document.querySelectorAll(".noStrikeZone");
        if (noStrikeZones) {
            for (let z of noStrikeZones) {
                let zone = z as HTMLElement
                //if (CollisionDetection.checkCollisionWithElement(target.getTargetEl(), zone)) {
                if (CollisionDetection.checkCollisionWithCircle(zone, target.getTargetEl())) {
                    return true
                }
            }
        }
        return false
    }
    public action() {
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
                console.log("Hit ACTION nostrikezone remove")
                this.removeNoStrikeZone();
            }
        }
        //if (this.damage > Damage.badlyDented) {
        //    this.noStrikeZone.remove();
        //}
    }
    private deploy() {
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
    private setNoStrikeZone() {
        this.noStrikeZone = ElementCreator.returnNewDiv(this.targetEl, 'noStrikeZone');
        this.noStrikeZone.addEventListener('mouseover', this.overNoStrikeZone.bind(this));
        this.noStrikeZone.addEventListener('mouseleave', this.leaveNoStrikeZone.bind(this));
    }
    private removeNoStrikeZone() {
        this.noStrikeZone.remove();
        this.noStrikeZone = null;
    }
    private overNoStrikeZone() {
        game.strikesRestricted = true;
    }
    private leaveNoStrikeZone() {
        game.strikesRestricted = false;
    }
}

// The special enemies: a name each, and a different colour on a scan. One hides in a building (Hills) or in a bunker
// under one (Coast). The Hills one tries to get away in a vehicle (see HillsLevel.startFlee), when he stops being
// a separate target and the vehicle is the special target.
class SpecialNames {
    private static first: Array<string> = ["Abu", "Jabar", "Ali", "Amir", "Mahmoud", "Muhammad", "Omar", "Ahmed", "Abdul", "Hassan"];
    private static last: Array<string> = ["Abbas", "Sinwar", "Deif", "Haniyeh", "ibn Rashid", "ibn Khalid", "ibn Walid", "ibn Tariq",
        "ibn Saleh", "ibn Mansour", "Haddad", "Hamdan", "Qasim", "Barakat", "Khalil", "Nasser"];
    // two to four first names and a last
    public static random(): string {
        const pool = SpecialNames.first.slice();
        const count = RandomNumberGen.randomNumBetween(2, 4);
        const names: Array<string> = [];
        for (let i = 0; i < count; i++) {
            names.push(pool.splice(RandomNumberGen.randomNumBetween(0, pool.length - 1), 1)[0]);
        }
        names.push(RandomNumberGen.returnRandomFromArray(SpecialNames.last));
        return names.join(" ");
    }
}
// A headshot (one of the 14 in AS_assets/portraits) for each special enemy, with a red ELIMINATED stamp over it when he's been dealt with
class SpecialPortraits {
    private static count: number = 14;
    private static path(n: number): string {
        return assetsFolder + "portraits/Portrait_" + (n < 10 ? "0" : "") + n + ".png";
    }
    public static random(): string {
        return SpecialPortraits.path(RandomNumberGen.randomNumBetween(1, SpecialPortraits.count));
    }
    // All of them, in a random order
    public static shuffled(): Array<string> {
        const all: Array<string> = [];
        for (let n = 1; n <= SpecialPortraits.count; n++) all.push(SpecialPortraits.path(n));
        for (let i = all.length - 1; i > 0; i--) {
            const j = RandomNumberGen.randomNumBetween(0, i);
            [all[i], all[j]] = [all[j], all[i]];
        }
        return all;
    }
}
function announceElimination(name: string, portrait?: string) {
    const text = "Well done, you eliminated " + name + "!";
    // the headshot with the stamp right across it, at the side of the text, which wraps if it has to
    const html = portrait
        ? '<div class="eliminatedMessage"><div class="eliminatedCard"><img class="eliminatedPortrait" src="' + portrait + '"><img class="eliminatedStamp" src="' + assetsFolder + 'portraits/Stamp_eliminated.png"></div><div class="eliminatedText">' + text + '</div></div>'
        : text;
    PopupHandler.addToArray(html, '<span class="eliminatedTitle">Target eliminated</span>', msgLength.long);
}

// The men a game of stages is against: a list made when the game is picked (and shown, before it starts), who turn up in the stages in order
type WantedMan = { name: string, portrait: string };
class SpecialRoster {
    public static make(count: number): Array<WantedMan> {
        const names = new Set<string>();
        while (names.size < count) names.add(SpecialNames.random());
        const faces = SpecialPortraits.shuffled();
        return Array.from(names).map((name, i) => ({ name: name, portrait: faces[i % faces.length] }));
    }
}

class SpecialEnemy extends BuildingEnemy {
    public readonly name: string;
    public readonly portrait: string;
    public boarded: boolean = false;      // he's got into a vehicle: that's the target now
    public called: boolean = false;       // he's called for a boat, which is on its way
    public bunker?: Bunker;
    constructor(name?: string, portrait?: string) {
        super();
        this.name = name || SpecialNames.random();
        this.portrait = portrait || SpecialPortraits.random();
        this.targetEl.classList.add('special');
    }
    public isFinished(): boolean {
        return this.boarded || super.isFinished();
    }
    public heatSignatureBox(): Box | null {
        return this.boarded ? null : super.heatSignatureBox();
    }
    public eliminate() {
        if (this.boarded || this.damage === Damage.destroyed) return;
        super.eliminate();
        announceElimination(this.name, this.portrait);
        if (game.level) game.level.specialDown(); // (another one in the stage is spooked)
    }
    // Down in a bunker, so he's only to be seen where a scan has found him
    public goUnderground() {
        this.targetEl.classList.add('underground');
    }
    // Gets into a vehicle: he's out of the building, and no longer a target on his own
    public board() {
        this.boarded = true;
        this.setHeatSignature(false);
        this.targetEl.style.display = "none";
    }
}

// A bunker under a building: a shaft down from the building to a square room, drawn only where a surveillance drone's
// scan reaches. Nothing that goes bang above ground touches it, or the one in it: only a bunker buster does anything,
// and brings it down with the building above it.
class Bunker extends Target {
    private static shaftDrop: number = 55;     // how far below the building's foot the room is
    private static roomSize: number = 44;
    public building: Building;
    public occupant?: SpecialEnemy;
    private shaft: { from: position, to: position };
    private room: Box;
    private surfaceBox: Box; // where its building stood: still there to be hit by a buster once the building has gone
    private planEl: SVGSVGElement;

    constructor(building: Building) {
        super(hiddenTunnelTarget);
        this.building = building;
        building.bunker = this;
        this.targetEl.classList.add('smallSquare', 'bunker');
        this.targetEl.classList.remove('flexCenter');
        allTargets.push(this);
    }
    protected get picSources(): Array<string> {
        return ['trans.png'];
    }
    public action() { }

    // Lays the bunker out beneath its building and draws it; returns the middle of the room
    public setUp(): position {
        const rect = this.building.getTargetEl().getBoundingClientRect();
        const size = Bunker.roomSize;
        const centre: position = {
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

    private draw() {
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
        this.planEl = svg as SVGSVGElement;
    }

    // How far a point is from the shaft or the room, whichever is nearer
    private distanceFrom(p: position): number {
        const inRoom = CollisionDetection.nearestPointInBox(p, this.room);
        const a = this.shaft.from, b = this.shaft.to;
        const dx = b.X - a.X, dy = b.Y - a.Y;
        const lengthSquared = dx * dx + dy * dy;
        const along = lengthSquared ? Math.max(0, Math.min(1, ((p.X - a.X) * dx + (p.Y - a.Y) * dy) / lengthSquared)) : 0;
        const onShaft = Math.hypot(a.X + dx * along - p.X, a.Y + dy * along - p.Y);
        return Math.min(Math.hypot(inRoom.X - p.X, inRoom.Y - p.Y), onShaft);
    }
    public heatDistanceFrom(p: position): number | null {
        return this.damage === Damage.destroyed ? null : this.distanceFrom(p);
    }
    public setHeatSignature(show: boolean, around?: position, radius?: number) {
        super.setHeatSignature(show);
        if (show && around && radius && this.planEl) {
            const mask = "radial-gradient(circle at " + around.X + "px " + around.Y + "px, black " + Math.round(radius * 0.65) + "px, transparent " + radius + "px)";
            this.planEl.style.maskImage = mask;
            this.planEl.style.webkitMaskImage = mask;
        }
    }
    // An invisible hitbox where the building above it stood (or still stands): that's what a bunker buster has to land on,
    // whether or not the building's still there. (The bunker as it's drawn on a scan is just where it is underground.)
    public isUnder(p: position): boolean {
        return this.damage !== Damage.destroyed && p.X >= this.surfaceBox.left && p.X <= this.surfaceBox.right && p.Y >= this.surfaceBox.top && p.Y <= this.surfaceBox.bottom;
    }
    // Nothing else does anything to it
    public hit(severity: strikeSeverity, wepName: weaponNames, collisionInfo?: vectorMoveObj) { }

    // Brought down: whoever's in it goes too
    public destroy() {
        if (this.damage === Damage.destroyed) return;
        this.damage = Damage.destroyed;
        this.setHeatSignature(false);
        const index = allTargets.indexOf(this);
        if (index >= 0) allTargets.splice(index, 1);
        if (this.occupant) this.occupant.eliminate();
        ContentElHandler.removeFromContentEl(this.targetEl);
    }
}
