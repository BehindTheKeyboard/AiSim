export function getRandomFoodLocation(canvasWidth, canvasHeight, radius) {
    const x = radius + Math.random() * (canvasWidth - 2 * radius);
    const y = radius + Math.random() * (canvasHeight - 2 * radius);
    return { x, y };
}
export function normalizeAngle(angle) {
    angle = angle % 360; // Normalize to [0, 360]
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}
export function isColliding(player1, player2) {
    return player1.getPlayerLocation().x < player2.getPlayerLocation().x + player2.getPlayerSize().width &&
        player1.getPlayerLocation().x + player1.getPlayerSize().width > player2.getPlayerLocation().x &&
        player1.getPlayerLocation().y < player2.getPlayerLocation().y + player2.getPlayerSize().height &&
        player1.getPlayerLocation().y + player1.getPlayerSize().height > player2.getPlayerLocation().y;
}
export var Nutrition;
(function (Nutrition) {
    Nutrition[Nutrition["low"] = 0.25] = "low";
    Nutrition[Nutrition["normal"] = 1] = "normal";
    Nutrition[Nutrition["good"] = 1.5] = "good";
    Nutrition[Nutrition["poison"] = -1] = "poison";
})(Nutrition || (Nutrition = {}));
export var Wall;
(function (Wall) {
    Wall["None"] = "None";
    Wall["Top"] = "Top";
    Wall["Bottom"] = "Bottom";
    Wall["Left"] = "Left";
    Wall["Right"] = "Right";
})(Wall || (Wall = {}));
export function playSound(soundFile) {
    const audio = new Audio(soundFile);
    audio.play().catch(err => console.error(`Error playing ${soundFile}: `, err));
}
export function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
export function getRandomColor() {
    const r = Math.floor(getRandomNumber(0, 256)); // Random red component (0-255)
    const g = Math.floor(getRandomNumber(0, 256)); // Random green component (0-255)
    const b = Math.floor(getRandomNumber(0, 256)); // Random blue component (0-255)
    return `rgb(${r}, ${g}, ${b})`; // Return the RGB color string
}
