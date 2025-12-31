import type { State, Tile } from "../state";
import type { Rect, XY } from "../util/xy";
import { PALETTE } from "./colour";

export class Renderer {
    private wallWidth = 0.2;
    private wallHeight = 0.4;
    public render(ctx: CanvasRenderingContext2D, state: State) {
        // background
        ctx.fillStyle = "red";
        const w = 600;
        const h = 600;
        ctx.fillRect(0, 0, w, h);
        // Work out tile sizes
        const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h)) * 2; // Size in both x and y of 2 tiles
        const wallWidth = Math.ceil(s * this.wallWidth);
        const tileWidth = s - wallWidth;
        const wallHeight = Math.ceil(s * this.wallHeight);
        const tileHeight = s - wallHeight;
        // For each tile
        state.maze.forEach((x, y, t) => {
            const left = Math.floor(x / 2) * tileWidth + Math.ceil(x / 2) * wallWidth;
            const top = Math.floor(y / 2) * tileHeight + Math.ceil(y / 2) * wallHeight;
            let rect: Rect;
            if (x % 2 === 0) {
                if (y % 2 === 0) {
                    rect = { top, left, width: wallWidth, height: wallHeight };
                } else {
                    rect = { top, left, width: wallWidth, height: tileHeight };
                }
            } else {
                if (y % 2 === 0) {
                    rect = { top, left, width: tileWidth, height: wallHeight };
                } else {
                    rect = { top, left, width: tileWidth, height: tileHeight };
                }
            }
            switch (t.type) {
                case "outside":
                    this.renderTileOutside(ctx, rect);
                    break;
                case "wall":
                    this.renderTileWall(ctx, rect, state.maze.get(x, y + 1));
                    break;
                case "room":
                case "hall":
                case "door":
                    this.renderFloor(ctx, rect, t);
                    break;
            }
            if (t.items) {
                this.renderItems(ctx, state, t, [x, y], rect);
            }
        });
    }

    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile) {
        this.rectangle(ctx, "magenta", rect);
    }

    public renderTileOutside(ctx: CanvasRenderingContext2D, rect: Rect) {
        this.rectangle(ctx, PALETTE.black, rect);
    }

    public renderTileWall(ctx: CanvasRenderingContext2D, rect: Rect, tileBelow?: Tile) {
        if (tileBelow && tileBelow.type === "wall") {
            this.rectangle(ctx, PALETTE.lightGrey, rect);
        } else {
            ctx.fillStyle = PALETTE.lightGrey;
            const topHeight = this.wallWidth * rect.height * 2;
            ctx.fillRect(rect.left, rect.top, rect.width, topHeight);

            ctx.fillStyle = PALETTE.darkGrey;
            ctx.fillRect(rect.left, rect.top + topHeight, rect.width, rect.height - topHeight);
        }
    }

    public rectangle(ctx: CanvasRenderingContext2D, color: string, rect: Rect) {
        ctx.fillStyle = color;
        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    }
    public renderItems(ctx: CanvasRenderingContext2D, s: State, t: Tile, xy: XY, rect: Rect) {
        if (t.items) {
            if (t.items.key) {
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    rect.left + rect.width * 0.75,
                    rect.top + rect.height * 0.5,
                    rect.height / 4,
                    Math.PI,
                    Math.PI * 3,
                );
                ctx.lineTo(rect.left + rect.width * 0.25, rect.top + rect.height / 2);
                ctx.lineTo(rect.left + rect.width * 0.25, rect.top + rect.height / 3);
                ctx.stroke();
            }
        }
    }
}
