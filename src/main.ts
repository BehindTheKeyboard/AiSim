import { Game } from "./game.js";

window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = 1600;
    canvas.height = 1400;

    const game = new Game(canvas.width, canvas.height, 300);
    game.addPlayers(10);
    game.addFood(20);
    game.initializeInputHandler(canvas);
    game.startGame();
    function animate(): void {
        if (!game.gameActive || game.gameOver) return;
        // Clear the canvas for animation
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        // Update the game
        game.update();
        game.draw(ctx!);
        requestAnimationFrame(animate);
    }
    animate();
});