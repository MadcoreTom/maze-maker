import { renderInitState, StateBanana, StateInit, Tile2 } from "../layers";
import { ReturnsGenerator } from "../types";
import { shuffle } from "../util/random";
import { XY } from "../util/xy";
import { Layer3 } from "./layer";

export class IdentifierLayer extends Layer3<StateInit, StateBanana> {
    constructor() {
        super("Identify", [])
    }
    convert(state: StateInit): StateBanana {
        return {
            maze: state.maze.clone((x, y, v) => ({ ...v, type: "outside" }))
        };
    }
    apply(): ReturnsGenerator {
        const kernel: XY[] = [
            [-1, -1], [-1, 0], [0, -1], [0, 0]
        ];
        const wallKernel: XY[] = [
            [-1,-1], [0, -1], [1, -1],
            [ -1,0],[ 1,0],
            [-1,1],[0,1],[1,1]
        ]
        const state = this.state as StateBanana;
        return function* () {
            // find room and hallways
            state.maze.forEach((x, y, v) => {
                if (v) {
                    if (!v.solid) {
                        const k = state.maze.getKernel([x, y], kernel);
                        if (k.filter(a => a && !a.solid).length == 4) {
                            (k[0] as Tile2).type = "room";
                            (k[1] as Tile2).type = "room";
                            (k[2] as Tile2).type = "room";
                            (k[3] as Tile2).type = "room";
                        } else if (k[3] && !k[3].solid) {
                            v.type = "hall"
                        }
                    } else {
                        const k = state.maze.getKernel([x, y], wallKernel);
                        if(k.filter(a=>a && !a.solid).length > 0){
                            v.type = "wall";
                        }
                    }
                }
            });
            // TODO if near a room or a hall its a wall, and the rest is outside
            yield;

        }
    };
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            const state = this.state;
            ctx.fillStyle = "white";
            const w = 600, h = 600;
            ctx.fillRect(0, 0, w, h);
            const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h));
            state.maze.forEach((x, y, v) => {
                ctx.fillStyle = colorMap[v.type];
                ctx.fillRect(x * s, y * s, s, s);
            });
            ctx.strokeStyle = "black"
            state.maze.forEach((x, y, v) => {
                ctx.strokeRect(x * s, y * s, s, s);
            });
        }
    }
}

const colorMap = {
    "hall": "limegreen",
    "outside": "navy",
    "room": "orange",
    "wall": "blue"
}