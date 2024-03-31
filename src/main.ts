import { Game } from "./game.js";

window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement!.clientWidth;
    canvas.height = canvas.parentElement!.clientHeight;
    const game = new Game(canvas.width, canvas.height, 300);
    game.addPlayers(10);
    game.addFood(30);
    // game.createWalls();
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