import { ALL_LAYERS } from "./layers";
import { MazeComponent } from "./main";
import "./draggable-number-input";
import { applyStyle, createElement } from "./element-util";
import type { LayerLogic } from "./layers/layer";

export class LayerComponent extends HTMLElement {
  private layer: LayerLogic;
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

    const regen = document.createElement("button");
    regen.textContent = "↻";
    regen.ariaLabel = "Re-generate";
    applyStyle(regen, {
      background: "#bbb",
      color: "black",
      height: "30px",
      width: "30px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    });
    regen.addEventListener("mouseover", () => {
      applyStyle(regen, { background: "limegreen" });
    });
    regen.addEventListener("mouseout", () => {
      applyStyle(regen, { background: "#bbb" });
    });
    regen.addEventListener("click", () => {
      this.onChange();
    });
    this.appendChild(regen);
  }

  private addNumberInput(parent: HTMLElement, title: string, min: number, max: number, defaultVal: number) {
    const input = createElement("draggable-number-input", {
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
}
