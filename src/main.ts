import { DraggableNumberInput } from "./draggable-number-input";
import { L1 } from "./layers";
import { LayerComponent } from "./layer-component"
import { createInitialState, MyGenerator } from "./types"
import { applyStyle, createElement } from "./element-util";
import { LayerLogic } from "./layers/layer";



export class MazeComponent extends HTMLElement {
    private ctx: CanvasRenderingContext2D;
    private curGenerator: null | [LayerLogic, MyGenerator] = null;

    connectedCallback() {

        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.appendChild(canvas);
        canvas.style.alignSelf = "center"

        const layerContainer = createElement("div",{});
        this.appendChild(layerContainer);
        applyStyle(
            layerContainer,
            {
                display: "flex",
                flexDirection: "column",
                gap: "10px"
            }
        );

        let cur: LayerLogic | undefined = L1;
        cur.init(createInitialState());
        this.curGenerator = [cur, cur.apply()()];
        while (cur) {

            const elem = document.createElement("my-layercomponent");
            elem.setAttribute("type", cur.title);
            // this.state.generatorStack.push(layer.apply(layer, this.state)())
            layerContainer.appendChild(elem);

            cur = cur.next;
        }
        applyStyle(
            this,
            {
                display: "flex",
                flexWrap : "wrap",
                flexDirection: "column",
                maxHeight: "100vh"
            }
        );
        this.tick(0);
    }

    public tick(time: number) {
        console.log("tick")
        if (this.curGenerator) {
            const n = this.curGenerator[1].next();
            if (n.done) {
                this.curGenerator[1].next();
                const nextLayer = this.curGenerator[0].next;
                if (nextLayer) {
                    nextLayer.init(this.curGenerator[0].state || createInitialState());
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


    public refreshLayer(layer: LayerLogic) {
        const triggerAnimation = this.curGenerator == null;
        console.log("Refresh", layer?.title, "trigger Animation = " + triggerAnimation, "with prev state", layer.prev?.state);
        layer.init(layer.prev?.state || createInitialState());
        this.curGenerator = [layer, layer.apply()()];
        if (triggerAnimation) {
            window.requestAnimationFrame(n => this.tick(n));
        }
    }
}

customElements.define("my-layercomponent", LayerComponent);

customElements.define("my-mazecomponent", MazeComponent);


customElements.define('draggable-number-input', DraggableNumberInput);