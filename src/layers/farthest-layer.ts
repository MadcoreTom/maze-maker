import { ReturnsGenerator, State, Tile } from "../types";
import { pickRandom } from "../util/random";
import { addXY, equalsXY, Rect, XY } from "../util/xy";
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

    private renderTiles(ctx: CanvasRenderingContext2D, state: State,
        options: {wallWidth:number, wallHeight:number},
    renderers: {
        tile: (s:State,t:Tile,xy:XY, rect:Rect)=>void,
        vWall: (s:State,t:Tile,xy:XY, rect:Rect)=>void,
        hWall: (s:State,t:Tile,xy:XY, rect:Rect)=>void,
        corner: (s:State,t:Tile,xy:XY, rect:Rect)=>void,
    }) {
            // background
            ctx.fillStyle = "red";
            const w = 600, h = 600;
            ctx.fillRect(0, 0, w, h);
            // Work out tile sizes
            const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h)) * 2; // Size in both x and y of 2 tiles
            const wallWidth = Math.ceil(s * options.wallWidth);
            const tileWidth = s - wallWidth;
            const wallHeight = Math.ceil(s * options.wallHeight);
            const tileHeight = s - wallHeight;
            // For each tile
            state.maze.forEach((x,y,t)=>{
                const left = Math.floor(x/2) * tileWidth + Math.ceil(x/2) * wallWidth;
                const top = Math.floor(y/2) * tileHeight + Math.ceil(y/2) * wallHeight;
                if(x % 2 == 0){
                    if(y % 2 == 0){
                        renderers.corner(state, t, [x,y],{top, left, width: wallWidth, height: wallHeight});
                    } else {
                        renderers.vWall(state, t, [x,y],{top, left, width: wallWidth, height: tileHeight});
                    }
                } else {
                    if(y % 2 == 0){
                        renderers.hWall(state, t, [x,y],{top, left, width: tileWidth, height: wallHeight});
                    } else {
                        renderers.tile(state, t, [x,y],{top, left, width: tileWidth, height: tileHeight});
                    }
                }
            });
    }

    render(ctx: CanvasRenderingContext2D) {
        if(this.state){
            const state = this.state;
            this.renderTiles(
                ctx, state,
                {wallWidth: 0.2, wallHeight: 0.4},
                {
                    corner: (s,t,xy,rect) => {
                        if(t.type == "wall"){
                            const below = state.maze.get(xy[0],xy[1]+1);
                            if(below && below.type == "wall"){
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                            } else if(!below || below.type == "outside") {
                                ctx.fillStyle = "black";
                                ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height/2); // TODO rounding errors
                            } else {
                                ctx.fillStyle = colorMap[t.type];
                                ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height/2); // TODO rounding errors
                            }
                        } else if(t.type == "outside"){
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        }
                    },
                    hWall: (s,t,xy,rect) => {
                        if(t.type == "wall"){
                            const below = state.maze.get(xy[0],xy[1]+1);
                            if(!below || below.type == "outside"){
                                ctx.fillStyle = "black";
                            } else {
                                ctx.fillStyle = colorMap[t.type];

                            }
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                            ctx.fillStyle = "magenta";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height/2); // TODO rounding errors
                        } else if(t.type == "outside"){
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        }
                    },
                    vWall: (s,t,xy,rect) => {
                        if(t.type == "wall"){
                            ctx.fillStyle = "magenta";
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        } else if(t.type == "outside"){
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top,rect.width, rect.height);
                        }
                    },
                    tile: (s,t,xy,rect) => {
                        ctx.fillStyle = colorMap[t.type];
                        if(t.distance != undefined && t.distance != MAX_DIST){
                            ctx.fillStyle = `hsl(${t.distance * 3}, 100%, 50%)`;
                        }
                        if(t.mainPath){
                            ctx.fillStyle = "white";
                        }
                        if(s.farthestFromPath && equalsXY(s.farthestFromPath, xy)){
                            ctx.fillStyle = "yellow";
                        }
                        ctx.fillRect(rect.left, rect.top,rect.width, rect.height)
                    }
                }
            )
        }
        /*
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
            */
    }
        
}


const colorMap = {
    "hall": "limegreen",
    "outside": "black",
    "room": "orange",
    "wall": "blue",
    "door": "red"
}