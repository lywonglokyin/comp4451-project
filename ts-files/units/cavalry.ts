import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';

declare let PIXI: typeof pixiNamespace;


export class Cavalry extends CommandableSprite {
    static turningSpeed: number = 0.02;
    static maxSpeed: number = 8;
    static accel: number = 0.1;
    static decel: number = 0.08;
    static readonly assetAddr: string = 'images/testunit3.png';

    constructor(x: number, y: number) {
        super(Cavalry.turningSpeed,
            Cavalry.maxSpeed,
            Cavalry.accel,
            Cavalry.decel,
            78,
            PIXI.Texture.from(Cavalry.assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
