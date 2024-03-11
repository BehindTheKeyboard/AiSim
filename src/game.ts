import { InputHandler } from "./input.js";
import { Player } from "./player.js";
import { Food } from "./food.js";
import { Location, Nutrition, isColliding } from "./tools.js";

class Game {
    width: number;
    height: number;
    players: Player[];
    input?: InputHandler;
    food: Food[];
    roundTime: number = 0;
    gameActive: boolean;
    timeRemaining: number;
    foodIntervalId: NodeJS.Timeout | null = null;
    gameOver: boolean = false;
    foodLifespan: number = 60000; //One minute

    constructor(width: number, height: number, roundTime: number) {
        this.roundTime = roundTime;
        this.gameActive = false;
        this.timeRemaining = this.roundTime;

        this.width = width;
        this.height = height;
        this.players = [];
        this.food = [];
        this.startFoodInterval();
    }


    initializeInputHandler(canvas: HTMLCanvasElement): void {
        this.input = new InputHandler(this, canvas);
    }

    startGame(): void {
        this.timeRemaining = this.roundTime;
        this.gameActive = true;
        // this.resetGame();
        this.updateTimer();
    }

    update(): void {
        this.players.forEach((player) => {
            if (player.isAlive) {
                player.update();
            } else {
                this.removePlayer(player);
            }
        })
        this.checkFood();
    }


    // updateTimer(): void {
    //     let lastTime = 0;

    //     const gameLoop = (timeStamp: number) => {
    //         if (!this.gameActive) return;


    //         const deltaTime = (timeStamp - lastTime) / 1000;
    //         this.timeRemaining -= deltaTime;

    //         // Calculate minutes and seconds from timeRemaining
    //         const minutes = Math.floor(this.timeRemaining / 60);
    //         const seconds = Math.floor(this.timeRemaining % 60);

    //         // Format the minutes and seconds to always show two digits
    //         const formattedMinutes = String(minutes).padStart(2, '0');
    //         const formattedSeconds = String(seconds).padStart(2, '0');

    //         // Update the timer display
    //         const timerElement = document.getElementById("timerDisplay");
    //         if (timerElement) {
    //             this.gameActive ? timerElement.textContent = `Time Remaining: ${formattedMinutes}:${formattedSeconds}` : timerElement.textContent = "Round Ended";
    //         }

    //         if (this.timeRemaining <= 0) {
    //             this.timeRemaining = 0; // Ensure time doesn't go negative
    //             this.endRound();
    //             // Optionally, immediately update the display here as well
    //             const timerElement = document.getElementById("timerDisplay");
    //             if (timerElement) {
    //                 timerElement.textContent = "Round Ended";
    //             }
    //         } else {
    //             lastTime = timeStamp;
    //             requestAnimationFrame(gameLoop);
    //         }
    //     };
    //     if (this.gameActive) {
    //         requestAnimationFrame(gameLoop);
    //     }
    // }
    updateTimer(): void {
        let lastTime = 0;
        let elapsedTime = 0; // Initialize elapsed time

        const gameLoop = (timeStamp: number) => {
            if (!this.gameActive) return;

            if (lastTime !== 0) { // Skip the first frame to avoid large deltaTime
                const deltaTime = (timeStamp - lastTime) / 1000;
                elapsedTime += deltaTime; // Increment elapsed time
            }

            // Calculate minutes and seconds from elapsedTime
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = Math.floor(elapsedTime % 60);

            // Format the minutes and seconds to always show two digits
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');

            // Update the timer display
            const timerElement = document.getElementById("timerDisplay");
            if (timerElement) {
                timerElement.textContent = `Time Elapsed: ${formattedMinutes}:${formattedSeconds}`;
            }

            lastTime = timeStamp; // Update lastTime for the next frame
            requestAnimationFrame(gameLoop);
        };
        if (this.gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }


    endRound(): void {
        this.gameActive = false; // Stop game activities
        console.log("Round ended!");

        // Cancel the food addition interval to prevent more food from being added
        if (this.foodIntervalId) {
            clearInterval(this.foodIntervalId);
            this.foodIntervalId = null;
        }

        // Reset game state for a new round or show end-of-round information
        // Optionally, you could call startGame() after a delay or based on user input
    }

    addFood(amount: number): void {
        let nutritionalValue = 0;
        for (let i = 0; i < amount; i++) {
            const rand = Math.random();
            if (rand < 0.70) {
                nutritionalValue = Nutrition.low;
            } else if (rand < 0.85) {
                nutritionalValue = Nutrition.normal;
            } else if (rand < 0.95) {
                nutritionalValue = Nutrition.good;
            } else {
                nutritionalValue = Nutrition.poison;
            }
            const food = new Food(this, nutritionalValue);
            this.food.push(food);
        }
    }

    checkFood(): void {
        if (this.food.length <= 0) this.addFood(4);
    }

    addPlayers(count: number): void {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            // Example of creating a unique hungerDisplayId for each player
            const parentDisplayId = 'players-display'; // The ID of the parent container for hunger displays
            const newPlayer = new Player(this, parentDisplayId, x, y);
            this.players.push(newPlayer);
        }
        const parentDisplayId = 'players-display';
        const newPlayer = new Player(this, parentDisplayId, this.width / 2, this.height / 2);
        this.players.push(newPlayer);
    }

    removePlayer(player: Player): void {
        this.players = this.players.filter(p => p !== player);
        if (this.players.length === 0) {
            this.gameOver = true;
        }
    }

    removeFood(location: Location): void {
        this.food = this.food.filter(food =>
            food.location.x !== location.x ||
            food.location.y !== location.y);
    }


    draw(context: CanvasRenderingContext2D): void {
        this.players.forEach((player) => {
            if (player.isAlive) {
                player.draw(context);
            }
        })
        for (const food of this.food) {
            food.draw(context);
        }

        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) { // Start j from i + 1 to avoid duplicate checks and self-collision
                if (isColliding(this.players[i], this.players[j])) {
                    // Call the collision avoidance method
                    this.players[i].collisionAvoidance(this.players[i], this.players[j]);
                }
            }
        }
    }

    startFoodInterval(): void {
        this.foodIntervalId = setInterval(() => {
            if (!this.gameActive) return; // Check if game is active before adding food
            this.addFood(3);
        }, 5000);

        // Start a new interval to gradually remove old food
        const foodRemovalInterval = 1000; // Check every second for old food to remove
        setInterval(() => {
            if (!this.gameActive) return;
            this.removeExpiredFood();
        }, foodRemovalInterval);
    }

    removeExpiredFood(): void {
        const now = Date.now();
        // Assuming your food array is sorted by creation time, check the first item
        if (this.food.length > 0 && now - this.food[0].creationTime >= this.foodLifespan) {
            this.food.shift(); // Remove the first (oldest) food item
        }
    }


    handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
        const rect = canvas.getBoundingClientRect(); // Gets the canvas position relative to the viewport
        const scaleX = canvas.width / rect.width; // Relationship bitmap vs. element for X
        const scaleY = canvas.height / rect.height; // Relationship bitmap vs. element for Y

        // Calculate the mouse position on the canvas
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        let hoveredPlayer: Player | null = null;

        // Loop through all players to check if the mouse is over one
        for (let player of this.players) {
            if (mouseX >= player.location.x && mouseX <= player.location.x + player.width &&
                mouseY >= player.location.y && mouseY <= player.location.y + player.height) {
                hoveredPlayer = player;
                break; // Exit the loop once a hovered player is found
            }
        }

        if (hoveredPlayer) {
            this.showPlayerInfo(hoveredPlayer);
        } else {
            setTimeout(() => {
                this.hidePlayerInfo();
            }, 10000)
        }
    }

    showPlayerInfo(player: Player): void {
        let infoDisplay = document.getElementById('hovered-player-info');
        if (!infoDisplay) {
            console.error('Hovered player info display element not found');
            return;
        }
        // Assuming player.hunger has a property 'value' you want to display
        const timeAlive = player.getTimeAlive();
        infoDisplay.style.display = 'block';
        infoDisplay.innerHTML = `Name: ${player.playerDisplayId}` +
            `<br>Health: ${player.health}` +
            `<br>Hunger: ${player.hunger.hungerLevel}` +
            `<br>Can ID Poison: ${player.canIdentifyPoison}` +
            `<br> Age: ${player.playerAge}` +
            `<br> Time Alive: ${this.formatTime(timeAlive)}` +
            `<br> LocX: ${player.location.x} LocY: ${player.location.y}`
    }
    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }



    hidePlayerInfo(): void {
        let infoDisplay = document.getElementById('hovered-player-info');
        if (infoDisplay) {
            infoDisplay.style.display = 'none';
        }
    }
}


export { Game };