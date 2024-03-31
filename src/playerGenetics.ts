import { Hunger, PlayerData, Telemetry } from "./tools";

class PlayerGenetics {
    telemetryGene: Telemetry;
    playerDataGene: PlayerData;
    hungerGene: Hunger;

    constructor() {
        this.telemetryGene = {
            maxSpeed: 0,
            speed: 0,
            velocity: {
                velocityX: 0,
                velocityY: 0,
            },
            location: {
                x: 0,
                y: 0,
            },
        }

        this.playerDataGene = {
            age: "Baby",
            color: "rgb(153, 0, 0)", // make this more random
            height: 10,
            width: 6,
            
            playerDisplayId: "" //gets set later
        }

        this.hungerGene = {
            hungerIncreaseRate: .25,
            hungerLevel: 0,
            maxHunger: 10,
        }
    }
}

export {PlayerGenetics}