var game;
window.onload = () => {
    const contentEl = ContentElHandler.returnContentEl();
    loadSound();
    loadAllGifs();
    game = new GameHandler(contentEl);
};
//# sourceMappingURL=app.js.map