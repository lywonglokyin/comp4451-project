import * as pixiNamespace from 'pixi.js';
import {Application, Container, Point, Sprite, Ticker, TilingSprite} from 'pixi.js';
import {CommandableSprite} from './commandableSprite.js';
import {Interaction} from './interactive.js';
import {Cavalry} from './units/cavalry.js';
import {Commander} from './units/commander.js';
import {Infantry} from './units/infantry.js';
import {UnitTypes} from './units/unitTypes.js';

declare let PIXI: typeof pixiNamespace;

export class Game {
    private state: string = 'play';
    private gameContainer: Container = new PIXI.Container();

    private gameLeftBound: number;
    private gameUpBound: number;
    private gameRightBound: number;
    private gameDownBound: number;
    private readonly gameBoundPadding: number = 40;

    private playerOneUnits: CommandableSprite[] = [];
    private playerTwoUnits: CommandableSprite[] = [];

    private cameraFocus: Sprite|null = null;

    private interaction: Interaction; // Handles I/O.

    private selectedSprite: CommandableSprite|null = null;

    readonly mapTileAsset: string = 'images/tiles.png'

    constructor(width: number, height: number, app: Application) {
        const mapSprite: TilingSprite = new PIXI.TilingSprite(PIXI.Texture.from(this.mapTileAsset), width, height);
        this.gameContainer.addChild(mapSprite);
        this.interaction = new Interaction(this, app);

        this.gameLeftBound = this.gameBoundPadding;
        this.gameUpBound = this.gameBoundPadding;
        this.gameRightBound = width - this.gameBoundPadding;
        this.gameDownBound = height - this.gameBoundPadding;
    }

    public addUnit(x: number, y: number,
        unitType: UnitTypes, commandable:boolean = true, player: number = 0): CommandableSprite {
        const localPos = this.gameContainer.toLocal(new PIXI.Point(x, y));
        let unit: CommandableSprite;
        if (unitType == UnitTypes.Commander) {
            unit = new Commander(localPos.x, localPos.y);
        } else if (unitType == UnitTypes.Infantry) {
            unit = new Infantry(localPos.x, localPos.y);
        } else if (unitType == UnitTypes.Cavalry) {
            unit = new Cavalry(localPos.x, localPos.y);
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
        return unit;
    }

    public setSelectedSprite(sprite: CommandableSprite): void {
        if (this.selectedSprite !== null) {
            this.selectedSprite.tint = 0xFFFFFF;
        }
        this.selectedSprite = sprite;
        this.selectedSprite.tint = 0xFF5555;
    }

    public setSelectedSpriteTarget(x: number, y: number) {
        if (this.selectedSprite == null) {
            return;
        }
        const localClickPos: Point = new PIXI.Point(x, y);
        const localPos: Point = this.gameContainer.toLocal(localClickPos);
        this.selectedSprite.targetX = localPos.x;
        this.selectedSprite.targetY = localPos.y;
        this.selectedSprite.hasTarget = true;
    }

    private checkBoundAndEnforce(unit: CommandableSprite) {
        if (unit.x < this.gameLeftBound) {
            unit.speed = 0;
            unit.x = this.gameLeftBound;
        } else if (unit.x > this.gameRightBound) {
            unit.speed = 0;
            unit.x = this.gameRightBound;
        }
        if (unit.y < this.gameUpBound) {
            unit.speed = 0;
            unit.y = this.gameUpBound;
        } else if (unit.y > this.gameDownBound) {
            unit.speed = 0;
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
        this.playerOneUnits.forEach((unit)=>{
            unit.act();
            this.checkBoundAndEnforce(unit);
        });
        this.playerTwoUnits.forEach((unit)=>{
            unit.act();
            this.checkBoundAndEnforce(unit);
        });
    }

    public getInteractionObject(): Interaction {
        return this.interaction;
    }
}
