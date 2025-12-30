import { cloneState, cloneTile, type State, type Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import type { Rect, XY } from "../util/xy";

export abstract class LayerLogic {
    public state?: State;
    public prev?: LayerLogic;
    public next?: LayerLogic;
    constructor(
        public readonly title: string,
        public readonly params: Parameter[],
    ) {}
    public init(state: State) {
        this.state = cloneState(state);
        console.log("INIT", state, " -> ", this.state);
    }
    abstract apply(): ReturnsGenerator;
    abstract render(ctx: CanvasRenderingContext2D);
    protected getNumberParam(name: string, defaultValue: number): number {
        const p = this.params.filter(p => p.type === "number" && p.name === name)[0];
        return p ? p.value : defaultValue;
    }

    protected renderTiles(
        ctx: CanvasRenderingContext2D,
        state: State,
        options: { wallWidth: number; wallHeight: number },
        renderers: {
            tile: TileRenderer;
            vWall: TileRenderer;
            hWall: TileRenderer;
            corner: TileRenderer;
        },
    ) {
        // background
        ctx.fillStyle = "red";
        const w = 600,
            h = 600;
        ctx.fillRect(0, 0, w, h);
        // Work out tile sizes
        const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h)) * 2; // Size in both x and y of 2 tiles
        const wallWidth = Math.ceil(s * options.wallWidth);
        const tileWidth = s - wallWidth;
        const wallHeight = Math.ceil(s * options.wallHeight);
        const tileHeight = s - wallHeight;
        // For each tile
        state.maze.forEach((x, y, t) => {
            const left = Math.floor(x / 2) * tileWidth + Math.ceil(x / 2) * wallWidth;
            const top = Math.floor(y / 2) * tileHeight + Math.ceil(y / 2) * wallHeight;
            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    renderers.corner(state, t, [x, y], { top, left, width: wallWidth, height: wallHeight });
                } else {
                    renderers.vWall(state, t, [x, y], { top, left, width: wallWidth, height: tileHeight });
                }
            } else {
                if (y % 2 === 0) {
                    renderers.hWall(state, t, [x, y], { top, left, width: tileWidth, height: wallHeight });
                } else {
                    renderers.tile(state, t, [x, y], { top, left, width: tileWidth, height: tileHeight });
                }
            }
        });
    }
}

export type Parameter = {
    name: string;
    type: "number";
    min: number;
    max: number;
    value: number;
};

export type TileRenderer = (s: State, t: Tile, xy: XY, rect: Rect) => void;
