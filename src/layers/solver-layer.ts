import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { Array2 } from "../util/array2";
import { shuffle } from "../util/random";
import { LayerLogic } from "./layer";

export class MazeSolverLayer extends LayerLogic {
    constructor() {
        super("Solver", []);
    }

    apply(): ReturnsGenerator {
        const state = this.state!;
        return function* () {
            const queue: [number, number][] = [];
            state.maze.forEach((x, y, v) => {
                const left = state.maze.get(x - 1, y)?.solid;
                const right = state.maze.get(x + 1, y)?.solid;
                const up = state.maze.get(x, y - 1)?.solid;
                const down = state.maze.get(x, y + 1)?.solid;
                const count = [left, right, up, down].filter(c => c === false).length;
                if (count === 2 && (x % 2 === 1 || y % 2 === 1)) {
                    queue.push([x, y]);
                }
            });
            console.log("queue", queue.length);
            // shuffle
            shuffle(queue);
            // todo pop off queue, check opposing nonsolids are different rooms, if so,set min(r1,r2) to max(r1,r2) . yield;
            let cur = queue.shift();
            while (cur) {
                const [x, y] = cur;
                const left = state.maze.get(x - 1, y);
                const right = state.maze.get(x + 1, y);
                const up = state.maze.get(x, y - 1);
                const down = state.maze.get(x, y + 1);
                // horizontal
                if (left && !left.solid && right && !right.solid && left.roomId !== right.roomId) {
                    const low = Math.min(left.roomId, right.roomId);
                    const high = Math.max(left.roomId, right.roomId);
                    state.maze.forEach((x, y, v) => {
                        if (v.roomId === low) {
                            v.roomId = high;
                        }
                    });
                    const t = state.maze.get(x, y)!; //  { solid: false, roomId: high, type: "room" }
                    t.solid = false;
                    t.roomId = high;
                    t.type = "room";
                    yield;
                }
                // vertical
                else if (up && !up.solid && down && !down.solid && up.roomId !== down.roomId) {
                    const low = Math.min(up.roomId, down.roomId);
                    const high = Math.max(up.roomId, down.roomId);
                    state.maze.forEach((x, y, v) => {
                        if (v.roomId === low) {
                            v.roomId = high;
                        }
                    });
                    const t = state.maze.get(x, y)!; ///, { solid: false, roomId: high, type: "hall" });
                    t.solid = false;
                    t.roomId = high;
                    t.type = "hall";
                    yield;
                }
                cur = queue.shift();
            }
            yield;
        };
    }
}
