export function fmod(a: number, b:number): number{
    return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
}