import { FirstLayer } from "./layers/first-layer";
import { Layer3 } from "./layers/layer";
import { RoomLayer } from "./layers/room-layer";
import { MazeSolverLayer } from "./layers/solver-layer";
import { EndTrimmerLayer } from "./layers/trim-layer";
import { FillHairpinsLayer } from "./layers/fill-hairpins-layer";
import { Array2 } from "./util/array2";
import { ReturnsGenerator, State, Tile } from "./types"


export function renderInitState(ctx: CanvasRenderingContext2D, state: StateInit) {
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


export function renderRoomIds(ctx: CanvasRenderingContext2D, state: StateInit) {
    ctx.fillStyle = "white";
    const w = 600, h = 600;
    ctx.fillRect(0, 0, w, h);
    const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h));
    state.maze.forEach((x, y, v) => {
        ctx.fillStyle = v.solid ? "navy" : `hsl(${v.roomId*10},80%,60%)`;
        ctx.fillRect(x * s, y * s, s, s);
    });
    ctx.strokeStyle = "black"
    state.maze.forEach((x, y, v) => {
        ctx.strokeRect(x * s, y * s, s, s);
    });
}

export type StateSolver = StateInit & {queue:[number,number][]};



function registerLayer<A>(cur:Layer3<A,any>, prev?:Layer3<any,A>){
    if(prev){
        prev.next = cur;
        cur.prev = prev;
    }
    ALL_LAYERS[cur.title] = cur;
}


export const ALL_LAYERS: { [id: string]: Layer3<any, any> } = {};

export const L1 = new FirstLayer();
const L1_5 = new RoomLayer();
const L2 = new MazeSolverLayer();
const L3 = new EndTrimmerLayer();
const L4 = new FillHairpinsLayer();
registerLayer(L1);
registerLayer(L1_5, L1);
registerLayer(L2, L1_5);
registerLayer(L3,L2);
registerLayer(L4,L3);





export type StateInit = { maze: Array2<Tile> };