class Sound {
    sound;
    title;
    constructor(src) {
        let arr = src.split('/');
        this.title = arr[arr.length - 2] + "/" + arr[arr.length - 1];
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        document.body.appendChild(this.sound);
    }
    setVolume(vol) {
        this.sound.volume = vol;
    }
    play() {
        this.sound.play();
    }
    stop() {
        this.sound.pause();
    }
    playClone() {
        this.sound.cloneNode(true).play();
    }
}
class RandomSoundGen {
    static soundIndex = 0;
    static getRandomSound(sounds) {
        let length = sounds.length;
        let randNum = Math.floor(Math.random() * (length) + 1);
        return sounds[randNum - 1];
    }
    static playRandomSound(sounds) {
        let sound = this.getRandomSound(sounds);
        sound.play();
    }
    static playSequentialSound(sounds) {
        if (this.soundIndex >= sounds.length - 1) {
            this.soundIndex = 0;
        }
        else
            this.soundIndex++;
        sounds[this.soundIndex].play();
        console.log("SOUNDINDEX: " + this.soundIndex);
    }
}
const soundFolder = "./AS_assets/sound/";
var aluak = new Sound(soundFolder + "aluAk.mp3");
var pgia = new Sound(soundFolder + "pgia.mp3");
var matara = new Sound(soundFolder + "matara_shmd.mp3");
var meUle = new Sound(soundFolder + "MeUle.mp3");
var bleep_neg = new Sound(soundFolder + "target_lost.mp3");
var bleep_pos = new Sound(soundFolder + "target_lock.wav");
var click_1 = new Sound(soundFolder + "click_1.mp3");
var click_2 = new Sound(soundFolder + "click_2.mp3");
var pop = new Sound(soundFolder + "pop_click.wav");
var radio_1 = new Sound(soundFolder + "radio_1.mp3");
var radio_2 = new Sound(soundFolder + "radio_2.mp3");
var bleepbleep = new Sound(soundFolder + "bleepbleep.mp3");
//var beep = new Sound(soundFolder + "Beep.wav");
var kibalti_1 = new Sound(soundFolder + "Kibalti.mp3");
var kibalti_2 = new Sound(soundFolder + "Kibalti2.mp3");
var nachon = new Sound(soundFolder + "bleepNachon.mp3");
var rashai = new Sound(soundFolder + "Rashai.mp3");
var meaAchuz = new Sound(soundFolder + "MeaAchuz.mp3");
var muchan = new Sound(soundFolder + "Muchan.mp3");
var sec_5 = new Sound(soundFolder + "5sec.mp3");
var sec_4_3 = new Sound(soundFolder + "4_3.mp3");
var waitBitzua = new Sound(soundFolder + "WaitBitzua.mp3");
var mag = new Sound(soundFolder + "automag_reload.wav");
var flak = new Sound(soundFolder + "flak_cannon_ready.wav");
var pickup = new Sound(soundFolder + "weapon_pickup.wav");
var redeemerpickup = new Sound(soundFolder + "redeemerpickup.wav");
var alarm3 = new Sound(soundFolder + "alarm3.wav");
var jet = new Sound(soundFolder + "jet_fly.mp3");
var chopper = new Sound(soundFolder + "chopper.mp3");
var gunSounds = [];
var mortarSounds = [];
var howitzerSounds = [];
var airstrikeSounds = [];
var nukeSounds = [];
var explosions = [];
var strikes = [];
var bigExplosions = [];
var multiExplosions = [];
var crashes = [];
var beeps = [];
var ticks = [];
var clicks = [];
var ambience = [];
var ricochet = [];
var strikePrep = [];
function loadSound() {
    strikePrep.push(kibalti_1, kibalti_2, nachon, 
    //     rashai,  replace rashai?
    meaAchuz, muchan, sec_5, sec_4_3, waitBitzua);
    ricochet.push(new Sound(soundFolder + "ricochet_1.mp3"), new Sound(soundFolder + "ricochet_2.mp3"), 
    //new Sound(soundFolder + "ricochet_3.mp3"),
    //new Sound(soundFolder + "ricochet_4.mp3"),
    new Sound(soundFolder + "ricochet_5.mp3"));
    ticks.push(new Sound(soundFolder + "stopwatch_3.mp3"), new Sound(soundFolder + "stopwatch_3.mp3"), new Sound(soundFolder + "stopwatch_3.mp3"));
    ambience.push(new Sound(soundFolder + "ambient_1_q.mp3"), new Sound(soundFolder + "ambient_2_q.mp3"), new Sound(soundFolder + "ambient_4_q.mp3"), new Sound(soundFolder + "ambient_5_q.mp3"));
    beeps.push(new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"));
    multiExplosions.push(new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"));
    bigExplosions.push(new Sound(soundFolder + "messy_bomb_grander.mp3"), new Sound(soundFolder + "bigExpl.mp3"));
    crashes.push(new Sound(soundFolder + "crash_1.mp3"), new Sound(soundFolder + "crash_2.mp3"), new Sound(soundFolder + "crash_3.mp3"), new Sound(soundFolder + "crash_4.mp3"), new Sound(soundFolder + "crash_5.mp3"));
    strikes.push(new Sound(soundFolder + "strike_1.mp3"), new Sound(soundFolder + "strike_2.mp3"), new Sound(soundFolder + "strike_3.mp3"));
    gunSounds.push(new Sound(soundFolder + "gun_1.mp3"), new Sound(soundFolder + "gun_2.mp3"), new Sound(soundFolder + "gun_3.mp3"), new Sound(soundFolder + "gun_5.mp3"), new Sound(soundFolder + "gun_6.mp3"), new Sound(soundFolder + "gun_7.mp3"), new Sound(soundFolder + "gun_8.mp3"));
    mortarSounds.push(new Sound(soundFolder + "mortar_1.mp3"), new Sound(soundFolder + "mortar_2.mp3"), new Sound(soundFolder + "mortar_3.mp3"), new Sound(soundFolder + "mortar_4.mp3"), new Sound(soundFolder + "mortar_5.mp3"));
    howitzerSounds.push(
    //new Sound(soundFolder + "yoRE_1.mp3"),
    //new Sound(soundFolder + "yoRE_2.mp3"),
    //new Sound(soundFolder + "yoRE_3.mp3"),
    new Sound(soundFolder + "tank_fire.mp3"), new Sound(soundFolder + "yoRE_Eish.mp3"), new Sound(soundFolder + "tank_fire.mp3"), new Sound(soundFolder + "tank_fire.mp3"));
    airstrikeSounds.push(new Sound(soundFolder + "shager_1.mp3"), new Sound(soundFolder + "shager_2.mp3"), new Sound(soundFolder + "shager_3.mp3"), new Sound(soundFolder + "shager_4.mp3"), new Sound(soundFolder + "shager_5.mp3"));
    nukeSounds.push(new Sound(soundFolder + "redAlert7.mp3"));
    explosions.push(new Sound(soundFolder + "expl_dull.mp3"), new Sound(soundFolder + "expl_dull2.mp3"), new Sound(soundFolder + "messy_bomb_3.mp3"));
}
//# sourceMappingURL=sound.js.map