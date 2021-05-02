import * as pixiNamespace from 'pixi.js';
import {Application, Container, Point, Sprite, Ticker, TilingSprite} from 'pixi.js';
import {CollisionHandler} from './collision.js';
import {CommandableSprite} from './commandableSprite.js';
import {Interaction} from './interactive.js';
import {MovableSprite} from './moveableSprite.js';
import {Cavalry} from './units/cavalry.js';
import {Commander} from './units/commander.js';
import {Infantry} from './units/infantry.js';
import {UnitTypes} from './units/unitTypes.js';
import {Player} from './player.js';
import {angleToAnother, euclideanDist, fmod} from './utils.js';

declare let PIXI: typeof pixiNamespace;

export class Game {
    private state: string = 'play';
    private gameContainer: Container = new PIXI.Container();

    gameWidth: number;
    gameHeight: number;

    private gameLeftBound: number;
    private gameUpBound: number;
    private gameRightBound: number;
    private gameDownBound: number;
    private readonly gameBoundPadding: number = 40;

    private playerOneUnits: CommandableSprite[] = [];
    private playerTwoUnits: CommandableSprite[] = [];

    private cameraFocus: Sprite|null = null;

    private interaction: Interaction; // Handles I/O.
    private collisionHandler: CollisionHandler; // Handles collision.

    private selectedSprites: CommandableSprite[] = []; // This array should remain sorted according to x position.
    private selectedSpritesSet: Set<CommandableSprite> = new Set();
    private selectedSpritesAnchorX: number = 0;
    private selectedSpritesAnchorY: number = 0;

    readonly mapTileAsset: string = 'images/tiles.png'

    constructor(width: number, height: number, app: Application) {
        this.gameWidth = width;
        this.gameHeight = height;
        const mapSprite: TilingSprite = new PIXI.TilingSprite(PIXI.Texture.from(this.mapTileAsset), width, height);
        this.gameContainer.addChild(mapSprite);

        this.interaction = new Interaction(this, app);
        this.collisionHandler = new CollisionHandler(this, 100);

        this.gameLeftBound = this.gameBoundPadding;
        this.gameUpBound = this.gameBoundPadding;
        this.gameRightBound = width - this.gameBoundPadding;
        this.gameDownBound = height - this.gameBoundPadding;
    }

    public addUnit(x: number, y: number,
        unitType: UnitTypes, commandable:boolean = true, player: Player = Player.One): CommandableSprite {
        const localPos = this.gameContainer.toLocal(new PIXI.Point(x, y));
        let unit: CommandableSprite;
        if (unitType == UnitTypes.Commander) {
            unit = new Commander(localPos.x, localPos.y, player);
        } else if (unitType == UnitTypes.Infantry) {
            unit = new Infantry(localPos.x, localPos.y, player);
        } else if (unitType == UnitTypes.Cavalry) {
            unit = new Cavalry(localPos.x, localPos.y, player);
        } else {
            throw new Error('Unexpected unit type!');
        }

        if (commandable) {
            unit.interactive = true;
            this.interaction.bindCommandable(unit);
        }

        this.gameContainer.addChild(unit);
        if (player==0) {
            this.playerOneUnits.push(unit);
        } else {
            this.playerTwoUnits.push(unit);
        }
        this.collisionHandler.addUnit(unit);
        return unit;
    }

    public addSelectedSprite(sprite: CommandableSprite): void {
        if (this.selectedSprites.length === 0) {
            this.selectedSprites.push(sprite);
        } else {
            if (this.selectedSpritesSet.has(sprite)) {
                return;
            }
            const index = this.findInsertIndex(sprite, 0, this.selectedSprites.length - 1);
            this.selectedSprites.splice(index, 0, sprite);
        }
        this.selectedSpritesSet.add(sprite);
        sprite.tint = 0xFF5555;
    }

    private findInsertIndex(sprite: CommandableSprite, first: number, last: number): number {
        if (first > last) {
            return first;
        }
        const mid = (first + last) >> 1; // Divide by 2 and round down.
        const targetX = this.selectedSprites[mid].x;
        if (sprite.x > targetX) {
            return this.findInsertIndex(sprite, mid+1, last);
        } else if (sprite.x < targetX) {
            return this.findInsertIndex(sprite, first, mid-1);
        } else {
            return mid;
        }
    }

    public deselectSprite(): void {
        this.selectedSprites.forEach((sprite)=>{
            sprite.tint = 0xFFFFFF;
        });
        this.selectedSprites = [];
        this.selectedSpritesSet.clear();
    }

    public addShadowSprite(x: number, y:number): void {
        if (this.selectedSprites === []) {
            return;
        }
        const localClickPos: Point = new PIXI.Point(x, y);
        const localPos: Point = this.gameContainer.toLocal(localClickPos);

        this.selectedSpritesAnchorX = localPos.x; // Used later for multi unit selection.
        this.selectedSpritesAnchorY = localPos.y; // Used later for multi unit selection.

        this.selectedSprites.forEach((selectedSprite)=>{
            selectedSprite.targetX = localPos.x;
            selectedSprite.targetY = localPos.y;
            selectedSprite.targetDirection = selectedSprite.directionToTarget();

            const shadowSprite = new PIXI.Sprite(selectedSprite.texture);
            shadowSprite.alpha = 0.3;
            shadowSprite.anchor.set(0.5);
            this.gameContainer.addChild(shadowSprite);
            selectedSprite.setTargetSprite(shadowSprite);

            selectedSprite.updateShadowSprite();
        });
    }

    public shadowSpriteDrag(x: number, y: number): void {
        if (this.selectedSprites === []) {
            return;
        }
        const localClickPos: Point = new PIXI.Point(x, y);
        const localPos: Point = this.gameContainer.toLocal(localClickPos);
        if (this.selectedSprites.length === 1) {
            const selectedSprite = this.selectedSprites[0];
            const shadowDirection: number = angleToAnother(
                selectedSprite.targetX,
                selectedSprite.targetY,
                localPos.x,
                localPos.y,
            );
            selectedSprite.targetDirection = shadowDirection;
            selectedSprite.updateShadowSprite();
        } else {
            const numSelected = this.selectedSprites.length;
            const xDiff = (localPos.x - this.selectedSpritesAnchorX)/(numSelected-1);
            const yDiff = (localPos.y - this.selectedSpritesAnchorY)/(numSelected-1);
            const direction = fmod(angleToAnother(
                this.selectedSpritesAnchorX,
                this.selectedSpritesAnchorY,
                localPos.x,
                localPos.y) - Math.PI / 2, 2* Math.PI);
            const needToRevserse = !((direction >= 0 && direction <= Math.PI/2) ||
             (direction>= 3*Math.PI/2 && direction < 2*Math.PI));

            for (let i=0; i< this.selectedSprites.length; ++i) {
                if (needToRevserse) {
                    this.selectedSprites[i].targetX = localPos.x - xDiff * i;
                    this.selectedSprites[i].targetY = localPos.y - yDiff * i;
                } else {
                    this.selectedSprites[i].targetX = this.selectedSpritesAnchorX + xDiff * i;
                    this.selectedSprites[i].targetY = this.selectedSpritesAnchorY + yDiff * i;
                }
                this.selectedSprites[i].targetDirection = direction;
                this.selectedSprites[i].updateShadowSprite();
            }
        }
    }

    public setSelectedSpriteTarget() {
        this.selectedSprites.forEach((sprite)=>{
            sprite.hasTarget = true;
            sprite.needAlign = true;
        });
        this.deselectSprite();
    }

    public applyDamage(unit: MovableSprite, direction: number, impulse: number, damage: number): void {
        unit.applyDamage(direction, impulse, damage);
    }

    public isHealthy(unit: MovableSprite): boolean {
        return unit.hp >= 0;
    }

    public destroyUnit(unit: MovableSprite): void {
        let unitList: MovableSprite[] = [];
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
        unit.destroy();
    }

    private checkBoundAndEnforce(unit: CommandableSprite) {
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

    public showGame(app: Application) {
        app.stage.addChild(this.gameContainer);
        this.gameContainer.position.x = app.renderer.width/2;
        this.gameContainer.position.y = app.renderer.height/2;
    }

    public attachGameLoop(ticker: Ticker) {
        ticker.add(this.gameLoop);
    }

    public fixCamera(sprite: Sprite) {
        this.cameraFocus = sprite;
    }

    public zoomIn() {
        this.gameContainer.scale.x *= 1.05;
        this.gameContainer.scale.y *= 1.05;
    }

    public zoomOut() {
        this.gameContainer.scale.x *= 0.99;
        this.gameContainer.scale.y *= 0.99;
    }

    private gameLoop = ()=> {
        if (this.cameraFocus !== null) {
            this.gameContainer.pivot.x = this.cameraFocus.x;
            this.gameContainer.pivot.y = this.cameraFocus.y;
        }
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
    }


    public collide(unit: MovableSprite, another: MovableSprite) {
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

            if (unit.canAttack()) {
                const angleAlignment = Math.cos(direction - unit.rotation);
                if (angleAlignment > 0) {
                    const impulse = angleAlignment * unit.weight * unit.speed;
                    const damage = this.calcDamage(unit.attackStat, unit.speed);
                    console.log('unit', direction, unit.rotation, angleAlignment, impulse, damage);
                    another.applyDamage(direction, impulse, damage);
                    unit.attack();
                }
            }
            if (another.canAttack()) {
                const angleAlignment = Math.cos((direction+Math.PI) - another.rotation);
                if (angleAlignment>0) {
                    const impulse = angleAlignment * another.weight * another.speed;
                    const damage = this.calcDamage(another.attackStat, another.speed);
                    console.log('another', direction, another.rotation, angleAlignment, impulse, damage);
                    unit.applyDamage(direction + Math.PI, impulse, damage);
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

    public getInteractionObject(): Interaction {
        return this.interaction;
    }
}
