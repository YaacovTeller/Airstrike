
type userInfo = {
    user: string,

}

class userHandler {
    public static userName: string;
    private static key = 'Airstrike_TS USER'

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
    private static inputError() {
        PopupHandler.addToArray("Write your name","Input Error");
    }
    public static displayName() {
        document.getElementById("userNameInput").classList.add("displayNone");
        let userDisplay = document.getElementById("userDisplay");
        userDisplay.classList.remove("displayNone");
        userDisplay.innerText = `Hi ${userHandler.userName}!`;
    }

    public static setUserInfo() {
        let inputField: HTMLInputElement = document.getElementById('username') as HTMLInputElement;
        if (inputField.value.length == 0) {
            this.inputError();
            return
        }
        this.userName = inputField.value;
        let value: userInfo = {
            user: this.userName,
        }
        this.displayName();
        this.setLocal(value);
    }
    public static getUserInfo() {
        let userInfo = this.getLocal();
        if (userInfo) {
            let userObj: userInfo = JSON.parse(userInfo);
            this.userName = userObj.user;
            console.log(userObj)
        }
    }
    private static getLocal() {
        return localStorage.getItem(this.key);
    }
    private static setLocal(value) {
        let json = JSON.stringify(value)
        localStorage.setItem(this.key, json);
      //  saveJsonToFile(json);
    }
}
