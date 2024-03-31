import { Game } from "./game";

class InputHandler {
    keys: string[];
    game: Game;
    canvas: HTMLCanvasElement;
    
    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.keys = [];
        this.game = game;
        this.canvas = canvas;
        this.initMouseListeners();
        window.addEventListener('keydown', e => {
            if ((e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'Enter' ||
                e.key === 'a'
            ) && this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
            console.log("Keypressed: ", e.key, this.keys);
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'Enter' ||
                e.key === 'a'
            ) {
                this.keys.splice(this.keys.indexOf(e.key), 1);
            }
            console.log("KeyUNpressed: ", e.key, this.keys);
        })
    }
    
    initMouseListeners() {
        this.canvas.addEventListener('mousemove', (event) => {
            // Call game method or directly handle here
            this.game.handleMouseMove(event, this.canvas);
        });
    }

    updatePlayerMovement(): void {
        // Update player movement based on the keys pressed
        for (const key of this.keys) {
            switch (key) {
                case 'ArrowUp':
                    this.game.players.forEach(player => player.moveForward());
                    break;
                case 'ArrowDown':
                    this.game.players.forEach(player => player.moveBackward);
                    break;
                case 'ArrowLeft':
                    this.game.players.forEach(player => player.rotateLeft(1));
                    break;
                case 'ArrowRight':
                    this.game.players.forEach(player => player.rotateRight(1));
                    break;
                // Add more cases for other keys as needed
            }
        }
    }
}

export { InputHandler };