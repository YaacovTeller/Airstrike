var game;
window.onload = () => {
    const contentEl = ContentElHandler.returnContentEl();
    loadSound();
    CanvasGifHandler.loadAllGifs();
    game = new GameHandler(contentEl);
};
//# sourceMappingURL=app.js.map