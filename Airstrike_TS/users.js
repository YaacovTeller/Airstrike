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
//# sourceMappingURL=users.js.map