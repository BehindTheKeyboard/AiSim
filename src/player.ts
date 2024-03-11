import { Game } from "./game";
import { Age, Hunger, Location, Nutrition, Wall, normalizeAngle } from "./tools.js";
import { Food } from "./food.js"

class Player {
    game: Game;
    width: number;
    height: number;
    color: string;
    location: Location;
    speed: number;
    maxSpeed: number;
    rotationSpeed: number = .25;
    rotation: number = 0;
    targetRotation: number;
    hunger: Hunger;
    velocityX: number = 0;
    velocityY: number = 0;
    visionRadius: number = 130;
    isAlive: boolean = true;
    margin: number = 5; // player buffer distance from canvas walls
    health: number;
    healthBar: HTMLDivElement = document.createElement('div');
    hungerDisplay: HTMLDivElement = document.createElement('div');
    playerDisplayId: string = "";
    playerAge: Age;
    foodAmount: number = 0;
    creationTime: Date;
    canIdentifyPoison: boolean;
    avoidPoison: boolean;
    hasConsumedPoison: boolean;
    identifyPoisonChance: number = 0.50;
    wallHitCounter: number = 0;
    collidedWithWall = false;
    hasRotatedPostCollision = false;
    backupCounter = 30;

    // #region constructor
    constructor(game: Game, parentDisplayId: string, x?: number, y?: number) {
        this.hasConsumedPoison = false;
        this.avoidPoison = false;
        this.canIdentifyPoison = false;
        this.playerAge = "Baby";
        this.creationTime = new Date();
        this.game = game;
        this.width = 10;
        this.height = 6;
        this.color = "rgb(153, 0, 0)";
        if (x !== undefined && y !== undefined) {
            this.location = { x, y };
        } else {
            this.location = { x: 0, y: 0 };
        }
        this.speed = .25;
        this.maxSpeed = 1;
        this.hunger = { hungerLevel: 0, maxHunger: 10, hungerIncreaseRate: .25 };
        this.rotation = Math.random() * 360;
        this.health = 100;
        this.targetRotation = 0;

        this.createPlayerDisplay(parentDisplayId, game);
        this.createHungerDisplay();
        this.createHealthDisplay();
        this.updateHungerDisplay();
        this.updateHealthDisplay();
        this.startHungerInterval();
    }
    // #endregion

    update(): void {
        if (this.isAlive === true) {
            if (this.health > 100) this.health = 100;
            if (this.checkHungerLevel() >= 10) {
                this.health -= .5;
            }
            if (this.checkHungerLevel() > 8) {
                this.searchForFood(this.getClosetFoodLocation());
            } else {
                this.explore();
            }
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
            this.explore();
            this.smoothRotation(this.targetRotation);
            this.updateHealthDisplay();
            this.applyVelocity();
            this.checkForFoodCollision();
            this.checkGrowth();
            this.checkSpeed();
        }
    }

    draw(context: CanvasRenderingContext2D): void {
        context.save(); // Save the current state of the context

        // Move the context to the center of the player
        context.translate(this.location.x + this.width / 2, this.location.y + this.height / 2);
        context.rotate(this.radians(this.rotation)); // Rotate to the player's current rotation

        context.beginPath();
        context.moveTo(this.width / 2, 0); //tip to the right
        context.lineTo(-this.width / 2, this.height / 2); // Bottom left
        context.lineTo(-this.width / 2, -this.height / 2); // Top left
        context.closePath();
        context.fillStyle = this.color;
        context.fill();
        context.restore(); // Restore the context state to what it was before transformations
    }

    createPlayerDisplay(parentDisplayId: string, game: Game): void {
        // Create player display container
        const playerDisplayContainer = document.createElement('div');
        playerDisplayContainer.className = 'player-display-container';
        this.playerDisplayId = `Player: ${game.players.length + 1}`;
        playerDisplayContainer.id = this.playerDisplayId;

        // Append the player display container to the parent element
        const parentElement = document.getElementById(parentDisplayId);
        if (parentElement) {
            parentElement.appendChild(playerDisplayContainer);
        }
    }

    createHungerDisplay(): void {
        const container = document.getElementById(this.playerDisplayId);
        if (!container) {
            console.error(`Container with ID '${this.playerDisplayId}' not found.`);
            return;
        }

        // Create and append the player identifier display
        const playerIdentifier = document.createElement('div');
        playerIdentifier.textContent = this.playerDisplayId;
        container.appendChild(playerIdentifier);

        // Create and append the hunger display
        const hungerDisplay = document.createElement('div');
        hungerDisplay.className = 'hunger-display';
        hungerDisplay.textContent = `Hunger: ${this.hunger.hungerLevel}`;
        container.appendChild(hungerDisplay);

        // Save the hunger display for later updates
        this.hungerDisplay = hungerDisplay;
    }

    checkSpeed(): void {
        if (this.speed >= this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
    }

    updateHungerDisplay(): void {
        if (this.hungerDisplay) {
            if (this.isAlive) {
                this.hungerDisplay.textContent = `Hunger: ${this.hunger.hungerLevel}`;
            } else {
                // Use getTimeAlive() to get the elapsed time and display it
                const timeAlive = this.getTimeAlive();
                this.hungerDisplay.textContent = `TERMINATED - Time Alive: ${timeAlive} seconds`;
                this.hungerDisplay.style.color = "red";
            }
        } else {
            console.error("Hunger display element not found.");
        }
    }


    // Assuming this is in the Player class
    createHealthDisplay(): void {
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

        // Assuming 'players-display' is the ID of the container where you want to append the displays
        const container = document.getElementById('players-display');
        if (container) {
            console.log("Container found");
            container.appendChild(healthDisplay);
        }

        // Store reference to healthBar for later updates
        this.healthBar = healthBar;
    }

    updateHealthDisplay() {
        const maxWidth = 200;
        this.healthBar.style.width = `${maxWidth * this.healthPercentage() / 100}px`;

        const red = Math.floor(255 * (1 - this.healthPercentage() / 100));
        const green = Math.floor(255 * (this.healthPercentage() / 100));
        this.healthBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
    }

    healthPercentage(): number {
        return this.health;
    }

    // #region player wall collision checks
    private calculateBaseLeftPosition(): { x: number, y: number } {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        // Calculate the angle for the left point
        const angleLeft = this.radians(this.rotation - 90);
        // Calculate the position
        const xLeft = this.location.x + halfWidth + Math.cos(angleLeft) * halfHeight;
        const yLeft = this.location.y + halfHeight + Math.sin(angleLeft) * halfHeight;
        return { x: xLeft, y: yLeft };
    }

    private calculateBaseRightPosition(): { x: number, y: number } {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        // Calculate the angle for the right point
        const angleRight = this.radians(this.rotation + 90);
        // Calculate the position
        const xRight = this.location.x + halfWidth + Math.cos(angleRight) * halfHeight;
        const yRight = this.location.y + halfHeight + Math.sin(angleRight) * halfHeight;
        return { x: xRight, y: yRight };
    }

    private calculateTipPosition(): { x: number; y: number } {
        // Calculate the tip's position relative to the center
        const offsetX = Math.cos(this.radians(this.rotation)) * (this.width / 2);
        const offsetY = Math.sin(this.radians(this.rotation)) * (this.width / 2);

        // Apply the offset to the center position to get the tip's global position
        const tipX = this.location.x + this.width / 2 + offsetX;
        const tipY = this.location.y + this.height / 2 + offsetY;

        return { x: tipX, y: tipY };
    }

    private checkWallCollision(): { collision: boolean, wall: 'top' | 'bottom' | 'left' | 'right' | null } {
        // Calculate positions of the triangle's vertices
        const tipPosition = this.calculateTipPosition();
        const baseLeftPosition = this.calculateBaseLeftPosition(); // Ensure this method is correctly implemented
        const baseRightPosition = this.calculateBaseRightPosition(); // Ensure this method is correctly implemented
    
        // Initialize variables to track collision state
        let collision = false;
        let wall: 'top' | 'bottom' | 'left' | 'right' | null = null;
    
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
            else if (point.x + (margin + 2)>= rightBoundary) {
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
    private rotateRight(degrees: number): void {
        this.rotation -= degrees; // Decrease the angle for clockwise rotation
        if (this.rotation < 0) {
            this.rotation += 360; // Normalize to ensure it's within 0-360 degrees
        }
    }


    private rotateLeft(degrees: number): void {
        this.rotation += degrees; // Increase the angle for counterclockwise rotation
        if (this.rotation >= 360) {
            this.rotation -= 360; // Normalize to ensure it's within 0-360 degrees
        }
    }

    private adjustPositionWithinBoundaries(nextX: number, nextY: number): void {
        this.location.x = Math.max(0, Math.min(nextX, this.game.width - this.width));
        this.location.y = Math.max(0, Math.min(nextY, this.game.height - this.height));
    }

    private moveForward(): void {
        this.velocityX += Math.cos(this.radians(this.rotation)) * this.speed;
        this.velocityY += Math.sin(this.radians(this.rotation)) * this.speed;
    }

    private moveBackward(): void {
        this.velocityX -= Math.cos(this.radians(this.rotation)) * this.speed;
        this.velocityY -= Math.sin(this.radians(this.rotation)) * this.speed;
    }

    private strafeLeft(): void {
        this.velocityX += Math.cos(this.radians(this.rotation - 90)) * this.speed;
        this.velocityY += Math.sin(this.radians(this.rotation - 90)) * this.speed;
    }

    private strafeRight(): void {
        this.velocityX += Math.cos(this.radians(this.rotation + 90)) * this.speed;
        this.velocityY += Math.sin(this.radians(this.rotation + 90)) * this.speed;
    }

    rotate(degrees: number): void {
        // Update the entity's angle by adding the rotation degrees
        // Ensuring the angle stays within the range of 0 to 360
        this.rotation = (this.rotation + degrees) % 360;
        if (this.rotation < 0) {
            this.rotation += 360; // Correct negative angles
        }

        // Recalculate velocity based on the new angle
        // Convert angle to radians for Math functions
        const radians = this.rotation * Math.PI / 180;
        this.velocityX = Math.cos(radians) * this.speed;
        this.velocityY = Math.sin(radians) * this.speed;
    }

    private smoothRotation(desiredAngle: number): number {
        let desiredRotation = normalizeAngle(desiredAngle);
        let rotationDifference = desiredRotation - this.rotation;
        rotationDifference = (rotationDifference + 180) % 360 - 180;
        if (Math.abs(rotationDifference) < this.rotationSpeed) {
            this.rotation = desiredRotation; // Close enough, align exactly
        } else if (rotationDifference > 0) {
            this.rotateLeft(this.rotationSpeed); // Need to rotate counterclockwise
        } else {

            this.rotateRight(this.rotationSpeed); // Need to rotate clockwise
        }

        return desiredRotation;
    }

    private getRandomAngle(min: number, max: number): number {
        const angle = Math.random() * (max - min) + min;
        return Math.random() > 0.5 ? angle : -angle; // Randomly choose to rotate left or right
    }
    isRotating = false;
    private explore(): void {
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
        } else if (!this.isRotating) {
            // Normal movement allowed only if not currently rotating
            this.moveForward();
        }
        // this.moveForward();

        const foodInRange = this.getClosetFoodLocation();

        if (foodInRange && this.hunger.hungerLevel > 3) {
            // Food is in range and player is sufficiently hungry
            this.searchForFood(foodInRange);
        }// } else {
        //     if (Math.random() < 0.001) {
        //         const randomAngle = Math.random() * 360; // Choose a random angle
        //         this.rotation = randomAngle;
        //         let desiredRotation = normalizeAngle(randomAngle);
        //         this.smoothRotation(desiredRotation);
        //     }
        // }
    }

    public applyVelocity(): void {
        const nextX = this.location.x + this.velocityX;
        const nextY = this.location.y + this.velocityY;
        this.adjustPositionWithinBoundaries(nextX, nextY);

        // Optional: Apply friction or damping to gradually reduce velocity
        this.velocityX *= 0.2;
        this.velocityY *= 0.2;
    }

    private radians(degrees: number): number {
        return degrees * Math.PI / 180;
    }
    // #endregion

    // #region Hunger
    increaseHunger(): void {
        this.hunger.hungerLevel += this.hunger.hungerIncreaseRate;
        if (this.hunger.hungerLevel > this.hunger.maxHunger) {
            this.hunger.hungerLevel = this.hunger.maxHunger;
        }
        this.updateHungerDisplay();
    }

    playSound(soundFile: string): void {
        const audio = new Audio(soundFile);
        audio.play().catch(err => console.error("Error playing Eat Sound: ", err));
    }

    consumeFood(foodValue: number): void {
        this.hunger.hungerLevel -= foodValue;
        let eatSound = "";
        if (foodValue === Nutrition.poison) {
            if (!this.avoidPoison) {
                this.health -= 10;
                this.speed -= .25
                this.foodAmount -= 2;
                if (this.speed < .25) this.speed = .25;
                this.hasConsumedPoison = true;
                this.identifyPoisonChance += 0.05;
                this.identifyPoison();
                console.log(this.playerDisplayId, " is sick");
                eatSound = "./sounds/Ugg.mp3";
            } else {
                this.playSound("sounds/Nope.mp3");
            }
        } else if (foodValue === Nutrition.good) {
            this.speed += .25
            this.health += 15;
            this.foodAmount += 1;
            eatSound = "./sounds/Munch.mp3";
        } else if (foodValue === Nutrition.normal) {
            this.speed += .15
            this.health += 8;
            this.foodAmount += .5;
            eatSound = "./sounds/Munch.mp3";
        } else if (foodValue === Nutrition.low) {/* BLUE */
            this.speed += .05;
            this.health += 2;
            this.foodAmount += .25;
            eatSound = "./sounds/Munch.mp3";
        }
        this.playSound(eatSound);
        if (this.hunger.hungerLevel < 0) this.hunger.hungerLevel = 0;
        this.updateHungerDisplay();
        this.updateHealthDisplay();
    }

    identifyPoison(): void {
        if (this.identifyPoisonChance !== 100 && this.hasConsumedPoison) {
            if (Math.random() < this.identifyPoisonChance) {
                if (!this.canIdentifyPoison) {
                    this.canIdentifyPoison = true;
                    this.avoidPoison = true;
                    console.log("Can now Identify Poison");
                    this.playSound("sounds/AvoidPoison.mp3");
                }
            }
        }
    }
    searchForFood(food: Food | null): void {
        if (!food) {
            this.explore();
            return;
        }
        const dx = food.location.x - this.location.x;
        const dy = food.location.y - this.location.y;
        const distanceToFood = Math.sqrt(dx * dx + dy * dy);
        const angleToFood = Math.atan2(dy, dx) * (180 / Math.PI);
        let rotationDifference = this.smoothRotation(angleToFood);
        // Gradual deceleration as the player approaches the food
        const decelerationDistance = 10; // Distance within which to start slowing down
        if (distanceToFood < decelerationDistance) {
            const speedFactor = distanceToFood / decelerationDistance; // Slow down as it gets closer
            this.speed = Math.max(this.speed * speedFactor, .25); // Ensure there's a minimum speed
        }

        // Continue moving forward if already facing the food
        if (Math.abs(rotationDifference) < 10) { // 10 degrees tolerance
            this.moveForward(); // slight boost forward  like snatching food
        }
    }

    getClosetFoodLocation(): Food | null {
        if (this.game.food.length === 0) {
            return null;
        }

        let closestFood: Food | null = null;
        let closestDistance = Infinity;

        for (const food of this.game.food) {
            const dx = this.location.x - food.location.x;
            const dy = this.location.y - food.location.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.visionRadius && distance < closestDistance) {
                closestFood = food;
                closestDistance = distance;
            }
            if (closestFood?.nutritionalValue === Nutrition.poison && this.canIdentifyPoison) {
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

    private checkForFoodCollision(): void {
        this.game.food.forEach((food, index) => {
            if (Math.abs(this.location.x - food.location.x) < this.width &&
                Math.abs(this.location.y - food.location.y) < this.height) {
                if (!this.avoidPoison) {
                    this.consumeFood(food.nutritionalValue); // Assuming Food has a 'value' property indicating its nutritional value
                    this.game.removeFood(food.location); // Notify the game to remove the consumed food
                } else if (this.avoidPoison && food.nutritionalValue === Nutrition.poison) {
                    console.log("AVOIDED");
                } else {
                    this.consumeFood(food.nutritionalValue); // Assuming Food has a 'value' property indicating its nutritional value
                    this.game.removeFood(food.location); // Notify the game to remove the consumed food
                }
            }
        });
    }

    checkHungerLevel(): number {
        return this.hunger.hungerLevel;
    }

    // #endregion

    collisionAvoidance(player1: Player, player2: Player): void {
        const dx = player2.location.x - player1.location.x;
        const dy = player2.location.y - player1.location.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Ensure there's no division by zero
        if (distance == 0) return;

        const nx = dx / distance;
        const ny = dy / distance;

        // Apply a repulsion force by adjusting velocities
        const repulsionStrength = 2; // Adjust as needed
        player1.velocityX -= nx * repulsionStrength;
        player1.velocityY -= ny * repulsionStrength;
        player2.velocityX += nx * repulsionStrength;
        player2.velocityY += ny * repulsionStrength;

        // Determine the direction to rotate based on their relative position
        const rotationAdjustment = 10; // Adjust based on desired rotation speed

        // Assuming positive rotation is clockwise and negative is counterclockwise
        if (dx * player1.velocityY - dy * player1.velocityX > 0) {
            // Player 1 should rotate left (counterclockwise)
            player1.rotateLeft(rotationAdjustment);
        } else {
            // Player 1 should rotate right (clockwise)
            player1.rotateRight(rotationAdjustment);
        }

        if (dx * player2.velocityY - dy * player2.velocityX < 0) {
            // Player 2 should rotate left (counterclockwise)
            player2.rotateLeft(rotationAdjustment);
        } else {
            // Player 2 should rotate right (clockwise)
            player2.rotateRight(rotationAdjustment);
        }
    }

    getRandomRotation(): { angle: number, direction: 'left' | 'right' } {
        const minAngle = 1; // Minimum angle to ensure there's always some rotation
        const maxAngle = 10; // Maximum angle
        const angle = Math.random() * (maxAngle - minAngle) + minAngle;
        const direction = Math.random() > 0.5 ? 'left' : 'right'; // Randomly choose direction
        return { angle, direction };
    }
    
    adjustVelocityAndPositionOnCollision(): void {
        const collisionBuffer = 2;
        const minimumSpeed = 10; // Minimum speed after bouncing

        // Check for collision with left or right walls
        if (this.location.x <= 0 + collisionBuffer || this.location.x >= this.game.width - this.width - collisionBuffer) {
            // Reverse X velocity to simulate a bounce
            this.velocityX = -this.velocityX;

            // Ensure the entity moves with at least the minimum speed
            if (Math.abs(this.velocityX) < minimumSpeed) {
                this.velocityX = this.velocityX < 0 ? -minimumSpeed : minimumSpeed;
            }

            // Optional: Adjust location to prevent sticking to the wall
            if (this.location.x <= 0 + collisionBuffer) {
                this.location.x = 0 + collisionBuffer;
            } else {
                this.location.x = this.game.width - this.width - collisionBuffer;
            }
        }

        // Check for collision with top or bottom walls
        if (this.location.y <= 0 + collisionBuffer || this.location.y >= this.game.height - this.height - collisionBuffer) {
            // Reverse Y velocity to simulate a bounce
            this.velocityY = -this.velocityY;

            // Ensure the entity moves with at least the minimum speed
            if (Math.abs(this.velocityY) < minimumSpeed) {
                this.velocityY = this.velocityY < 0 ? -minimumSpeed : minimumSpeed;
            }

            // Optional: Adjust location to prevent sticking to the wall
            if (this.location.y <= 0 + collisionBuffer) {
                this.location.y = 0 + collisionBuffer;
            } else {
                this.location.y = this.game.height - this.height - collisionBuffer;
            }
        }
        // Note: Collision with other entities would require additional logic
    }

    moveToFood(foodX: number, foodY: number): void {
        // Calculate direction towards food
        let dx = foodX - this.location.x;
        let dy = foodY - this.location.y;
        let angleToFood = Math.atan2(dy, dx); // Radians

        // Update player's rotation to face the food
        this.rotation = angleToFood * 180 / Math.PI; // Convert to degrees

        // Move player towards the food, you might adjust speed or use a different method
        // This is a simplistic approach, consider adding smooth rotation and movement
        this.location.x += Math.cos(angleToFood) * this.speed;
        this.location.y += Math.sin(angleToFood) * this.speed;
    }

    getAge(): Age {
        return this.playerAge;
    }

    setAge(age: Age) {
        this.playerAge = age;
    }

    checkGrowth(): void {
        switch (this.playerAge) {
            case "Baby": {
                this.width = 10;
                this.height = 6;
                this.color = "rgb(255, 102, 178)";
                if (this.foodAmount >= 2 && this.getTimeAlive() >= (2 * 60)) {
                    this.playerAge = "Adalescence";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Adalescence": {
                this.width = 15;
                this.height = 11;
                this.color = "rgb(153, 0, 0)";
                if (this.foodAmount >= 6 && this.getTimeAlive() >= (12 * 60)) {
                    this.playerAge = "Adult";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Adult": {
                this.width = 20;
                this.height = 16;
                this.color = "rgb(51, 51, 255)";
                if (this.foodAmount >= 12 && this.getTimeAlive() >= (24 * 60)) {
                    this.playerAge = "Senior";
                    this.foodAmount = 0;
                }
                break;
            }
            case "Senior": {
                this.width = 18;
                this.height = 14;
                this.color = "rgb(96, 96, 96)";
            }
        }
    }

    getTimeAlive(): number {
        const now = new Date();
        const aliveTimeMs = now.getTime() - this.creationTime.getTime();
        return Math.floor(aliveTimeMs / 1000);
    }
}

export { Player };