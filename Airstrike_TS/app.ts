var game: GameHandler;

window.onload = () => {
    const contentEl: HTMLElement = ContentElHandler.returnContentEl();
    loadSound();
    CanvasGifHandler.loadAllGifs();
    game = new GameHandler(contentEl);
};