export function fmod(a: number, b:number): number {
    return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
}

export function euclideanDist(x: number, y:number, targetX:number, targetY: number) {
    return Math.sqrt((x - targetX)**2 + (y - targetY)**2);
}

export function angleToAnother(x: number, y: number, anotherX: number, anotherY: number) {
    return Math.atan2((anotherY-y), (anotherX-x)) + Math.PI / 2;
}
