import { ReturnsGenerator, State, Tile } from "../types";
import { pickRandom } from "../util/random";
import { addXY, XY } from "../util/xy";
import { LayerLogic } from "./layer";

const kernel: XY[] = [[-1,0],[0,-1],[1,0],[0,1]];
const MAX_DIST = 99999;

export class FarthestLayer extends LayerLogic {
    public constructor(){
        super("Farthest", [

        ])
    }
    apply(): ReturnsGenerator {
        const state = this.state as State;
        return function*(){
            // find random point
            const options: XY[] = [];
            state.maze.forEach((x,y,t)=>{
                if(!t.solid){
                    options.push([x,y]);
                }
                t.distance = MAX_DIST;
            });
            const start = pickRandom(options);
            (state.maze.get(start[0], start[1]) as Tile).distance = 0;
            let queue: XY[] = [start];
            while(queue.length > 0){
                const q = queue.shift() as XY;
                const t = state.maze.get(q[0],q[1]) as Tile;
                state.maze.getKernel(q, kernel).forEach((n,i)=>{
                    // if not visited
                    if (n && n.distance == MAX_DIST && !n?.solid){
                        n.distance = (t.distance  || 0)+ 1;
                        queue.push(addXY(kernel[i],q));
                    }
                });
                yield;
            }
            // calc distance
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            const state = this.state;
            ctx.fillStyle = "red";
            const w = 600, h = 600;
            ctx.fillRect(0, 0, w, h);
            const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h)) * 2;
            const wa = Math.ceil(s * 0.2);
            const f = s - wa;
            // vertical
            const vwa = Math.ceil(s * 0.4);
            const vf = s - vwa;
            state.maze.forEach((x, y, v) => {
                ctx.fillStyle = colorMap[v.type];
                if(v.distance != MAX_DIST){
                    ctx.fillStyle = `hsl(${v.distance * 3}, 100%, 50%)`;
                }
                ctx.fillRect(
                    Math.floor(x / 2) * f + Math.ceil(x / 2) * wa,
                    Math.floor(y / 2) * vf + Math.ceil(y / 2) * vwa,
                    x % 2 == 0 ? wa : f,
                    y % 2 == 0 ? vwa : vf
                );
            });

        }
    }
}


const colorMap = {
    "hall": "limegreen",
    "outside": "black",
    "room": "orange",
    "wall": "blue",
    "door": "magenta"
}