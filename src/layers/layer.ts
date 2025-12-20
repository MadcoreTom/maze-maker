import { ReturnsGenerator, State, Tile, Tile2 } from "../types";

export abstract class Layer3 {
    public state?: State;
    public prev?: Layer3;
    public next?: Layer3;
    constructor(
        public readonly title: string,
        public readonly params: Parameter[]
    ) {

    }
    public init(state?: State) {
        this.state = this.convert(state);
        console.log("INIT", state, " -> ", this.state)
    }
    protected convert(state?: State): State {
        if (!state) return this.createInitialState();
        return this.deepCopy(state);
    }
    protected abstract createInitialState(): State;
    protected deepCopy(state: State): State {
        return {
            maze: state.maze.clone((x, y, v) => ({ ...v })),
            generatorStack: [...state.generatorStack],
            queue: state.queue ? [...state.queue] : undefined
        };
    }
    abstract apply(): ReturnsGenerator;
    abstract render(ctx: CanvasRenderingContext2D);
    protected getNumberParam(name: string, defaultValue: number): number {
        const p = this.params.filter(p => p.type == "number" && p.name == name)[0];
        return p ? p.value : defaultValue;
    }
}

export type Parameter = {
    name: string,
    type: "number",
    min: number,
    max: number,
    value: number
}