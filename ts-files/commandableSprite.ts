import { Texture } from "pixi.js";
import { MovableSprite } from "./moveableSprite.js";
import { fmod } from "./utils.js";

export class CommandableSprite extends MovableSprite{

    hasTarget: boolean = false;
    targetX: number = 0;
    targetY: number = 0;
    safe_distance: number;  // The distance from which the object need to decel

    constructor(texture?: Texture){
        super(texture);
        this.safe_distance = this.maxSpeed**2 / 2 / this.decel;
    }

    public move(){
        if (this.hasTarget){
            let direction_diff = this.align_direction();
            this.adjustSpeed(direction_diff);
        }
        super.move();
    }

    private align_direction: ()=>number = ()=>{
        let directionToTarget = fmod(this.directionToTarget(), 2*Math.PI);
        let myDirection = fmod(this.rotation, 2 * Math.PI);
        let direction_diff = Math.abs(directionToTarget-myDirection);
        let directionTolerance: number = 0.05;
        if (direction_diff < directionTolerance){
            // Same direction
            return direction_diff;
        }
        if (myDirection < directionToTarget){
            if (directionToTarget < (myDirection + Math.PI)){
                this.turnRight();
            } else {
                this.turnLeft();
            }
        } else {
            if (directionToTarget > (myDirection - Math.PI)){
                this.turnLeft();
            } else {
                this.turnRight();
            }
        }
        return direction_diff;
    }

    private adjustSpeed: (d: number)=>void = (direction_diff: number)=>{
        // adjust sprite speed based on distance to target.
        let targetDistance = this.distanceToTarget();
        let distance_tolerance = 4;
        if (targetDistance < distance_tolerance){
            this.speed = 0;
            this.hasTarget = false;
            return;
        }
        if (direction_diff > (Math.PI / 2)){
            this.decSpeed();
            return;
        }
        if (targetDistance < this.safe_distance){
            let required_decel = this.speed ** 2 / 2 / targetDistance;
            if (required_decel < this.decel){
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
        return Math.atan2((this.targetY-this.y), (this.targetX-this.x)) + Math.PI / 2;
    }
}