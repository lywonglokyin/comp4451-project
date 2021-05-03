import {CollisionHandler} from './collision.js';
import {Cavalry} from './units/cavalry.js';
import {Commander} from './units/commander.js';
import {Infantry} from './units/infantry.js';
import {UnitTypes} from './units/unitTypes.js';
import {Player} from './player.js';
import {angleToAnother, euclideanDist, fmod} from '../../utils.js';
import {Commandable} from './commandable.js';
import {Movable} from './movable.js';
import {Server, Socket} from 'socket.io';
import {io} from 'socket.io-client';


export interface UnitPosInfo{
    x: number;
    y: number;
    rotation: number;
}

export class Game {
    private state: string = 'play';

    gameWidth: number;
    gameHeight: number;

    private gameLeftBound: number;
    private gameUpBound: number;
    private gameRightBound: number;
    private gameDownBound: number;
    private readonly gameBoundPadding: number = 40;

    private playerOneUnits: Commandable[] = [];
    private playerTwoUnits: Commandable[] = [];
    everyUnits: {[key: number]:Commandable} = {};

    private collisionHandler: CollisionHandler; // Handles collision.

    private selectedSprites: Commandable[] = []; // This array should remain sorted according to x position.
    private selectedSpritesSet: Set<Commandable> = new Set();
    private selectedSpritesAnchorX: number = 0;
    private selectedSpritesAnchorY: number = 0;

    private server: Server;
    private gameID: string;

    constructor(width: number, height: number, server: Server, gameID: number) {
        this.gameWidth = width;
        this.gameHeight = height;

        this.collisionHandler = new CollisionHandler(this, 100);

        this.gameLeftBound = this.gameBoundPadding;
        this.gameUpBound = this.gameBoundPadding;
        this.gameRightBound = width - this.gameBoundPadding;
        this.gameDownBound = height - this.gameBoundPadding;

        this.server = server;
        this.gameID = gameID.toString();
    }

    public addUnit(x: number, y: number,
        unitType: UnitTypes, player: Player = Player.One): Commandable {
        let unit: Commandable;
        if (unitType == UnitTypes.Commander) {
            unit = new Commander(x, y, player);
            unit.ai = false;
        } else if (unitType == UnitTypes.Infantry) {
            unit = new Infantry(x, y, player);
        } else if (unitType == UnitTypes.Cavalry) {
            unit = new Cavalry(x, y, player);
        } else {
            throw new Error('Unexpected unit type!');
        }

        if (player==0) {
            this.playerOneUnits.push(unit);
        } else {
            this.playerTwoUnits.push(unit);
            unit.rotation = Math.PI;
        }
        this.everyUnits[unit.id] = unit;
        this.collisionHandler.addUnit(unit);

        this.server.to(this.gameID).emit('addUnit', unit.id, unitType, player);

        return unit;
    }

    public applyDamage(unit: Movable, direction: number, impulse: number, damage: number): void {
        unit.applyDamage(direction, impulse, damage);
    }

    public isHealthy(unit: Movable): boolean {
        return unit.hp >= 0;
    }

    public destroyUnit(unit: Movable): void {
        if (unit.type === UnitTypes.Commander) {
            if (unit.player === Player.One) {
                this.server.to(this.gameID).emit('gameWon', Player.Two);
            } else {
                this.server.to(this.gameID).emit('gameWon', Player.One);
            }
        }

        let unitList: Movable[] = [];
        if (unit.player === Player.One) {
            unitList = this.playerOneUnits;
        } else if (unit.player === Player.Two) {
            unitList = this.playerTwoUnits;
        }
        let unitIndex = unitList.indexOf(unit, 0);
        unitList.splice(unitIndex, 1);
        unitIndex = this.collisionHandler.units.indexOf(unit, 0);
        this.collisionHandler.units.splice(unitIndex, 1);
        for (let i=0; i<this.selectedSprites.length; ++i) {
            if (unit === this.selectedSprites[i]) {
                this.selectedSprites.splice(i, 1);
                break;
            }
        }
        this.server.to(this.gameID).emit('destroyUnit', unit.id);
    }

    private checkBoundAndEnforce(unit: Commandable) {
        if (unit.x < this.gameLeftBound) {
            unit.x = this.gameLeftBound;
        } else if (unit.x > this.gameRightBound) {
            unit.x = this.gameRightBound;
        }
        if (unit.y < this.gameUpBound) {
            unit.y = this.gameUpBound;
        } else if (unit.y > this.gameDownBound) {
            unit.y = this.gameDownBound;
        }
    }

    gameLoop = ()=> {
        this.playerOneUnits.concat(this.playerTwoUnits).forEach((unit)=>{
            unit.act();
            this.checkBoundAndEnforce(unit);
        });
        this.collisionHandler.detectCollisions();
        // Units health check.
        this.playerOneUnits.concat(this.playerTwoUnits).forEach((unit)=>{
            if (!this.isHealthy(unit)) {
                this.destroyUnit(unit);
            }
        });
        // Check bound after collision
        this.playerOneUnits.concat(this.playerTwoUnits).forEach((unit)=>{
            this.checkBoundAndEnforce(unit);
        });

        const posBulk: {[key: number]: UnitPosInfo}= {};
        this.playerOneUnits.concat(this.playerTwoUnits).forEach((unit)=>{
            const unitBulk: UnitPosInfo = {
                'x': unit.x,
                'y': unit.y,
                'rotation': unit.rotation,
            };
            posBulk[unit.id] = unitBulk;
        });
        this.server.to(this.gameID).emit('updatePos', posBulk);
    }


    public collide(unit: Movable, another: Movable) {
        // Include actions to handle after collision occured
        const distance = euclideanDist(unit.x, unit.y, another.x, another.y);
        if (unit.player === another.player) {
            unit.limitSpeed();
            another.limitSpeed();
            const xDisplacement = (unit.x - another.x) / distance / 10;
            const yDisplacement = (unit.y - another.y) / distance / 10;
            unit.x += xDisplacement;
            unit.y += yDisplacement;
            another.x -= xDisplacement;
            another.y -= yDisplacement;
        } else {
            const direction = angleToAnother(unit.x, unit.y, another.x, another.y);
            unit.hasEnemy(direction);
            another.hasEnemy(direction+Math.PI);
            if (unit.canAttack()) {
                const angleAlignment = Math.cos(direction - unit.rotation);
                if (angleAlignment > 0) {
                    const impulse = angleAlignment * unit.weight * unit.speed;
                    const damage = this.calcDamage(unit.attackStat, unit.speed);
                    another.applyDamage(direction, impulse, damage);
                    this.server.to(this.gameID).emit('applyDamage', another.id);
                    unit.attack();
                }
            }
            if (another.canAttack()) {
                const angleAlignment = Math.cos((direction+Math.PI) - another.rotation);
                if (angleAlignment>0) {
                    const impulse = angleAlignment * another.weight * another.speed;
                    const damage = this.calcDamage(another.attackStat, another.speed);
                    unit.applyDamage(direction + Math.PI, impulse, damage);
                    this.server.to(this.gameID).emit('applyDamage', unit.id);
                    another.attack();
                }
            }

            const xDiff = - (unit.x - another.x) -
            Math.sin(direction) * (unit.unitSize + another.unitSize)/2;
            const yDiff = - (unit.y - another.y) +
            Math.cos(direction) * (unit.unitSize + another.unitSize)/2;
            const unitWeightProp = unit.weight / (unit.weight + another.weight);
            unit.x += xDiff * (1-unitWeightProp);
            unit.y += yDiff * (1-unitWeightProp);
            another.x -= xDiff * unitWeightProp;
            another.y -= yDiff * unitWeightProp;
        }
    }

    private calcDamage(attackStat: number, unitSpeed: number): number {
        const speedAttenuation = unitSpeed<2 ? 1 : (unitSpeed**2 / 30 +1);
        return attackStat * speedAttenuation;
    }

    public updateTargetPos(id: number, targetX: number, targetY:number, targetDirection:number) {
        const unit: Commandable = this.everyUnits[id];
        unit.targetX = targetX;
        unit.targetY = targetY;
        unit.targetDirection = targetDirection;
        unit.hasTarget = true;
        unit.needAlign = true;
    }
}
