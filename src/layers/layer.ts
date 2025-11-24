import { ReturnsGenerator } from "../types";

export abstract class Layer3<A, B> {
    public state?: B;
    public prev?: Layer3<any, A>;
    public next?: Layer3<B, any>;
    constructor(
        public readonly title: string,
        public readonly params: Parameter[]
    ) {

    }
    public init(state: A) {
        this.state = this.convert(state);
        console.log("INIT", state, " -> ", this.state)
    }
    abstract convert(state: A): B;
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