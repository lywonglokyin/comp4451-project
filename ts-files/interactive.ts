import * as pixiNamespace from 'pixi.js';

import {Application, Point, Ticker} from 'pixi.js';
import {CommandableSprite} from './commandableSprite.js';
import {Game} from './game.js';
import {KeyboardListener} from './keyboard_listener.js';
import {MovableSprite} from './moveableSprite.js';

declare let PIXI: typeof pixiNamespace;

export class Interaction {
    app: Application;
    game: Game;

    constructor(game: Game, app: Application) {
        this.app = app;
        this.game = game;

        this.bindRightClickMove();
        this.bindCameraZoom();
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
        sprite.on('mousedown', (e: PointerEvent)=>{
            const targetSprite = e.target! as unknown as CommandableSprite;
            this.game.setSelectedSprite(targetSprite);
        });
    }

    public bindRightClickMove() {
        this.app.view.addEventListener('contextmenu', (e: MouseEvent) => {
            const targetX: number = e.clientX;
            const targetY: number = e.clientY;
            this.game.setSelectedSpriteTarget(targetX, targetY);
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
}
