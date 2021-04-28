import {Sprite, Texture} from 'pixi.js';
import {MovableSprite} from './moveableSprite.js';
import {angleToAnother, fmod} from './utils.js';

export class CommandableSprite extends MovableSprite {
    hasTarget: boolean = false;
    needAlign: boolean = false; // True when this sprite need direction adjustment at its final position.
    targetX: number = 0;
    targetY: number = 0;
    targetDirection: number = 0; // Which direction the spirte should face at the final position.
    private targetSprite: Sprite|null = null;
    safeDistance: number; // The distance from which the object need to decel

    readonly DIRECTION_TORLERANCE: number = 0.05;

    constructor(turningSpeed: number, maxSpeed: number, accel: number, decel: number,
        unitSize:number, texture?: Texture) {
        super(turningSpeed, maxSpeed, accel, decel, unitSize, texture);
        this.safeDistance = this.maxSpeed**2 / 2 / this.decel;
    }

    public move() {
        if (this.hasTarget) {
            const directionDiff = this.alignDirection(this.directionToTarget());
            this.adjustSpeed(directionDiff);
        } else if (this.needAlign) {
            const directionDiff = this.alignDirection(this.targetDirection);
            if (directionDiff < this.DIRECTION_TORLERANCE) {
                this.needAlign = false;
            }
        }
        super.move();
    }


    private alignDirection: (directoin: number)=>number = (targetDirection: number)=>{
        targetDirection = fmod(targetDirection, 2*Math.PI);
        const myDirection = fmod(this.rotation, 2 * Math.PI);
        const directionDiff = Math.abs(targetDirection-myDirection);
        if (directionDiff < this.DIRECTION_TORLERANCE ) {
        // Same direction
            return directionDiff;
        }
        if (myDirection < targetDirection) {
            if (targetDirection < (myDirection + Math.PI)) {
                this.turnRight();
            } else {
                this.turnLeft();
            }
        } else {
            if (targetDirection > (myDirection - Math.PI)) {
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
            if (this.targetSprite !== null) {
                this.targetSprite.destroy();
                this.targetSprite = null;
            }
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
        return angleToAnother(this.x, this.y, this.targetX, this.targetY);
    }

    public setTargetSprite(sprite: Sprite): void {
        if (this.targetSprite !== null) {
            this.targetSprite.destroy();
        }
        this.targetSprite = sprite;
    }

    public getTargetSprite(): Sprite {
        if (this.targetSprite === null) {
            throw Error('Target sprite not found for this object!');
        }
        return this.targetSprite;
    }

    public updateShadowSprite() {
        if (this.targetSprite !== null) {
            this.targetSprite.x = this.targetX;
            this.targetSprite.y = this.targetY;
            this.targetSprite.rotation = this.targetDirection;
        }
    }
}
