import { Wall } from "./wall.js"

export class Level {
    levels: Wall[][] = [];
    private levelNumber: number;
    constructor() { 
        this.loadLevels();
        this.levelNumber = 1;
    }

    private loadLevels(): void {
        this.levels.push(this.level1);
        this.levels.push(this.level2);
    }

    draw(context: CanvasRenderingContext2D) {
        context.save();

        this.levels[this.levelNumber - 1].forEach((wall) => {
            context.fillStyle = wall.color;
            context.fillRect(wall.position.x, wall.position.y, wall.width, wall.height);
        })
        
    }

    setLevel(levelNumber: number) {
        this.levelNumber = levelNumber;
    }

    getLevelNumber(): number {
        return this.levelNumber - 1;
    }

    getLevels(): Wall[][] {
        return this.levels;
    }

    level1: Wall[] = [
        new Wall(450, 250, 5, 400, "#1C63A2"),
        new Wall(850, 250, 5, 400, "#1C63A2")
    ]

    level2: Wall[] = [
        new Wall(200, 300, 5, 100, "red")
    ]
}