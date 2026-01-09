import { L1 } from "./layers";
import { LayerLogic } from "./layers/layer";
import { PixelRenderer } from "./render/renderer-pixel";
import { createInitialState } from "./state";
import { MyGenerator } from "./types";

export class GameComponent extends HTMLElement {
    private ctx?: CanvasRenderingContext2D;
    private renderer = new PixelRenderer();
    private state?: State;
    private elements?: {
        canvas: HTMLCanvasElement;
        left: HTMLButtonElement;
        right: HTMLButtonElement;
        up: HTMLButtonElement;
        down: HTMLButtonElement;
    };

    private curLayer?: LayerLogic = L1;
    private curGenerator?: MyGenerator;

    connectedCallback() {
        console.log("connected");

        this.elements = {
            canvas: this.querySelector("canvas") as HTMLCanvasElement,
            left: this.querySelector("[name=left]") as HTMLButtonElement,
            right: this.querySelector("[name=right]") as HTMLButtonElement,
            up: this.querySelector("[name=up]") as HTMLButtonElement,
            down: this.querySelector("[name=down]") as HTMLButtonElement,
        };

        this.elements.right.textContent = ">>>>";

        this.elements.canvas.width = 600;
        this.elements.canvas.height = 600;
        this.ctx = this.elements.canvas.getContext("2d") as CanvasRenderingContext2D;

        // initialise the maze
        this.curLayer!.init(createInitialState());
        this.curGenerator = this.curLayer!.apply()();
        console.log("🍌 init", this.curLayer!.state);

        this.setupResizeObserver();

        window.requestAnimationFrame(n => this.tick(n));
    }

    private setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this.onComponentResize(entry.contentRect.width);
            }
        });
        resizeObserver.observe(this);
    }

    private onComponentResize(width: number) {
        console.log(`GameComponent resized: ${width}px`);
        // c * s + a = w
        // w = component width
        // c is between 100 and 120
        // s is a positive integer
        // a is minimised
        // assumptions w is always over 120, and generally under 1000
        // design it so i can control the minimum and maximum values of C

        const w = width;
        const minC = 100; // minimum number of pixels to show (otherwise too zoomed in)
        const maxC = 120; // maximum number of pixels to show (otherwise too zoomed out)

        // Find the optimal c and s that minimize a
        let bestC = minC;
        let bestS = 1; // the pixel scale
        let bestA = w - minC * 1; // the gap

        for (let c = minC; c <= maxC; c++) {
            const s = Math.floor(w / c);
            const a = w - c * s;

            if (s >= 1 && a >= 0 && a < bestA) {
                bestC = c;
                bestS = s;
                bestA = a;
            }
        }

        console.log(`Calculated: c=${bestC}, s=${bestS}, a=${bestA}, total=${bestC * bestS + bestA}`);

        // Update canvas dimensions
        if (this.elements) {
            this.elements.canvas.width = bestC;
            this.elements.canvas.height = bestC;
            this.elements.canvas.style.width = `${bestC * bestS}px`;
            this.elements.canvas.style.height = `${bestC * bestS}px`;
            this.elements.canvas.style.margin = "auto";
        }
    }

    private tick(time: number) {
        if (this.ctx && this.state) {
            this.renderer.render(this.ctx, this.state);
        }

        if (this.curLayer && this.curGenerator) {
            for (let i = 0; i < 10 && this.curGenerator && this.curLayer; i++) {
                // do 10 steps at a time
                const n = this.curGenerator.next();
                if (n.done) {
                    console.log("🍌 next");
                    if (this.curLayer.next) {
                        this.curLayer = this.curLayer.next;
                        this.curLayer.init(this.curLayer!.prev!.state!);
                        this.curGenerator = this.curLayer.apply()();
                    } else {
                        this.state = this.curLayer.state;
                        this.curGenerator = undefined;
                    }
                }
            }
            window.requestAnimationFrame(n => this.tick(n));
        } else {
            console.log("🍌 Complete");
        }
    }
}
