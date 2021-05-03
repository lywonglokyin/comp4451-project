import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';
import {Player} from '../host/game/player.js';
import {UnitTypes} from '../host/game/units/unitTypes.js';

declare let PIXI: typeof pixiNamespace;


export class Cavalry extends CommandableSprite {
    static turningSpeed: number = 0.02;
    static maxSpeed: number = 8;
    static accel: number = 0.1;
    static decel: number = 0.08;
    static readonly playerOneassetAddr: string = 'images/testunit3.png';
    static readonly playerTwoassetAddr: string = 'images/cav2.png';

    constructor(x: number, y: number, player: Player, id: number) {
        let assetAddr: string;
        if (player == Player.One) {
            assetAddr = Cavalry.playerOneassetAddr;
        } else {
            assetAddr = Cavalry.playerTwoassetAddr;
        }
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
            id,
            UnitTypes.Cavalry,
            PIXI.Texture.from(assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
