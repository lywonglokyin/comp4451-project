import {Movable} from './movable.js';
import {Player} from './player.js';
import {angleToAnother, fmod} from '../../utils.js';

export class Commandable extends Movable {
    hasTarget: boolean = false;
    needAlign: boolean = false; // True when this sprite need direction adjustment at its final position.
    targetX: number = 0;
    targetY: number = 0;
    targetDirection: number = 0; // Which direction the spirte should face at the final position.
    safeDistance: number; // The distance from which the object need to decel

    readonly DIRECTION_TORLERANCE: number = 0.05;

    ai: boolean = true;

    constructor(turningSpeed: number, maxSpeed: number, accel: number, decel: number,
        unitSize:number, weight: number, hp: number, attack: number, player: Player,
        attackCooldown: number) {
        super(turningSpeed, maxSpeed, accel, decel, unitSize, weight, hp, attack, player, attackCooldown);
        this.safeDistance = this.maxSpeed**2 / 2 / this.decel;
    }

    public move() {
        if (this.ai) {
            if (this.hasTarget) {
                const directionDiff = this.alignDirection(this.directionToTarget());
                this.adjustSpeed(directionDiff);
            } else if (this.needAlign) {
                const directionDiff = this.alignDirection(this.targetDirection);
                if (directionDiff < this.DIRECTION_TORLERANCE) {
                    this.needAlign = false;
                }
            } else if (this.hasHostile) {
                this.alignDirection(this.hostileDirection);
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
}
