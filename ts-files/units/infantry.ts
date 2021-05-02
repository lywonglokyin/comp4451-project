import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';
import {Player} from '../player.js';

declare let PIXI: typeof pixiNamespace;


export class Infantry extends CommandableSprite {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;
    static readonly playerOneassetAddr: string = 'images/testunit2.png';
    static readonly playerTwoassetAddr: string = 'images/testunit5.png';

    constructor(x: number, y: number, player: Player) {
        let assetAddr: string;
        if (player == Player.One) {
            assetAddr = Infantry.playerOneassetAddr;
        } else {
            assetAddr = Infantry.playerTwoassetAddr;
        }
        super(Infantry.turningSpeed,
            Infantry.maxSpeed,
            Infantry.accel,
            Infantry.decel,
            78, // Unit size
            1, // Unit weight
            100, // Unit hp
            10, // Unit attack
            player,
            5*60, // Attack cooldown 5 sec
            PIXI.Texture.from(assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
        if (player == Player.Two) {
            this.rotation = Math.PI;
        }
    }
}
