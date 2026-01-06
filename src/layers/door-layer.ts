import { PathRenderer } from "../render/render-progress";
import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import type { XY } from "../util/xy";
import { LayerLogic } from "./layer";

export class DoorLayer extends LayerLogic {
    constructor() {
        super("Doors", [], new PathRenderer("distance", 99999, "mainPath"));
    }
    apply(): ReturnsGenerator {
        const state = this.state as State;
        return function* () {
            const doors: XY[] = [];
            const mainPath: XY[] = [];

            state.maze.forEach((x, y, t) => {
                if (t.mainPath) {
                    mainPath[t.distance as number] = [x, y];
                } else if (t.type === "door") {
                    doors.push([x, y]);
                }
            });

            // regular doors
            for (const d of doors) {
                const t = state.maze.get(d[0], d[1]) as Tile;
                if (!t.items) {
                    t.items = {};
                }
                t.items.door = Math.random() < 0.5 ? "open" : "closed";
                yield;
            }

            // cur tracks our position along the main path
            const start = Math.floor(mainPath.length / 2 + (Math.random() * mainPath.length) / 2); // random in the second half
            let cur = start;
            let found: number | undefined;
            while (!found && cur < mainPath.length) {
                const pos = mainPath[cur];
                if ((state.maze.get(pos[0], pos[1]) as Tile).type === "door") {
                    found = cur;
                } else {
                    cur++;
                }
            }
            // if not found, search backward
            cur = start;
            while (!found && cur > 0) {
                const pos = mainPath[cur];
                if ((state.maze.get(pos[0], pos[1]) as Tile).type === "door") {
                    found = cur;
                } else {
                    cur--;
                }
            }

            // TODO sort the doors on the main path, choose one in the last 50%, make it locked and solid
            // shuffle(mainPath);
            for (let i = 0; i < mainPath.length; i++) {
                const d = mainPath[i];
                const t = state.maze.get(d[0], d[1]) as Tile;
                // TODO set a startPath property too, for the key layer
                if (t.type === "door") {
                    if (!t.items) {
                        t.items = {};
                    }
                    if (found && i === found) {
                        t.items.door = "locked";
                        t.solid = true;
                    } else {
                        t.items.door = Math.random() < 0.2 ? "open" : "closed";
                    }
                }
                if (!found || i < found) {
                    t.mainPathBeforeDoor = true;
                }
                yield;
            }

            // TODO track "main path before door"
        };
    }
}
