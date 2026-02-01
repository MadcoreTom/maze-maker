import { PixelRenderer } from "../render/renderer-pixel";
import type { State } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance } from "../util/distance";
import type { XY } from "../util/xy";
import { LayerLogic } from "./layer";

export class KeyLayer extends LayerLogic {
    constructor() {
        super("Key", [], new PixelRenderer());
        // super("Key", [], new PathRenderer("distanceFromPath", MAX_DIST, "mainPath"));
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
}
