import * as pixi_namespace from 'pixi.js'
import { Application, PlaneGeometry, Rectangle, Sprite } from 'pixi.js';
import { movableSprite } from './moveableSprite';

declare var PIXI:  typeof pixi_namespace;

const app: Application = new PIXI.Application({transparent: false});
document.body.appendChild(app.view);

let game_state: string = "play";

let commander: movableSprite = PIXI.Sprite.from('images/commander.png');
commander.anchor.set(0.5);

commander.x = 100;
commander.y = 100;

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
    commander.x += 1;
    if (commander.x == 200){
        commander.x = 10
    }
}