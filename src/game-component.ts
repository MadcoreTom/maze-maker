import { type Action, WalkDownAction, WalkLeftAction, WalkRightAction, WalkUpAction } from "./action";
import { L1 } from "./layers";
import type { LayerLogic } from "./layers/layer";
import { PixelRenderer } from "./render/renderer-pixel";
import { createInitialState, type State } from "./state";
import type { MyGenerator } from "./types";
import type { XY } from "./util/xy";

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
        console.log("Key", code, KEY_MAP[code], KEY_MAP[code] ? Control[KEY_MAP[code]] : "?");
        console.log(this.state?.actions);
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
            this.updateButtons();
        }
    }

    // private addAnimation(spriteName: string, type: any /*TODO */) {
    //     const exists = this.state && this.state.animations.filter(a => a.spriteName === spriteName).length > 0;
    //     if (!exists && this.state) {
    //         this.state.animations.push({
    //             spriteName: spriteName,
    //             duration: 240,
    //             starttime: this.lastFrameTime,
    //             type: type
    //         })

    //     }
    // }

    private updateAction(key: "left" | "right" | "up" | "down", dx: number, dy: number, createAction: () => Action) {
        if (!this.state) {
            return;
        }
        const kernel: XY[] = [
            [dx, dy],
            [2 * dx, 2 * dy],
        ];
        const result = this.state.maze.getKernel(this.state.sprites.getSpriteByName("player")!.tile, kernel);

        if (result[0] && !result[0].solid && result[1] && !result[1].solid) {
            this.state.actions[key] = createAction();
        }
        // console.log("result", result, this.state.actions)
    }

    private updateButtons() {
        if (!this.state || !this.elements) {
            return;
        }
        ["up", "down", "left", "right"].forEach(key => {
            if (this.state!.actions[key]) {
                this.elements![key].disabled = false;
                this.elements![key].textContent = this.state!.actions[key].displayName;
            } else {
                this.elements![key].disabled = true;
                this.elements![key].textContent = "";
            }
        });
    }

    private tick(time: number) {
        const delta = Math.min(100, time - this.lastFrameTime);
        this.lastFrameTime = time;
        if (this.ctx && this.state) {
            this.renderer.render(this.ctx, this.state);
        } else if (this.ctx && this.curLayer) {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, 600, 600);
            this.ctx.fillStyle = "yellow";
            this.ctx.fillText("Layer " + this.curLayer.title, 10, 10);
        }

        if (this.state) {
            if (this.state.animation) {
                const finished = this.state.animation(delta);
                if (finished) {
                    this.state.animation = null;
                    // TODO calculate next available actions (unless its time for sprites to take turns?)
                    this.state.actions = {
                        left: null,
                        right: null,
                        up: null,
                        down: null,
                    };

                    this.updateAction("left", -1, 0, () => new WalkLeftAction());
                    this.updateAction("right", 1, 0, () => new WalkRightAction());
                    this.updateAction("up", 0, -1, () => new WalkUpAction());
                    this.updateAction("down", 0, 1, () => new WalkDownAction());
                    this.updateButtons();
                }
            }

            // this.state.animations = this.state.animations.filter(anim => {
            //     const progress = Math.min(1,(time - anim.starttime) / anim.duration);
            //     if(anim.type == "RIGHT"){
            //         const s= this.state!.sprites.getSpriteByName(anim.spriteName);
            //         if(s){
            //             s.position[0] = 2+ s.tile[0] * 18 + Math.floor(progress * 18);
            //             if(progress >= 1){
            //                 s.tile[0]++;
            //                 s.position[0] = 2+ s.tile[0] * 18;
            //             }
            //         }
            //     } else if(anim.type == "LEFT"){
            //         const s= this.state!.sprites.getSpriteByName(anim.spriteName);
            //         if(s){
            //             s.position[0] = 2+ s.tile[0] * 18 - Math.floor(progress * 18);
            //             if(progress >= 1){
            //                 s.tile[0]--;
            //                 s.position[0] = 2+ s.tile[0] * 18;
            //             }
            //         }
            //     } else  if(anim.type == "DOWN"){
            //         const s= this.state!.sprites.getSpriteByName(anim.spriteName);
            //         if(s){
            //             s.position[1] = 6+ s.tile[1] * 18 + Math.floor(progress * 18);
            //             if(progress >= 1){
            //                 s.tile[1]++;
            //                 s.position[1] = 6+ s.tile[1] * 18;
            //             }
            //         }
            //     } else if(anim.type == "UP"){
            //         const s= this.state!.sprites.getSpriteByName(anim.spriteName);
            //         if(s){
            //             s.position[1] = 5+ s.tile[1] * 18 - Math.floor(progress * 18);
            //             if(progress >= 1){
            //                 s.tile[1]--;
            //                 s.position[1] = 6+ s.tile[1] * 18;
            //             }
            //         }
            //     }
            //     return progress < 1;
            // });
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
                // last generator step
                let pos:XY = this.state.start || [1,1];
                this.state.sprites.addSprite("player", {
                    position: [pos[0] * 18, pos[1] * 18],
                    tile: pos,
                    sprite: { left: 0, top: 0, width: 16, height: 12 },
                });
            }
        }

        this.lastFrameTime = time;
        window.requestAnimationFrame(n => this.tick(n));
    }
}
