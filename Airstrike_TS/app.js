var game;
window.onload = () => {
    const contentEl = ContentElHandler.returnContentEl();
    loadSound();
    game = new GameHandler(contentEl);
};
