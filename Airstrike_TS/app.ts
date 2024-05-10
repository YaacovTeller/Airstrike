var charge: ChargeWeaponType;
var sniper: BulletWeaponType;
var mortar: ExplosiveWeaponType;
var howitzer: ExplosiveWeaponType;
var airstrike: ExplosiveWeaponType;
var nuke: ExplosiveWeaponType;
var allWeaponTypes: Array<WeaponType>

var game: GameHandler;
function pushWeaponInstances() {
    charge = new ChargeWeaponType(chargeInfo);
    sniper = new BulletWeaponType(sniperInfo);
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
    const contentEl: HTMLElement = ContentElHandler.returnContentEl();
    game = new GameHandler(contentEl);
    pushWeaponInstances();
    loadSound();
};