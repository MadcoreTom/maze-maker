import { Array2, ReturnsGenerator, State, Tile } from "./types"

export type Layer = {
    title: string,
    params: Parameter[],
    apply: (layer: Layer, state: State) => ReturnsGenerator
}

export type Parameter = {
    name: string,
    type: "number",
    min: number,
    max: number,
    value: number
}

export const LAYERS2: Layer[] = [
    {
        title: "Dimension",
        params: [
            {
                name: "Width",
                type: "number",
                min: 5,
                max: 100,
                value: 20
            },
            {
                name: "Height",
                type: "number",
                min: 5,
                max: 100,
                value: 20
            }
        ],
        apply: (layer: Layer, state: State): ReturnsGenerator => {
            return function* () {
                state.maze = new Array2(
                    getNumberParam(layer,"Width",10),
                    getNumberParam(layer,"Height",10),
                ()=>({solid:true, roomId: 1}))
                return;
            }
        }
    },
    {
        title: "randomize",
        params: [{
            name: "iterations",
            min:0, max:1000,type:"number",value:100
        }],
        apply: (layer: Layer, state: State): ReturnsGenerator => {
            return function* () {
                yield;
                const count = getNumberParam(layer, "iterations",0);
                for(let i=0;i<count;i++){
                    (state.maze.get(Math.floor(Math.random()*state.maze.w),Math.floor(Math.random() * state.maze.h)) as Tile).solid = Math.random() > 0.5;
                    yield;
                }
                return;
            }
        }
    }
]

function getNumberParam(layer:Layer, name:string, defaultVal:number):number{
    const param = layer.params.filter(p=>p.name == name && p.type == "number")[0];
    return param ? param.value : defaultVal;
}