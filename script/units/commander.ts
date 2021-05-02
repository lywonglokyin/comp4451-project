import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';
import {Player} from '../player.js';

declare let PIXI: typeof pixiNamespace;


export class Commander extends CommandableSprite {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;
    static readonly assetAddr: string = 'images/testunit.png';

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
            PIXI.Texture.from(Commander.assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
