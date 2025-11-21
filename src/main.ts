import { DraggableNumberInput } from "./draggable-number-input";
import { L1, Layer3 } from "./layers";
import { LayerComponent } from "./layer-component"
import { MyGenerator } from "./types"
import { createElement } from "./element-util";



export class MazeComponent extends HTMLElement {
    private ctx: CanvasRenderingContext2D;
    private curGenerator: null | [Layer3<any, any>, MyGenerator] = null;

    connectedCallback() {

        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.appendChild(canvas);
        canvas.style.alignSelf = "center"

        const layerContainer = createElement("div",{});
        this.appendChild(layerContainer)
        layerContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px`

        let cur: Layer3<any, any> | undefined = L1;
        this.curGenerator = [cur, cur.apply()()];
        cur.init(null);
        while (cur) {

            const elem = document.createElement("my-layercomponent");
            elem.setAttribute("type", cur.title);
            // this.state.generatorStack.push(layer.apply(layer, this.state)())
            layerContainer.appendChild(elem);

            cur = cur.next;
        }

        this.style.cssText =`
        display:flex;
        flex-wrap: wrap;
        flex-direction: column;
        max-height: 100vh`

        this.tick(0);
    }

    public tick(time: number) {
        console.log("tick")
        if (this.curGenerator) {
            const n = this.curGenerator[1].next();
            if (n.done) {
                const nextLayer = this.curGenerator[0].next;
                if (nextLayer) {
                    nextLayer.init(this.curGenerator[0].state);
                    this.curGenerator = [nextLayer, nextLayer.apply()()];
                } else {
                    this.curGenerator = null;
                    console.log("Done")
                    return;
                }
            }

            this.curGenerator[0].render(this.ctx)

            window.requestAnimationFrame(n => this.tick(n));
        } else {
            console.log("done");
        }
    }


    public refreshLayer(layer: Layer3<any, any>) {
        const triggerAnimation = this.curGenerator == null;
        console.log("Refresh", layer?.title, "trigger Animation = " + triggerAnimation, "with prev state", layer.prev?.state);
        layer.init(layer.prev?.state);
        this.curGenerator = [layer, layer.apply()()];
        if (triggerAnimation) {
            window.requestAnimationFrame(n => this.tick(n));
        }
    }
}

customElements.define("my-layercomponent", LayerComponent);

customElements.define("my-mazecomponent", MazeComponent);


customElements.define('draggable-number-input', DraggableNumberInput);