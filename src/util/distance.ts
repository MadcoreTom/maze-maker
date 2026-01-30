import type { State, Tile } from "../state";
import type { Array2 } from "./array2";
import { addXY, type XY } from "./xy";

export const KERNEL_UDLR: XY[] = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
] as const;
const MAX_DIST = 99999;

export function* calcDistance(
    maze: Array2<Tile>,
    start: XY[],
    property: "distance" | "distanceFromPath",
): Generator<unknown, XY, void> {
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
        maze.getKernel(q, KERNEL_UDLR).forEach((n, i) => {
            // if not visited
            if (n && n[property] === MAX_DIST && !n?.solid) {
                n[property] = (t[property] || 0) + 1;
                queue.push(addXY(KERNEL_UDLR[i], q));
            }
        });
        last = q;
        yield;
    }
    return last;
}

/**
 * Calculates all reachable tiles <= distance, and sets the timestamp
 */
export function calcVisibility(state: State, start: XY, distance: number, timestamp: number) {
    const startTile = state.maze.get(start[0], start[1]) as Tile;
    startTile.visDistance = 0;
    startTile.visTimestamp = timestamp;
    let tempVisCount = 0;
    const queue: XY[] = [start];
    const inRange: XY[] = [];
    while (queue.length > 0) {
        const cur = queue.shift() as XY;
        const t = state.maze.get(cur[0], cur[1]) as Tile;
        if (t.visDistance < distance) {
            state.maze.getKernel(cur, KERNEL_UDLR).forEach((n, i) => {
                // if not visited
                if (n && n.visTimestamp != timestamp && !n?.solid) {
                    n.visTimestamp = timestamp; // set tile to indicate that it was visible at the current time
                    n.visDistance = t.visDistance + 1; // set the distance too
                    tempVisCount++;
                    queue.push(addXY(KERNEL_UDLR[i], cur));
                }
            });
        }
        inRange.push(cur);
    }
    state.visTimestamp = timestamp;
    // then set discovered
    // first select only tiles (so odd coords)
    inRange
        .filter(([x, y]) => x % 2 === 1 && y % 2 === 1)
        .forEach(([x, y]) => {
            // self
            state.maze.doIf(x, y, (x, y, v) => (v.discovered = true));
            // left and right
            state.maze.doIf(x - 1, y, (x, y, v) => {
                v.discovered = true;
                v.visTimestamp = timestamp;
            });
            state.maze.doIf(x + 1, y, (x, y, v) => {
                v.discovered = true;
                v.visTimestamp = timestamp;
            });
            // Up and up diagonals discovers top and bottom
            state.maze.doIf(x, y - 1, (x, y, v) => {
                v.discovered = true;
                v.discoveredBottom = true;
                v.visTimestamp = timestamp;
            });
            state.maze.doIf(x - 1, y - 1, (x, y, v) => {
                v.discovered = true;
                v.discoveredBottom = true;
                v.visTimestamp = timestamp;
            });
            state.maze.doIf(x + 1, y - 1, (x, y, v) => {
                v.discovered = true;
                v.discoveredBottom = true;
                v.visTimestamp = timestamp;
            });
            // down and down diagonals only discovers top
            state.maze.doIf(x, y + 1, (x, y, v) => {
                v.discovered = true;
                v.visTimestamp = timestamp;
            });
            state.maze.doIf(x - 1, y + 1, (x, y, v) => {
                v.discovered = true;
                v.visTimestamp = timestamp;
            });
            state.maze.doIf(x + 1, y + 1, (x, y, v) => {
                v.discovered = true;
                v.visTimestamp = timestamp;
            });
        });
}

export function* tracePath(
    maze: Array2<Tile>,
    start: XY,
    property: "distance",
    callback: (tile: Tile) => void,
): Generator<unknown, void, void> {
    let cur: XY = [start[0], start[1]];
    while (cur !== undefined) {
        const t = maze.get(cur[0], cur[1]) as Tile;
        callback(t);
        const d = t[property] as number;
        const options = maze
            .getKernel(cur, KERNEL_UDLR)
            .map((t, i) => (t && t.distance !== undefined && t.distance < d ? addXY(cur, KERNEL_UDLR[i]) : null))
            .filter(x => x !== null);
        cur = options[0];
        yield;
    }
}

export { MAX_DIST, KERNEL_UDLR as kernel };
