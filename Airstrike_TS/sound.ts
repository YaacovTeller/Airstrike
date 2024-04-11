﻿class Sound {
    private sound;
    private title;
    constructor(src: string) {
        let arr = src.split('/');
        this.title = arr[arr.length - 2] + "/" + arr[arr.length - 1]
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        document.body.appendChild(this.sound);
    }

    public setVolume(vol: number) {
        this.sound.volume = vol
    }
    public play() {
        this.sound.play();
    }
    public stop() {
        this.sound.pause();
    }
    public playClone() {
        this.sound.cloneNode(true).play();
    }
}

class RandomSoundGen {
    static soundIndex = 0;
    static getRandomSound(sounds: Array<Sound>) {
        let length = sounds.length;
        let randNum = Math.floor(Math.random() * (length) + 1);
        return sounds[randNum - 1]
    }
    static playRandomSound(sounds: Array<Sound>) {
        let sound = this.getRandomSound(sounds);
        sound.play();
    }
    static playNotSoRandomSound(sounds: Array<Sound>) {
        if (this.soundIndex >= sounds.length - 1) {
            this.soundIndex = 0
        }
        else this.soundIndex++
        sounds[this.soundIndex].play();
    }
}
    const soundFolder: string = "./AS_assets/sound/"

var gunSounds: Array<Sound> = [];
var mortarSounds: Array<Sound> = [];
var howitzerSounds: Array<Sound> = [];
var airstrikeSounds: Array<Sound> = [];
var nukeSounds: Array<Sound> = [];
var pgia: Sound;
var redAlert: Sound;
var bigExpl: Sound;
var explosions: Array<Sound> = [];
var strikes: Array<Sound> = [];
var bigExplosions: Array<Sound> = [];

function loadSound() {
    strikes.push(
         new Sound(soundFolder + "strike_1.mp3"),
         new Sound(soundFolder + "strike_2.mp3"),
         new Sound(soundFolder + "strike_3.mp3"),
    )
    bigExplosions.push(
        new Sound(soundFolder + "bigExpl.mp3"),
    )
    redAlert = new Sound(soundFolder + "redAlert7.mp3");
    pgia = new Sound(soundFolder + "pgia.mp3");
    gunSounds.push(
        new Sound(soundFolder + "gun_1.mp3"),
        new Sound(soundFolder + "gun_2.mp3"),
        new Sound(soundFolder + "gun_3.mp3"),
        new Sound(soundFolder + "gun_5.mp3"),
        new Sound(soundFolder + "gun_6.mp3"),
        new Sound(soundFolder + "gun_7.mp3"),
        new Sound(soundFolder + "gun_8.mp3"),
    )
    mortarSounds.push(
        new Sound(soundFolder + "mortar_1.mp3"),
        new Sound(soundFolder + "mortar_2.mp3"),
        new Sound(soundFolder + "mortar_3.mp3"),
        new Sound(soundFolder + "mortar_4.mp3"),
        new Sound(soundFolder + "mortar_5.mp3")
    )
    howitzerSounds.push(
        new Sound(soundFolder + "yoRE_1.mp3"),
        new Sound(soundFolder + "yoRE_2.mp3"),
        new Sound(soundFolder + "yoRE_3.mp3"),
        // new Sound(soundFolder + "yoRE_4.mp3"),
        // new Sound(soundFolder + "yoRE_5.mp3")
    )
    airstrikeSounds.push(
        new Sound(soundFolder + "shager_1.mp3"),
        new Sound(soundFolder + "shager_2.mp3"),
        new Sound(soundFolder + "shager_3.mp3"),
        new Sound(soundFolder + "shager_4.mp3"),
        new Sound(soundFolder + "shager_5.mp3")
    )
    nukeSounds.push(
        new Sound(soundFolder + "redAlert7.mp3")
    )
    explosions.push(
        new Sound(soundFolder + "expl_dull.mp3"),
        new Sound(soundFolder + "expl_dull2.mp3"),

    )
}