import { ReturnsGenerator, State, Tile } from "../types";

export abstract class LayerLogic {
    public state?: State;
    public prev?: LayerLogic;
    public next?: LayerLogic;
    constructor(
        public readonly title: string,
        public readonly params: Parameter[]
    ) {

    }
    public init(state: State) {
        this.state = this.cloneState(state);
        console.log("INIT", state, " -> ", this.state)
    }
    protected cloneState(state: State): State {
        return {
            maze: state.maze.clone((x, y, v) => ({ ...v })),
            queue: state.queue ? [...state.queue] : undefined
        };    }
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