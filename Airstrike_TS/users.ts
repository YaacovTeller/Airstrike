

// The people who play: a list of names, one of them picked, in local storage. Each has their own progress (see GameProgress). The menu has a box to pick
// from them, with the option of adding a new one, and a small button to delete the one that's picked.
class userHandler {
    public static userName: string;               // who's playing (nobody, until there's a name)
    public static users: Array<string> = [];
    private static usersKey = 'Airstrike_TS USERS';
    private static oldKey = 'Airstrike_TS USER';  // (from when there was only the one name)
    private static newOption = "__new__";
    public static onChange: () => void = () => { }; // told when a different user is picked, added or deleted

    private static inputError() {
        PopupHandler.addToArray("Write your name","Input Error");
    }
    // Puts the name, if there is one, in front of a message's closing punctuation: "Well done!" becomes "Well done, Sam!"
    public static addressed(text: string): string {
        if (!userHandler.userName) return text;
        const name = userHandler.userName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return text.replace(/([.!?…]*)$/, ", " + name + "$1");
    }

    // Where this user's progress is kept
    public static progressKey(): string {
        return 'Airstrike_TS FINISHED' + (userHandler.userName ? ' ' + userHandler.userName : '');
    }

    // ---- local storage
    public static getUserInfo() {
        try {
            const saved = localStorage.getItem(this.usersKey);
            if (saved) {
                const obj = JSON.parse(saved);
                this.users = Array.isArray(obj.users) ? obj.users : [];
                this.userName = this.users.includes(obj.current) ? obj.current : this.users[0];
                return;
            }
            // from when there was only the one name: it's the first user, and the progress that was kept for nobody is theirs
            const old = localStorage.getItem(this.oldKey);
            if (old) {
                const name = JSON.parse(old).user;
                if (name) {
                    this.users = [name];
                    this.userName = name;
                    this.adoptAnonymousProgress();
                    this.save();
                }
                localStorage.removeItem(this.oldKey);
            }
        }
        catch (e) { }
    }
    private static save() {
        try {
            localStorage.setItem(this.usersKey, JSON.stringify({ users: this.users, current: this.userName }));
        }
        catch (e) { }
    }
    // Progress made before there was a name goes to the first name there is
    private static adoptAnonymousProgress() {
        try {
            const plain = 'Airstrike_TS FINISHED';
            const progress = localStorage.getItem(plain);
            if (progress && this.userName && !localStorage.getItem(this.progressKey())) {
                localStorage.setItem(this.progressKey(), progress);
                localStorage.removeItem(plain);
            }
        }
        catch (e) { }
    }

    // ---- what the menu does
    public static addUser() {
        const input = document.getElementById('username') as HTMLInputElement;
        const name = input.value.trim();
        if (!name.length) {
            this.inputError();
            return;
        }
        const first = this.users.length == 0;
        if (!this.users.includes(name)) this.users.push(name);
        this.userName = name;
        if (first) this.adoptAnonymousProgress();
        input.value = "";
        this.save();
        this.render();
        this.onChange();
    }
    public static selectUser(name: string) {
        if (!this.users.includes(name)) return;
        this.userName = name;
        this.save();
        this.render();
        this.onChange();
    }
    // Deletes the one that's picked, and their progress, asking first. (Another is picked in their place, if there is one.)
    public static deleteCurrent() {
        const name = this.userName;
        if (!name) return;
        if (!confirm("Do you really want to delete " + name + " and their progress?")) return;
        try {
            localStorage.removeItem(this.progressKey());
        }
        catch (e) { }
        this.users = this.users.filter(u => u !== name);
        this.userName = this.users[0];
        this.save();
        this.render();
        this.onChange();
    }
    // Whether the box for a new name is showing (it is when there's nobody, or when "add a new user" is picked)
    private static adding: boolean = false;
    public static render() {
        const picker = document.getElementById("userPicker");
        const entry = document.getElementById("userNameInput");
        const select = document.getElementById("userSelect") as HTMLSelectElement;
        const cancel = document.getElementById("userCancel");
        if (!picker || !entry || !select) return;
        const showEntry = this.adding || this.users.length == 0;
        select.innerHTML = "";
        for (const name of this.users) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        }
        const add = document.createElement("option");
        add.value = this.newOption;
        add.textContent = "+ Add new user";
        select.appendChild(add);
        if (this.userName) select.value = this.userName;
        picker.classList.toggle("displayNone", showEntry);
        entry.classList.toggle("displayNone", !showEntry);
        if (cancel) cancel.classList.toggle("displayNone", this.users.length == 0);
    }
    public static setUpMenu() {
        const select = document.getElementById("userSelect") as HTMLSelectElement;
        select.onchange = () => {
            if (select.value == this.newOption) {
                this.adding = true;
                this.render();
                (document.getElementById("username") as HTMLInputElement).focus();
            }
            else this.selectUser(select.value);
        };
        document.getElementById("userInput").onclick = () => { this.adding = false; this.addUser(); };
        (document.getElementById("username") as HTMLInputElement).addEventListener("keydown", (event: KeyboardEvent) => {
            event.stopPropagation(); // (typing a name isn't pressing the game's keys)
            if (event.key == "Enter") { this.adding = false; this.addUser(); }
            else if (event.key == "Escape" && this.users.length) { this.adding = false; this.render(); }
        });
        document.getElementById("userCancel").onclick = () => { this.adding = false; this.render(); };
        document.getElementById("userDelete").onclick = () => this.deleteCurrent();
        this.render();
    }
}

// Which kinds of game have been finished, and on which difficulty: kept in local storage, and shown as a stamp on the menu's button for each
type finishedGames = { [location: string]: Array<string> };
class GameProgress {
    private static key(): string { return userHandler.progressKey(); } // (each user's own)
    private static order = ["normal", "hard", "chaos"];
    private static read(): finishedGames {
        try {
            return JSON.parse(localStorage.getItem(GameProgress.key())) || {};
        }
        catch (e) {
            return {};
        }
    }
    public static record(location: string, difficulty: string) {
        const done = GameProgress.read();
        const list = done[location] || [];
        if (!list.includes(difficulty)) list.push(difficulty);
        done[location] = list;
        try {
            localStorage.setItem(GameProgress.key(), JSON.stringify(done));
        }
        catch (e) { } // (no storage to keep it in: it just isn't remembered)
    }
    public static hasAny(): boolean {
        const done = GameProgress.read();
        return Object.keys(done).some(location => (done[location] || []).length > 0);
    }
    public static clear() {
        try {
            localStorage.removeItem(GameProgress.key());
        }
        catch (e) { }
    }
    // The hardest difficulty this kind of game has been finished on, if it has
    public static best(location: string): string | null {
        const list = GameProgress.read()[location] || [];
        let best: string = null;
        for (const difficulty of GameProgress.order) if (list.includes(difficulty)) best = difficulty;
        return best;
    }
}
