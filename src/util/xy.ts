export type XY = [number, number];
export type XYReadOnly = readonly [number, number];

export function addXY(a: XYReadOnly, b: XYReadOnly): XY {
    return [a[0] + b[0], a[1] + b[1]];
}
export function scaleXY(a: XYReadOnly, scale: number): XY {
    return [a[0] * scale, a[1] * scale];
}

export function equalsXY(a: XYReadOnly, b: XYReadOnly): boolean {
    return a[0] === b[0] && a[1] === b[1];
}
export function cloneXY<T extends undefined | XY>(a: T): T {
    return (a ? [a[0], a[1]] : undefined) as T;
}

export type Rect = {
    left: number;
    top: number;
    width: number;
    height: number;
};
