import * as pixi_namespace from 'pixi.js'
import { Application, PlaneGeometry, Rectangle, Sprite } from 'pixi.js';
import { MovableSprite } from './moveableSprite.js';
import {KeyboardListener} from './keyboard_listener.js';

declare var PIXI:  typeof pixi_namespace;

const app: Application = new PIXI.Application({transparent: false});
document.body.appendChild(app.view);

let game_state: string = "play";

let commander: MovableSprite = new MovableSprite(PIXI.Texture.from('images/testunit.png'))
commander.anchor.set(0.5);

commander.x = 100;
commander.y = 100;


let downKeyListener = new KeyboardListener("ArrowDown");
downKeyListener.pressed = (()=>{
    app.ticker.add(commander.decSpeed)
});
downKeyListener.released = (()=>{
    app.ticker.remove(commander.decSpeed)
})
let upKeyListener = new KeyboardListener("ArrowUp");
upKeyListener.pressed = (()=>{
    app.ticker.add(commander.incSpeed)
})
upKeyListener.released = (()=>{
    app.ticker.remove(commander.incSpeed)
})
let leftKeyListener = new KeyboardListener("ArrowLeft");
leftKeyListener.pressed = (()=>{
    app.ticker.add(commander.turnLeft);
})
leftKeyListener.released = (()=>{
    app.ticker.remove(commander.turnLeft);
})
let rightKeyListener = new KeyboardListener("ArrowRight");
rightKeyListener.pressed = (()=>{
    app.ticker.add(commander.turnRight);
})
rightKeyListener.released = (()=>{
    app.ticker.remove(commander.turnRight);
})

app.stage.addChild(commander);

app.ticker.add(()=>{
    gameLoop();
})

function gameLoop(){
    if (game_state === "play"){
        playFrame();
    }
}

function playFrame(){
    commander.move();
}