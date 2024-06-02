var game;
window.onload = () => {
    const contentEl = ContentElHandler.returnContentEl();
    game = new GameHandler(contentEl);
    loadSound();
};
//# sourceMappingURL=app.js.map