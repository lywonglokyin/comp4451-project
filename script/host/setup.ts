import * as pixiNamespace from 'pixi.js';
import {Application} from 'pixi.js';
import * as socketClientNamespace from 'socket.io-client';
import {UnitPosInfo} from './game/game.js';
import {Player} from './game/player.js';
import {UnitTypes} from './game/units/unitTypes.js';
import {Interaction} from './interactive.js';
import {Renderer} from './renderer.js';

declare let PIXI: typeof pixiNamespace;
declare let io: typeof socketClientNamespace.io;

const hostButton = document.getElementById('host')!;
const joinButton = document.getElementById('join')!;
const startButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('start')!;
startButton.disabled = true;
const inputField: HTMLInputElement = <HTMLInputElement>document.getElementById('inputGameID')!;
inputField.value = '';
const msgDiv: HTMLDivElement = <HTMLDivElement>document.getElementById('msg')!;

const socket = io();
const app: Application = new PIXI.Application({
    transparent: false,
    width: window.innerWidth,
    height: window.innerHeight,
});

const renderer: Renderer = new Renderer(3000, 6000, app);

const interactive: Interaction = new Interaction(renderer, app, socket);

function hostNewGame() {
    const gameID = (Math.random()* 100000) | 0;
    inputField.value = gameID.toString();
    socket.emit('createNewGame', {
        'gameID': gameID,
    });
}

function joinGame(gameID: number) {
    socket.emit('joinRoom', {
        'gameID': gameID,
    }, (msg: string)=>{
        console.log(msg);
    });
}

function startGame() {
    socket.emit('startGame', parseInt(inputField.value));
}

socket.on('message', (msg:string)=>{
    console.log(msg);
    if (msg.substr(0, 6) === 'Socket') {
        startButton.disabled = false;
    }
    msgDiv.innerHTML += msg;
    msgDiv.innerHTML += '<br>';
});

socket.on('startGame', (gameID: number, player: Player)=>{
    const playerStr = player == Player.One? 'Player one' : 'Player two';
    console.log('Start as ' + playerStr + '!');
    hostButton.remove();
    joinButton.remove();
    startButton.remove();
    inputField.remove();
    msgDiv.remove();

    renderer.setPlayer(player);
    if (player==Player.Two) {
        renderer.invertView();
    }

    document.body.appendChild(app.view);
    app.view.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    app.ticker.add(renderer.render);
});

socket.on('addUnit', (id: number, type: UnitTypes, player: Player)=>{
    const unit = renderer.addUnit(id, type, player);
    if (player === renderer.player && type !== UnitTypes.Commander) {
        interactive.bindCommandable(unit);
    }
    if (player === renderer.player && type === UnitTypes.Commander) {
        interactive.bindMovementControl(unit);
    }
});

socket.on('updatePos', (posBulk: {[key: number]: UnitPosInfo})=>{
    renderer.updatePos(posBulk);
});

socket.on('destroyUnit', (id: number)=>{
    renderer.destroyUnit(id);
});

socket.on('applyDamage', (id: number)=>{
    renderer.applyDamage(id);
});

socket.on('gameWon', (player: Player)=>{
    const div = document.createElement('div');
    div.className += 'overlay';
    if (renderer.player === player) {
        console.log('You won!');
        div.innerHTML = 'You won!';
    } else {
        console.log('You lose!');
        div.innerHTML = 'You lose!';
    }
    document.body.appendChild(div);
    socket.emit('gameWon');
});


hostButton.addEventListener('click', ()=>{
    hostNewGame();
});

joinButton.addEventListener('click', ()=>{
    const gameID = parseInt(inputField.value);
    joinGame(gameID);
});

startButton.addEventListener('click', ()=>{
    startGame();
});
