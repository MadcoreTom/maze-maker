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
                    const solid = x % 2 == 0 || y % 2 == 0;
                    return { solid: solid, roomId: !solid ? room++ : 0 }
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

type StateSolver = StateInit & {queue:[number,number][]};

class MazeSolverLayer extends Layer3<StateInit, StateSolver> {
    constructor() {
        super("Solver", []);
    }
    convert(state: StateInit): StateSolver {
        const queue:[number,number][] = [];
        state.maze.forEach((x,y,v)=>{
            const left = state.maze.get(x-1,y)?.solid;
            const right= state.maze.get(x+1,y)?.solid;
            const up= state.maze.get(x,y-1) ?.solid;
            const down = state.maze.get(x,y+1) ?.solid;
            const count = [left,right,up,down].filter(c=>c===false).length;
            if(count == 2){
                queue.push([x,y]);
            }
        });
        // shuffle
        for(let i=0;i<queue.length -1;i++){
            const r = Math.floor(Math.random() * (queue.length -i))+i;
            const tmp = queue[r];
            queue[r] = queue[i];
            queue[i] = tmp;
        }
        return {
            maze: new Array2<Tile>(state.maze.w, state.maze.h, (x, y) => ({ ...state.maze.get(x, y) as Tile })) // TODO implement a clone method
            ,
            queue
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
    apply(): ReturnsGenerator {
        const state = this.state as StateSolver;
        return function* () {
console.log(state.queue)
// todo pop off queue, check opposing nonsolids are different rooms, if so,set min(r1,r2) to max(r1,r2) . yield;
            let cur = state.queue.shift();
            while(cur){
                const [x,y] = cur;
                const left = state.maze.get(x-1,y);
                const right= state.maze.get(x+1,y);
                const up= state.maze.get(x,y-1) ;
                const down = state.maze.get(x,y+1);
console.log("",left,right,up,down);
                // horizontal
                if(left && !left.solid && right && !right.solid && left.roomId != right.roomId){
                    const low = Math.min(left.roomId, right.roomId);
                    const high= Math.max(left.roomId, right.roomId);
                    state.maze.forEach((x,y,v)=>{
                        if(v.roomId == low){
                            v.roomId = high;
                        }
                    })
                    state.maze.set(x,y, {solid: false, roomId: high});
                    console.log("h")
                }
                // vertical
                else if(up && !up.solid && down && !down.solid && up.roomId != down.roomId){
                    const low = Math.min(up.roomId, down.roomId);
                    const high= Math.max(up.roomId, down.roomId);
                    state.maze.forEach((x,y,v)=>{
                        if(v.roomId == low){
                            v.roomId = high;
                        }
                    })
                    state.maze.set(x,y, {solid: false, roomId: high})
                }
                yield; // todo if there isnt a match, dont yeilf unless it happens a bunch

                cur = state.queue.shift();
            }
        }
    }
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
                    console.log(x, y)
                    t.solid = !t.solid;
                }
                const tmp = state.maze.get(0, 0);
                if (tmp) {
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
const L3 = new MazeSolverLayer();
L2.next = L3;
L3.prev = L2;

export const ALL_LAYERS: { [id: string]: Layer3<any, any> } = {};
ALL_LAYERS[L1.title] = L1;
ALL_LAYERS[L2.title] = L2;
ALL_LAYERS[L3.title] = L3;

export type Parameter = {
    name: string,
    type: "number",
    min: number,
    max: number,
    value: number
}


type StateInit = { maze: Array2<Tile> };