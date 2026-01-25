import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { Array2 } from "../util/array2";
import { LayerLogic } from "./layer";

export class FirstLayer extends LayerLogic {
    constructor() {
        super("First", [
            {
                name: "Width",
                type: "number",
                min: 1,
                max: 100,
                value: 25,
            },
            {
                name: "Height",
                type: "number",
                min: 1,
                max: 100,
                value: 25,
            },
        ]);
    }
    apply(): ReturnsGenerator {
        const w = this.getNumberParam("Width", 10);
        const h = this.getNumberParam("Height", 10);
        const s = this.state as State;
        console.log("potato", w, h, s, this);
        return function* () {
            let room = 1;
            s.maze = new Array2<Tile>(w, h, (x, y) => {
                const solid = x % 2 === 0 || y % 2 === 0;
                return {
                    solid: solid,
                    roomId: !solid ? room++ : 0,
                    type: "outside",
                    visDistance: 9999,
                    visTimestamp: -1,
                };
            });
        };
    }
}
