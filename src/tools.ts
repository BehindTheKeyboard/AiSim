import { Player } from "./player";

export interface Location {
    x: number,
    y: number
}

export interface Velocity {
    velocityX: number;
    velocityY: number;
}

export type Age = "Baby" | "Adalescence" | "Adult" | "Senior";

export interface PlayerData {
    playerDisplayId: string;
    width: number;
    height: number;
    color: string;
    age: Age;
}

export interface Telemetry {
    speed: number;
    maxSpeed: number;
    velocity: Velocity;
    location: Location;
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
    return player1.getPlayerLocation().x < player2.getPlayerLocation().x + player2.getPlayerSize().width &&
    player1.getPlayerLocation().x + player1.getPlayerSize().width > player2.getPlayerLocation().x &&
    player1.getPlayerLocation().y < player2.getPlayerLocation().y + player2.getPlayerSize().height &&
    player1.getPlayerLocation().y + player1.getPlayerSize().height > player2.getPlayerLocation().y;
}

export enum Nutrition {
    low = .25,
    normal = 1,
    good = 1.5,
    poison = -1,
}

export enum Wall {
    None = "None",
    Top = "Top",
    Bottom = "Bottom",
    Left = "Left",
    Right = "Right"
}

export interface Speed {
    current: number,
    minimum: number,
    maximum: number
}

export function playSound(soundFile: string): void {
    const audio = new Audio(soundFile);
    audio.play().catch(err => console.error(`Error playing ${soundFile}: `, err));
}

export function getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function getRandomColor(): string{
    const r = Math.floor(getRandomNumber(0, 256)); // Random red component (0-255)
    const g = Math.floor(getRandomNumber(0, 256)); // Random green component (0-255)
    const b = Math.floor(getRandomNumber(0, 256)); // Random blue component (0-255)
    return `rgb(${r}, ${g}, ${b})`; // Return the RGB color string
}
