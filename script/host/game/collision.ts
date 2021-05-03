import {Game} from './game.js';
import {Movable} from './movable.js';
import {euclideanDist} from '../../utils.js';


export class CollisionHandler {
    units: Movable[];
    game: Game;

    hSize: number; // NUmber of horizontal grids
    vSize: number; // Number of vertical grids
    gridSize: number;

    grids: Movable[][][];

    constructor(game: Game, gridSize: number) {
        this.units = [];
        this.game = game;

        if ((this.game.gameHeight % gridSize !== 0) ||(this.game.gameWidth % gridSize !== 0)) {
            throw Error('Game height and width must be multiple of grid_size!');
        }
        this.gridSize = gridSize;
        this.hSize = ~~(this.game.gameWidth/gridSize);
        this.vSize = ~~(this.game.gameHeight/gridSize);

        this.grids = [[[]]];
    }

    detectCollisions() {
        this.initializeEmptyGrid();
        this.units.forEach((unit)=>{
            this.addUnitToGrid(unit);
        });

        for (let y = 0; y < this.vSize; ++y) {
            for (let x = 0; x < this.hSize; ++x) {
                this.grids[y][x].forEach((unit)=>{
                    this.checkUnitCollision(unit, x, y);
                });
            }
        }
    }

    addUnit(unit: Movable): void {
        this.units.push(unit);
    }

    private initializeEmptyGrid(): void {
        const grids: Movable[][][] = new Array<Movable[][]>(this.vSize);
        for (let y = 0; y < this.vSize; ++y) {
            grids[y] = new Array<Movable[]>(this.hSize);
            for (let x = 0; x < this.hSize; ++x) {
                grids[y][x] = [];
            }
        }
        this.grids = grids;
    }

    private addUnitToGrid(unit: Movable): void {
        const horizontalPos: number = Math.trunc(unit.x / this.gridSize);
        const verticalPos: number = Math.trunc(unit.y / this.gridSize);
        this.grids[verticalPos][horizontalPos].push(unit);
    }

    private checkUnitCollision(unit: Movable, x: number, y:number): void {
        this.grids[y][x].forEach((another)=>{
            if (unit !== another) {
                if (this.isCollide(unit, another)) {
                    this.game.collide(unit, another);
                }
            }
        });
        if (x !== this.hSize-1) {
            // Right grid
            this.checkUnitCollisionWithGrid(unit, x + 1, y);
        }
        if (y !== this.vSize - 1) {
            // Bottom grid
            this.checkUnitCollisionWithGrid(unit, x, y+1);
            if (x !== 0) {
                // Bottom left grid
                this.checkUnitCollisionWithGrid(unit, x-1, y+1);
            }
            if (x !== this.hSize-1) {
                // Bottom right grid
                this.checkUnitCollisionWithGrid(unit, x+1, y + 1);
            }
        }
    }

    private checkUnitCollisionWithGrid(unit: Movable, targetX: number, targetY: number): void {
        this.grids[targetY][targetX].forEach((another)=>{
            if (this.isCollide(unit, another)) {
                this.game.collide(unit, another);
            }
        });
    }

    private isCollide(unit: Movable, another: Movable): boolean {
        // For now, assume all sprites are circle
        const distance: number = euclideanDist(unit.x, unit.y, another.x, another.y);
        const safeDistance: number = unit.unitSize / 2 + another.unitSize / 2;
        return distance < safeDistance;
    }
}
