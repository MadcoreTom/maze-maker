import type { State } from "../state";

export interface Renderer {
    render(ctx: CanvasRenderingContext2D, state: State): void;
}
