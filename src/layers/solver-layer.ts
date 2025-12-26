import { renderRoomIds } from "../layers";
import { Array2 } from "../util/array2";
import { ReturnsGenerator, State, Tile } from "../types";
import { LayerLogic } from "./layer";
import { shuffle } from "../util/random";

export class MazeSolverLayer extends LayerLogic {
    constructor() {
        super("Solver", []);
    }
    protected createInitialState(): State {
        throw new Error("MazeSolverLayer requires an input state");
    }
    private internalInit() {
        const state = this.state as State;
        const queue: [number, number][] = [];
        state.maze.forEach((x, y, v) => {
            const left = state.maze.get(x - 1, y)?.solid;
            const right = state.maze.get(x + 1, y)?.solid;
            const up = state.maze.get(x, y - 1)?.solid;
            const down = state.maze.get(x, y + 1)?.solid;
            const count = [left, right, up, down].filter(c => c === false).length;
            if (count == 2 && (x % 2 == 1 || y % 2 == 1)) {
                queue.push([x, y]);
            }
        });
        console.log("queue", queue.length)
        // shuffle
        shuffle(queue);
        this.state = {
            maze: new Array2<Tile>(state.maze.w, state.maze.h, (x, y) => ({ ...state.maze.get(x, y) as Tile })),
            queue
        }
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderRoomIds(ctx, this.state);
        }
    }
    apply(): ReturnsGenerator {
        this.internalInit();
        const state = this.state!;
        return function* () {
            state.queue = state.queue || [];
            // todo pop off queue, check opposing nonsolids are different rooms, if so,set min(r1,r2) to max(r1,r2) . yield;
            let cur = state.queue.shift();
            while (cur) {
                const [x, y] = cur;
                const left = state.maze.get(x - 1, y);
                const right = state.maze.get(x + 1, y);
                const up = state.maze.get(x, y - 1);
                const down = state.maze.get(x, y + 1);
                // horizontal
                if (left && !left.solid && right && !right.solid && left.roomId != right.roomId) {
                    const low = Math.min(left.roomId, right.roomId);
                    const high = Math.max(left.roomId, right.roomId);
                    state.maze.forEach((x, y, v) => {
                        if (v.roomId == low) {
                            v.roomId = high;
                        }
                    })
                    state.maze.set(x, y, { solid: false, roomId: high, type: "room" });
                }
                // vertical
                else if (up && !up.solid && down && !down.solid && up.roomId != down.roomId) {
                    const low = Math.min(up.roomId, down.roomId);
                    const high = Math.max(up.roomId, down.roomId);
                    state.maze.forEach((x, y, v) => {
                        if (v.roomId == low) {
                            v.roomId = high;
                        }
                    })
                    state.maze.set(x, y, { solid: false, roomId: high, type: "hall" })
                }
                yield; // todo if there isnt a match, dont yeilf unless it happens a bunch

                cur = state.queue.shift();
            }
        }
    }
}
