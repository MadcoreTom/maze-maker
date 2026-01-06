import { Rect, XY } from "../util/xy";

export class ImageMap {
    private image: CanvasImageSource;
    private ready = false;
    public constructor(url: string, private readonly map: { [name: string]: Rect }) {
        this.image = new Image();
        this.image.onload = () => {
            this.ready = true;
            console.log("Loaded image", url);
        }
        this.image.src = url;
    }

    public draw(ctx: CanvasRenderingContext2D, pos: XY, name: string) {
        const r = this.map[name];
        if (this.ready && r) {
            ctx.drawImage(this.image,
                r.left, r.top, r.width, r.height,
                pos[0], pos[1], r.width, r.height
            );
        }
    }
}