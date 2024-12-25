class Sound {
    sound;
    title;
    volume;
    constructor(src) {
        let arr = src.split('/');
        this.title = arr[arr.length - 1]; //arr[arr.length - 2] + "/" + arr[arr.length - 1]
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
    addEndEvent(func) {
        this.sound.onended = null;
        this.sound.onended = () => func();
    }
}
class RandomSoundGen {
    static soundIndexes = {};
    static playWithVolumeSet(sound) {
        sound.setVolume(game.volume);
        sound.play();
    }
    static getRandomSound(sounds) {
        let length = sounds.length;
        let randNum = Math.floor(Math.random() * (length) + 1);
        return sounds[randNum - 1];
    }
    static playRandomSound(sounds) {
        let sound = this.getRandomSound(sounds);
        // sound.play();
        this.playWithVolumeSet(sound);
    }
    static playSequentialSound(sounds) {
        let title = sounds[0].title;
        let index = this.soundIndexes[title];
        if (index == undefined || index >= sounds.length - 1) {
            this.soundIndexes[title] = 0;
        }
        else {
            this.soundIndexes[title]++;
        }
        let sound = sounds[this.soundIndexes[title]];
        // sound.play();
        this.playWithVolumeSet(sound);
    }
    static playThroughArray(sounds) {
        let index = 0;
        this.playWithEndEvent(sounds, index);
    }
    static playWithEndEvent(sounds, index) {
        let sound = sounds[index];
        // sound.play();
        this.playWithVolumeSet(sound);
        sound.addEndEvent(() => {
            index++;
            index == sounds.length ? index = 0 : "";
            if (index < sounds.length) {
                sound = sounds[index];
                this.playWithEndEvent(sounds, index);
            }
        });
    }
}
const soundFolder = "./AS_assets/sound/";
const ambienceFolder = soundFolder + "ambience/";
const aluak = new Sound(soundFolder + "aluAk.mp3");
const cheer = new Sound(soundFolder + "cheers_gib.mp3");
const pgia = new Sound(soundFolder + "pgia.mp3");
const matara = new Sound(soundFolder + "matara_shmd.mp3");
const meUle = new Sound(soundFolder + "MeUle.mp3");
const bleep_neg = new Sound(soundFolder + "target_lost.mp3");
const bleep_pos = new Sound(soundFolder + "target_lock.wav");
const click_1 = new Sound(soundFolder + "click_1.mp3");
const click_2 = new Sound(soundFolder + "click_2.mp3");
const pop = new Sound(soundFolder + "pop_click.wav");
const activate = new Sound(soundFolder + "cannonActivate.wav");
const radio_1 = new Sound(soundFolder + "radio_1.mp3");
const radio_2 = new Sound(soundFolder + "radio_2.mp3");
const bleepbleep = new Sound(soundFolder + "bleepbleep.mp3");
const nachon = new Sound(soundFolder + "nachon.mp3");
//const beep = new Sound(soundFolder + "Beep.wav");
//const bleepNachon = new Sound(soundFolder + "bleepNachon.mp3");
const kibalti_1 = new Sound(soundFolder + "Kibalti.mp3");
const kibalti_2 = new Sound(soundFolder + "Kibalti2.mp3");
const rashai = new Sound(soundFolder + "Rashai.mp3");
const meaAchuz = new Sound(soundFolder + "MeaAchuz.mp3");
const muchan = new Sound(soundFolder + "Muchan.mp3");
const sec_5 = new Sound(soundFolder + "5sec.mp3");
const sec_4_3 = new Sound(soundFolder + "4_3.mp3");
const waitBitzua = new Sound(soundFolder + "WaitBitzua.mp3");
const mag = new Sound(soundFolder + "automag_reload.wav");
const flak = new Sound(soundFolder + "flak_cannon_ready.wav");
const pickup = new Sound(soundFolder + "weapon_pickup.wav");
const redeemerpickup = new Sound(soundFolder + "redeemerpickup.wav");
const alarm3 = new Sound(soundFolder + "alarm3.wav");
const jet = new Sound(soundFolder + "jet_fly.mp3");
const jet_pass = new Sound(soundFolder + "jet_pass.mp3");
//const strike_4 = new Sound(soundFolder + "strike_4.mp3");
const gunSounds = [];
const chopper = [];
const cannonSounds = [];
const mortarSounds = [];
const howitzerSounds = [];
const airstrikeSounds = [];
const nukeSounds = [];
const explosions = [];
const strikes = [];
const bigExplosions = [];
const multiExplosions = [];
const crashes = [];
const beeps = [];
const ticks = [];
const clicks = [];
const ricochet = [];
const strikePrep = [];
const acknowledge = [];
const revs = [];
const gib = [];
const ambience_1 = [];
const thunder = [];
const nightSounds = [];
const regular_amb = {
    primary: ambience_1,
    secondary: []
};
const night = {
    primary: [new Sound(ambienceFolder + "crickets.mp3")],
    secondary: nightSounds
};
const rain_amb = {
    primary: [new Sound(ambienceFolder + "rain.mp3")],
    secondary: []
};
const heavyRain_amb = {
    primary: [new Sound(ambienceFolder + "rain_heavy.mp3")],
    secondary: []
};
const storm_amb = {
    primary: [new Sound(ambienceFolder + "rain_pouring.mp3")],
    secondary: thunder
};
function loadSound() {
    strikePrep.push(
    //     rashai,  replace rashai?
    kibalti_1, kibalti_2, nachon, meaAchuz, muchan, sec_5, sec_4_3, waitBitzua);
    acknowledge.push(pgia, matara, meUle, pgia, aluak);
    thunder.push(new Sound(ambienceFolder + "thunder_big.mp3"), new Sound(ambienceFolder + "thunder_small.mp3"));
    ambience_1.push(new Sound(ambienceFolder + "ambient_1_q.mp3"), new Sound(ambienceFolder + "ambient_2_q.mp3"), new Sound(ambienceFolder + "ambient_4_q.mp3"), new Sound(ambienceFolder + "ambient_5_q.mp3"));
    nightSounds.push(new Sound(ambienceFolder + "owl.mp3"), new Sound(ambienceFolder + "owl_2.mp3"), new Sound(ambienceFolder + "jackal_1.mp3"), new Sound(ambienceFolder + "owl_3.mp3"), new Sound(ambienceFolder + "owl_4.mp3"), new Sound(ambienceFolder + "jackal_2.mp3"));
    gib.push(new Sound(soundFolder + "gib_1.mp3"), new Sound(soundFolder + "gib_2.mp3"), new Sound(soundFolder + "gib_3.mp3"), new Sound(soundFolder + "gib_4.mp3"), new Sound(soundFolder + "gib_5.mp3"), new Sound(soundFolder + "gib_6.mp3"));
    revs.push(new Sound(soundFolder + "rev_1.mp3"), new Sound(soundFolder + "rev_2.mp3"), new Sound(soundFolder + "rev_3.mp3"));
    ricochet.push(new Sound(soundFolder + "ricochet_1.mp3"), new Sound(soundFolder + "ricochet_2.mp3"), 
    //new Sound(soundFolder + "ricochet_3.mp3"),
    //new Sound(soundFolder + "ricochet_4.mp3"),
    new Sound(soundFolder + "ricochet_5.mp3"));
    ticks.push(new Sound(soundFolder + "stopwatch_3.mp3"), new Sound(soundFolder + "stopwatch_3.mp3"), new Sound(soundFolder + "stopwatch_3.mp3"));
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
    cannonSounds.push(
    //new Sound(soundFolder + "hshot.wav"),
    //new Sound(soundFolder + "hshot.wav"),
    new Sound(soundFolder + "hshot_small.mp3"), new Sound(soundFolder + "hshot_small.mp3"));
    //cannonSounds.push(
    //    new Sound(soundFolder + "chaingun_loop.wav"),
    //    new Sound(soundFolder + "chaingun_loop.wav"),
    //    new Sound(soundFolder + "chaingun_loop.wav"),
    //)
    chopper.push(new Sound(soundFolder + "chopper.mp3"), new Sound(soundFolder + "chopper.mp3"));
}
//# sourceMappingURL=sound.js.map