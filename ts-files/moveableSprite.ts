import * as pixi_namespace from 'pixi.js'
import { Texture } from 'pixi.js';

declare var PIXI: typeof pixi_namespace;

export class MovableSprite extends PIXI.Sprite{
    turningSpeed: number = 0.1;
    speed: number = 0;
    maxSpeed: number = 5;
    accel: number = 0.01;
    decel: number = 0.05;

    constructor(texture?: Texture){
        super(texture);
    }

    public turnLeft: ()=>void = ()=>{
        this.rotation -= this.turningSpeed;
        if (this.speed > this.maxSpeed*0.6){
            this.speed*= 0.95;
        }
    };
    public turnRight: ()=>void = ()=>{
        this.rotation += this.turningSpeed;
        if (this.speed > this.maxSpeed*0.6){
            this.speed*= 0.95;
        }
    }

    public move: ()=>void = ()=>{
        this.x += Math.sin(this.rotation) * Math.max(0, this.speed-0.3);
        this.y -= Math.cos(this.rotation) * Math.max(0, this.speed-0.3);
    }

    public incSpeed: ()=>void = ()=>{
        this.speed += this.accel;
        if (this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
    }
    public decSpeed: ()=>void = ()=>{
        this.speed -= this.decel;
        if (this.speed < 0){
            this.speed = 0;
        }
    }
}
