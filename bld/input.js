class InputHandler {
    constructor(game, canvas) {
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
                e.key === 'a') && this.keys.indexOf(e.key) === -1) {
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
                e.key === 'a') {
                this.keys.splice(this.keys.indexOf(e.key), 1);
            }
            console.log("KeyUNpressed: ", e.key, this.keys);
        });
    }
    initMouseListeners() {
        this.canvas.addEventListener('mousemove', (event) => {
            // Call game method or directly handle here
            this.game.handleMouseMove(event, this.canvas);
        });
    }
}
export { InputHandler };
