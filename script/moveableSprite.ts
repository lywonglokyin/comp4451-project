import * as pixiNamespace from 'pixi.js';
import {Texture} from 'pixi.js';
import {Player} from './player.js';

declare let PIXI: typeof pixiNamespace;

export class MovableSprite extends PIXI.Sprite {
    turningSpeed: number;
    speed: number = 0;
    maxSpeed: number;
    accel: number;
    decel: number;

    weight: number; // Weight of the unit, affect the movement after collision.
    private needShift: boolean = false; // If true, the unit would be shifted due to being attacked.
    private static readonly SHIFT_COUNTER_MAX = 60; // Countdown from the shift animation. Default to be 60 ticks (1sec)
    private shiftCounter: number = MovableSprite.SHIFT_COUNTER_MAX; // A countdown for the shift animation.
    private shiftX: number = 0; // The shift in X for each tick.
    private shiftY: number = 0; // The shift in Y for ecah tick.

    hp: number;
    attackStat: number;
    private attackCooldown: number = 0;
    private readonly MAX_ATTACK_COOLDOWN: number;

    player: Player;

    unitSize: number; // For now, it is assumed diameter of circle, this is used for collsion detection only

    constructor(turningSpeed: number, maxSpeed: number, accel: number, decel: number,
        unitSize: number, weight: number, hp: number, attack: number, player: Player,
        attackCooldown: number, texture?: Texture) {
        super(texture);
        this.turningSpeed = turningSpeed;
        this.maxSpeed = maxSpeed;
        this.accel = accel;
        this.decel = decel;
        this.unitSize = unitSize;
        this.weight = weight;

        this.hp = hp;
        this.attackStat = attack;
        this.MAX_ATTACK_COOLDOWN = attackCooldown;

        this.player = player;
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
        if (this.needShift) {
            this.shift();
        }
        if (this.attackCooldown > 0) {
            --this.attackCooldown;
        }
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

    public canAttack() {
        return this.attackCooldown == 0;
    }

    public attack(): void {
        this.attackCooldown = this.MAX_ATTACK_COOLDOWN;
    }

    public applyDamage(direction: number, impulse: number, damage: number): void {
        this.hp -= damage;
        this.speed = Math.min(this.speed, Math.max(this.speed*0.5, this.maxSpeed*0.2));
        this.shiftX = Math.sin(direction)* impulse / this.weight;
        this.shiftY = -Math.cos(direction) * impulse / this.weight;
        this.needShift = true;
    }

    private shift(): void {
        if (this.shiftCounter == 0) {
            this.needShift = false;
            this.shiftCounter = MovableSprite.SHIFT_COUNTER_MAX;
            return;
        }
        this.x += this.shiftX;
        if (this.shiftX <= 10 && this.shiftX >= -10) {
            this.shiftX = 0;
        } else {
            this.shiftX += this.shiftX > 0 ? -10 : 10;
        }
        this.y += this.shiftY;
        if (this.shiftY <= 10 && this.shiftY >= -10) {
            this.shiftY = 0;
        } else {
            this.shiftY += this.shiftY > 0 ? -10 : 10;
        }
        --this.shiftCounter;
    }
}
