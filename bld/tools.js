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
    return player1.location.x < player2.location.x + player2.width &&
        player1.location.x + player1.width > player2.location.x &&
        player1.location.y < player2.location.y + player2.height &&
        player1.location.y + player1.height > player2.location.y;
}
export var Nutrition;
(function (Nutrition) {
    Nutrition[Nutrition["low"] = 0.25] = "low";
    Nutrition[Nutrition["normal"] = 1] = "normal";
    Nutrition[Nutrition["good"] = 1.5] = "good";
    Nutrition[Nutrition["poison"] = -1] = "poison";
})(Nutrition || (Nutrition = {}));
