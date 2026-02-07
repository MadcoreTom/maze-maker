import { type Action } from "./action";
import { ActionAnimation } from "./animation";
import { Entities } from "./entities/entities";
import type { Entity } from "./entities/entity";
import { Array2 } from "./util/array2";
import { cloneXY, equalsXY, type Rect, type XY } from "./util/xy";

export type Tile = {
    solid: boolean;
    roomId: number;
    type: "wall" | "outside" | "hall" | "room" | "door";
    distance?: number;
    distanceFromPath?: number;
    mainPath?: true;
    mainPathBeforeDoor?: true;
    items?: Items;
    visTimestamp: number;
    visDistance: number;
    discovered?: boolean;
    discoveredBottom?: boolean;
    entity?: Entity;
};

export type State = {
    maze: Array2<Tile>;
    start?: XY;
    end?: XY;
    farthestFromPath?: XY;
    entities: Entities;
    animation: ActionAnimation | null;
    viewportSize?: XY;
    actions: {
        left: null | Action;
        right: null | Action;
        up: null | Action;
        down: null | Action;
    };
    visTimestamp: number; // The timestamp of the latest pass of visibility calculations
    triggerNewLevel?: boolean;
    inventory: string[];
    phase: "READY" | "PLAYER_ANIM" | "WORLD_ANIM" // TODO use enum
};

// Note: this is a funny style, but avoids scanning arrays
export type Items = {
    key?: true;
    door?: "locked" | "open" | "closed";
};

export type Sprite = {
    offset: XY;
    sprite: Rect | string;
};

export type Animation = {
    starttime: number;
    duration: number;
    type: "LEFT" | "RIGHT" | "UP" | "DOWN";
    spriteName: string;
};

export function createInitialState(): State {
    return {
        maze: new Array2<Tile>(1, 1, () => ({
            roomId: 0,
            solid: true,
            type: "outside",
            visTimestamp: -1,
            visDistance: 99999,
        })),
        entities: new Entities(),
        animation: null,
        actions: {
            left: null,
            right: null,
            up: null,
            down: null,
        },
        visTimestamp: 0,
        inventory: [],
        phase: "READY"
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
        viewportSize: cloneXY(s.viewportSize),
        inventory: [...s.inventory],
    };
}
