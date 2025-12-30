import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import type { Array2 } from "../util/array2";
import { pickRandom } from "../util/random";
import { addXY, equalsXY, Rect, type XY } from "../util/xy";
import { LayerLogic } from "./layer";

const kernel: XY[] = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
];
const MAX_DIST = 99999;

export class FarthestLayer extends LayerLogic {
    public constructor() {
        super("Farthest", []);
    }
    private *calcDistance(maze: Array2<Tile>, start: XY[], property: "distance"): Generator<unknown, XY, void> {
        // initialise
        maze.forEach((x, y, t) => {
            t[property] = MAX_DIST;
        });
        start.forEach(xy => {
            (maze.get(xy[0], xy[1]) as Tile)[property] = 0;
        });
        const queue: XY[] = [...start];
        let last: XY = start[0];
        // calc distance
        while (queue.length > 0) {
            const q = queue.shift() as XY;
            const t = maze.get(q[0], q[1]) as Tile;
            maze.getKernel(q, kernel).forEach((n, i) => {
                // if not visited
                if (n && n.distance === MAX_DIST && !n?.solid) {
                    n.distance = (t.distance || 0) + 1;
                    queue.push(addXY(kernel[i], q));
                }
            });
            last = q;
            // TODO make this a generator function so i can yield
            yield;
        }
        return last;
    }
    apply(): ReturnsGenerator {
        const state = this.state as State;
        const calcDistance = this.calcDistance;
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
            let cur: XY = [last2[0], last2[1]];
            while (!equalsXY(cur, last)) {
                const t = state.maze.get(cur[0], cur[1]) as Tile;
                t.mainPath = true;
                const d = t.distance as number;
                const options = state.maze
                    .getKernel(cur, kernel)
                    .map((t, i) => (t && t.distance !== undefined && t.distance < d ? addXY(cur, kernel[i]) : null))
                    .filter(x => x !== null);
                cur = options[0];
                console.log(cur);
                yield;
            }
            // and the last one
            const t = state.maze.get(cur[0], cur[1]) as Tile;
            t.mainPath = true;
            state.start = last2;
            state.end = cur;
            yield;
            // set the path as distance 0 and add to the queue, the others are max
            const mainPath: XY[] = [];
            state.maze.forEach((x, y, t) => {
                if (t.mainPath) {
                    mainPath.push([x, y]);
                }
            });
            // calc distance from the path

            state.farthestFromPath = yield* calcDistance(state.maze, mainPath, "distance");
            yield;
        };
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            const state = this.state;
            this.renderTiles(
                ctx,
                state,
                { wallWidth: 0.2, wallHeight: 0.4 },
                {
                    corner: (s, t, xy, rect) => {
                        if (t.type === "wall") {
                            const below = state.maze.get(xy[0], xy[1] + 1);
                            if (below && below.type === "wall") {
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                            } else if (!below || below.type === "outside") {
                                ctx.fillStyle = "black";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                            } else {
                                ctx.fillStyle = colorMap[t.type];
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                                ctx.fillStyle = "magenta";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                            }
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                    },
                    hWall: (s, t, xy, rect) => {
                        if (t.type === "wall") {
                            const below = state.maze.get(xy[0], xy[1] + 1);
                            if (!below || below.type === "outside") {
                                ctx.fillStyle = "black";
                            } else {
                                ctx.fillStyle = colorMap[t.type];
                            }
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                            ctx.fillStyle = "magenta";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                    },
                    vWall: (s, t, xy, rect) => {
                        if (t.type === "wall") {
                            ctx.fillStyle = "magenta";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = colorMap[t.type];
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                    },
                    tile: (s, t, xy, rect) => {
                        ctx.fillStyle = colorMap[t.type];
                        if (t.distance !== undefined && t.distance !== MAX_DIST) {
                            ctx.fillStyle = `hsl(${t.distance * 3}, 100%, 50%)`;
                        }
                        if (t.mainPath) {
                            ctx.fillStyle = "white";
                        }
                        if (s.farthestFromPath && equalsXY(s.farthestFromPath, xy)) {
                            ctx.fillStyle = "yellow";
                        }
                        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                    },
                },
            );
        }
    }
}

const colorMap = {
    hall: "limegreen",
    outside: "black",
    room: "orange",
    wall: "blue",
    door: "red",
};
