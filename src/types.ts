import { Array2 } from "./util/array2";
import type { XY } from "./util/xy";

export type MyGenerator = Generator<undefined, void, unknown>;

export type ReturnsGenerator = () => MyGenerator;

export type Tile = {
  solid: boolean;
  roomId: number;
  type: "wall" | "outside" | "hall" | "room" | "door";
  distance?: number;
  mainPath?: true;
};
export type State = {
  maze: Array2<Tile>;
  // generatorStack: MyGenerator[],
  queue?: [number, number][];
  start?: XY;
  end?: XY;
  farthestFromPath?: XY;
};

export function createInitialState(): State {
  return {
    maze: new Array2<Tile>(1, 1, () => ({ roomId: 0, solid: true, type: "outside" })),
    // generatorStack: []
  };
}
