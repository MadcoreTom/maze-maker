export class DraggableNumberInput extends HTMLElement {
    private input: HTMLInputElement;
    private label: HTMLLabelElement;
    private isDragging = false;
    private startY = 0;
    private startValue = 0;
    private dragSensitivity = 0.2;
    private min: number;
    private max: number;
    private initialValue: number;

    constructor() {
        super();
        
    }

    connectedCallback() {
        this.min = Math.floor(parseFloat(this.getAttribute('min') || '0'));
        this.max = Math.floor(parseFloat(this.getAttribute('max') || '100'));
        this.initialValue = Math.floor(parseFloat(this.getAttribute('value') || '50'));
        this.createInput();
        this.setupEventListeners();
    }

    private createInput() {
        this.label = document.createElement('label');
        this.label.style.cursor = 'ns-resize';
        this.label.style.userSelect = 'none';
        this.label.style.display = 'inline-block';
        this.label.style.padding = '4px 8px';
        this.label.style.backgroundColor = '#2a2a2a';
        this.label.style.border = '1px solid #666';
        this.label.style.borderRadius = '4px';
        this.label.style.color = '#ccc';

        this.input = document.createElement('input');
        this.input.type = 'number';
        this.input.value = this.initialValue.toString();
        this.input.min = this.min.toString();
        this.input.max = this.max.toString();
        this.input.step = '1';
        this.input.style.backgroundColor = 'transparent';
        this.input.style.border = 'none';
        this.input.style.color = '#ccc';
        this.input.style.outline = 'none';
        this.input.style.width = '60px';
        this.input.style.fontSize = '14px';

        this.label.appendChild(this.input);
        this.appendChild(this.label);
        
        // Focus styles
        this.input.addEventListener('focus', () => {
            this.label.style.backgroundColor = '#3a3a2a';
            this.label.style.borderColor = '#b8b800';
            this.label.style.color = '#fff';
            this.input.style.color = '#fff';
        });
        
        this.input.addEventListener('blur', () => {
            this.label.style.backgroundColor = '#2a2a2a';
            this.label.style.borderColor = '#666';
            this.label.style.color = '#ccc';
            this.input.style.color = '#ccc';
        });
    }

    private setupEventListeners() {
        this.label.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        this.label.addEventListener('pointermove', this.handlePointerMove.bind(this));
        this.label.addEventListener('pointerup', this.handlePointerUp.bind(this));
        this.label.addEventListener('pointercancel', this.handlePointerUp.bind(this));
        
        let debounceTimeout: number;
        
        this.input.addEventListener('change', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = window.setTimeout(() => {
                console.log('Value changed:', this.input.valueAsNumber);
            }, 500);
            
            this.dispatchEvent(new CustomEvent('valuechange', {
                detail: { value: this.input.valueAsNumber }
            }));
        });
        
        this.input.addEventListener('blur', () => {
            clearTimeout(debounceTimeout);
            console.log('Value on blur:', this.input.valueAsNumber);
        });
    }

    private handlePointerDown(e: PointerEvent) {
        e.preventDefault();
        this.isDragging = true;
        this.startY = e.clientY;
        this.startValue = this.input.valueAsNumber;
        this.label.style.cursor = 'grabbing';
        this.label.setPointerCapture(e.pointerId);
    }

    private handlePointerMove(e: PointerEvent) {
        if (!this.isDragging) return;

        e.preventDefault();
        const deltaY = this.startY - e.clientY;
        const deltaValue = Math.round(deltaY * this.dragSensitivity);
        let newValue = this.startValue + deltaValue;

        newValue = Math.max(this.min, Math.min(this.max, newValue));

        this.input.value = newValue.toString();
        
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: newValue }
        }));
    }

    private handlePointerUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.label.style.cursor = 'ns-resize';
        }
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
        this.setAttribute('value', roundedVal.toString());
    }
}

