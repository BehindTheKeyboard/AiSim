import { Game } from "./game.js";
window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1600;
    canvas.height = 1600;
    const game = new Game(canvas.width, canvas.height, 300);
    game.addPlayers(15);
    game.addFood(50);
    game.initializeInputHandler(canvas);
    game.startGame();
    function animate() {
        if (!game.gameActive || game.gameOver)
            return;
        // Clear the canvas for animation
        ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Update the game
        game.update();
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate();
});
