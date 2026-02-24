import { type Action, calculateAllActions } from "../action";
import { type ActionAnimation, createParallelAnimation } from "../animation";
import { applyParams, L1 } from "../layers";
import type { LayerLogic } from "../layers/layer";
import { PixelRenderer } from "../render/renderer-pixel";
import { createInitialState, type State } from "../state";
import type { MyGenerator } from "../types";
import { calcVisibility } from "../util/distance";

enum Control {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}
const KEY_MAP: { [keyCode: string]: Control } = {
    KeyA: Control.LEFT,
    ArrowLeft: Control.LEFT,
    KeyD: Control.RIGHT,
    ArrowRight: Control.RIGHT,
    KeyW: Control.UP,
    ArrowUp: Control.UP,
    KeyS: Control.DOWN,
    ArrowDown: Control.DOWN,
};

export class GameComponent extends HTMLElement {
    private ctx?: CanvasRenderingContext2D;
    private renderer = new PixelRenderer();
    private state?: State;
    private elements?: {
        canvas: HTMLCanvasElement;
        left: HTMLButtonElement;
        right: HTMLButtonElement;
        up: HTMLButtonElement;
        down: HTMLButtonElement;
    };

    private lastFrameTime: number = 0;
    private curLayer?: LayerLogic = L1;
    private curGenerator?: MyGenerator;

    connectedCallback() {
        console.log("connected");
        // L1.params.filter(p => p.name == "Width").forEach(p => (p.value = 21));
        // L1.params.filter(p => p.name == "Height").forEach(p => (p.value = 21));
        applyParams([
            {
                Width: 15,
                Height: 9,
            },
            {
                Rooms: 3,
                "Width Range": 3,
                "Height Range": 2,
            },
            {},
            {
                iterations: 1,
            },
            {},
            {},
            {},
            {},
        ]);

        this.elements = {
            canvas: this.querySelector("canvas") as HTMLCanvasElement,
            left: this.querySelector("[name=left]") as HTMLButtonElement,
            right: this.querySelector("[name=right]") as HTMLButtonElement,
            up: this.querySelector("[name=up]") as HTMLButtonElement,
            down: this.querySelector("[name=down]") as HTMLButtonElement,
        };

        this.elements.left.addEventListener("click", () => this.keyDown("ArrowLeft"));
        this.elements.right.addEventListener("click", () => this.keyDown("ArrowRight"));
        this.elements.up.addEventListener("click", () => this.keyDown("ArrowUp"));
        this.elements.down.addEventListener("click", () => this.keyDown("ArrowDown"));

        this.elements.canvas.width = 600;
        this.elements.canvas.height = 600;
        this.ctx = this.elements.canvas.getContext("2d") as CanvasRenderingContext2D;

        // initialise the maze
        this.curLayer!.init(createInitialState());
        this.curGenerator = this.curLayer!.apply()();
        console.log("🍌 init", this.curLayer!.state);

        this.setupResizeObserver();
        window.addEventListener("keydown", e => this.keyDown(e.code));

        window.requestAnimationFrame(n => this.tick(n));
    }

    private setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this.onComponentResize(entry.contentRect.width);
            }
        });
        resizeObserver.observe(this);
    }

    private onComponentResize(width: number) {
        console.log(`GameComponent resized: ${width}px`);
        // c * s + a = w
        // w = component width
        // c is between 100 and 120
        // s is a positive integer
        // a is minimised
        // assumptions w is always over 120, and generally under 1000
        // design it so i can control the minimum and maximum values of C

        const w = width;
        const minC = 100; // minimum number of pixels to show (otherwise too zoomed in)
        const maxC = 120; // maximum number of pixels to show (otherwise too zoomed out)

        // Find the optimal c and s that minimize a
        let bestC = minC;
        let bestS = 1; // the pixel scale
        let bestA = w - minC * 1; // the gap

        for (let c = minC; c <= maxC; c++) {
            const s = Math.floor(w / c);
            const a = w - c * s;

            if (s >= 1 && a >= 0 && a < bestA) {
                bestC = c;
                bestS = s;
                bestA = a;
            }
        }

        console.log(`Calculated: c=${bestC}, s=${bestS}, a=${bestA}, total=${bestC * bestS + bestA}`);

        // Update canvas dimensions
        if (this.elements) {
            this.elements.canvas.width = bestC;
            this.elements.canvas.height = bestC;
            this.elements.canvas.style.width = `${bestC * bestS}px`;
            this.elements.canvas.style.height = `${bestC * bestS}px`;
            this.elements.canvas.style.margin = "0 auto";
        }
        if (this.state) {
            this.state.viewportSize = [bestC, bestC];
        } else {
            console.log("Could not set VP size");
        }
    }

    private keyDown(code: string) {
        if (this.state && this.state.phase != "READY") {
            return;
        }
        const control = KEY_MAP[code];
        let action: Action | null = null;
        if (control !== undefined && this.state) {
            switch (control) {
                case Control.LEFT:
                    action = this.state ? this.state.actions.left : null;
                    break;
                case Control.RIGHT:
                    action = this.state ? this.state.actions.right : null;
                    break;
                case Control.UP:
                    action = this.state ? this.state.actions.up : null;
                    break;
                case Control.DOWN:
                    action = this.state ? this.state.actions.down : null;
                    break;
            }
        }

        if (this.state && action) {
            action.onClick(this.state);
            this.state.animation = action.getAnimation(this.state);

            this.state.actions = {
                left: null,
                right: null,
                up: null,
                down: null,
            };
            // disable all buttons while animating
            if (this.state.animation == null) {
                // this.updateActions();
                this.startWorldAnim();
            } else {
                this.state.phase = "PLAYER_ANIM";
            }
            this.updateButtons();
        }
    }

    private startWorldAnim() {
        if (!this.state) {
            return;
        }
        // TODO process this in a different phase of animation
        // TOOD only process discovered ones
        const animations: ActionAnimation[] = [];
        this.state.entities.removeDeadEntities(this.state);
        this.state.entities.forEachEntity(e => {
            const a = e.onTurn(this.state!);
            if (a) {
                animations.push(a);
            }
        });
        if (animations.length > 0) {
            console.log("animations", animations.length);
            this.state.animation = createParallelAnimation(animations);
            this.state.phase = "WORLD_ANIM";
        } else {
            this.state.phase = "READY";
            this.updateActions();
            this.updateButtons();
        }
    }

    // TODO this just has null check and calls another function. it cam be improved to be called from places where its already know not to be null
    private updateActions() {
        if (!this.state) {
            return;
        }
        this.state.actions = calculateAllActions(this.state);

        // TODO move this to its own place
        calcVisibility(this.state, this.state.entities.getEntityByName("player")!.getTile(), 4, Date.now());
    }

    private updateButtons() {
        if (!this.state || !this.elements) {
            return;
        }
        const directions: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"];
        directions.forEach(k => {
            if (this.state!.actions[k]) {
                this.elements![k].disabled = false;
                this.elements![k].textContent = this.state!.actions[k].displayName;
            } else {
                this.elements![k].disabled = true;
                this.elements![k].textContent = "";
            }
        });
    }

    private tick(time: number) {
        const delta = Math.min(100, time - this.lastFrameTime);
        this.lastFrameTime = time;

        if (this.state && this.state.triggerNewLevel) {
            this.state = undefined;

            // make the level bigger
            applyParams([
                {
                    Width: L1.params.filter(p => p.name == "Width")[0].value + 2,
                    Height: L1.params.filter(p => p.name == "Height")[0].value + 4,
                },
                {
                    Rooms: 3,
                    "Width Range": 3,
                    "Height Range": 2,
                },
                {},
                {
                    iterations: 1,
                },
                {},
                {},
                {},
                {},
            ]);
            this.curLayer = L1;
            this.curLayer!.init(createInitialState());
            this.curGenerator = this.curLayer!.apply()();
        }

        if (this.ctx && this.state) {
            this.renderer.render(this.ctx, this.state);
        } else if (this.ctx && this.curLayer) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, 600, 600);
            this.ctx.fillStyle = "yellow";
            this.ctx.fillText("Layer " + this.curLayer.title, 10, 10);
        }

        if (this.state) {
            // Clean up dead entities
            this.state.entities.removeDeadEntities(this.state);

            if (this.state.animation) {
                const finished = this.state.animation(delta, this.state);
                if (finished) {
                    this.state.animation = null;

                    if (this.state.phase == "PLAYER_ANIM") {
                        this.startWorldAnim();
                    } else {
                        this.state.phase = "READY";
                        this.updateActions();
                        this.updateButtons();
                    }
                }
            }
        }

        if (this.curLayer && this.curGenerator) {
            for (let i = 0; i < 10 && this.curGenerator && this.curLayer; i++) {
                // do 10 steps at a time
                const n = this.curGenerator.next();
                if (n.done) {
                    console.log("🍌 next");
                    if (this.curLayer.next) {
                        this.curLayer = this.curLayer.next;
                        this.curLayer.init(this.curLayer!.prev!.state!);
                        this.curGenerator = this.curLayer.apply()();
                    } else {
                        this.state = this.curLayer.state;
                        this.state!.viewportSize = [this.elements!.canvas.width, this.elements!.canvas.height];
                        this.curGenerator = undefined;
                    }
                }
            }
            if (!this.curGenerator && this.state) {
                this.updateActions();
                this.updateButtons();
            }
        }

        if (this.ctx && this.state) {
            this.ctx.fillStyle = "cyan";
            this.state.inventory.forEach((name, idx) => {
                this.ctx!.fillText(name, 10, 30 + 10 * idx);
            });
        }

        this.lastFrameTime = time;
        window.requestAnimationFrame(n => this.tick(n));
    }
}
