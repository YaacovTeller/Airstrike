class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static returnRandomFromArray(array) {
        return array[RandomNumberGen.randomNumBetween(0, array.length - 1)];
    }
}
class ElementCreator {
    static returnNewImageEl(parent, classname, src, append) {
        let el = this.returnNewEl(parent, 'img', classname, append);
        if (src)
            el.src = src;
        //    if (src) el.src = src + loadNewImage();
        return el;
    }
    static returnNewEl(parent, divType, classname, append) {
        let el = document.createElement(divType);
        el.className = classname;
        append ? parent.appendChild(el) : parent.prepend(el);
        return el;
    }
    static returnNewDiv(parent, classname) {
        return this.returnNewEl(parent, 'div', classname);
    }
    static returnNewCanvas(parent, classname) {
        return this.returnNewEl(parent, 'canvas', classname);
    }
}
class ContentElHandler {
    static returnContentWrapper() {
        return document.getElementById("contentWrapper");
    }
    static returnbackground() {
        return document.getElementById("background");
    }
    static addToContentWrapper(elem) {
        this.returnContentWrapper().appendChild(elem);
    }
    static addToBackground(elem) {
        this.returnbackground().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content");
    }
    static addToContentEl(elem) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem) {
        let contentEl = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
        elem = null;
    }
    static contentElWidth() {
        return this.returnContentEl().clientWidth;
    }
    static clearContent() {
        this.returnContentEl().innerHTML = "";
    }
    static fadeRemoveItem(item, stayTime, fadeTime, array) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime);
        setTimeout(() => {
            if (item) {
                if (array) {
                    let index = array.indexOf(item);
                    if (index >= 0) {
                        array.splice(index, 1);
                    }
                }
                ContentElHandler.removeFromContentEl(item);
            }
        }, stayTime + fadeTime);
    }
}
function loadNewImage() {
    return '?' + new Date().getTime();
}
class MouseHandler {
    static mousePos = { X: '', Y: '' };
    static updateMousePos(event) {
        if (event) {
            this.mousePos.X = event.clientX;
            this.mousePos.Y = event.clientY;
        }
        return this.mousePos;
    }
}
//# sourceMappingURL=Utilities.js.map