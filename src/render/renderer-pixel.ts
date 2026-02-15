import type { State, Tile } from "../state";
import { addXY, type Rect, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import { ImageMap } from "./image-map";
import type { Renderer } from "./render-interface";

const tiles = new ImageMap("tiles.png", {
    "corner.outside": { left: 2, top: 18, width: 2, height: 6 },
    "corner.fog": { left: 92, top: 0, width: 2, height: 6 },
    "corner.wall_outside": { left: 0, top: 18, width: 2, height: 6 },
    "corner.full": { left: 0, top: 0, width: 2, height: 6 },
    "corner.w1": { left: 20, top: 0, width: 2, height: 6 },
    "corner.f1": { left: 20, top: 18, width: 2, height: 6 },
    "corner.f2": { left: 38, top: 18, width: 2, height: 6 },

    "vwall.outside": { left: 2, top: 6, width: 2, height: 12 },
    "vwall.fog": { left: 92, top: 6, width: 2, height: 12 },
    "vwall.w1": { left: 0, top: 6, width: 2, height: 12 },
    "vwall.f1": { left: 20, top: 6, width: 2, height: 12 },
    "vwall.f2": { left: 38, top: 6, width: 2, height: 12 },
    "vwall.door.closed": { left: 56, top: 6, width: 2, height: 12 },
    "vwall.door.open": { left: 74, top: 6, width: 2, height: 12 },

    "hwall.outside": { left: 2, top: 18, width: 16, height: 6 },
    "hwall.fog": { left: 94, top: 0, width: 16, height: 6 },
    "hwall.wall_outside": { left: 2, top: 0, width: 16, height: 6 },
    "hwall.w1": { left: 22, top: 0, width: 16, height: 6 },
    "hwall.f1": { left: 22, top: 18, width: 16, height: 6 },
    "hwall.f2": { left: 40, top: 18, width: 16, height: 6 },
    "hwall.door.open": { left: 76, top: 0, width: 16, height: 6 },
    "hwall.door.closed": { left: 58, top: 0, width: 16, height: 6 },
    "hwall.door.open_top": { left: 76, top: 0, width: 16, height: 2 },
    "hwall.door.closed_top": { left: 58, top: 0, width: 16, height: 2 },

    "tile.outside": { left: 4, top: 6, width: 16, height: 12 },
    "tile.f1": { left: 22, top: 6, width: 16, height: 12 },
    "tile.f2": { left: 40, top: 6, width: 16, height: 12 },
    "tile.fog": { left: 94, top: 6, width: 16, height: 12 },
});

const sprites = new ImageMap("sprites.png", {
    player: { left: 0, top: 0, width: 16, height: 12 },
    start: { left: 16, top: 0, width: 16, height: 12 },
    end: { left: 32, top: 0, width: 16, height: 12 },
    key: { left: 48, top: 0, width: 16, height: 12 },
    imp: { left: 64, top: 0, width: 16, height: 12 },
    rat: { left: 80, top: 0, width: 16, height: 12 },
});

const W_SMALL = 2;
const W_LARGE = 16;
const H_SMALL = 6;
const H_LARGE = 12;

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
function getCornerName(x: number, y: number, tile: Tile, maze: any, showBottom: boolean): string {
    if (tile.type === "outside") return "corner.outside";
    if (tile.type === "wall") {
        if (!showBottom) {
            return "corner.wall_outside";
        } else {
            const below = maze.get(x, y + 1);
            // TODO only use corner.full if below is a wall, and below-left or below-right has visTimestamp >=0
            return !below || below.type === "wall" || below.type === "door"
                ? "corner.full"
                : below && below.type === "outside"
                  ? "corner.wall_outside"
                  : "corner.w1";
        }
    }
    return tile.type == "hall" ? "corner.f2" : "corner.f1";
}

function getVWallName(tile: Tile): string {
    if (tile.type === "outside") return "vwall.outside";
    if (tile.type === "wall") return "vwall.w1";
    if (tile.type === "door") {
        const closed = tile.items && tile.items.door && tile.items.door !== "open";
        return closed ? "vwall.door.closed" : "vwall.door.open";
    }

    return tile.type == "hall" ? "vwall.f2" : "vwall.f1";
}

function getHWallName(x: number, y: number, tile: Tile, maze: any, showBottom: boolean): string {
    if (tile.type !== "room" && tile.type !== "hall") {
        if (!showBottom) {
            if (tile.type === "door")
                return tile.items && tile.items.door === "open" ? "hwall.door.open_top" : "hwall.door.closed_top"; // TODO only show the top of the door
            return "hwall.wall_outside";
        }
    }
    if (tile.type == "wall") {
        const below = maze.get(x, y + 1);
        return !below || below.type === "outside" || below.visTimestamp < 0 ? "hwall.wall_outside" : "hwall.w1";
    }
    if (tile.type === "outside") return "hwall.outside";
    if (tile.type === "door") return tile.items && tile.items.door === "open" ? "hwall.door.open" : "hwall.door.closed";
    return tile.type == "hall" ? "hwall.f2" : "hwall.f1";
}

function getTileName(tile: Tile): string {
    if (tile.type === "outside") return "tile.outside";
    return tile.type == "hall" ? "tile.f2" : "tile.f1";
}

function applyShading(ctx: CanvasRenderingContext2D, rect: Rect): void {
    if (rect.width == W_LARGE) {
        if (rect.height == H_LARGE) {
            tiles.draw(ctx, [rect.left, rect.top], "tile.fog");
        } else {
            tiles.draw(ctx, [rect.left, rect.top], "hwall.fog");
        }
    } else {
        if (rect.height == H_LARGE) {
            tiles.draw(ctx, [rect.left, rect.top], "vwall.fog");
        } else {
            tiles.draw(ctx, [rect.left, rect.top], "corner.fog");
        }
    }
}

export class PixelRenderer implements Renderer {
    render(ctx: CanvasRenderingContext2D, state: State): void {
        // TODO get canvas size somewhere
        ctx.fillStyle = PALETTE.black;
        ctx.fillRect(0, 0, 600, 600);

        const offset: XY = [0, 0];
        const player = state.entities.getEntityByName("player");
        if (player && state.viewportSize) {
            const s = player.getSprite()!;
            const [x, y] = player.getTile();

            offset[0] =
                Math.floor((state.viewportSize[0] - W_LARGE) / 2) -
                (Math.floor(x / 2) * (W_SMALL + W_LARGE) + (x % 2) * W_SMALL + s.offset[0]); // TODO this should a include the sprite offset of the player
            offset[1] =
                Math.floor((state.viewportSize[1] - H_LARGE) / 2) -
                (Math.floor(y / 2) * (H_SMALL + H_LARGE) + (y % 2) * H_SMALL + s.offset[1]); // TODO center this properly
        }

        const visibleBounds: Rect = {
            left: Math.floor(-offset[0] / 18) * 2,
            top: Math.floor(-offset[1] / 18) * 2,
            width: state.viewportSize![0],
            height: state.viewportSize![1],
        };

        const visibileRegion = new Path2D(); // Only draw entities in this region

        state.maze.forEachRect(visibleBounds, (x, y, t) => {
            if (!t.discovered) {
                return;
            }

            const rect = getRect([x, y], offset);
            let tileName: string;

            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    // Corner
                    tileName = getCornerName(x, y, t, state.maze, !!t.discoveredBottom);
                } else {
                    // Vertical wall
                    tileName = getVWallName(t);
                }
            } else {
                if (y % 2 === 0) {
                    // Horizontal wall
                    tileName = getHWallName(x, y, t, state.maze, !!t.discoveredBottom);
                } else {
                    // Normal tile
                    tileName = getTileName(t);
                }
            }

            tiles.draw(ctx, [rect.left, rect.top], tileName as any);
            if (t.visTimestamp !== state.visTimestamp) {
                applyShading(ctx, rect);
                // shadingRects.push(rect); // HERE 1
            } else {
                visibileRegion.rect(rect.left, rect.top, rect.width, rect.height);
            }
        });

        ctx.save();
        ctx.clip(visibileRegion, "evenodd");

        // sprites
        state.entities.forEachEntity(e => {
            // TODO handle child sprites eventually
            const s = e.getSprite();
            const [x, y] = e.getTile();
            if (s) {
                const pos: XY = [
                    Math.floor(x / 2) * (W_SMALL + W_LARGE) + (x % 2) * W_SMALL + s.offset[0],
                    Math.floor(y / 2) * (H_SMALL + H_LARGE) + (y % 2) * H_SMALL + s.offset[1],
                ];
                if (typeof s.sprite === "string") {
                    sprites.draw(ctx, addXY(pos, offset), s.sprite as any);
                } else {
                    sprites.drawRegion(ctx, addXY(pos, offset), s.sprite as Rect);
                }
            }
        });

        ctx.restore();
    }
}
