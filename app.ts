import express from 'express';
import * as http from 'http';
import {Server, Socket} from 'socket.io';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {Game} from './script/host/game/game.js';
import {UnitTypes} from './script/host/game/units/unitTypes.js';
import {Player} from './script/host/game/player.js';


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let gameLoopInterval: ReturnType<typeof setInterval>|null = null;

app.use('/js-script', express.static('js-script'));
app.use('/images', express.static('images'));
app.use('/sound', express.static('sound'));

app.get('/', (req, res)=>{
    res.redirect('/host.html');
});
app.get('/host.html', (req, res)=>{
    res.sendFile(join(__dirname, '../', 'host.html'));
});


const server = http.createServer(app);

server.listen(8080, ()=>{
    console.log('Listening on port 8080');
});

const io = new Server(server);
let globalGame: Game|null = null;

io.sockets.on('connection', (socket)=>{
    console.log('Someone connected!');

    socket.on('createNewGame', (data)=>{
        const gameID: number = data.gameID;
        console.log('Create game with id', gameID);
        socket.join(gameID.toString());
        io.to(gameID.toString()).emit('message', 'Created room ' + gameID + '.\n');
    });

    socket.on('joinRoom', (data)=>{
        const gameID: number = data.gameID;
        if (io.of('/').adapter.rooms.get(gameID.toString())) {
            // Room exists
            socket.join(gameID.toString());
            io.to(gameID.toString()).emit('message', 'Socket ' + socket.id + ' joined room ' + gameID + '!\n');
        } else {
            // Room not exist
            console.log('Room not exist!');
            socket.emit('message', 'Room not exist!\n');
        }
    });

    socket.on('startGame', (gameID: number)=>{
        const clients = io.sockets.adapter.rooms.get(gameID.toString())!;
        const clientsArray = [...clients];
        io.to(clientsArray[0]).emit('startGame', gameID, Player.One);
        io.to(clientsArray[1]).emit('startGame', gameID, Player.Two);
        const game = new Game(3000, 6000, io, gameID);
        globalGame = game;
        const commander = game.addUnit(1500, 3400, UnitTypes.Commander);
        const enemyCommander = game.addUnit(1500, 2600, UnitTypes.Commander, Player.Two);
        for (let x=800; x<=2400; x+=100) {
            game.addUnit(x, 3200, UnitTypes.Infantry);
        }
        for (let x=800; x<=1200; x+=100) {
            game.addUnit(x, 3400, UnitTypes.Cavalry);
        }
        for (let x=2000; x<=2400; x+=100) {
            game.addUnit(x, 3400, UnitTypes.Cavalry);
        }
        for (let x=800; x<=2400; x+=100) {
            game.addUnit(x, 2800, UnitTypes.Infantry, Player.Two);
        }
        for (let x=800; x<=1200; x+=100) {
            game.addUnit(x, 2600, UnitTypes.Cavalry, Player.Two);
        }
        for (let x=2000; x<=2400; x+=100) {
            game.addUnit(x, 2600, UnitTypes.Cavalry, Player.Two);
        }
        gameLoopInterval = setInterval(game.gameLoop, 1000/60);
    });

    socket.on('updateTargetPos', (id, targetX, targetY, targetDirection)=>{
        if (globalGame !== null) {
            globalGame.updateTargetPos(id, targetX, targetY, targetDirection);
        }
    });

    socket.on('incSpeed', (id)=>{
        if (globalGame !== null) {
            globalGame.everyUnits[id].incSpeed();
        }
    });

    socket.on('decSpeed', (id)=>{
        if (globalGame !== null) {
            globalGame.everyUnits[id].decSpeed();
        }
    });

    socket.on('turnLeft', (id)=>{
        if (globalGame !== null) {
            globalGame.everyUnits[id].turnLeft();
        }
    });

    socket.on('turnRight', (id)=>{
        if (globalGame !== null) {
            globalGame.everyUnits[id].turnRight();
        }
    });

    socket.on('gameWon', ()=>{
        if (gameLoopInterval !== null) {
            clearInterval(gameLoopInterval);
            gameLoopInterval = null;
        }
    });
});

io.of('/').adapter.on('create-room', (room) => {
    console.log(`DEBUG: room ${room} was created`);
});

io.of('/').adapter.on('join-room', (room, id) => {
    console.log(`DEBUG: socket ${id} has joined room ${room}`);
});
