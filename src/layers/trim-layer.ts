import { renderInitState, StateInit, StateSolver } from "../layers";
import { ReturnsGenerator, Tile } from "../types";
import { Layer3 } from "./layer";

export class EndTrimmerLayer extends Layer3< StateSolver,StateInit> {
    constructor() {
        super("Trimmer", [
            {
                name: "iterations",
                min:0,
                max:100,
                value:2,
                type:"number"
            }
        ]);
    }
    convert(state: StateSolver): StateInit {
        return {
            maze: state.maze.clone((x,y,v)=>({...v}))
        };
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
    apply(): ReturnsGenerator {
        const state = this.state as StateSolver;
        const iterations = this.getNumberParam("iterations", 0);
        return function* () {
            for (let i = 1; i < iterations; i++) {
                const queue: [number, number][] = [];
                state.maze.forEach((x, y, v) => {
                    if (x > 0 && y > 0 && x < state.maze.w - 1 && y < state.maze.h - 1 && !state.maze.get(x, y)?.solid) {
                        const neighbours = [
                            state.maze.get(x - 1, y),
                            state.maze.get(x + 1, y),
                            state.maze.get(x, y - 1),
                            state.maze.get(x, y + 1)
                        ].filter(a => a && !a.solid).length;
                        if (neighbours == 1) {
                            queue.push([x, y]);
                        }
                    }
                });
                yield;
                // TODO shuffle queue?
                for (let [x, y] of queue) {
                    (state.maze.get(x, y) as Tile).solid = true;
                    yield;
                }
            }
        }
    }
}
