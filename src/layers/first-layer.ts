import { renderInitState } from "../layers";
import { Array2 } from "../util/array2";
import { ReturnsGenerator, State, Tile } from "../types";
import { Layer3 } from "./layer";

export class FirstLayer extends Layer3 {
    constructor() {
        super("First", [
            {
                name: "Width",
                type: "number",
                min: 1,
                max: 100,
                value: 21
            },
            {
                name: "Height",
                type: "number",
                min: 1,
                max: 100,
                value: 21
            }
        ])
    }
    protected createInitialState(): State {
        let room = 1;
        return {
            maze: new Array2<Tile>(
                this.getNumberParam("Width", 10),
                this.getNumberParam("Height", 10),
                (x, y) => {
                    const solid = x % 2 == 0 || y % 2 == 0;
                    return { solid: solid, roomId: !solid ? room++ : 0 }
                }
            ),
            generatorStack: []
        }
    }
    apply(): ReturnsGenerator {
        return function* () {

        }
    };
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
}
