import { renderInitState } from "../layers";
import type { State, Tile } from "../state";
import type { ReturnsGenerator } from "../types";
import { LayerLogic } from "./layer";

export class EndTrimmerLayer extends LayerLogic {
    constructor() {
        super("Trimmer", [
            {
                name: "iterations",
                min: 0,
                max: 100,
                value: 4,
                type: "number",
            },
        ]);
    }
    protected createInitialState(): State {
        throw new Error("EndTrimmerLayer requires an input state");
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderInitState(ctx, this.state);
        }
    }
    apply(): ReturnsGenerator {
        const state = this.state!;
        const iterations = this.getNumberParam("iterations", 0) * 2;
        return function* () {
            for (let i = 0; i < iterations; i++) {
                const queue: [number, number][] = [];
                state.maze.forEach((x, y, v) => {
                    if (
                        x > 0 &&
                        y > 0 &&
                        x < state.maze.w - 1 &&
                        y < state.maze.h - 1 &&
                        !state.maze.get(x, y)?.solid
                    ) {
                        const neighbours = [
                            state.maze.get(x - 1, y),
                            state.maze.get(x + 1, y),
                            state.maze.get(x, y - 1),
                            state.maze.get(x, y + 1),
                        ].filter(a => a && !a.solid).length;
                        if (neighbours === 1) {
                            queue.push([x, y]);
                        }
                    }
                });
                yield;
                // TODO shuffle queue?
                for (const [x, y] of queue) {
                    (state.maze.get(x, y) as Tile).solid = true;
                    yield;
                }
            }
        };
    }
}
