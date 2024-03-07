import { Game } from "./game";
import { getRandomFoodLocation, Location, Nutrition } from "./tools.js";

export class Food {
    game: Game;
    location: Location;
    radius: number;
    color: 'red' | 'green' | 'yellow' | 'blue';
    nutritionalValue: Nutrition;
    creationTime: number;

    constructor(game: Game, nutritionalValue: Nutrition) {
        this.game = game;
        this.radius = 4;
        this.location = getRandomFoodLocation(this.game.width, this.game.height, this.radius);
        this.nutritionalValue = nutritionalValue;
        this.creationTime = Date.now();

        switch (nutritionalValue) {
            case Nutrition.low:
                this.color = "blue";
                break;
            case Nutrition.normal:
                this.color = "yellow";
                break;
            case Nutrition.good:
                this.color = "green";
                break;
            case Nutrition.poison:
                this.color = "red"; // Assuming poison is represented by green
                break;
            default:
                this.color = "yellow"; // Default color, in case none of the conditions are met
        }
    }

    getColor(): string {
        return this.color;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.beginPath();
        context.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2, true);
        context.fillStyle = this.getColor();
        context.fill();
    }
}