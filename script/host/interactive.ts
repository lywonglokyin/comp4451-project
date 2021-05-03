import {Application, InteractionEvent} from 'pixi.js';
import {Socket} from 'socket.io-client';
import {CommandableSprite} from '../commandableSprite.js';

import {KeyboardListener} from '../keyboard_listener.js';
import {MovableSprite} from '../moveableSprite.js';
import {Renderer} from './renderer.js';


export class Interaction {
    app: Application;
    renderer: Renderer;
    socket: Socket;

    private leftMouseDragFromX: number = 0;
    private leftMouseDragFromY: number = 0;
    private leftMouseDragToX: number = 0;
    private leftMouseDragToY: number = 0;
    private isLeftClickDown: boolean = false;

    isRightClickDown: boolean = false;

    constructor(renderer: Renderer, app: Application, socket: Socket) {
        this.app = app;
        this.renderer = renderer;
        this.socket = socket;

        this.bindRightClickMove();
        this.bindCameraZoom();
        this.bindLeftMouseDrag();
    }

    public bindMovementControl(sprite: MovableSprite) {
        const downKeyListener = new KeyboardListener('ArrowDown');
        let downKeyInterval: ReturnType<typeof setInterval>|null = null;
        downKeyListener.pressed = (()=>{
            downKeyInterval = setInterval(()=>{
                this.socket.emit('decSpeed', sprite.id);
            }, 1000/60);
        });
        downKeyListener.released = (()=>{
            if (downKeyInterval!==null) {
                clearInterval(downKeyInterval);
                downKeyInterval = null;
            }
        });
        const upKeyListener = new KeyboardListener('ArrowUp');
        let upKeyInterval: ReturnType<typeof setInterval>|null = null;
        upKeyListener.pressed = (()=>{
            upKeyInterval = setInterval(()=>{
                this.socket.emit('incSpeed', sprite.id);
            }, 1000/60);
        });
        upKeyListener.released = (()=>{
            if (upKeyInterval!==null) {
                clearInterval(upKeyInterval);
                upKeyInterval = null;
            }
        });
        const leftKeyListener = new KeyboardListener('ArrowLeft');
        let leftKeyInterval: ReturnType<typeof setInterval>|null = null;
        leftKeyListener.pressed = (()=>{
            leftKeyInterval = setInterval(()=>{
                this.socket.emit('turnLeft', sprite.id);
            }, 1000/60);
        });
        leftKeyListener.released = (()=>{
            if (leftKeyInterval!==null) {
                clearInterval(leftKeyInterval);
                leftKeyInterval = null;
            }
        });
        const rightKeyListener = new KeyboardListener('ArrowRight');
        let rightKeyInterval: ReturnType<typeof setInterval>|null = null;
        rightKeyListener.pressed = (()=>{
            rightKeyInterval = setInterval(()=>{
                this.socket.emit('turnRight', sprite.id);
            }, 1000/60);
        });
        rightKeyListener.released = (()=>{
            if (rightKeyInterval!==null) {
                clearInterval(rightKeyInterval);
                rightKeyInterval = null;
            }
        });
    }

    public bindCommandable(sprite: CommandableSprite) {
        sprite.on('mousedown', (e: InteractionEvent)=>{
            const originalEvent = <MouseEvent>e.data.originalEvent;
            console.log(originalEvent.button);
            const targetSprite = e.target! as unknown as CommandableSprite;
            this.renderer.addSelectedSprite(targetSprite);
            e.stopPropagation();
        });
    }

    public bindLeftMouseDrag() {
        this.app.view.addEventListener('mousedown', (e: MouseEvent)=>{
            console.log('Mouse down!', e.button);
            if (e.button === 0) {
                this.renderer.deselectSprite();
                this.leftMouseDragFromX = e.clientX;
                this.leftMouseDragFromY = e.clientY;
                this.isLeftClickDown = true;
            }
        });
        this.app.view.addEventListener('mousemove', (e:MouseEvent)=>{
            if (this.isLeftClickDown) {
                this.leftMouseDragToX = e.clientX;
                this.leftMouseDragToY = e.clientY;
                this.renderer.drawDragRectangle(this.leftMouseDragFromX, this.leftMouseDragFromY,
                    this.leftMouseDragToX, this.leftMouseDragToY);
            }
        });
        this.app.view.addEventListener('mouseup', (e: MouseEvent)=>{
            if (e.button === 0) {
                this.renderer.removeDragRectangle();
                this.renderer.selectUnitsWithBox(this.leftMouseDragFromX, this.leftMouseDragFromY,
                    this.leftMouseDragToX, this.leftMouseDragToY);
                this.isLeftClickDown = false;
            }
        });
    }

    public bindRightClickMove() {
        this.app.view.addEventListener('mousedown', (e: MouseEvent)=>{
            if (e.button === 2) {
                this.isRightClickDown = true;
                const targetX: number = e.clientX;
                const targetY: number = e.clientY;
                this.renderer.addShadowSprite(targetX, targetY);
            }
        });
        this.app.view.addEventListener('mousemove', (e: MouseEvent)=>{
            if (this.isRightClickDown) {
                const targetX: number = e.clientX;
                const targetY: number = e.clientY;
                this.renderer.shadowSpriteDrag(targetX, targetY);
            }
        });
        this.app.view.addEventListener('contextmenu', () => {
            this.renderer.setSelectedSpriteTarget(this.socket);

            this.isRightClickDown = false;
        });
    }

    public bindCameraZoom() {
        this.app.view.addEventListener('wheel', (e: WheelEvent)=>{
            const isScrollUp: boolean = e.deltaY < 0;
            if (isScrollUp) {
                this.renderer.zoomIn();
            } else {
                this.renderer.zoomOut();
            }
        });
    }
}
