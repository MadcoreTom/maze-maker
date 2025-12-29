import { applyStyle } from "./element-util";

export class DraggableNumberInput extends HTMLElement {
  private input: HTMLInputElement;
  private label: HTMLLabelElement;
  private labelText: string;
  private min: number;
  private max: number;
  private initialValue: number;

  constructor() {
    super();
  }

  connectedCallback() {
    this.min = Math.floor(parseFloat(this.getAttribute("min") || "0"));
    this.max = Math.floor(parseFloat(this.getAttribute("max") || "100"));
    this.initialValue = Math.floor(parseFloat(this.getAttribute("value") || "50"));
    this.labelText = this.getAttribute("label") || "";
    this.createInput();
    this.setupEventListeners();
  }

  private createInput() {
    this.label = document.createElement("label");
    this.label.textContent = this.labelText;

    this.input = document.createElement("input");
    this.input.type = "number";
    this.input.value = this.initialValue.toString();
    this.input.min = this.min.toString();
    this.input.max = this.max.toString();
    this.input.step = "1";
    applyStyle(this.input, {
      background: "#223",
      color: "yellow",
      fontSize: "20px",
      lineHeight: "120%",
      border: "none",
      padding: "0.25em 0.5em",
      width: "50px",
      fontFamily: "monospace",
    });

    this.label.appendChild(this.input);
    this.appendChild(this.label);

    // Focus styles
    this.input.addEventListener("focus", () => {
      applyStyle(this.input, {
        color: "limegreen",
      });
    });

    this.input.addEventListener("blur", () => {
      applyStyle(this.input, {
        color: "yellow",
      });
    });
  }

  private setupEventListeners() {
    let debounceTimeout: number;

    this.input.addEventListener("change", () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = window.setTimeout(() => {
        console.log("Value changed:", this.input.valueAsNumber);
      }, 500);

      this.dispatchEvent(
        new CustomEvent("valuechange", {
          detail: { value: this.input.valueAsNumber },
        }),
      );
    });

    this.input.addEventListener("blur", () => {
      clearTimeout(debounceTimeout);
      console.log("Value on blur:", this.input.valueAsNumber);
    });
  }

  get value(): number {
    return this.input ? this.input.valueAsNumber : this.initialValue;
  }

  set value(val: number) {
    const roundedVal = Math.floor(val);
    if (this.input) {
      this.input.value = roundedVal.toString();
    }
    this.initialValue = roundedVal;
    this.setAttribute("value", roundedVal.toString());
  }
}
