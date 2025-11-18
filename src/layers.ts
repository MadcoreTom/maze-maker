import { Array2, ReturnsGenerator, State, Tile } from "./types"

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
class FirstLayer extends Layer3<void, StateInit> {
    constructor() {
        super("First", [
            {
                name: "Width",
                type: "number",
                min: 1,
                max: 100,
                value: 21
            },
            {
                name: "Height",
                type: "number",
                min: 1,
                max: 100,
                value: 21
            }
        ])
    }
    convert(state: void): StateInit {
        let room = 1;
        return {
            maze: new Array2<Tile>(
                this.getNumberParam("Width", 10),
                this.getNumberParam("Height", 10),
                (x, y) => {
                    const solid = x % 2 == 1 && y % 2 == 1;
                    return { solid: solid, roomId: solid ? room++ : 0 }
                }
            )
        }
    }
    apply(): ReturnsGenerator {
        return function* () {

        }
    };
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
}

function renderInitState(ctx: CanvasRenderingContext2D, state: StateInit) {
    ctx.fillStyle = "white";
    const w = 600, h = 600;
    ctx.fillRect(0, 0, w, h);
    const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h));
    state.maze.forEach((x, y, v) => {
        ctx.fillStyle = v.solid ? "navy" : "yellow";
        ctx.fillRect(x * s, y * s, s, s);
    });
    ctx.strokeStyle = "black"
    state.maze.forEach((x, y, v) => {
        ctx.strokeRect(x * s, y * s, s, s);
    });
}

class RandomizeLayer extends Layer3<StateInit, StateInit> {
    constructor() {
        super("Randomize", [{
            name: "iterations",
            min: 0,
            max: 100,
            value: 0,
            type: "number"
        }
        ])
    }
    convert(state: StateInit): StateInit {
        return {
            maze: new Array2<Tile>(state.maze.w, state.maze.h, (x, y) => ({ ...state.maze.get(x, y) as Tile }))
        }
    }
    apply(): ReturnsGenerator {
        console.log("apply rand", this.state)
        const state = this.state as StateInit;
        const count = this.getNumberParam("iterations", 0);
        return function* () {
            for (let i = 0; i < count; i++) {
                const x = Math.floor(Math.random() * state.maze.w);
                const y = Math.floor(Math.random() * state.maze.h);
                const t = state.maze.get(x, y);
                if (t) {
                    console.log(x,y)
                    t.solid = !t.solid;
                }
                const tmp = state.maze.get(0,0);
                if(tmp){
                    tmp.solid = Math.random() > 0.5;
                }
                yield;
            }
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        console.log("r", this.state)
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
}

export const L1 = new FirstLayer();
const L2 = new RandomizeLayer();
L1.next = L2; 
L2.prev = L1;

export const ALL_LAYERS: { [id: string]: Layer3<any, any> } = {};
ALL_LAYERS[L1.title] = L1;
ALL_LAYERS[L2.title] = L2;

export type Parameter = {
    name: string,
    type: "number",
    min: number,
    max: number,
    value: number
}


type StateInit = { maze: Array2<Tile> };