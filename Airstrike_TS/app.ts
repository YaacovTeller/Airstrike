var game: GameHandler;

window.onload = () => {
    const contentEl: HTMLElement = ContentElHandler.returnContentEl();
    loadSound();
    loadAllGifs();
    game = new GameHandler(contentEl);
};