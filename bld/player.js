import { Nutrition, playSound, normalizeAngle } from "./tools.js";
import { PlayerGenetics } from "./playerGenetics.js";
class Player {
    // #region constructor
    constructor(game, parentDisplayId, x, y) {
        this.rotationSpeed = .25;
        this.rotation = 0;
        this.visionRadius = 130;
        this.isAlive = true;
        this.healthBar = document.createElement('div');
        this.healthStatus = document.createElement('span');
        this.hungerDisplay = document.createElement('div');
        this.playerDisplayId = "";
        this.foodAmount = 0;
        this.identifyPoisonChance = 0.50;
        this.collidedWithWall = false;
        this.backupCounter = 30;
        this.isRotating = false;
        this.playerGenetics = new PlayerGenetics();
        this.playerGenetics.telemetryGene = {
            maxSpeed: 1,
            speed: .25,
            velocity: {
                velocityX: 0,
                velocityY: 0,
            },
            location: {
                x: 0,
                y: 0,
            },
        };
        this.playerGenetics.playerDataGene = {
            age: "Baby",
            color: "rgb(153, 0, 0)",
            height: 10,
            width: 6,
            playerDisplayId: "" //gets set later
        };
        this.hasConsumedPoison = false;
        this.avoidPoison = false;
        this.canIdentifyPoison = false;
        this.creationTime = new Date();
        this.game = game;
        if (x !== undefined && y !== undefined) {
            this.playerGenetics.telemetryGene.location = { x, y };
        }
        else {
            this.playerGenetics.telemetryGene.location = { x: 0, y: 0 };
        }
        ;
        this.rotation = Math.random() * 360;
        this.health = 100;
        this.targetRotation = 0;
        this.createPlayerDisplay(parentDisplayId, game);
        this.createHungerDisplay();
        if (this.isAlive) {
            this.createHealthDisplay();
        }
        this.updateHungerDisplay();
        this.updateHealthDisplay();
        this.startHungerInterval();
    }
    // #endregion
    update() {
        if (this.isAlive === true) {
            if (this.health > 100)
                this.health = 100;
            if (this.checkHungerLevel() >= 10) {
                this.health -= .01;
            }
            if (this.checkHungerLevel() > 8) {
                this.searchForFood(this.getClosetFoodLocation());
            }
            else {
                this.explore();
            }
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
            this.smoothRotation(this.targetRotation);
            this.updateHealthDisplay();
            this.applyVelocity();
            this.checkForFoodCollision();
            this.checkGrowth();
            this.checkSpeed();
        }
    }
    draw(context) {
        context.save(); // Save the current state of the context
        // Move the context to the center of the player
        context.translate(this.playerGenetics.telemetryGene.location.x +
            this.playerGenetics.playerDataGene.width / 2, this.playerGenetics.telemetryGene.location.y +
            this.playerGenetics.playerDataGene.height / 2);
        context.rotate(this.radians(this.rotation)); // Rotate to the player's current rotation
        context.beginPath();
        context.moveTo(this.playerGenetics.playerDataGene.width / 2, 0); //tip to the right
        context.lineTo(-this.playerGenetics.playerDataGene.width / 2, this.playerGenetics.playerDataGene.height / 2); // Bottom left
        context.lineTo(-this.playerGenetics.playerDataGene.width / 2, -this.playerGenetics.playerDataGene.height / 2); // Top left
        context.closePath();
        context.fillStyle = this.playerGenetics.playerDataGene.color;
        context.fill();
        context.restore(); // Restore the context state to what it was before transformations
    }
    // #region getters and setters
    getPlayerLocation() {
        return { x: this.playerGenetics.telemetryGene.location.x, y: this.playerGenetics.telemetryGene.location.y };
    }
    getPlayerSize() {
        return { width: this.playerGenetics.playerDataGene.width, height: this.playerGenetics.playerDataGene.height };
    }
    getPlayerName() {
        return this.playerGenetics.playerDataGene.playerDisplayId;
    }
    getPlayerHunger() {
        return this.playerGenetics.hungerGene.hungerLevel;
    }
    // #endregion
    die() {
        // this.removeHealthDisplay();
        console.log(`Player ${this.playerGenetics.playerDataGene.playerDisplayId} has died.`);
    }
    createPlayerDisplay(parentDisplayId, game) {
        // Create player display container
        const playerDisplayContainer = document.createElement('div');
        playerDisplayContainer.className = 'player-display-container';
        this.playerGenetics.playerDataGene.playerDisplayId = `Player: ${game.players.length + 1}`;
        playerDisplayContainer.id = this.playerGenetics.playerDataGene.playerDisplayId;
        // Append the player display container to the parent element
        const parentElement = document.getElementById(parentDisplayId);
        if (parentElement) {
            parentElement.appendChild(playerDisplayContainer);
        }
    }
    createHungerDisplay() {
        const container = document.getElementById(this.playerGenetics.playerDataGene.playerDisplayId);
        if (!container) {
            console.error(`Container with ID '${this.playerGenetics.playerDataGene.playerDisplayId}' not found.`);
            return;
        }
        // Create and append the player identifier display
        const playerIdentifier = document.createElement('div');
        playerIdentifier.textContent = this.playerGenetics.playerDataGene.playerDisplayId;
        container.appendChild(playerIdentifier);
        // Create and append the hunger display
        const hungerDisplay = document.createElement('div');
        hungerDisplay.className = 'hunger-display';
        hungerDisplay.textContent = `Hunger: ${this.playerGenetics.hungerGene.hungerLevel}`;
        container.appendChild(hungerDisplay);
        // Save the hunger display for later updates
        this.hungerDisplay = hungerDisplay;
    }
    updateHungerDisplay() {
        // Calculate minutes and seconds from timeRemaining
        let deathTimeSet = false;
        if (this.hungerDisplay) {
            if (this.isAlive) {
                this.hungerDisplay.textContent = `Hunger: ${this.playerGenetics.hungerGene.hungerLevel}`;
            }
            else if (!this.isAlive) {
                // if (!deathTimeSet) {
                //     const timeAlive = this.getTimeAlive();
                //     const minutes = Math.floor(timeAlive / 60);
                //     const seconds = Math.floor(timeAlive % 60);
                //     this.hungerDisplay.textContent = `Time Alive: ${minutes}:${seconds} seconds`;
                //     this.hungerDisplay.style.color = "red";
                // }
            }
        }
        else {
            console.error("Hunger display element not found.");
        }
    }
    // Assuming this is in the Player class
    createHealthDisplay() {
        const healthDisplay = document.createElement('div');
        healthDisplay.className = 'health-display';
        healthDisplay.style.display = 'flex'; // Ensure the label and bar are in a row
        healthDisplay.style.alignItems = 'center'; // Align items vertically in the center
        // Create a span for the "Health: " label
        const healthLabel = document.createElement('span');
        healthLabel.textContent = 'Health: ';
        healthLabel.style.marginRight = '10px'; // Add some space between the label and the bar
        healthDisplay.appendChild(healthLabel); // Append the label to the healthDisplay
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthDisplay.appendChild(healthBar); // Append the healthBar after the label
        const healthStatus = document.createElement('span');
        healthStatus.id = 'health-status'; // Set an ID for easy access
        healthDisplay.appendChild(healthStatus); // Append the health status after the health bar
        // Assuming 'players-display' is the ID of the container where you want to append the displays
        const container = document.getElementById('players-display');
        if (container) {
            console.log("Container found");
            container.appendChild(healthDisplay);
        }
        // Store reference to healthBar for later updates
        this.healthBar = healthBar;
        this.healthStatus = healthStatus;
    }
    updateHealthDisplay() {
        const maxWidth = 200;
        this.healthBar.style.width = `${maxWidth * this.healthPercentage() / 100}px`;
        const red = Math.floor(255 * (1 - this.healthPercentage() / 100));
        const green = Math.floor(255 * (this.healthPercentage() / 100));
        this.healthBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
        // Update health status based on player's health
        if (this.isAlive) {
            this.healthStatus.textContent = '';
        }
        else {
            this.healthStatus.textContent = 'Dead';
            this.healthStatus.style.color = "red";
            this.healthStatus.style.fontWeight = "bold";
        }
    }
    healthPercentage() {
        return this.health;
    }
    checkSpeed() {
        if (this.playerGenetics.telemetryGene.speed >= this.playerGenetics.telemetryGene.maxSpeed) {
            this.playerGenetics.telemetryGene.speed = this.playerGenetics.telemetryGene.maxSpeed;
        }
    }
    // #region player wall collision checks
    calculateBaseLeftPosition() {
        const halfWidth = this.playerGenetics.playerDataGene.width / 2;
        const halfHeight = this.playerGenetics.playerDataGene.height / 2;
        // Calculate the angle for the left point
        const angleLeft = this.radians(this.rotation - 90);
        // Calculate the position
        const xLeft = this.playerGenetics.telemetryGene.location.x + halfWidth + Math.cos(angleLeft) * halfHeight;
        const yLeft = this.playerGenetics.telemetryGene.location.y + halfHeight + Math.sin(angleLeft) * halfHeight;
        return { x: xLeft, y: yLeft };
    }
    calculateBaseRightPosition() {
        const halfWidth = this.playerGenetics.playerDataGene.width / 2;
        const halfHeight = this.playerGenetics.playerDataGene.height / 2;
        // Calculate the angle for the right point
        const angleRight = this.radians(this.rotation + 90);
        // Calculate the position
        const xRight = this.playerGenetics.telemetryGene.location.x + halfWidth + Math.cos(angleRight) * halfHeight;
        const yRight = this.playerGenetics.telemetryGene.location.y + halfHeight + Math.sin(angleRight) * halfHeight;
        return { x: xRight, y: yRight };
    }
    calculateTipPosition() {
        // Calculate the tip's position relative to the center
        const offsetX = Math.cos(this.radians(this.rotation)) * (this.playerGenetics.playerDataGene.width / 2);
        const offsetY = Math.sin(this.radians(this.rotation)) * (this.playerGenetics.playerDataGene.width / 2);
        // Apply the offset to the center position to get the tip's global position
        const tipX = this.playerGenetics.telemetryGene.location.x + this.playerGenetics.playerDataGene.width / 2 + offsetX;
        const tipY = this.playerGenetics.telemetryGene.location.y + this.playerGenetics.playerDataGene.height / 2 + offsetY;
        return { x: tipX, y: tipY };
    }
    checkWallCollision() {
        // Calculate positions of the triangle's vertices
        const tipPosition = this.calculateTipPosition();
        const baseLeftPosition = this.calculateBaseLeftPosition(); // Ensure this method is correctly implemented
        const baseRightPosition = this.calculateBaseRightPosition(); // Ensure this method is correctly implemented
        // Initialize variables to track collision state
        let collision = false;
        let wall = null;
        // Define the game area boundaries
        const leftBoundary = 0;
        const rightBoundary = this.game.width;
        const topBoundary = 0;
        const bottomBoundary = this.game.height;
        // Check each vertex for wall collision
        const points = [tipPosition, baseLeftPosition, baseRightPosition];
        const margin = 2;
        for (const point of points) {
            // Left wall collision
            if (point.x - (margin + 2) <= leftBoundary) {
                collision = true;
                wall = 'left';
                break;
            }
            // Right wall collision
            else if (point.x + (margin + 2) >= rightBoundary) {
                collision = true;
                wall = 'right';
                break;
            }
            // Top wall collision
            if (point.y - margin <= topBoundary) {
                collision = true;
                wall = 'top';
                break;
            }
            // Bottom wall collision
            else if (point.y + margin >= bottomBoundary) {
                collision = true;
                wall = 'bottom';
                break;
            }
        }
        return { collision, wall };
    }
    // #endregion
    // #region player movement
    rotateRight(degrees) {
        this.rotation += degrees; // Decrease the angle for clockwise rotation
        if (this.rotation < 0) {
            this.rotation += 360; // Normalize to ensure it's within 0-360 degrees
        }
    }
    rotateLeft(degrees) {
        this.rotation -= degrees; // Increase the angle for counterclockwise rotation
        if (this.rotation >= 360) {
            this.rotation -= 360; // Normalize to ensure it's within 0-360 degrees
        }
    }
    adjustPositionWithinBoundaries(nextX, nextY) {
        this.playerGenetics.telemetryGene.location.x = Math.max(0, Math.min(nextX, this.game.width - this.playerGenetics.playerDataGene.width));
        this.playerGenetics.telemetryGene.location.y = Math.max(0, Math.min(nextY, this.game.height - this.playerGenetics.playerDataGene.height));
    }
    moveForward() {
        this.playerGenetics.telemetryGene.velocity.velocityX += Math.cos(this.radians(this.rotation)) * this.playerGenetics.telemetryGene.speed;
        this.playerGenetics.telemetryGene.velocity.velocityY += Math.sin(this.radians(this.rotation)) * this.playerGenetics.telemetryGene.speed;
    }
    moveBackward() {
        this.playerGenetics.telemetryGene.velocity.velocityX -= Math.cos(this.radians(this.rotation)) * this.playerGenetics.telemetryGene.speed;
        this.playerGenetics.telemetryGene.velocity.velocityY -= Math.sin(this.radians(this.rotation)) * this.playerGenetics.telemetryGene.speed;
    }
    strafeLeft() {
        this.playerGenetics.telemetryGene.velocity.velocityX += Math.cos(this.radians(this.rotation - 90)) * this.playerGenetics.telemetryGene.speed;
        this.playerGenetics.telemetryGene.velocity.velocityY += Math.sin(this.radians(this.rotation - 90)) * this.playerGenetics.telemetryGene.speed;
    }
    strafeRight() {
        this.playerGenetics.telemetryGene.velocity.velocityX += Math.cos(this.radians(this.rotation + 90)) * this.playerGenetics.telemetryGene.speed;
        this.playerGenetics.telemetryGene.velocity.velocityY += Math.sin(this.radians(this.rotation + 90)) * this.playerGenetics.telemetryGene.speed;
    }
    smoothRotation(desiredAngle) {
        let desiredRotation = normalizeAngle(desiredAngle);
        let rotationDifference = desiredRotation - this.rotation;
        rotationDifference = (rotationDifference + 180) % 360 - 180;
        if (Math.abs(rotationDifference) < this.rotationSpeed) {
            this.rotation = desiredRotation; // Close enough, align exactly
        }
        else if (rotationDifference > 0) {
            this.rotateLeft(this.rotationSpeed); // Need to rotate counterclockwise
        }
        else {
            this.rotateRight(this.rotationSpeed); // Need to rotate clockwise
        }
        return desiredRotation;
    }
    getRandomAngle(min, max) {
        const angle = Math.random() * (max - min) + min;
        return Math.random() > 0.5 ? angle : -angle; // Randomly choose to rotate left or right
    }
    explore() {
        if (Math.random() < 0.009) { // Adjust this threshold to control how often direction changes occur
            // Ensure random angle selection is more controlled and varied
            const randomAngle = this.getRandomAngle(3, 200); // Use a helper function to get an angle between 3 and 12 degrees, either direction
            // this.smoothRotation(this.rotation + randomAngle); // Adjust current rotation by the random angle
            this.targetRotation = this.rotation + randomAngle;
        }
        const { collision, wall } = this.checkWallCollision();
        const backupTerm = 5;
        if (collision && !this.collidedWithWall) {
            this.collidedWithWall = true;
            this.backupCounter = backupTerm;
        }
        if (this.collidedWithWall) {
            console.log("Collision with wall");
            if (this.backupCounter > 0) {
                this.moveBackward();
                let between3and12 = Math.floor(Math.random() * (12 - 3 + 1)) + 3;
                this.rotateLeft(between3and12);
                this.backupCounter--;
                if (this.backupCounter === 0 && !this.isRotating) {
                    // Start rotation
                    this.isRotating = true;
                    this.targetRotation = Math.random() * 360; // Store the target rotation as a new property if needed
                }
            }
            // Continuously attempt to rotate to the desired angle until successful
            if (this.isRotating) {
                let currentRotation = this.smoothRotation(this.targetRotation);
                if (Math.abs(normalizeAngle(currentRotation) - normalizeAngle(this.targetRotation)) < this.rotationSpeed) {
                    this.isRotating = false; // Rotation complete
                    this.collidedWithWall = false; // Allow moving forward again
                }
            }
        }
        else if (!this.isRotating) {
            // Normal movement allowed only if not currently rotating
            this.moveForward();
        }
        const foodInRange = this.getClosetFoodLocation();
        if (foodInRange && this.playerGenetics.hungerGene.hungerLevel > 3) {
            // Food is in range and player is sufficiently hungry
            this.searchForFood(foodInRange);
        }
    }
    applyVelocity() {
        const nextX = this.playerGenetics.telemetryGene.location.x + this.playerGenetics.telemetryGene.velocity.velocityX;
        const nextY = this.playerGenetics.telemetryGene.location.y + this.playerGenetics.telemetryGene.velocity.velocityY;
        this.adjustPositionWithinBoundaries(nextX, nextY);
        // Optional: Apply friction or damping to gradually reduce velocity
        this.playerGenetics.telemetryGene.velocity.velocityX *= 0.2;
        this.playerGenetics.telemetryGene.velocity.velocityY *= 0.2;
    }
    radians(degrees) {
        return degrees * Math.PI / 180;
    }
    // #endregion
    // #region Hunger
    increaseHunger() {
        this.playerGenetics.hungerGene.hungerLevel += this.playerGenetics.hungerGene.hungerIncreaseRate;
        if (this.playerGenetics.hungerGene.hungerLevel > this.playerGenetics.hungerGene.maxHunger) {
            this.playerGenetics.hungerGene.hungerLevel = this.playerGenetics.hungerGene.maxHunger;
        }
        this.updateHungerDisplay();
    }
    consumeFood(foodValue) {
        this.playerGenetics.hungerGene.hungerLevel -= foodValue;
        let eatSound = "";
        if (foodValue === Nutrition.poison) {
            if (!this.avoidPoison) {
                this.health -= 10;
                this.playerGenetics.telemetryGene.speed -= .25;
                this.foodAmount -= 2;
                if (this.playerGenetics.telemetryGene.speed < .25)
                    this.playerGenetics.telemetryGene.speed = .25;
                this.hasConsumedPoison = true;
                this.identifyPoisonChance += 0.05;
                this.identifyPoison();
                console.log(this.playerGenetics.playerDataGene.playerDisplayId, " is sick");
                eatSound = "./sounds/Ugg.mp3";
            }
            else {
                console.log("NOPE!!");
                playSound("./sounds/Nope.mp3");
            }
        }
        else if (foodValue === Nutrition.good) {
            this.playerGenetics.telemetryGene.speed += .25;
            this.health += 15;
            this.foodAmount += 1;
            eatSound = "./sounds/Munch.mp3";
        }
        else if (foodValue === Nutrition.normal) {
            this.playerGenetics.telemetryGene.speed += .15;
            this.health += 8;
            this.foodAmount += .5;
            eatSound = "./sounds/Munch.mp3";
        }
        else if (foodValue === Nutrition.low) { /* BLUE */
            this.playerGenetics.telemetryGene.speed += .05;
            this.health += 2;
            this.foodAmount += .25;
            eatSound = "./sounds/Munch.mp3";
        }
        playSound(eatSound);
        if (this.playerGenetics.hungerGene.hungerLevel < 0)
            this.playerGenetics.hungerGene.hungerLevel = 0;
        this.updateHungerDisplay();
        this.updateHealthDisplay();
    }
    identifyPoison() {
        if (this.identifyPoisonChance !== 100 && this.hasConsumedPoison) {
            if (Math.random() < this.identifyPoisonChance) {
                if (!this.canIdentifyPoison) {
                    this.canIdentifyPoison = true;
                    this.avoidPoison = true;
                    console.log("Can now Identify Poison");
                    playSound("sounds/AvoidPoison.mp3");
                }
            }
        }
    }
    searchForFood(food) {
        if (!food) {
            this.explore();
            return;
        }
        const dx = food.location.x - this.playerGenetics.telemetryGene.location.x;
        const dy = food.location.y - this.playerGenetics.telemetryGene.location.y;
        const distanceToFood = Math.sqrt(dx * dx + dy * dy);
        const angleToFood = Math.atan2(dy, dx) * (180 / Math.PI);
        let rotationDifference = this.smoothRotation(angleToFood);
        // Gradual deceleration as the player approaches the food
        const decelerationDistance = 10; // Distance within which to start slowing down
        if (distanceToFood < decelerationDistance) {
            const speedFactor = distanceToFood / decelerationDistance; // Slow down as it gets closer
            this.playerGenetics.telemetryGene.speed = Math.max(this.playerGenetics.telemetryGene.speed * speedFactor, .25); // Ensure there's a minimum speed
        }
        // Continue moving forward if already facing the food
        if (Math.abs(rotationDifference) < 10) { // 10 degrees tolerance
            this.snatchFood();
        }
    }
    snatchFood() {
        this.moveForward();
    }
    getClosetFoodLocation() {
        if (this.game.food.length === 0) {
            return null;
        }
        let closestFood = null;
        let closestDistance = Infinity;
        for (const food of this.game.food) {
            const dx = this.playerGenetics.telemetryGene.location.x - food.location.x;
            const dy = this.playerGenetics.telemetryGene.location.y - food.location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.visionRadius && distance < closestDistance) {
                closestFood = food;
                closestDistance = distance;
            }
            if ((closestFood === null || closestFood === void 0 ? void 0 : closestFood.nutritionalValue) === Nutrition.poison && this.canIdentifyPoison) {
                this.avoidPoison === true;
            }
        }
        return closestFood ? closestFood : null;
    }
    startHungerInterval() {
        this.updateHungerDisplay();
        setInterval(() => {
            this.increaseHunger();
            this.updateHungerDisplay(); // Update the display method
        }, 5000);
    }
    checkForFoodCollision() {
        this.game.food.forEach((food, index) => {
            if (Math.abs(this.playerGenetics.telemetryGene.location.x - food.location.x) < this.playerGenetics.playerDataGene.width &&
                Math.abs(this.playerGenetics.telemetryGene.location.y - food.location.y) < this.playerGenetics.playerDataGene.height) {
                if (!this.avoidPoison) {
                    this.consumeFood(food.nutritionalValue); // Assuming Food has a 'value' property indicating its nutritional value
                    this.game.removeFood(food.location); // Notify the game to remove the consumed food
                }
                else if (this.avoidPoison && food.nutritionalValue === Nutrition.poison) {
                    console.log("AVOIDED");
                }
                else {
                    this.consumeFood(food.nutritionalValue); // Assuming Food has a 'value' property indicating its nutritional value
                    this.game.removeFood(food.location); // Notify the game to remove the consumed food
                }
            }
        });
    }
    checkHungerLevel() {
        return this.playerGenetics.hungerGene.hungerLevel;
    }
    // #endregion
    collisionAvoidance(player1, player2) {
        const dx = player2.playerGenetics.telemetryGene.location.x - player1.playerGenetics.telemetryGene.location.x;
        const dy = player2.playerGenetics.telemetryGene.location.y - player1.playerGenetics.telemetryGene.location.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Ensure there's no division by zero
        if (distance == 0)
            return;
        const nx = dx / distance;
        const ny = dy / distance;
        // Apply a repulsion force by adjusting velocities
        const repulsionStrength = 1; // Adjust as needed
        player1.playerGenetics.telemetryGene.velocity.velocityX -= nx * repulsionStrength;
        player1.playerGenetics.telemetryGene.velocity.velocityY -= ny * repulsionStrength;
        player2.playerGenetics.telemetryGene.velocity.velocityX += nx * repulsionStrength;
        player2.playerGenetics.telemetryGene.velocity.velocityY += ny * repulsionStrength;
        // Determine the direction to rotate based on their relative position
        const rotationAdjustment = 10; // Adjust based on desired rotation speed
        // Assuming positive rotation is clockwise and negative is counterclockwise
        if (dx * player1.playerGenetics.telemetryGene.velocity.velocityY - dy * player1.playerGenetics.telemetryGene.velocity.velocityX > 0) {
            // Player 1 should rotate left (counterclockwise)
            player1.rotateLeft(rotationAdjustment);
        }
        else {
            // Player 1 should rotate right (clockwise)
            player1.rotateRight(rotationAdjustment);
        }
        if (dx * player2.playerGenetics.telemetryGene.velocity.velocityY - dy * player2.playerGenetics.telemetryGene.velocity.velocityX < 0) {
            // Player 2 should rotate left (counterclockwise)
            player2.rotateLeft(rotationAdjustment);
        }
        else {
            // Player 2 should rotate right (clockwise)
            player2.rotateRight(rotationAdjustment);
        }
    }
    collisionAvoidanceWithWall(wall) {
        const playerX = this.getPlayerLocation().x;
        const playerY = this.getPlayerLocation().y;
        const playerWidth = this.getPlayerSize().width;
        const playerHeight = this.getPlayerSize().height;
        // Calculate the player's bounding box
        const playerLeft = playerX;
        const playerRight = playerX + playerWidth;
        const playerTop = playerY;
        const playerBottom = playerY + playerHeight;
        // Calculate the wall's bounding box
        const wallLeft = wall.position.x;
        const wallRight = wall.position.x + wall.width;
        const wallTop = wall.position.y;
        const wallBottom = wall.position.y + wall.height;
        // Check for collision
        if (playerRight > wallLeft && playerLeft < wallRight && playerBottom > wallTop && playerTop < wallBottom) {
            // Calculate the overlap amounts in each direction
            const overlapLeft = playerRight - wallLeft;
            const overlapRight = wallRight - playerLeft;
            const overlapTop = playerBottom - wallTop;
            const overlapBottom = wallBottom - playerTop;
            // Find the minimum overlap to determine the direction of collision
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            // Adjust player's velocity to repel it away from the wall
            if (minOverlapX < minOverlapY) {
                // Collision in the horizontal direction
                if (overlapLeft < overlapRight) {
                    // Player collided from the right, adjust velocity to move left
                    this.playerGenetics.telemetryGene.velocity.velocityX -= 2; // Adjust the repulsion strength as needed
                }
                else {
                    // Player collided from the left, adjust velocity to move right
                    this.playerGenetics.telemetryGene.velocity.velocityX += 2; // Adjust the repulsion strength as needed
                }
                // Rotate the player away from the wall
                this.rotateRight(10); // Adjust rotation angle as needed
            }
            else {
                // Collision in the vertical direction
                if (overlapTop < overlapBottom) {
                    // Player collided from below, adjust velocity to move up
                    this.playerGenetics.telemetryGene.velocity.velocityY -= 2; // Adjust the repulsion strength as needed
                }
                else {
                    // Player collided from above, adjust velocity to move down
                    this.playerGenetics.telemetryGene.velocity.velocityY += 2; // Adjust the repulsion strength as needed
                }
                // Rotate the player away from the wall
                this.rotateRight(10); // Adjust rotation angle as needed
            }
        }
    }
    getRandomRotation() {
        const minAngle = 1; // Minimum angle to ensure there's always some rotation
        const maxAngle = 10; // Maximum angle
        const angle = Math.random() * (maxAngle - minAngle) + minAngle;
        const direction = Math.random() > 0.5 ? 'left' : 'right'; // Randomly choose direction
        return { angle, direction };
    }
    adjustVelocityAndPositionOnCollision() {
        const collisionBuffer = 2;
        const minimumSpeed = 10; // Minimum speed after bouncing
        // Check for collision with left or right walls
        if (this.playerGenetics.telemetryGene.location.x <= 0 + collisionBuffer || this.playerGenetics.telemetryGene.location.x >= this.game.width - this.playerGenetics.playerDataGene.width - collisionBuffer) {
            // Reverse X velocity to simulate a bounce
            this.playerGenetics.telemetryGene.velocity.velocityX = -this.playerGenetics.telemetryGene.velocity.velocityX;
            // Ensure the entity moves with at least the minimum speed
            if (Math.abs(this.playerGenetics.telemetryGene.velocity.velocityX) < minimumSpeed) {
                this.playerGenetics.telemetryGene.velocity.velocityX = this.playerGenetics.telemetryGene.velocity.velocityX < 0 ? -minimumSpeed : minimumSpeed;
            }
            // Optional: Adjust location to prevent sticking to the wall
            if (this.playerGenetics.telemetryGene.location.x <= 0 + collisionBuffer) {
                this.playerGenetics.telemetryGene.location.x = 0 + collisionBuffer;
            }
            else {
                this.playerGenetics.telemetryGene.location.x = this.game.width - this.playerGenetics.playerDataGene.width - collisionBuffer;
            }
        }
        // Check for collision with top or bottom walls
        if (this.playerGenetics.telemetryGene.location.y <= 0 + collisionBuffer || this.playerGenetics.telemetryGene.location.y >= this.game.height - this.playerGenetics.playerDataGene.height - collisionBuffer) {
            // Reverse Y velocity to simulate a bounce
            this.playerGenetics.telemetryGene.velocity.velocityY = -this.playerGenetics.telemetryGene.velocity.velocityY;
            // Ensure the entity moves with at least the minimum speed
            if (Math.abs(this.playerGenetics.telemetryGene.velocity.velocityY) < minimumSpeed) {
                this.playerGenetics.telemetryGene.velocity.velocityY = this.playerGenetics.telemetryGene.velocity.velocityY < 0 ? -minimumSpeed : minimumSpeed;
            }
            // Optional: Adjust location to prevent sticking to the wall
            if (this.playerGenetics.telemetryGene.location.y <= 0 + collisionBuffer) {
                this.playerGenetics.telemetryGene.location.y = 0 + collisionBuffer;
            }
            else {
                this.playerGenetics.telemetryGene.location.y = this.game.height - this.playerGenetics.playerDataGene.height - collisionBuffer;
            }
        }
        // Note: Collision with other entities would require additional logic
    }
    moveToFood(foodX, foodY) {
        // Calculate direction towards food
        let dx = foodX - this.playerGenetics.telemetryGene.location.x;
        let dy = foodY - this.playerGenetics.telemetryGene.location.y;
        let angleToFood = Math.atan2(dy, dx); // Radians
        // Update player's rotation to face the food
        this.rotation = angleToFood * 180 / Math.PI; // Convert to degrees
        // Move player towards the food, you might adjust speed or use a different method
        // This is a simplistic approach, consider adding smooth rotation and movement
        this.playerGenetics.telemetryGene.location.x += Math.cos(angleToFood) * this.playerGenetics.telemetryGene.speed;
        this.playerGenetics.telemetryGene.location.y += Math.sin(angleToFood) * this.playerGenetics.telemetryGene.speed;
    }
    getAge() {
        return this.playerGenetics.playerDataGene.age;
    }
    setAge(age) {
        this.playerGenetics.playerDataGene.age = age;
    }
    checkGrowth() {
        switch (this.playerGenetics.playerDataGene.age) {
            case "Baby": {
                this.playerGenetics.playerDataGene.width = 10;
                this.playerGenetics.playerDataGene.height = 6;
                this.playerGenetics.playerDataGene.color = "rgb(255, 102, 178)";
                if (this.foodAmount >= 2 && this.getTimeAlive() >= (2 * 60)) {
                    this.playerGenetics.playerDataGene.age = "Adalescence";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Adalescence": {
                this.playerGenetics.playerDataGene.width = 15;
                this.playerGenetics.playerDataGene.height = 11;
                this.playerGenetics.playerDataGene.color = "rgb(153, 0, 0)";
                if (this.foodAmount >= 6 && this.getTimeAlive() >= (12 * 60)) {
                    this.playerGenetics.playerDataGene.age = "Adult";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Adult": {
                this.playerGenetics.playerDataGene.width = 20;
                this.playerGenetics.playerDataGene.height = 16;
                this.playerGenetics.playerDataGene.color = "rgb(51, 51, 255)";
                if (this.foodAmount >= 12 && this.getTimeAlive() >= (24 * 60)) {
                    this.playerGenetics.playerDataGene.age = "Senior";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Senior": {
                this.playerGenetics.playerDataGene.width = 18;
                this.playerGenetics.playerDataGene.height = 14;
                this.playerGenetics.playerDataGene.color = "rgb(96, 96, 96)";
            }
        }
    }
    getTimeAlive() {
        const now = new Date();
        const aliveTimeMs = now.getTime() - this.creationTime.getTime();
        return Math.floor(aliveTimeMs / 1000);
    }
}
export { Player };
