import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';

declare let PIXI: typeof pixiNamespace;


export class Commander extends CommandableSprite {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;
    static readonly assetAddr: string = 'images/testunit.png';

    constructor(x: number, y: number) {
        super(Commander.turningSpeed,
            Commander.maxSpeed,
            Commander.accel,
            Commander.decel,
            PIXI.Texture.from(Commander.assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
