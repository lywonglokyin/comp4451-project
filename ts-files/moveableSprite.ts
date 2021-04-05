import { Sprite } from "pixi.js";

export interface movableSprite extends Sprite{
    direction?: number;
    turningSpeed?: number;
    speed?: number;
}
