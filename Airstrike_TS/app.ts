var charge: ChargeWeaponType;
var sniper: ExplosiveWeaponType;
var mortar: ExplosiveWeaponType;
var howitzer: ExplosiveWeaponType;
var airstrike: ExplosiveWeaponType;
var nuke: ExplosiveWeaponType;
var allWeaponTypes: Array<WeaponType>

var game: GameHandler;
    window.onload = () => {
    const contentEl: HTMLElement = document.getElementById("content")!;
        game = new GameHandler(contentEl);

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

    game.hud.drawHUD();
    game.changeWeapon(mortar);

    loadSound();
};