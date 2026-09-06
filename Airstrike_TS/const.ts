const assetsFolder: string = "./AS_assets/";
const assetsSVGFolder: string = assetsFolder + "SVG/";
const classicExplosion: string = 'expl1.gif';
const strikeExplosion: string = 'expl_big.gif';
const mushroomExplosion: string = 'mushroom_1.gif';

const crashTimeout = 600;
const destroyedTargetStayConst = 20000;
var destroyedTargetStay = 20000;
const damagedTargetStay = 40000;
const itemStay = 15000;
var fireStay = itemStay;
const fadeAnimTime = 8000;

var lightID = 1;