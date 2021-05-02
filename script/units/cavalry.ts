import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';
import {Player} from '../player.js';

declare let PIXI: typeof pixiNamespace;


export class Cavalry extends CommandableSprite {
    static turningSpeed: number = 0.02;
    static maxSpeed: number = 8;
    static accel: number = 0.1;
    static decel: number = 0.08;
    static readonly assetAddr: string = 'images/testunit3.png';

    constructor(x: number, y: number, player: Player) {
        super(Cavalry.turningSpeed,
            Cavalry.maxSpeed,
            Cavalry.accel,
            Cavalry.decel,
            78, // Unit size
            10, // Unit weight
            500, // Unit hp
            10, // Unit attack
            player,
            5*60, // Attack cooldown 5 sec
            PIXI.Texture.from(Cavalry.assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
