import * as pixiNamespace from 'pixi.js';

import {CommandableSprite} from '../commandableSprite.js';

declare let PIXI: typeof pixiNamespace;


export class Infantry extends CommandableSprite {
    static turningSpeed: number = 0.03;
    static maxSpeed: number = 5;
    static accel: number = 0.03;
    static decel: number = 0.05;
    static readonly assetAddr: string = 'images/testunit2.png';

    constructor(x: number, y: number) {
        super(Infantry.turningSpeed,
            Infantry.maxSpeed,
            Infantry.accel,
            Infantry.decel,
            PIXI.Texture.from(Infantry.assetAddr));
        this.anchor.set(0.5);
        this.x = x;
        this.y = y;
    }
}
