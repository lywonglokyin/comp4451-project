import * as pixiNamespace from 'pixi.js';
import {Texture} from 'pixi.js';

declare let PIXI: typeof pixiNamespace;

export class MovableSprite extends PIXI.Sprite {
    turningSpeed: number;
    speed: number = 0;
    maxSpeed: number;
    accel: number;
    decel: number;

    unitSize: number; // For now, it is assumed diameter of circle, this is used for collsion detection only

    constructor(turningSpeed: number, maxSpeed: number, accel: number, decel: number,
        unitSize: number, texture?: Texture) {
        super(texture);
        this.turningSpeed = turningSpeed;
        this.maxSpeed = maxSpeed;
        this.accel = accel;
        this.decel = decel;
        this.unitSize = unitSize;
    }

    public turnLeft: ()=>void = ()=>{
        this.rotation -= this.turningSpeed;
        if (this.speed > this.maxSpeed*0.4) {
            this.speed*= 0.99;
        }
    };
    public turnRight: ()=>void = ()=>{
        this.rotation += this.turningSpeed;
        if (this.speed > this.maxSpeed*0.4) {
            this.speed*= 0.99;
        }
    }

    move() {
        if (this.speed < 0.3) {
            return;
        }
        this.x += Math.sin(this.rotation) * Math.max(0, this.speed-0.3);
        this.y -= Math.cos(this.rotation) * Math.max(0, this.speed-0.3);
    }

    act() {
        this.move();
    }

    public incSpeed: ()=>void = ()=>{
        this.speed += this.accel;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
    }
    public decSpeed: ()=>void = ()=>{
        this.speed -= this.decel;
        if (this.speed < 0) {
            this.speed = 0;
        }
    }

    public limitSpeed() {
        if (this.speed > (this.maxSpeed * 0.5)) {
            this.speed *= 0.8;
        }
    }
}
