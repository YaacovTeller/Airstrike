"use strict";
class userHandler {
    static userName;
    static key = 'Airstrike_TS USER';
    //public getFingerprint() {
    //    const userAgent = navigator.userAgent;
    //    const platform = navigator.platform;
    //    const language = navigator.language;
    //    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    //    const timezoneOffset = new Date().getTimezoneOffset();
    //    const plugins = Array.from(navigator.plugins).map(plugin => plugin.name).join(',');
    //    return `${userAgent}|${platform}|${language}|${screenResolution}|${timezoneOffset}|${plugins}`;
    //}
    //    public saveJsonToFile(jsonObject) {
    //    const jsonString = JSON.stringify(jsonObject, null, 2);
    //    const blob = new Blob([jsonString], { type: 'text/plain' });
    //    const link = document.createElement('a');
    //    link.download = 'output.txt';
    //    link.href = window.URL.createObjectURL(blob);
    //    document.body.appendChild(link);
    //    link.click();
    //    document.body.removeChild(link);
    //}
    static inputError() {
        PopupHandler.addToArray("Write your name", "Input Error");
    }
    // Puts the name, if there is one, in front of a message's closing punctuation: "Well done!" becomes "Well done, Sam!"
    static addressed(text) {
        if (!userHandler.userName)
            return text;
        const name = userHandler.userName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return text.replace(/([.!?…]*)$/, ", " + name + "$1");
    }
    static displayName() {
        document.getElementById("userNameInput").classList.add("displayNone");
        let userDisplay = document.getElementById("userDisplay");
        userDisplay.classList.remove("displayNone");
        userDisplay.innerText = `Hi ${userHandler.userName}!`;
    }
    static setUserInfo() {
        let inputField = document.getElementById('username');
        if (inputField.value.length == 0) {
            this.inputError();
            return;
        }
        this.userName = inputField.value;
        let value = {
            user: this.userName,
        };
        this.displayName();
        this.setLocal(value);
    }
    static getUserInfo() {
        let userInfo = this.getLocal();
        if (userInfo) {
            let userObj = JSON.parse(userInfo);
            this.userName = userObj.user;
            console.log(userObj);
        }
    }
    static getLocal() {
        return localStorage.getItem(this.key);
    }
    static setLocal(value) {
        let json = JSON.stringify(value);
        localStorage.setItem(this.key, json);
        //  saveJsonToFile(json);
    }
}
class GameProgress {
    static key = 'Airstrike_TS FINISHED';
    static order = ["normal", "hard", "chaos"];
    static read() {
        try {
            return JSON.parse(localStorage.getItem(GameProgress.key)) || {};
        }
        catch (e) {
            return {};
        }
    }
    static record(location, difficulty) {
        const done = GameProgress.read();
        const list = done[location] || [];
        if (!list.includes(difficulty))
            list.push(difficulty);
        done[location] = list;
        try {
            localStorage.setItem(GameProgress.key, JSON.stringify(done));
        }
        catch (e) { } // (no storage to keep it in: it just isn't remembered)
    }
    // The hardest difficulty this kind of game has been finished on, if it has
    static best(location) {
        const list = GameProgress.read()[location] || [];
        let best = null;
        for (const difficulty of GameProgress.order)
            if (list.includes(difficulty))
                best = difficulty;
        return best;
    }
}
//# sourceMappingURL=users.js.map