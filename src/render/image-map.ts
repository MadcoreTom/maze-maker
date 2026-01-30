import type { Rect, XY } from "../util/xy";

export class ImageMap<T extends string> {
    private image: CanvasImageSource;
    private ready = false;
    public constructor(
        url: string,
        private readonly map: Record<T, Rect>,
    ) {
        this.image = new Image();
        this.image.onload = () => {
            this.ready = true;
            console.log("Loaded image", url);
        };
        this.image.src = url;
    }

    public draw(ctx: CanvasRenderingContext2D, pos: XY, name: T) {
        const r = this.map[name];
        if (r) {
            this.drawRegion(ctx, pos, r);
        }
    }
    public drawRegion(ctx: CanvasRenderingContext2D, pos: XY, region: Rect) {
        if (this.ready) {
            ctx.drawImage(
                this.image,
                region.left,
                region.top,
                region.width,
                region.height,
                pos[0],
                pos[1],
                region.width,
                region.height,
            );
        }
    }
}
