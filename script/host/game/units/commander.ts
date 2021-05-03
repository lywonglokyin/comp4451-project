import {Commandable} from '../commandable.js';
import {Player} from '../player.js';


export class Commander extends Commandable {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;

    constructor(x: number, y: number, player: Player) {
        super(Commander.turningSpeed,
            Commander.maxSpeed,
            Commander.accel,
            Commander.decel,
            78, // Unit size
            12, // Unit weight
            600, // Unit hp
            10, // Unit attack
            player,
            5*60, // Attack cooldown 5 sec
        );
        this.x = x;
        this.y = y;
    }
}
