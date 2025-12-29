import type { ReturnsGenerator, State, Tile } from "../types";
import type { XY } from "../util/xy";
import { LayerLogic } from "./layer";

export class IdentifierLayer extends LayerLogic {
  constructor() {
    super("Identify", []);
  }

  apply(): ReturnsGenerator {
    (this.state as State).maze.forEach((x, y, t) => {
      t.type = "outside";
    });
    const kernel: XY[] = [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 0],
    ];
    const wallKernel: XY[] = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    const state = this.state!;
    return function* () {
      // find room and hallways
      state.maze.forEach((x, y, v) => {
        if (v) {
          if (!v.solid) {
            const k = state.maze.getKernel([x, y], kernel);
            if (k.filter(a => a && !a.solid).length === 4) {
              (k[0] as Tile).type = "room";
              (k[1] as Tile).type = "room";
              (k[2] as Tile).type = "room";
              (k[3] as Tile).type = "room";
            } else if (k[3] && !k[3].solid) {
              v.type = "hall";
            }
          } else {
            const k = state.maze.getKernel([x, y], wallKernel);
            if (k.filter(a => a && !a.solid).length > 0) {
              v.type = "wall";
            }
          }
        }
      });
      // TODO if near a room or a hall its a wall, and the rest is outside
      yield;
      state.maze.forEach((x, y, v) => {
        if (v.type === "hall" && x % 2 !== y % 2) {
          const door =
            state.maze
              .getKernel(
                [x, y],
                [
                  [-1, 0],
                  [1, 0],
                  [0, 1],
                  [0, -1],
                ],
              )
              .filter(t => t?.type === "room").length > 0;
          if (door) {
            console.log("Door detected", x, y);
            v.type = "door";
          }
        }
      });
      yield;
    };
  }
  render(ctx: CanvasRenderingContext2D) {
    if (this.state) {
      const state = this.state;
      ctx.fillStyle = "red";
      const w = 600,
        h = 600;
      ctx.fillRect(0, 0, w, h);
      const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h)) * 2;
      const wa = Math.ceil(s * 0.2);
      const f = s - wa;
      // vertical
      const vwa = Math.ceil(s * 0.4);
      const vf = s - vwa;
      state.maze.forEach((x, y, v) => {
        ctx.fillStyle = colorMap[v.type];
        if (v.type === "door") {
          console.log("door");
        }
        ctx.fillRect(
          Math.floor(x / 2) * f + Math.ceil(x / 2) * wa,
          Math.floor(y / 2) * vf + Math.ceil(y / 2) * vwa,
          x % 2 === 0 ? wa : f,
          y % 2 === 0 ? vwa : vf,
        );
      });
    }
  }
}

const colorMap = {
  hall: "limegreen",
  outside: "navy",
  room: "orange",
  wall: "blue",
  door: "magenta",
};
