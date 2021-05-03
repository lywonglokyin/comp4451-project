import * as pixiNamespace from 'pixi.js';
import {Application, Container, Graphics, Point, Sprite, Ticker, TilingSprite} from 'pixi.js';
import {CommandableSprite} from '../commandableSprite.js';
import {MovableSprite} from '../moveableSprite.js';
import {Cavalry} from '../units/cavalry.js';
import {Commander} from '../units/commander.js';
import {Infantry} from '../units/infantry.js';
import {UnitTypes} from '../units/unitTypes.js';
import {Player} from './game/player.js';
import {angleToAnother, euclideanDist, fmod} from '../utils.js';
import {UnitPosInfo} from './game/game.js';
import {Socket} from 'socket.io-client';

declare let PIXI: typeof pixiNamespace;

export class Renderer {
    private state: string = 'play';
    private gameContainer: Container = new PIXI.Container();

    gameWidth: number;
    gameHeight: number;

    private everyUnits: {[key: number]:CommandableSprite} = {};

    private cameraFocus: MovableSprite|null = null;


    private dragRectange: Graphics|null = null;
    private selectedSprites: CommandableSprite[] = []; // This array should remain sorted according to x position.
    private selectedSpritesSet: Set<CommandableSprite> = new Set();
    private selectedSpritesAnchorX: number = 0;
    private selectedSpritesAnchorY: number = 0;

    readonly mapTileAsset: string = 'images/tiles.png'

    app: Application;

    player: Player = Player.One;

    hitAudios: HTMLAudioElement[];
    deadAudios: HTMLAudioElement[];

    constructor(width: number, height: number, app: Application) {
        this.gameWidth = width;
        this.gameHeight = height;
        const mapSprite: TilingSprite = new PIXI.TilingSprite(PIXI.Texture.from(this.mapTileAsset), width, height);
        this.gameContainer.addChild(mapSprite);

        this.app = app;

        this.app.stage.addChild(this.gameContainer);
        this.gameContainer.position.x = this.app.renderer.width/2;
        this.gameContainer.position.y = this.app.renderer.height/2;

        this.hitAudios = [
            new Audio('sound/hit1.wav'),
            new Audio('sound/hit2.wav'),
            new Audio('sound/hit3.wav'),
        ];
        this.hitAudios.forEach((audio)=>{
            audio.volume = 0.3;
        });
        this.deadAudios = [
            new Audio('sound/dead1.wav'),
            new Audio('sound/dead2.wav'),
        ];
    }

    public addUnit(unitID: number, unitType: UnitTypes, player: Player): CommandableSprite {
        const localPos = this.gameContainer.toLocal(new PIXI.Point(0, 0));
        let unit: CommandableSprite;
        if (unitType == UnitTypes.Commander) {
            unit = new Commander(localPos.x, localPos.y, player, unitID);
        } else if (unitType == UnitTypes.Infantry) {
            unit = new Infantry(localPos.x, localPos.y, player, unitID);
        } else if (unitType == UnitTypes.Cavalry) {
            unit = new Cavalry(localPos.x, localPos.y, player, unitID);
        } else {
            throw new Error('Unexpected unit type!');
        }
        if (this.player == player) {
            unit.interactive = true;

            if (unitType == UnitTypes.Commander) {
                this.fixCamera(unit);
            }
        }
        unit.anchor.set(0.5);

        this.gameContainer.addChild(unit);
        this.everyUnits[unitID] = unit;
        return unit;
    }

    public updatePos(posBulk: {[key: number]: UnitPosInfo}) {
        // const localPos = this.gameContainer.toLocal(new PIXI.Point(x, y));
        for (const [key, value] of Object.entries(posBulk)) {
            const intKey = parseInt(key);
            const unit = this.everyUnits[intKey];
            unit.x = value.x;
            unit.y = value.y;
            unit.rotation = value.rotation;

            if (unit.targetSprite !== null) {
                const targetDistance = euclideanDist(value.x, value.y, unit.targetSprite.x, unit.targetSprite.y);
                const distanceTolerance = 4;
                if (targetDistance < distanceTolerance) {
                    unit.targetSprite.destroy();
                    unit.targetSprite = null;
                }
            }
        }
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

    public setSelectedSpriteTarget(socket: Socket) {
        this.selectedSprites.forEach((sprite)=>{
            sprite.hasTarget = true;
            sprite.needAlign = true;


            socket.emit('updateTargetPos', sprite.id, sprite.targetX, sprite.targetY, sprite.targetDirection);
        });

        this.deselectSprite();
    }

    public drawDragRectangle(fromX: number, fromY: number, toX: number, toY: number) {
        const localClickFrom: Point = new PIXI.Point(fromX, fromY);


        const localFrom: Point = this.gameContainer.toLocal(localClickFrom);


        const localClickTo: Point = new PIXI.Point(toX, toY);
        const localTo: Point = this.gameContainer.toLocal(localClickTo);
        const leftX = Math.min(localFrom.x, localTo.x);
        const rightX = Math.max(localFrom.x, localTo.x);
        const upY = Math.min(localFrom.y, localTo.y);
        const downY = Math.max(localFrom.y, localTo.y);
        if (this.dragRectange !== null) {
            this.dragRectange.destroy();
        }
        const newRectange: Graphics = new PIXI.Graphics();
        newRectange.lineStyle(2, 0xEEEEEE, 1);
        newRectange.beginFill(0xFFFFFF, 0);
        newRectange.drawRect(leftX, upY, rightX-leftX, downY-upY);
        newRectange.endFill();
        this.dragRectange = newRectange;
        this.gameContainer.addChild(newRectange);
    };

    public removeDragRectangle() {
        if (this.dragRectange !== null) {
            this.dragRectange.destroy();
        }
        this.dragRectange = null;
    }

    public selectUnitsWithBox(fromX: number, fromY: number, toX: number, toY: number) {
        const localClickFrom: Point = new PIXI.Point(fromX, fromY);
        const localFrom: Point = this.gameContainer.toLocal(localClickFrom);
        const localClickTo: Point = new PIXI.Point(toX, toY);
        const localTo: Point = this.gameContainer.toLocal(localClickTo);

        const leftX = Math.min(localFrom.x, localTo.x);
        const rightX = Math.max(localFrom.x, localTo.x);
        const upY = Math.min(localFrom.y, localTo.y);
        const downY = Math.max(localFrom.y, localTo.y);

        for (const [key, value] of Object.entries(this.everyUnits)) {
            const unit = value;
            if (unit.player === this.player && unit.type !== UnitTypes.Commander) {
                if (unit.x <= rightX && unit.x >= leftX) {
                    if (unit.y <= downY && unit.y >= upY) {
                        this.addSelectedSprite(unit);
                    }
                }
            }
        }
    }

    public isHealthy(unit: MovableSprite): boolean {
        return unit.hp >= 0;
    }

    public showGame(app: Application) {
        app.stage.addChild(this.gameContainer);
        this.gameContainer.position.x = app.renderer.width/2;
        this.gameContainer.position.y = app.renderer.height/2;
    }

    public fixCamera(sprite: MovableSprite) {
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

    private calcDamage(attackStat: number, unitSpeed: number): number {
        const speedAttenuation = unitSpeed<2 ? 1 : (unitSpeed**2 / 30 +1);
        return attackStat * speedAttenuation;
    }

    public render= () => {
        if (this.cameraFocus !== null) {
            this.gameContainer.pivot.x = this.cameraFocus.x;
            this.gameContainer.pivot.y = this.cameraFocus.y;
        }
    }

    public setPlayer(player: Player) {
        this.player = player;
    }

    public getLocalPos(x: number, y:number): Point {
        const localClickPos: Point = new PIXI.Point(x, y);
        return this.gameContainer.toLocal(localClickPos);
    }

    public invertView() {
        this.gameContainer.rotation = Math.PI;
    }

    public destroyUnit(id: number) {
        if (this.cameraFocus!== null &&this.cameraFocus.id === id) {
            this.cameraFocus = null;
        }
        this.everyUnits[id].destroy();
        delete this.everyUnits[id];
        const randomAudio = this.deadAudios[Math.floor(Math.random() * this.deadAudios.length)];
        randomAudio.play();
    }

    public applyDamage(id: number) {
        if (id in this.everyUnits) {
            this.everyUnits[id].tint = 0xFF0000;
            setTimeout(()=>{
                if (id in this.everyUnits) {
                    this.everyUnits[id].tint = 0xFFAAAA;
                    setTimeout(()=>{
                        if (id in this.everyUnits) {
                            this.everyUnits[id].tint = 0xFFCCCC;
                            setTimeout(()=>{
                                if (id in this.everyUnits) {
                                    this.everyUnits[id].tint = 0xFFFFFF;
                                }
                            }, 100);
                        }
                    }, 100);
                }
            }, 100);
        }
        const randomAudio = this.hitAudios[Math.floor(Math.random() * this.hitAudios.length)];
        randomAudio.play();
    }
}
