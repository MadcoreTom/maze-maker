import { Array2 } from "./util/array2";
import { cloneXY, type XY } from "./util/xy";

export type Tile = {
    solid: boolean;
    roomId: number;
    type: "wall" | "outside" | "hall" | "room" | "door";
    distance?: number;
    distanceFromPath?: number;
    mainPath?: true;
    mainPathBeforeDoor?: true;
    items?: Items;
};

export type State = {
    maze: Array2<Tile>;
    start?: XY;
    end?: XY;
    farthestFromPath?: XY;
    pos: XY
};

// Note: this is a funny style, but avoids scanning arrays
export type Items = {
    key?: true;
    door?: "locked" | "open" | "closed";
};

export function createInitialState(): State {
    return {
        maze: new Array2<Tile>(1, 1, () => ({ roomId: 0, solid: true, type: "outside" })),
        pos: [0,0]
    };
}

function cloneTile(t: Tile): Tile {
    return {
        ...t,
        items: { ...t.items },
    };
}

export function cloneState(s: State): State {
    return {
        ...s,
        maze: s.maze.clone((x, y, t) => cloneTile(t)),
        pos: cloneXY(s.pos)
    };
}
