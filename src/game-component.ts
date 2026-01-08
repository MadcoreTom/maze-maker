import { L1 } from "./layers";
import { LayerLogic } from "./layers/layer";
import { PixelRenderer } from "./render/renderer-pixel";
import { createInitialState } from "./state";
import { MyGenerator } from "./types";

export class GameComponent extends HTMLElement {
    private ctx?: CanvasRenderingContext2D;
    private renderer = new PixelRenderer();
    private state?:State;
    private elements?: {
        canvas: HTMLCanvasElement,
        left: HTMLButtonElement,
        right: HTMLButtonElement,
        up: HTMLButtonElement,
        down: HTMLButtonElement
    }

    private curLayer?: LayerLogic = L1;
    private curGenerator?: MyGenerator;

    connectedCallback() {
        console.log("connected");

        this.elements = {
            canvas: this.querySelector("canvas") as HTMLCanvasElement,
            left: this.querySelector("[name=left]") as HTMLButtonElement,
            right: this.querySelector("[name=right]") as HTMLButtonElement,
            up: this.querySelector("[name=up]") as HTMLButtonElement,
            down: this.querySelector("[name=down]") as HTMLButtonElement
        }

        this.elements.right.textContent = ">>>>";

        this.elements.canvas.width = 600;
        this.elements.canvas.height = 600;
        this.ctx = this.elements.canvas.getContext("2d") as CanvasRenderingContext2D;

        // initialise the maze
        this.curLayer!.init(createInitialState());
        this.curGenerator = this.curLayer!.apply()();
        console.log("🍌 init", this.curLayer!.state)

        window.requestAnimationFrame(n => this.tick(n));
    }

    private tick(time: number) {
        if (this.ctx && this.state) {
            this.renderer.render(this.ctx, this.state);
        }

        if (this.curLayer && this.curGenerator) {
            for (let i = 0; i < 10 && this.curGenerator && this.curLayer; i++) { // do 10 steps at a time
                const n = this.curGenerator.next();
                if (n.done) {
                    console.log("🍌 next")
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
            console.log("🍌 Complete")
        }
    }
}
