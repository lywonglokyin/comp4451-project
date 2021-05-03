import {Commandable} from '../commandable.js';
import {Player} from '../player.js';
import {UnitTypes} from './unitTypes.js';

export class Cavalry extends Commandable {
    static turningSpeed: number = 0.02;
    static maxSpeed: number = 8;
    static accel: number = 0.1;
    static decel: number = 0.08;

    constructor(x: number, y: number, player: Player) {
        super(Cavalry.turningSpeed,
            Cavalry.maxSpeed,
            Cavalry.accel,
            Cavalry.decel,
            78, // Unit size
            10, // Unit weight
            100, // Unit hp
            30, // Unit attack
            player,
            5*60, // Attack cooldown 5 sec
            UnitTypes.Cavalry,
        );
        this.x = x;
        this.y = y;
    }
}
