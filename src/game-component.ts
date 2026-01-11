import { L1 } from "./layers";
import { LayerLogic } from "./layers/layer";
import { PixelRenderer } from "./render/renderer-pixel";
import { createInitialState, State } from "./state";
import { MyGenerator } from "./types";

enum Control {
    UP,
    DOWN, 
    LEFT, 
    RIGHT
}
const KEY_MAP :{[keyCode:string]:Control} = {
    "KeyA": Control.LEFT,
    "ArrowLeft": Control.LEFT,
    "KeyD": Control.RIGHT,
    "ArrowRight": Control.RIGHT,
    "KeyW": Control.UP,
    "ArrowUp": Control.UP,
    "KeyS": Control.DOWN,
    "ArrowDown": Control.DOWN,
}

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
        
        this.elements.left.addEventListener("click", ()=>this.keyDown("ArrowLeft"));
        this.elements.right.addEventListener("click", ()=>this.keyDown("ArrowRight"));
        this.elements.up.addEventListener("click", ()=>this.keyDown("ArrowUp"));
        this.elements.down.addEventListener("click", ()=>this.keyDown("ArrowDown"));

        this.elements.canvas.width = 600;
        this.elements.canvas.height = 600;
        this.ctx = this.elements.canvas.getContext("2d") as CanvasRenderingContext2D;

        // initialise the maze
        this.curLayer!.init(createInitialState());
        this.curGenerator = this.curLayer!.apply()();
        console.log("🍌 init", this.curLayer!.state);

        this.setupResizeObserver();
        window.addEventListener("keydown",(e)=>this.keyDown(e.code))

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
    }

    private keyDown(code:string){
        console.log("Key", code, KEY_MAP[code],KEY_MAP[code] ? Control[KEY_MAP[code]] : "?");
        const control = KEY_MAP[code];
        if(control !== undefined && this.state){
            switch(control){
                case Control.LEFT:
                    this.addAnimation("player", "LEFT");
                    break;
                case Control.RIGHT:
                    this.addAnimation("player", "RIGHT");
                    break;
                case Control.UP:
                    this.addAnimation("player", "UP");
                    break;
                case Control.DOWN:
                    this.addAnimation("player", "DOWN");
                    break;
            }
        }
    }

    private addAnimation(spriteName: string, type: any /*TODO */) {
        const exists = this.state && this.state.animations.filter(a => a.spriteName === spriteName).length > 0;
        if (!exists && this.state) {
            this.state.animations.push({
                spriteName: spriteName,
                duration: 240,
                starttime: this.lastFrameTime,
                type: type
            })

        }
    }

    private tick(time: number) {
        if (this.ctx && this.state) {
            this.renderer.render(this.ctx, this.state);
        } else if(this.ctx &&this.curLayer){
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0,0,600,600);
            this.ctx.fillStyle = "yellow";
            this.ctx.fillText("Layer " + this.curLayer.title, 10, 10);
        }

        if(this.state){
        this.state.animations = this.state.animations.filter(anim => {
            const progress = Math.min(1,(time - anim.starttime) / anim.duration);
            if(anim.type == "RIGHT"){
                const s= this.state!.sprites.getSpriteByName(anim.spriteName);
                if(s){
                    s.position[0] = 2+ s.tile[0] * 18 + Math.round(progress * 18);
                    if(progress >= 1){
                        s.tile[0]++;
                    }
                }
            } else if(anim.type == "LEFT"){
                const s= this.state!.sprites.getSpriteByName(anim.spriteName);
                if(s){
                    s.position[0] = 2+ s.tile[0] * 18 - Math.round(progress * 18);
                    if(progress >= 1){
                        s.tile[0]--;
                    }
                }
            } else  if(anim.type == "DOWN"){
                const s= this.state!.sprites.getSpriteByName(anim.spriteName);
                if(s){
                    s.position[1] = 6+ s.tile[1] * 18 + Math.round(progress * 18);
                    if(progress >= 1){
                        s.tile[1]++;
                    }
                }
            } else if(anim.type == "UP"){
                const s= this.state!.sprites.getSpriteByName(anim.spriteName);
                if(s){
                    s.position[1] = 5+ s.tile[1] * 18 - Math.round(progress * 18);
                    if(progress >= 1){
                        s.tile[1]--;
                    }
                }
            }
            return progress < 1;
        });

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
                        this.curGenerator = undefined;
                    }
                }
            }
            if(!this.curGenerator && this.state){
                // last generator step
                this.state.sprites.addSprite("player", {position: [2,6], tile:[0,0],sprite:{left:0,top:0,width:16,height:12}})
            }
        } 

this.lastFrameTime = time;
            window.requestAnimationFrame(n => this.tick(n));
    }
}
