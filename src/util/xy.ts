export type XY = [number, number];

export function addXY(a: XY, b: XY): XY {
    return [a[0] + b[0], a[1] + b[1]];
}

export type Rect = {
    left:number,
    top: number,
    width:number,
    height:number
};