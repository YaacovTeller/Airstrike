class RandomNumberGen {
    static randomNumBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static returnRandomFromArray(array) {
        return array[RandomNumberGen.randomNumBetween(0, array.length - 1)];
    }
}

class ElementCreator {
    public static returnNewImageEl(parent: HTMLElement, classname: string, src?: string, append?: boolean) {
        let el: HTMLImageElement = this.returnNewEl(parent, 'img', classname, append) as HTMLImageElement;
        if (src) el.src = src;
    //    if (src) el.src = src + loadNewImage();

        return el;
    }
    private static returnNewEl(parent: HTMLElement, divType: string, classname: string, append?: boolean) {
        let el = document.createElement(divType);
        el.className = classname;
        append ? parent.appendChild(el) : parent.prepend(el);
        return el;
    }
    public static returnNewDiv(parent: HTMLElement, classname: string) {
        return this.returnNewEl(parent, 'div', classname);
    }
    public static returnNewCanvas(parent: HTMLElement, classname: string, append?: boolean) {
        return this.returnNewEl(parent, 'canvas', classname, append) as HTMLCanvasElement;
    }

    // Freezes targetEl's absolute page position to match sourceEl's current on-screen rect,
    // so it can be detached/reparented without visually jumping.
    public static positionAbsoluteAtElementRect(sourceEl: HTMLElement, targetEl: HTMLElement) {
        const rect = sourceEl.getBoundingClientRect();
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        targetEl.style.position = "absolute";
        targetEl.style.left = `${x}px`;
        targetEl.style.top = `${y}px`;
    }
}

class ContentElHandler {
    static returnContentWrapper() {
        return document.getElementById("contentWrapper")!;
    }
    static returnbackground() {
        return document.getElementById("background")!;
    }
    static addToContentWrapper(elem: HTMLElement) {
        this.returnContentWrapper().appendChild(elem);
    }
    static addToBackground(elem: HTMLElement) {
        this.returnbackground().appendChild(elem);
    }
    static returnContentEl() {
        return document.getElementById("content")!;
    }
    static addToContentEl(elem: HTMLElement) {
        this.returnContentEl().appendChild(elem);
    }
    static removeFromContentEl(elem: HTMLElement) {
        let contentEl: HTMLElement = this.returnContentEl();
        if (elem && contentEl.contains(elem)) {
            contentEl.removeChild(elem);
        }
        elem = null
    }

    static contentElWidth() {
        return this.returnContentEl().clientWidth;
    }
    static clearContent() {
        this.returnContentEl().innerHTML = "";
    }
    static fadeRemoveItem(item: HTMLElement, stayTime, fadeTime, array?) {
        item.classList.add('smoothFade');
        setTimeout(() => {
            item.classList.add("hide");
        }, stayTime)
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
        }, stayTime + fadeTime)
    }
}

function loadNewImage() {
    return '?' + new Date().getTime();
}

class MouseHandler {
    static mousePos: position = { X: '', Y: '' };

    static updateMousePos(event?: MouseEvent) {
        if (event) {
            this.mousePos.X = event.clientX
            this.mousePos.Y = event.clientY
        }
        return this.mousePos
    }
}