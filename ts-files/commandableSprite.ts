import {Texture} from 'pixi.js';
import {MovableSprite} from './moveableSprite.js';
import {fmod} from './utils.js';

export class CommandableSprite extends MovableSprite {
    hasTarget: boolean = false;
    targetX: number = 0;
    targetY: number = 0;
    safeDistance: number; // The distance from which the object need to decel

    constructor(turningSpeed: number, maxSpeed: number, accel: number, decel: number,
        unitSize:number, texture?: Texture) {
        super(turningSpeed, maxSpeed, accel, decel, unitSize, texture);
        this.safeDistance = this.maxSpeed**2 / 2 / this.decel;
    }

    public move() {
        if (this.hasTarget) {
            const directionDiff = this.alignDirection();
            this.adjustSpeed(directionDiff);
        }
        super.move();
    }

    private alignDirection: ()=>number = ()=>{
        const directionToTarget = fmod(this.directionToTarget(), 2*Math.PI);
        const myDirection = fmod(this.rotation, 2 * Math.PI);
        const directionDiff = Math.abs(directionToTarget-myDirection);
        const directionTolerance: number = 0.05;
        if (directionDiff < directionTolerance ) {
        // Same direction
            return directionDiff;
        }
        if (myDirection < directionToTarget) {
            if (directionToTarget < (myDirection + Math.PI)) {
                this.turnRight();
            } else {
                this.turnLeft();
            }
        } else {
            if (directionToTarget > (myDirection - Math.PI)) {
                this.turnLeft();
            } else {
                this.turnRight();
            }
        }
        return directionDiff;
    }

    private adjustSpeed: (d: number)=>void = (directionDiff: number)=>{
        // adjust sprite speed based on distance to target.
        const targetDistance = this.distanceToTarget();
        const distanceTolerance = 4;
        if (targetDistance < distanceTolerance) {
            this.speed = 0;
            this.hasTarget = false;
            return;
        }
        if (directionDiff > (Math.PI / 2)) {
            this.decSpeed();
            return;
        }
        if ((directionDiff > (Math.PI / 45)) && (targetDistance < 5000*this.accel)) {
            // If very near, move only when angle < 4 degree.
            this.decSpeed();
            return;
        }
        if (targetDistance < this.safeDistance) {
            const requiredDecel = this.speed ** 2 / 2 / targetDistance;
            if (requiredDecel < this.decel) {
                this.incSpeed();
            } else {
                this.decSpeed();
            }
        } else {
            this.incSpeed();
        }
    }

    private distanceToTarget: ()=>number = ()=>{
        return Math.sqrt((this.targetX - this.x)**2 + (this.targetY - this.y)**2);
    }

    public directionToTarget: ()=>number = ()=>{
        return Math.atan2(
            (this.targetY-this.y),
            (this.targetX-this.x)) + Math.PI / 2;
    }
}
