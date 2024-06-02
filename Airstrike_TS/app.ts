var game: GameHandler;

window.onload = () => {
    const contentEl: HTMLElement = ContentElHandler.returnContentEl();
    game = new GameHandler(contentEl);
    loadSound();
};