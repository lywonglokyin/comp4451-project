import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';
import {Player} from '../host/game/player.js';

declare let PIXI: typeof pixiNamespace;


export class Commander extends CommandableSprite {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;
    static readonly playerOneassetAddr: string = 'images/commander1.png';
    static readonly playerTwoassetAddr: string = 'images/commander2.png';

    constructor(x: number, y: number, player: Player, id: number) {
        let assetAddr: string;
        if (player == Player.One) {
            assetAddr = Commander.playerOneassetAddr;
        } else {
            assetAddr = Commander.playerTwoassetAddr;
        }
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
            id,
            PIXI.Texture.from(assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
