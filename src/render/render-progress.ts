import type { State, Tile } from "../state";
import { equalsXY, type Rect, type XY } from "../util/xy";
import { PALETTE } from "./colour";
import type { Renderer } from "./render-interface";

export class BaseRenderer implements Renderer {
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
            this.renderTile(ctx, x, y, state, t, rect);
        });
    }

    protected renderTile(ctx: CanvasRenderingContext2D, x: number, y: number, state: State, t: Tile, rect: Rect) {
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
                this.renderFloor(ctx, rect, t, [x, y]);
                break;
        }
        if (t.items) {
            this.renderItems(ctx, state, t, [x, y], rect);
        }
    }

    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile, xy: XY) {
        this.rectangle(ctx, "#312", rect);
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

            if (t.items.door) {
                const colour = { open: "limegreen", closed: "yellow", locked: "magenta" }[t.items.door];
                this.rectangle(ctx, colour, rect);
            }
        }
    }
}

export class PathRenderer extends BaseRenderer {
    public constructor(
        private distanceProperty: "distance" | "distanceFromPath",
        private maxDist: number,
        private pathProperty: "mainPath",
    ) {
        super();
    }

    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile, xy: XY): void {
        let colour =
            tile[this.distanceProperty] === this.maxDist
                ? PALETTE.purple
                : `hsl(${(tile[this.distanceProperty] || 0) * 4}, 100%, 50%)`;
        this.rectangle(ctx, colour, rect);
        if (tile[this.pathProperty] && xy[0] % 2 === 1 && xy[1] % 2 === 1) {
            colour = `rgba(255,255,255,0.8)`;
            this.rectangle(ctx, colour, {
                left: rect.left + 1,
                top: rect.top + 1,
                width: rect.width - 2,
                height: rect.height - 2,
            });
        }
        if (tile[this.pathProperty] && tile.distance === 0) {
            ctx.fillStyle = PALETTE.black;
            ctx.fillText("S", rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }
}

export class EntityRenderer extends BaseRenderer {
    public constructor(
    ) {
        super();
    }

    public renderFloor(ctx: CanvasRenderingContext2D, rect: Rect, tile: Tile, xy: XY): void {
        let colour = PALETTE.purple;
        this.rectangle(ctx, colour, rect);
      
        ctx.textAlign = "center"
        if (tile.entities) {
            let str = tile.entities.map(e=>e.constructor.name.replace("Entity","")).filter(a=>a!="Door").join("\n");
            ctx.fillStyle = "cyan";
            ctx.fillText(str, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }

    public renderItems(ctx: CanvasRenderingContext2D, s: State, t: Tile, xy: XY, rect: Rect): void {
        if (t.items) {
            if (t.items.door) {
                const colour = { open: "limegreen", closed: "yellow", locked: "magenta" }[t.items.door];
                this.rectangle(ctx, colour, rect);
            }
        }
    }
    
}



export class GridRenderer extends BaseRenderer {
    protected renderTile(ctx: CanvasRenderingContext2D, x: number, y: number, state: State, tile: Tile, rect: Rect) {
        const colour = tile.solid ? PALETTE.black : `hsl(${tile.roomId * 3}, 75%, 50%)`;
        this.rectangle(ctx, colour, rect);
    }
}
