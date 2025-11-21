import { ALL_LAYERS, Layer3 } from "./layers";
import { MazeComponent } from "./main";
import "./draggable-number-input";
import { createElement } from "./element-util";

export class LayerComponent extends HTMLElement {
    private layer: Layer3<any, any>;
    private parent: MazeComponent;

    private findParentMaze(): MazeComponent | undefined {
        let p = this.parentNode;
        while (p) {
            if (p instanceof MazeComponent) {
                return p;
            }
            p = p.parentNode;
        }
        return;
    }
    connectedCallback() {
        setTimeout(() => {
            const parent = this.findParentMaze();
            if (parent) {
                this.parent = parent;
                const type = this.getAttribute("type");

                if (parent && type) {
                    this.onReady(parent, type)

                }
            }
            else { console.log("Could not find parent") }
        }, 1)
        this.style.cssText = `
        border: 10px solid red;
        border-radius: 5px;
        display:flex;`
    }

    private onReady(parent: MazeComponent, type: string) {
        const title = document.createElement("h2");
        title.innerText = type;
        this.appendChild(title);
        
        const layer = ALL_LAYERS[type];
        if (layer) {
            layer.params.forEach(param => {
                this.addNumberInput(this, param.name, param.min, param.max, param.value);
            });
            this.layer = layer;
        } else {
            console.log("Could not find layer");
        }
    }

    private addNumberInput(parent: HTMLElement, title: string, min: number, max: number, defaultVal: number) {
        const label = document.createElement("label");
        label.textContent = title + " ";
        
const input = createElement("draggable-number-input", {
    min, max,value:defaultVal
})

        label.appendChild(input);
        parent.appendChild(label);
        
        let debounceTimeout: number;
        
        input.addEventListener("valuechange", (e: any) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = window.setTimeout(() => {
                this.layer.params.filter(p => p.name == title && p.type == "number").forEach(p => p.value = e.detail.value)
                this.onChange();
            }, 500);
        });
    }

    private onChange() {
        if (this.parent) {
            this.parent.refreshLayer(this.layer);
        }
    }

}
