import { Player } from "./player";

export interface Location {
    x: number,
    y: number
}

export interface Velocity {
    velocityX: number;
    velocityY: number;
}

export interface Hunger {
    hungerLevel: number;
    maxHunger: number;
    hungerIncreaseRate: number;
}

export function getRandomFoodLocation(canvasWidth: number, canvasHeight: number, radius: number): Location {
    const x = radius + Math.random() * (canvasWidth - 2 * radius);
    const y = radius + Math.random() * (canvasHeight - 2 * radius);
    return { x, y };
}

export function normalizeAngle(angle: number): number {
    angle = angle % 360; // Normalize to [0, 360]
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}

export function isColliding(player1: Player, player2: Player): boolean {
    return player1.location.x < player2.location.x + player2.width &&
           player1.location.x + player1.width > player2.location.x &&
           player1.location.y < player2.location.y + player2.height &&
           player1.location.y + player1.height > player2.location.y;
}

export enum Nutrition {
    low = .25,
    normal = 1,
    good = 1.5,
    poison = -1,
}

export type Age = "Baby" | "Adalescence" | "Adult" | "Senior";
