import { addXY, XYReadOnly, type Rect, type XY } from "./xy";

export class Array2<T> {
    private data: T[] = [];
    public constructor(
        public readonly w: number,
        public readonly h: number,
        fill: (x: number, y: number) => T,
    ) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                this.data[x + y * w] = fill(x, y);
            }
        }
    }

    public inBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }

    public get(x: number, y: number): T | undefined {
        return this.inBounds(x, y) ? this.data[x + y * this.w] : undefined;
    }

    public doIf(x: number, y: number, func: (x: number, y: number, v: T) => unknown) {
        const a = this.get(x, y);
        if (a !== undefined) {
            func(x, y, a);
        }
    }

    public set(x: number, y: number, value: T) {
        if (this.inBounds(x, y)) {
            this.data[x + y * this.w] = value;
        }
    }

    public map(fn: (x: number, y: number, v: T) => T) {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                this.data[x + y * this.w] = fn(x, y, this.data[x + y * this.w]);
            }
        }
    }

    public clone<U>(fn: (x: number, y: number, v: T) => U): Array2<U> {
        return new Array2<U>(this.w, this.h, (x, y) => fn(x, y, this.data[x + y * this.w]));
    }

    public forEach(fn: (x: number, y: number, v: T) => void) {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                fn(x, y, this.data[x + y * this.w]);
            }
        }
    }

    // TODO create a foreach that returns a generator that yeilds for each element
    // or kind of curries and returns a list of functions withn o arguments that
    // the caller can invoke and yield in between

    public forEachRect(rect: Rect, fn: (x: number, y: number, v: T) => void) {
        for (let y = rect.top; y < rect.top + rect.height; y++) {
            for (let x = rect.left; x < rect.left + rect.width; x++) {
                const value = this.get(x, y);
                if (value !== undefined) {
                    fn(x, y, value);
                }
            }
        }
    }

    public getKernel(centre: XYReadOnly, offset: XY[]): (T | undefined)[] {
        return offset.map(o => addXY(centre, o)).map(([x, y]) => this.get(x, y));
    }
}
