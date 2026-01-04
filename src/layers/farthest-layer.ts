import type { State } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance, MAX_DIST, tracePath } from "../util/distance";
import { pickRandom } from "../util/random";
import type { XY } from "../util/xy";
import { LayerLogic } from "./layer";
import { PathRenderer } from "./render";

export class FarthestLayer extends LayerLogic {
    public constructor() {
        super("Farthest", [], new PathRenderer("distance", MAX_DIST, "mainPath"));
    }

    apply(): ReturnsGenerator {
        const state = this.state as State;

        return function* () {
            // find random point
            const options: XY[] = [];
            state.maze.forEach((x, y, t) => {
                if (!t.solid) {
                    options.push([x, y]);
                }
                t.distance = MAX_DIST;
            });
            const start = pickRandom(options);
            // calc distance from that point
            const last = yield* calcDistance(state.maze, [start], "distance");
            // calc distance from that new fartheset point `last`
            const last2 = yield* calcDistance(state.maze, [last], "distance");
            // plot the path form last2 to last by moving to neighbours with lower distance
            yield* tracePath(state.maze, last2, "distance", t => {
                t.mainPath = true;
            });
            state.start = last2;
            state.end = last;
            yield;
        };
    }
}
