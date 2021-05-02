import {Game} from './game.js';
import {MovableSprite} from './moveableSprite.js';
import {euclideanDist} from './utils.js';


export class CollisionHandler {
    units: MovableSprite[];
    game: Game;

    hSize: number; // NUmber of horizontal grids
    vSize: number; // Number of vertical grids
    gridSize: number;

    grids: MovableSprite[][][];

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

    addUnit(unit: MovableSprite): void {
        this.units.push(unit);
    }

    private initializeEmptyGrid(): void {
        const grids: MovableSprite[][][] = new Array<MovableSprite[][]>(this.vSize);
        for (let y = 0; y < this.vSize; ++y) {
            grids[y] = new Array<MovableSprite[]>(this.hSize);
            for (let x = 0; x < this.hSize; ++x) {
                grids[y][x] = [];
            }
        }
        this.grids = grids;
    }

    private addUnitToGrid(unit: MovableSprite): void {
        const horizontalPos: number = Math.trunc(unit.x / this.gridSize);
        const verticalPos: number = Math.trunc(unit.y / this.gridSize);
        this.grids[verticalPos][horizontalPos].push(unit);
    }

    private checkUnitCollision(unit: MovableSprite, x: number, y:number): void {
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

    private checkUnitCollisionWithGrid(unit: MovableSprite, targetX: number, targetY: number): void {
        this.grids[targetY][targetX].forEach((another)=>{
            if (this.isCollide(unit, another)) {
                this.game.collide(unit, another);
            }
        });
    }

    private isCollide(unit: MovableSprite, another: MovableSprite): boolean {
        // For now, assume all sprites are circle
        const distance: number = euclideanDist(unit.x, unit.y, another.x, another.y);
        const safeDistance: number = unit.unitSize / 2 + another.unitSize / 2;
        return distance < safeDistance;
    }
}
