var game: GameHandler;

window.onload = () => {
    const contentEl: HTMLElement = ContentElHandler.returnContentEl();
    loadSound();
    game = new GameHandler(contentEl);
};