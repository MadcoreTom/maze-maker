import { ALL_LAYERS, Layer3 } from "./layers";
import { MazeComponent } from "./main";

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
    }

    private onReady(parent: MazeComponent, type: string) {
        const title = document.createElement("h2");
        title.innerText = type;
        this.appendChild(title);
        /*
                switch (type) {
                    case "Dimensions": {
                        // const widthElem = document.createElement("input");
                        // widthElem.type = "number";
                        // this.appendChild(widthElem);
                        addNumberInput(this, "Width",5,100,20);
                        addNumberInput(this, "Height",5,100,20);
                    }
                }
                    */
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
        label.textContent = title;
        const input = document.createElement("input") as HTMLInputElement;
        input.type = "number";
        input.value = defaultVal + "";
        input.min = min + "";
        input.max = max + "";
        label.appendChild(input);
        parent.appendChild(label);
        input.addEventListener("blur", () => {
            this.layer.params.filter(p => p.name == title && p.type == "number").forEach(p => p.value = input.valueAsNumber)
            this.onChange();
        });
    }

    private onChange() {
        if (this.parent) {
            this.parent.refreshLayer(this.layer);
        }
    }

}
