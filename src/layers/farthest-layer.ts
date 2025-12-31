import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance, MAX_DIST, tracePath } from "../util/distance";
import { pickRandom } from "../util/random";
import type { Rect, XY } from "../util/xy";
import { LayerLogic } from "./layer";
import { Renderer } from "./render";

class MyRenderer extends Renderer {
    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile): void {
        const color = tile.mainPath ? "white" : `hsl(${(tile.distance || 0) * 3}, 100%, 50%)`;
        this.rectangle(ctx, color, rect);
    }
}
const RENDERER = new MyRenderer();

export class FarthestLayer extends LayerLogic {
    public constructor() {
        super("Farthest", []);
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

    render(ctx: CanvasRenderingContext2D) {
        RENDERER.render(ctx, this.state as State);
    }
}
