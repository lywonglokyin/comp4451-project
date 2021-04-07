import * as pixi_namespace from 'pixi.js'
import { Application, PlaneGeometry, Rectangle, Sprite } from 'pixi.js';
import { MovableSprite } from './moveableSprite.js';
import { CommandableSprite } from './commandableSprite.js';
import {KeyboardListener} from './keyboard_listener.js';

declare var PIXI:  typeof pixi_namespace;

const app: Application = new PIXI.Application({
    transparent: false,
    width: window.innerWidth,
    height: window.innerHeight
});
document.body.appendChild(app.view);
app.view.addEventListener('contextmenu', e => {
    e.preventDefault();
});

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



var selectedSprite: CommandableSprite|null = null;


const noOfUnits = 7;
const units: CommandableSprite[] = [];
for (let i = 0; i < noOfUnits; i++){
    let unit: CommandableSprite = new CommandableSprite(PIXI.Texture.from('images/testunit2.png'))
    unit.anchor.set(0.5);
    unit.x = 100 + i*100;
    unit.y = 200;
    unit.interactive = true;
    unit.on("mousedown", (e: PointerEvent)=>{
        console.log("clicked.");
        if (selectedSprite !== null){
            selectedSprite.tint = 0xFFFFFF;
        }
        let target_sprite = e.target! as unknown as CommandableSprite;
        target_sprite.tint = 0xFF5555;
        selectedSprite = target_sprite;
    })
    units.push(unit);
    app.stage.addChild(unit);
}

app.view.addEventListener('contextmenu', (e: MouseEvent) => {
    let targetX: number = e.clientX;
    let targetY: number = e.clientY;
    selectedSprite!.targetX = targetX;
    selectedSprite!.targetY = targetY;
    selectedSprite!.hasTarget = true;
    console.log(selectedSprite!.directionToTarget());
});


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
    units.forEach((unit: CommandableSprite)=>{
        unit.move();
    })
}