import { renderInitState } from "../layers";
import { ReturnsGenerator, State } from "../types";
import { shuffle } from "../util/random";
import { XY } from "../util/xy";
import { LayerLogic } from "./layer";

export class FillHairpinsLayer extends LayerLogic {
    constructor() {
        super("Fill Hairpins", [
            {
                name: "Iterations",
                type: "number",
                min: 0,
                max: 100,
                value: 0
            }
        ])
    }
    protected createInitialState(): State {
        throw new Error("FillHairpinsLayer requires an input state");
    }
    apply(): ReturnsGenerator {
        const kernel: XY[] = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        const state = this.state!;
        const iterations = this.getNumberParam("Iterations", 0);
        return function* () {
            for (let i = 0; i < iterations; i++) {
                // find candidates
                const candidates: XY[] = [];
                state.maze.forEach((x, y, v) => {
                    if (v && v.solid) {
                        const k = state.maze.getKernel([x, y], kernel);
                        if (k.filter(a => a && !a.solid).length >=6) {
                            candidates.push([x, y]);
                        }
                    }
                });
                yield;
                shuffle(candidates);
                yield;
                for(let xy of candidates){
                    // check if still good
                    const k = state.maze.getKernel(xy, kernel);
                        if (k.filter(a => a && !a.solid).length >= 6) {
                            const  t = state.maze.get(xy[0],xy[1]);
                            if(t){
                                t.solid = false;
                                t.roomId = k.filter(k=>k).map(k=>k?.roomId)[0] || 0;
                            }
                        }
                        yield;
                };
                yield;
            }
        }
    };
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
}