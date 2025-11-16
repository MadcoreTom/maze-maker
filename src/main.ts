// const LAYERS = ["Dimensions", "banana", "coconut"]

import { Layer, LAYERS2 } from "./layers";
import { LayerComponent } from "./lsyer-component"
import { Array2, ReturnsGenerator, State } from "./types"



export class MazeComponent extends HTMLElement {
    private ctx:CanvasRenderingContext2D;
    public state:State = {
        maze: new Array2(20, 20, (x,y)=>({roomId:0, solid: true})),
        generatorStack: []
    };

    connectedCallback() {
        
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.appendChild(canvas);

        LAYERS2.forEach(layer => {
            const elem = document.createElement("my-layercomponent");
            elem.setAttribute("type", layer.title);
            this.state.generatorStack.push(layer.apply(layer, this.state)())
            this.appendChild(elem);
        });
        // TODO add canvas
        this.tick(0);
    }

    public tick(time:number){
        console.log("tick")
        if(this.state.generatorStack.length > 0){
            const n = this.state.generatorStack[0].next();
            if(n.done){
                this.state.generatorStack.shift(); // more of a queue at this point
            }

            const ctx = this.ctx;
            ctx.fillStyle = "white";
            const w = 600, h= 600;
            ctx.fillRect(0,0,w,h);
            const s =Math.floor(Math.min(w/this.state.maze.w, h/this.state.maze.h));
            this.state.maze.forEach((x,y,v)=>{
                ctx.fillStyle = v.solid ? "navy" : "yellow";
                ctx.fillRect(x*s,y*s,s,s);
            });
            ctx.strokeStyle = "black"
            this.state.maze.forEach((x,y,v)=>{
                ctx.strokeRect(x*s,y*s,s,s);
            });

            window.requestAnimationFrame(n=>this.tick(n));
        } else {
            console.log("done");
        }
    }

    public refreshLayer(layer:Layer){
        // TODO i nthe future this will store a state at each depth
        // the array2 will have a function to copy
        const stackLen =this.state.generatorStack.length;
        this.state.generatorStack = [];
        LAYERS2.forEach(layer => {
            this.state.generatorStack.push(layer.apply(layer, this.state)());
        });
        if(stackLen == 0){
            this.tick(0)
        }
    }
}

customElements.define("my-layercomponent", LayerComponent);

customElements.define("my-mazecomponent", MazeComponent);
