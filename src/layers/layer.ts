import { cloneState, cloneTile, type State, type Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import type { Rect, XY } from "../util/xy";
import { GridRenderer, type Renderer } from "./render";

export abstract class LayerLogic {
    public state?: State;
    public prev?: LayerLogic;
    public next?: LayerLogic;
    constructor(
        public readonly title: string,
        public readonly params: Parameter[],
        public readonly renderer: Renderer = new GridRenderer(),
    ) {}
    public init(state: State) {
        this.state = cloneState(state);
        console.log("INIT", state, " -> ", this.state);
    }
    abstract apply(): ReturnsGenerator;
    protected getNumberParam(name: string, defaultValue: number): number {
        const p = this.params.filter(p => p.type === "number" && p.name === name)[0];
        return p ? p.value : defaultValue;
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
