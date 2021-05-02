import * as pixiNamespace from 'pixi.js';
import {Application, InteractionEvent, Sprite} from 'pixi.js';
import {CommandableSprite} from './commandableSprite.js';

import {Game} from './game.js';
import {KeyboardListener} from './keyboard_listener.js';
import {MovableSprite} from './moveableSprite.js';

declare let PIXI: typeof pixiNamespace;

export class Interaction {
    app: Application;
    game: Game;

    isRightClickDown: boolean = false;

    constructor(game: Game, app: Application) {
        this.app = app;
        this.game = game;

        this.bindRightClickMove();
        this.bindCameraZoom();
        this.bindDeselectSprite();
    }

    public bindMovementControl(sprite: MovableSprite) {
        const downKeyListener = new KeyboardListener('ArrowDown');
        downKeyListener.pressed = (()=>{
            this.app.ticker.add(sprite.decSpeed);
        });
        downKeyListener.released = (()=>{
            this.app.ticker.remove(sprite.decSpeed);
        });
        const upKeyListener = new KeyboardListener('ArrowUp');
        upKeyListener.pressed = (()=>{
            this.app.ticker.add(sprite.incSpeed);
        });
        upKeyListener.released = (()=>{
            this.app.ticker.remove(sprite.incSpeed);
        });
        const leftKeyListener = new KeyboardListener('ArrowLeft');
        leftKeyListener.pressed = (()=>{
            this.app.ticker.add(sprite.turnLeft);
        });
        leftKeyListener.released = (()=>{
            this.app.ticker.remove(sprite.turnLeft);
        });
        const rightKeyListener = new KeyboardListener('ArrowRight');
        rightKeyListener.pressed = (()=>{
            this.app.ticker.add(sprite.turnRight);
        });
        rightKeyListener.released = (()=>{
            this.app.ticker.remove(sprite.turnRight);
        });
    }

    public bindCommandable(sprite: CommandableSprite) {
        sprite.on('mousedown', (e: InteractionEvent)=>{
            const originalEvent = <MouseEvent>e.data.originalEvent;
            console.log(originalEvent.button);
            const targetSprite = e.target! as unknown as CommandableSprite;
            this.game.addSelectedSprite(targetSprite);
            e.stopPropagation();
        });
    }

    public bindRightClickMove() {
        this.app.view.addEventListener('mousedown', (e: MouseEvent)=>{
            if (e.button === 2) {
                this.isRightClickDown = true;
                const targetX: number = e.clientX;
                const targetY: number = e.clientY;
                this.game.addShadowSprite(targetX, targetY);
            }
        });
        this.app.view.addEventListener('mousemove', (e: MouseEvent)=>{
            if (this.isRightClickDown) {
                const targetX: number = e.clientX;
                const targetY: number = e.clientY;
                this.game.shadowSpriteDrag(targetX, targetY);
            }
        });
        this.app.view.addEventListener('contextmenu', () => {
            this.game.setSelectedSpriteTarget();
            this.isRightClickDown = false;
        });
    }

    public bindCameraZoom() {
        this.app.view.addEventListener('wheel', (e: WheelEvent)=>{
            const isScrollUp: boolean = e.deltaY < 0;
            if (isScrollUp) {
                this.game.zoomIn();
            } else {
                this.game.zoomOut();
            }
        });
    }

    public bindDeselectSprite() {
        this.app.stage.interactive = true;
        this.app.stage.on('mousedown', ()=>{
            this.game.deselectSprite();
        });
    }
}
