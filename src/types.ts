

// export abstract class Layer {
//     public constructor(protected readonly regenerateCallback: () => void) {

//     }
//     abstract addControls(parent: HTMLElement);
//     // something that returns a generator
//     abstract generator():Generator<void,void, void>;
// }

// // type a = ()=>Generator<void>;

// class BaseLayer extends Layer {
//     addControls(parent: HTMLElement) {

//     }

//     generator(): Generator<never, void, never> {
//         return function*(){

//         }();
//     }
// }




export type MyGenerator = Generator<undefined, void, unknown>;

export type ReturnsGenerator = () => MyGenerator;


export type Tile = {
    solid: boolean,
    roomId: number
}

import { Array2 } from './util/array2';

export type State = {
    maze: Array2<Tile>,
    generatorStack: MyGenerator[]
}