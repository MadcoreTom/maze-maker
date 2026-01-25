import type { State } from "../state";
import { addXY, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import { ImageMap } from "./image-map";
import type { Renderer } from "./render-interface";

const tiles = new ImageMap("tiles.png", {
    "corner.outside": { left: 2, top: 18, width: 2, height: 8 },
    "corner.full": { left: 0, top: 0, width: 2, height: 8 },
    "corner.w1": { left: 20, top: 0, width: 2, height: 8 },
    "corner.f1": { left: 20, top: 18, width: 2, height: 8 },

    "vwall.outside": { left: 2, top: 6, width: 2, height: 12 },
    "vwall.w1": { left: 0, top: 6, width: 2, height: 12 },
    "vwall.f1": { left: 20, top: 6, width: 2, height: 12 },

    "hwall.outside": { left: 2, top: 18, width: 16, height: 6 },
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
            if (x % 2 === 0) {
                const px = offset[0] + (x * (W_SMALL + W_LARGE)) / 2;

                if (y % 2 === 0) {
                    const py = offset[1] + (y * (H_SMALL + H_LARGE)) / 2;
                    if (t.type === "outside") {
                        tiles.draw(ctx, [px, py], "corner.outside");
                    } else if (t.type === "wall") {
                        const b = state.maze.get(x, y + 1);
                        if (b && b.type === "wall") {
                            tiles.draw(ctx, [px, py], "corner.full");
                        } else {
                            tiles.draw(ctx, [px, py], "corner.w1");
                        }
                    } else {
                        tiles.draw(ctx, [px, py], "corner.f1");
                    }
                } else {
                    const py = offset[1] + ((y - 1) * (H_SMALL + H_LARGE)) / 2 + H_SMALL;
                    if (t.type === "outside") {
                        tiles.draw(ctx, [px, py], "vwall.outside");
                    } else if (t.type === "wall") {
                        tiles.draw(ctx, [px, py], "vwall.w1");
                    } else {
                        tiles.draw(ctx, [px, py], "vwall.f1");
                    }
                }
            } else {
                const px = offset[0] + ((x - 1) * (W_SMALL + W_LARGE)) / 2 + W_SMALL;
                if (y % 2 === 0) {
                    const py = offset[1] + (y * (H_SMALL + H_LARGE)) / 2;
                    let name: string;
                    if (t.type === "wall") {
                        name = "hwall.w1";
                        // todo check below
                    } else if (t.type === "outside") {
                        name = "hwall.outside";
                    } else if (t.type == "door" && t.items && t.items.door) {
                        name = t.items && t.items.door == "open"? "hwall.door.open" : "hwall.door.closed";
                    } else {
                        name = "hwall.f1";
                    }
                    tiles.draw(ctx, [px, py], name);
                } else {
                    // normal tile
                    const py = offset[1] + ((y - 1) * (H_SMALL + H_LARGE)) / 2 + H_SMALL;
                    if (t.type === "outside") {
                        tiles.draw(ctx, [px, py], "tile.outside");
                    } else {
                        tiles.draw(ctx, [px, py], "tile.f1");
                    }
                    // blank out undiscovered, shade those out of view
                    // TODO just don't draw the tiles we don't need, rather than drawing a box over them
                    if (t.visTimestamp != state.visTimestamp) {
                        ctx.fillStyle = t.visTimestamp < 0 ? "red" : "rgba(0.05,0,0.05,0.5)";
                        ctx.fillRect(px, py, W_LARGE, H_LARGE);
                    }
                }
            }
        });
        tiles.draw(ctx, [10, 10], "test");

        // sprites
        state.sprites.forEachSprite(s => {
            sprites.drawRegion(ctx, addXY(s.position, offset), s.sprite);
        });
    }
}
