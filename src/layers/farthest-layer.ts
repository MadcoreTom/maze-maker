import { ReturnsGenerator, State, Tile } from "../types";
import { pickRandom } from "../util/random";
import { addXY, equalsXY, XY } from "../util/xy";
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
            // initialise
            (state.maze.get(start[0], start[1]) as Tile).distance = 0;
            let queue: XY[] = [start];
            let last: XY = start;
            // calc distance
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
                last = q;
                yield;
            }
            // clear distance
            state.maze.forEach((x,y,t)=>t.distance = MAX_DIST);
            // initialise again for last (fathest point from our random point)
            (state.maze.get(last[0], last[1]) as Tile).distance = 0;
            queue = [last];
            let last2: XY = last;
            // calc distance
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
                last2 = q;
                yield;
            }
            // plot the path form last2 to last by moving to neighbours with lower distance
            let cur: XY = [last2[0],last2[1]];
            while(cur[0] != last[0] || cur[1] != last[1]){
                const t = state.maze.get(cur[0],cur[1]) as Tile;
                t.mainPath = true;
                const d = t.distance as number;
                const options = state.maze.getKernel(cur, kernel)
                    .map((t, i) => t && t.distance != undefined && t.distance < d ? addXY(cur, kernel[i]) : null)
                    .filter(x => x != null);
                cur = options[0];
                console.log(cur)
                yield;
            }
            // and the last one
            const t = state.maze.get(cur[0],cur[1]) as Tile;
            t.mainPath = true;
            state.start = last2;
            state.end = cur;
            yield;
            // set the path as distance 0 and add to the queue, the others are max
            queue = [];
            state.maze.forEach((x,y,t)=>{
                if(t.mainPath){
                    t.distance = 0;
                    queue.push([x,y]);
                } else {
                    t.distance = MAX_DIST;
                }
            });
            // calc distance from the path
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
                state.farthestFromPath = [q[0],q[1]];
                yield;
            }
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
                if(v.mainPath){
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "white";
                    ctx.strokeRect(
                        Math.floor(x / 2) * f + Math.ceil(x / 2) * wa,
                        Math.floor(y / 2) * vf + Math.ceil(y / 2) * vwa,
                        x % 2 == 0 ? wa : f,
                        y % 2 == 0 ? vwa : vf
                    );
                }
                if(state.farthestFromPath && equalsXY(state.farthestFromPath,[x,y])){
                    ctx.lineWidth = 5;
                    ctx.fillStyle = "rgba(255,255,255,0.5)";
                    ctx.fillRect(
                        Math.floor(x / 2) * f + Math.ceil(x / 2) * wa+2,
                        Math.floor(y / 2) * vf + Math.ceil(y / 2) * vwa+2,
                        (x % 2 == 0 ? wa : f) -4,
                        (y % 2 == 0 ? vwa : vf) -4
                    );
                }
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