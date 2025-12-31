import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { calcDistance, MAX_DIST } from "../util/distance";
import { equalsXY, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import { LayerLogic, TileRenderer } from "./layer";

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
        function floorColour(tile: Tile): string {
            if (tile.distanceFromPath !== undefined && tile.distanceFromPath !== MAX_DIST) {
                return `hsl(${tile.distanceFromPath * 3}, 100%, 50%)`;
            } else if (tile.distance !== undefined && tile.distance !== MAX_DIST) {
                return `hsl(${tile.distance * 3}, 80%, 50%)`;
            } else {
                return colorMap[tile.type];
            }
        }

        const renderItems: TileRenderer = (s, t, xy, rect) => {
            if (t.items) {
                if (t.items.key) {
                    ctx.strokeStyle = "yellow";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(rect.left + rect.width * 0.75, rect.top + rect.height * 0.5, rect.height / 4, Math.PI, Math.PI * 3);
                    ctx.lineTo(rect.left + rect.width * 0.25, rect.top + rect.height / 2);
                    ctx.lineTo(rect.left + rect.width * 0.25, rect.top + rect.height / 3);
                    ctx.stroke();
                }
            }
        };

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
                                ctx.fillStyle = PALETTE.lightGrey;
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                            } else if (!below || below.type === "outside") {
                                ctx.fillStyle = "black";
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                                ctx.fillStyle = PALETTE.lightGrey;
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                            } else {
                                ctx.fillStyle = colorMap[t.type];
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                                ctx.fillStyle = PALETTE.lightGrey;
                                ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                            }
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = floorColour(t);
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                        renderItems(s, t, xy, rect);
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
                            ctx.fillStyle = PALETTE.lightGrey;
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height / 2); // TODO rounding errors
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = floorColour(t);
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                        renderItems(s, t, xy, rect);
                    },
                    vWall: (s, t, xy, rect) => {
                        if (t.type === "wall") {
                            ctx.fillStyle = PALETTE.lightGrey;
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else if (t.type === "outside") {
                            ctx.fillStyle = "black";
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        } else {
                            ctx.fillStyle = floorColour(t);
                            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        }
                        renderItems(s, t, xy, rect);
                    },
                    tile: (s, t, xy, rect) => {
                        ctx.fillStyle = floorColour(t);
                        if (t.mainPath) {
                            ctx.fillStyle = "white";
                        }
                        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
                        renderItems(s, t, xy, rect);
                    },
                },
            );
        }
    }
}

const colorMap = {
    hall: "limegreen",
    outside: PALETTE.black,
    room: "orange",
    wall: PALETTE.darkGrey,
    door: "red",
};
