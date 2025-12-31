import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance, MAX_DIST } from "../util/distance";
import { equalsXY, type Rect, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import { LayerLogic, TileRenderer } from "./layer";
import { Renderer } from "./render";

class MyRenderer extends Renderer {
    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile): void {
        const color = tile.mainPath ? "white" : `hsl(${(tile.distanceFromPath || 0) * 3}, 100%, 50%)`;
        this.rectangle(ctx, color, rect);
    }
}
const RENDERER = new MyRenderer();

export class KeyLayer extends LayerLogic {
    constructor() {
        super("Key", []);
    }

    apply(): ReturnsGenerator {
        const state = this.state as State;

        return function* () {
            // set the path as distance 0 and add to the queue, the others are max
            const mainPath: XY[] = [];
            state.maze.forEach((x, y, t) => {
                if (t.mainPath) {
                    mainPath.push([x, y]);
                }
            });
            // calc distance from the path

            state.farthestFromPath = yield* calcDistance(state.maze, mainPath, "distanceFromPath");
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
