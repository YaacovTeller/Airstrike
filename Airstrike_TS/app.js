var charge;
var sniper;
var mortar;
var howitzer;
var airstrike;
var nuke;
var allWeaponTypes;
var game;
function pushWeaponInstances() {
    charge = new ChargeWeaponType(chargeInfo);
    sniper = new ExplosiveWeaponType(sniperInfo);
    mortar = new ExplosiveWeaponType(mortarInfo);
    howitzer = new ExplosiveWeaponType(howitzerInfo);
    airstrike = new ExplosiveWeaponType(airstrikeInfo);
    allWeaponTypes = [sniper, mortar, howitzer, airstrike, charge];
    //charge.pushNewWeaponInstance();
    //charge.pushNewWeaponInstance();
    // charge.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    mortar.pushNewWeaponInstance();
    airstrike.pushNewWeaponInstance();
    airstrike.pushNewWeaponInstance();
    //airstrike.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
    howitzer.pushNewWeaponInstance();
}
window.onload = () => {
    const contentEl = ContentElHandler.returnContentEl();
    game = new GameHandler(contentEl);
    pushWeaponInstances();
    loadSound();
};
//# sourceMappingURL=app.js.map