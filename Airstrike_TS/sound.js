"use strict";
class Sound {
    sound;
    title;
    volume;
    // Every sound there is, and the clones that have been played, so they can all be stopped or paused together
    static all = [];
    static clones = [];
    static heldByPause = [];
    static stopAll() {
        for (const s of Sound.all) {
            s.sound.onended = null; // otherwise the ambience would carry on to its next track
            s.sound.pause();
            s.sound.currentTime = 0;
        }
        Sound.clones.forEach(c => c.pause());
        Sound.clones = [];
        Sound.heldByPause = [];
    }
    static pauseAll() {
        const playing = [...Sound.all.map(s => s.sound), ...Sound.clones].filter(a => !a.paused && !a.ended);
        playing.forEach(a => a.pause());
        Sound.heldByPause = playing;
    }
    static resumeAll() {
        Sound.heldByPause.forEach(a => a.play());
        Sound.heldByPause = [];
    }
    constructor(src) {
        Sound.all.push(this);
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
        const clone = this.sound.cloneNode(true);
        Sound.clones = Sound.clones.filter(c => !c.ended); // forget the ones that have finished
        Sound.clones.push(clone);
        clone.play();
    }
    addEndEvent(func) {
        this.sound.onended = null;
        this.sound.onended = () => func();
    }
}
class SoundPlayer {
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
const electr = new Sound(soundFolder + "electr.mp3"); // the power going
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
const carCrashes = []; // a car coming down: the first three have a swerve in them
const crashes = []; // anything else coming down on land: debris, bits
const splashes = []; // anything coming down in the water
const impactCrash = [];
const beeps = [];
const ticks = [];
const bombCountdowns = []; // a recorded countdown that ends in a blast, in place of the ticks and the usual explosion
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
    acknowledge.push(pgia, matara, meUle, pgia);
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
    bombCountdowns.push(new Sound(soundFolder + "bomb countdown.mp3"), new Sound(soundFolder + "bomb countdown.mp3"), new Sound(soundFolder + "bomb countdown.mp3"));
    beeps.push(new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"), new Sound(soundFolder + "beep_tiny.mp3"));
    multiExplosions.push(new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"), new Sound(soundFolder + "expl_many.mp3"));
    bigExplosions.push(new Sound(soundFolder + "messy_bomb_grander.mp3"), new Sound(soundFolder + "bigExpl.mp3"));
    carCrashes.push(new Sound(soundFolder + "crash_1.mp3"), new Sound(soundFolder + "crash_2.mp3"), new Sound(soundFolder + "crash_3.mp3"));
    crashes.push(
    // (only the sixth for the moment, to try it out: crash_4 and crash_5 go back in here)
    new Sound(soundFolder + "crash_6.mp3"));
    splashes.push(new Sound(soundFolder + "splash.mp3"));
    impactCrash.push(new Sound(soundFolder + "impact crash.mp3"));
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
var expl_small_imgs = [];
var expl_med_imgs = [];
var expl_big_imgs = [];
var fire_1_imgs = [];
var fire_2_imgs = [];
var smoke_imgs = [];
var splash_imgs = [];
class CanvasGifHandler {
    static expl_small_frames = [];
    static expl_med_frames = [];
    static expl_big_frames = [];
    static fire_1_frames = [];
    static fire_2_frames = [];
    static smoke_frames = [];
    static splash_frames = [];
    static loadAllGifs() {
        this.loadAllGifFrames();
        this.loadAllGifImages();
    }
    static loadAllGifFrames() {
        this.fire_1_frames.push(...this.loadGifFrames('fire_1/', 6, '1'));
        this.fire_2_frames.push(...this.loadGifFrames('fire_2/', 11, '15'));
        this.expl_small_frames.push(...this.loadGifFrames('expl_small/', 25, '05'));
        this.expl_med_frames.push(...this.loadGifFrames('expl_med/', 24, '08'));
        this.expl_big_frames.push(...this.loadGifFrames('expl_big/', 26, '1'));
        this.smoke_frames.push(...this.loadGifFrames('smoke_3/', 15, '1'));
        this.splash_frames.push(...this.loadGifFrames('splash/', 13, '1'));
    }
    static loadAllGifImages() {
        expl_small_imgs = this.convertToGifImages(this.expl_small_frames);
        expl_med_imgs = this.convertToGifImages(this.expl_med_frames);
        expl_big_imgs = this.convertToGifImages(this.expl_big_frames);
        fire_1_imgs = this.convertToGifImages(this.fire_1_frames);
        fire_2_imgs = this.convertToGifImages(this.fire_2_frames);
        smoke_imgs = this.convertToGifImages(this.smoke_frames);
        splash_imgs = this.convertToGifImages(this.splash_frames);
    }
    static convertToGifImages(frameUrls) {
        let frameImages = [];
        frameUrls.forEach((url) => {
            const img = new Image();
            img.src = url;
            frameImages.push(img);
        });
        return frameImages;
    }
    static loadGifFrames(folder, total, speed) {
        let frames = [];
        let path = assetsFolder + folder;
        for (let i = 0; i <= total; i++) {
            let num = i < 10 && total >= 10 ? "0" + i : "" + i;
            let string = `frame_${num}_delay-0.${speed}s.gif`;
            frames.push(path + string);
        }
        return frames;
    }
}
class CanvasGifPlayer {
    canvas;
    frames = [];
    fps;
    currentFrame = 0;
    playing = false;
    ctx;
    timeoutId;
    constructor(canvas, size) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        //  this.fps = fps;
        this.fps = 12;
        if (size) {
            this.canvas.width = size;
            this.canvas.height = size;
        }
        //this.canvas.style.width = "100px";
        //this.canvas.style.height = "100px";
    }
    //play(frameUrls: string[], repeat?) {
    //    if (this.playing) return;
    //    this.playing = true;
    //    frameUrls.forEach((url) => {
    //        const img = new Image();
    //        img.src = url;
    //        this.frames.push(img);
    //    });
    //    this.loop(repeat);
    //}
    play(frameImgs, repeat) {
        if (this.playing)
            return;
        this.playing = true;
        this.frames = frameImgs;
        this.loop(repeat);
    }
    pause() {
        this.playing = false;
        if (this.timeoutId !== undefined) {
            clearTimeout(this.timeoutId);
            this.timeoutId = undefined;
        }
        this.frames = [];
    }
    loop = (repeat) => {
        if (!this.playing)
            return;
        const frame = this.frames[this.currentFrame];
        //if (frame == null) {
        //    debugger
        //}
        if (frame && frame.complete) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
        }
        this.currentFrame++;
        if (this.currentFrame >= this.frames.length) {
            if (repeat) {
                this.currentFrame = 0;
            }
            else {
                this.playing = false;
                return;
            }
        }
        this.timeoutId = window.setTimeout(() => this.loop(repeat), 1000 / this.fps);
        //    setTimeout(this.loop, 1000 / this.fps, repeat);
    };
}
//# sourceMappingURL=sound.js.map