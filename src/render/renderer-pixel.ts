import type { State, Tile } from "../state";
import { addXY, type Rect, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import { ImageMap } from "./image-map";
import type { Renderer } from "./render-interface";

const tiles = new ImageMap("tiles.png", {
    "corner.outside": { left: 2, top: 18, width: 2, height: 6 },
     "corner.wall_outside": { left: 0, top: 18, width: 2, height: 6 },
    "corner.full": { left: 0, top: 0, width: 2, height: 6 },
    "corner.w1": { left: 20, top: 0, width: 2, height: 6 },
    "corner.f1": { left: 20, top: 18, width: 2, height: 6 },

    "vwall.outside": { left: 2, top: 6, width: 2, height: 12 },
    "vwall.w1": { left: 0, top: 6, width: 2, height: 12 },
    "vwall.f1": { left: 20, top: 6, width: 2, height: 12 },
    "vwall.door.closed": { left: 56, top: 6, width: 2, height: 12 },
    "vwall.door.open": { left: 74, top: 6, width: 2, height: 12 },

    "hwall.outside": { left: 2, top: 18, width: 16, height: 6 },
    "hwall.wall_outside": { left: 2, top: 0, width: 16, height: 6 },
    "hwall.w1": { left: 22, top: 0, width: 16, height: 6 },
    "hwall.f1": { left: 22, top: 18, width: 16, height: 6 },
    "hwall.door.open": { left: 76, top: 0, width: 16, height: 6 },
    "hwall.door.closed": { left: 58, top: 0, width: 16, height: 6 },

    "tile.outside": { left: 4, top: 6, width: 16, height: 12 },
    "tile.f1": { left: 22, top: 6, width: 16, height: 12 },
});

const sprites = new ImageMap("sprites.png", {
    player: { left: 0, top: 0, width: 18, height: 12 },
});

const W_SMALL = 2;
const W_LARGE = 16;
const H_SMALL = 6;
const H_LARGE = 12;

// Kernel constants for visibility calculation
const DIAGONAL: XY[] = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
] as const;
const LEFT_RIGHT: XY[] = [
    [-1, 0],
    [1, 0],
] as const;
const UP_DOWN: XY[] = [
    [0, -1],
    [0, 1],
] as const;

// Centralized position function that handles coordinate parity logic
function getRect([x, y]: XY, offset: XY): Rect {
    return {
        left: offset[0] + Math.floor(x / 2) * (W_SMALL + W_LARGE) + (x % 2) * W_SMALL,
        top: offset[1] + Math.floor(y / 2) * (H_SMALL + H_LARGE) + (y % 2) * H_SMALL,
        width: x % 2 == 0 ? W_SMALL : W_LARGE,
        height: y % 2 == 0 ? H_SMALL : H_LARGE,
    };
}

// Tile name selection functions
function getCornerName(x: number, y: number, tile: Tile, maze: any): string {
    if (tile.type === "outside") return "corner.outside";
    if (tile.type === "wall") {
        const below = maze.get(x, y + 1);
        // TODO only use corner.full if below is a wall, and below-left or below-right has visTimestamp >=0
        return !below || below.type === "wall" || below.type === "door" ? "corner.full" : (below && (below.type === "outside" || below.visTimestamp < 0) ? "corner.wall_outside" :"corner.w1");
    }
    return "corner.f1";
}

function getVWallName(tile: Tile): string {
    if (tile.type === "outside") return "vwall.outside";
    if (tile.type === "wall") return "vwall.w1";
    if (tile.type === "door") {
        const closed = tile.items && tile.items.door && tile.items.door !== "open";
        return closed ? "vwall.door.closed" : "vwall.door.open";
    }
    return "vwall.f1";
}

function getHWallName(x: number, y: number, tile: Tile, maze: any): string {
    if (tile.type === "wall") {
        const below = maze.get(x, y + 1);
        return !below || (below.type === "outside" || below.visTimestamp < 0) ? "hwall.wall_outside" : "hwall.w1";
    }
    if (tile.type === "outside") return "hwall.outside";
    if (tile.type === "door") return tile.items && tile.items.door === "open" ? "hwall.door.open" : "hwall.door.closed";
    return "hwall.f1";
}

function getTileName(tile: Tile): string {
    if (tile.type === "outside") return "tile.outside";
    return "tile.f1";
}

function applyShading(ctx: CanvasRenderingContext2D, rect: Rect): void {
    ctx.fillStyle = "rgba(0.05,0,0.05,0.5)";
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
}

function calcVisibility([x, y]: XY, tile: Tile, state: State): "hidden" | "shaded" | "visible" {
    if (x % 2 == 0 && y % 2 == 0) {
        // corner (check diagonal neighbours)
        const visible =
            state.maze.getKernel([x, y], DIAGONAL).filter(t => t && t.visTimestamp == state.visTimestamp).length > 0;
        if (visible) {
            return "visible";
        }
        const shaded = state.maze.getKernel([x, y], DIAGONAL).filter(t => t && t.visTimestamp >= 0).length > 0;
        return shaded ? "shaded" : "hidden";
    }

    if (x % 2 == 1 && y % 2 == 0) {
        // h wall (check up and down)
        const visible =
            state.maze.getKernel([x, y], UP_DOWN).filter(t => t && t.visTimestamp == state.visTimestamp).length > 0;
        if (visible) {
            return "visible";
        }
        const shaded = state.maze.getKernel([x, y], UP_DOWN).filter(t => t && t.visTimestamp >= 0).length > 0;
        return shaded ? "shaded" : "hidden";
    }

    if (x % 2 == 0 && y % 2 == 1) {
        // v wall (check left and right)
        const visible =
            state.maze.getKernel([x, y], LEFT_RIGHT).filter(t => t && t.visTimestamp == state.visTimestamp).length > 0;
        if (visible) {
            return "visible";
        }
        const shaded = state.maze.getKernel([x, y], LEFT_RIGHT).filter(t => t && t.visTimestamp >= 0).length > 0;
        return shaded ? "shaded" : "hidden";
    } else if (x % 2 == 1 && y % 2 === 1) {
        // tile. just check self
        if (tile.visTimestamp === state.visTimestamp) {
            return "visible";
        } else if (tile.visTimestamp >= 0) {
            return "shaded";
        } else {
            return "hidden";
        }
    }

    return "visible";
}

export class PixelRenderer implements Renderer {
    render(ctx: CanvasRenderingContext2D, state: State): void {
        // TODO get canvas size somewhere
        ctx.fillStyle = PALETTE.black;
        ctx.fillRect(0, 0, 600, 600);

        const offset: XY = [0, 0];
        const player = state.sprites.getSpriteByName("player");
        if (player && state.viewportSize) {
            offset[0] = Math.floor((state.viewportSize[0] - W_LARGE) / 2) - player.position[0];
            offset[1] = Math.floor((state.viewportSize[1] - H_LARGE) / 2) - player.position[1]; // TODO center this properly
        }

        state.maze.forEach((x, y, t) => {
            const visibility = calcVisibility([x, y], t, state);
            if (visibility === "hidden") {
                return;
            }

            const rect = getRect([x, y], offset);
            let tileName: string;

            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    // Corner
                    tileName = getCornerName(x, y, t, state.maze);
                } else {
                    // Vertical wall
                    tileName = getVWallName(t);
                }
            } else {
                if (y % 2 === 0) {
                    // Horizontal wall
                    tileName = getHWallName(x,y,t, state.maze);
                } else {
                    // Normal tile
                    tileName = getTileName(t);
                }
            }

            tiles.draw(ctx, [rect.left, rect.top], tileName);
            if (visibility === "shaded") {
                applyShading(ctx, rect);
            }
        });

        // sprites
        state.sprites.forEachSprite(s => {
            sprites.drawRegion(ctx, addXY(s.position, offset), s.sprite);
        });
    }
}
