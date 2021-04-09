import * as pixiNamespace from 'pixi.js';
import {Application} from 'pixi.js';
import {Game} from './game.js';
import {UnitTypes} from './units/unitTypes.js';

declare let PIXI: typeof pixiNamespace;

const app: Application = new PIXI.Application({
    transparent: false,
    width: window.innerWidth,
    height: window.innerHeight,
});
document.body.appendChild(app.view);

/**
 * Disable right click.
 */
app.view.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

const game = new Game(3000, 6000, app);
const interaction = game.getInteractionObject();
const commander = game.addUnit(100, 200, UnitTypes.Commander, false);
const infantry = game.addUnit(200, 200, UnitTypes.Infantry);
const cavalry = game.addUnit(300, 200, UnitTypes.Cavalry);
interaction.bindMovementControl(cavalry);
game.fixCamera(cavalry);
game.showGame(app);
game.attachGameLoop(app.ticker);
