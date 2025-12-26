




export type MyGenerator = Generator<undefined, void, unknown>;

export type ReturnsGenerator = () => MyGenerator;


export type Tile = {
    solid: boolean,
    roomId: number,
    type:"wall" | "outside" | "hall" | "room"
}

import { Array2 } from './util/array2';

export type State = {
    maze: Array2<Tile>,
    // generatorStack: MyGenerator[],
    queue?: [number, number][]
}

export function createInitialState(): State{
    return {
        maze: new Array2<Tile>(1,1,()=>({roomId: 0, solid: true, type: "outside"})),
        // generatorStack: []
    };
}