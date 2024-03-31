import { Location } from "./tools";

class Wall {
    position: Location;
    width: number;
    height: number;
    color: string;

    constructor(x: number, y: number, width: number, height: number, color: string) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(context: CanvasRenderingContext2D) {
        context.save();

        context.fillStyle = this.color;
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Method to check collision with a player
    collidesWithPlayer(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
        return (
            playerX < this.position.x + this.width &&
            playerX + playerWidth > this.position.x &&
            playerY < this.position.y + this.height &&
            playerY + playerHeight > this.position.y
        );
    }
}

export { Wall };
