import * as pixiNamespace from 'pixi.js';
import {Application} from 'pixi.js';
import {MovableSprite} from './moveableSprite.js';
import {CommandableSprite} from './commandableSprite.js';
import {KeyboardListener} from './keyboard_listener.js';

declare let PIXI: typeof pixiNamespace;

const app: Application = new PIXI.Application({
    transparent: false,
    width: window.innerWidth,
    height: window.innerHeight,
});
document.body.appendChild(app.view);
app.view.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

const gameState: string = 'play';

const commander: MovableSprite = new MovableSprite(0.03, 5, 0.03, 0.05, PIXI.Texture.from('images/testunit.png'));
commander.anchor.set(0.5);

commander.x = 100;
commander.y = 100;


const downKeyListener = new KeyboardListener('ArrowDown');
downKeyListener.pressed = (()=>{
    app.ticker.add(commander.decSpeed);
});
downKeyListener.released = (()=>{
    app.ticker.remove(commander.decSpeed);
});
const upKeyListener = new KeyboardListener('ArrowUp');
upKeyListener.pressed = (()=>{
    app.ticker.add(commander.incSpeed);
});
upKeyListener.released = (()=>{
    app.ticker.remove(commander.incSpeed);
});
const leftKeyListener = new KeyboardListener('ArrowLeft');
leftKeyListener.pressed = (()=>{
    app.ticker.add(commander.turnLeft);
});
leftKeyListener.released = (()=>{
    app.ticker.remove(commander.turnLeft);
});
const rightKeyListener = new KeyboardListener('ArrowRight');
rightKeyListener.pressed = (()=>{
    app.ticker.add(commander.turnRight);
});
rightKeyListener.released = (()=>{
    app.ticker.remove(commander.turnRight);
});

app.stage.addChild(commander);


let selectedSprite: CommandableSprite|null = null;


const noOfUnits = 7;
const units: CommandableSprite[] = [];
for (let i = 0; i < noOfUnits; i++) {
    const unit: CommandableSprite = new CommandableSprite(
        0.03, 5, 0.03, 0.05,
        PIXI.Texture.from('images/testunit2.png'));
    unit.anchor.set(0.5);
    unit.x = 100 + i*100;
    unit.y = 200;
    unit.interactive = true;
    unit.on('mousedown', (e: PointerEvent)=>{
        console.log('clicked.');
        if (selectedSprite !== null) {
            selectedSprite.tint = 0xFFFFFF;
        }
        const targetSprite = e.target! as unknown as CommandableSprite;
        targetSprite.tint = 0xFF5555;
        selectedSprite = targetSprite;
    });
    units.push(unit);
    app.stage.addChild(unit);
}

const cavUnit: CommandableSprite = new CommandableSprite(0.02, 8, 0.1, 0.08, PIXI.Texture.from('images/testunit3.png'));
cavUnit.anchor.set(0.5);
cavUnit.x = 200;
cavUnit.y = 300;
cavUnit.interactive = true;
cavUnit.on('mousedown', (e: PointerEvent)=>{
    console.log('clicked.');
    if (selectedSprite !== null) {
        selectedSprite.tint = 0xFFFFFF;
    }
    const targetSprite = e.target! as unknown as CommandableSprite;
    targetSprite.tint = 0xFF5555;
    selectedSprite = targetSprite;
});
app.stage.addChild(cavUnit);

app.view.addEventListener('contextmenu', (e: MouseEvent) => {
    const targetX: number = e.clientX;
    const targetY: number = e.clientY;
    selectedSprite!.targetX = targetX;
    selectedSprite!.targetY = targetY;
    selectedSprite!.hasTarget = true;
    console.log(selectedSprite!.directionToTarget());
});


app.ticker.add(()=>{
    gameLoop();
});

function gameLoop() {
    if (gameState === 'play') {
        playFrame();
    }
}

function playFrame() {
    commander.move();
    units.forEach((unit: CommandableSprite)=>{
        unit.move();
    });
    cavUnit.move();
}
