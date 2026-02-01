import { applyStyle, createElement } from "./element-util";
import { ALL_LAYERS } from "./layers";
import type { LayerLogic } from "./layers/layer";
import { MazeComponent } from "./main";

export class LayerComponent extends HTMLElement {
    private layer: LayerLogic;
    private parent: MazeComponent;
    private regen: HTMLButtonElement;

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
                    this.onReady(parent, type);
                }
            } else {
                console.log("Could not find parent");
            }
        }, 1);
        applyStyle(this, {
            background: "black",
            color: "#bbb",
            padding: "5px",
            display: "flex",
            alignItems: "anchor-center",
            borderRadius: "2px",
            justifyContent: "space-between",
            minHeight: "36px",
        });
    }

    private onReady(parent: MazeComponent, type: string) {
        const title = document.createElement("h2");
        title.innerText = type;
        applyStyle(title, {
            lineHeight: "100%",
            margin: "0",
            fontFamily: "monospace",
            color: "white",
        });
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

        this.regen = document.createElement("button");
        this.regen.textContent = "↻";
        this.regen.disabled = this.getAttribute("state") === "todo";
        this.regen.ariaLabel = "Re-generate";
        applyStyle(this.regen, {
            background: "#bbb",
            color: "black",
            height: "30px",
            width: "30px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
        });
        this.regen.addEventListener("mouseover", () => {
            if (!this.regen.disabled) {
                applyStyle(this.regen, { background: "limegreen" });
            }
        });
        this.regen.addEventListener("mouseout", () => {
            applyStyle(this.regen, { background: "#bbb" });
        });
        this.regen.addEventListener("click", () => {
            this.onChange();
        });
        this.appendChild(this.regen);
    }

    private addNumberInput(parent: HTMLElement, title: string, min: number, max: number, defaultVal: number) {
        const input = createElement("number-input", {
            min,
            max,
            value: defaultVal,
            label: title,
        });

        parent.appendChild(input);

        let debounceTimeout: number;

        input.addEventListener("valuechange", (e: any) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = window.setTimeout(() => {
                this.layer.params
                    .filter(p => p.name === title && p.type === "number")
                    .forEach(p => {
                        p.value = e.detail.value;
                    });
                this.onChange();
            }, 500);
        });
    }

    private onChange() {
        if (this.parent) {
            this.parent.refreshLayer(this.layer);
        }
    }

    static get observedAttributes() {
        return ["status"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "status" && newValue !== oldValue) {
            console.log(`Status change of ${this.layer?.title || "?"} from ${oldValue} to ${newValue}`);
            switch (newValue) {
                case "active":
                    this.style.border = "4px solid cyan";
                    this.regen.disabled = false;
                    break;
                case "complete":
                    this.style.border = "4px solid limegreen";
                    this.regen.disabled = false;
                    break;
                default:
                    this.style.border = "4px dotted yellow";
                    this.regen.disabled = true;
                    break;
            }
        }
    }
}
