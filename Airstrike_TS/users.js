class userHandler {
    static userName;
    static key = 'Airstrike_TS USER';
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
    }
}
