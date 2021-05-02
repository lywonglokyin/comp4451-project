import express from 'express';
import * as http from 'http';
import {Server} from 'socket.io';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/js-script', express.static('js-script'));
app.use('/images', express.static('images'));

app.get('/', (req, res)=>{
    res.sendFile(join(__dirname, '../', 'index.html'));
});

const server = http.createServer(app).listen(8000);

const io = new Server(server);


app.listen(8080, ()=>{
    console.log('Listening on port 8080');
});
