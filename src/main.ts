import { NumberInput } from "./draggable-number-input";
import { applyStyle, createElement } from "./element-util";
import { GameComponent } from "./game-component";
import { LayerComponent } from "./layer-component";
import { ALL_LAYERS, L1 } from "./layers";
import type { LayerLogic } from "./layers/layer";
import { createInitialState, type State } from "./state";
import type { MyGenerator } from "./types";

export class MazeComponent extends HTMLElement {
    private ctx?: CanvasRenderingContext2D;
    private curGenerator: null | [LayerLogic, MyGenerator] = null;
    private layerElements: LayerComponent[] = [];

    connectedCallback() {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.appendChild(canvas);
        canvas.style.alignSelf = "center";

        const layerContainer = createElement("div", {});
        this.appendChild(layerContainer);
        applyStyle(layerContainer, {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
        });

        let cur: LayerLogic | undefined = L1;
        cur.init(createInitialState());
        this.curGenerator = [cur, cur.apply()()];
        while (cur) {
            const elem = document.createElement("my-layercomponent");
            elem.setAttribute("type", cur.title);
            this.layerElements.push(elem as LayerComponent);
            // this.state.generatorStack.push(layer.apply(layer, this.state)())
            layerContainer.appendChild(elem);

            cur = cur.next;
        }
        applyStyle(this, {
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            maxHeight: "100vh",
        });
        this.tick(0);
    }

    public tick(time: number) {
        console.log("tick");
        if (this.curGenerator) {
            const n = this.curGenerator[1].next();
            if (n.done) {
                this.curGenerator[1].next();
                const nextLayer = this.curGenerator[0].next;
                if (nextLayer) {
                    nextLayer.init(this.curGenerator[0].state || createInitialState());
                    this.curGenerator = [nextLayer, nextLayer.apply()()];
                    this.updateStatuses();
                } else {
                    this.curGenerator = null;
                    console.log("Done");
                    this.updateStatuses();
                    return;
                }
            }

            this.curGenerator[0].renderer.render(this.ctx!, this.curGenerator[0].state as State);

            window.requestAnimationFrame(n => this.tick(n));
        } else {
            console.log("done");
        }
    }

    private updateStatuses() {
        let status = "complete";
        for (const elem of this.layerElements) {
            if (this.curGenerator && ALL_LAYERS[elem.getAttribute("type") as string] === this.curGenerator[0]) {
                status = "active";
            }
            elem.setAttribute("status", status);
            if (status === "active") {
                status = "todo";
            }
        }
    }

    public refreshLayer(layer: LayerLogic) {
        const triggerAnimation = this.curGenerator === null;
        console.log(
            "Refresh",
            layer?.title,
            "trigger Animation = " + triggerAnimation,
            "with prev state",
            layer.prev?.state,
        );
        layer.init(layer.prev?.state || createInitialState());
        this.curGenerator = [layer, layer.apply()()];
        this.updateStatuses();
        if (triggerAnimation) {
            window.requestAnimationFrame(n => this.tick(n));
        }
    }
}

customElements.define("my-layercomponent", LayerComponent);

customElements.define("my-mazecomponent", MazeComponent);

customElements.define("number-input", NumberInput);

customElements.define("my-game", GameComponent);
