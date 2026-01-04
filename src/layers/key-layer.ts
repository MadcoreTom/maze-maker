import type { State } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance, MAX_DIST } from "../util/distance";
import { type XY } from "../util/xy";
import { LayerLogic } from "./layer";
import { PathRenderer } from "./render";

const RENDERER = new PathRenderer("distanceFromPath", MAX_DIST, "mainPath");

export class KeyLayer extends LayerLogic {
    constructor() {
        super("Key", []);
    }

    apply(): ReturnsGenerator {
        const state = this.state as State;

        return function* () {
            // set the path as distance 0 and add to the queue, the others are max
            const path: XY[] = [];
            state.maze.forEach((x, y, t) => {
                if (t.mainPathBeforeDoor) {
                    path.push([x, y]);
                }
            });
            // calc distance from the path

            state.farthestFromPath = yield* calcDistance(state.maze, path, "distanceFromPath");
            // TODO maybe remove farthestFromPath since we can use items
            const t = state.maze.get(state.farthestFromPath[0], state.farthestFromPath[1]);
            if (t) {
                if (!t.items) {
                    t.items = {};
                }
                t.items.key = true;
            }
            yield;
        };
    }

    render(ctx: CanvasRenderingContext2D) {
        RENDERER.render(ctx, this.state as State);
    }
}
