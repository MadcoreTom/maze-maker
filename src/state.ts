import { type Action, type ActionAnimation, WalkLeftAction, WalkRightAction } from "./action";
import { Array2 } from "./util/array2";
import { cloneXY, type Rect, type XY } from "./util/xy";

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
    sprites: Sprites;
    animation: ActionAnimation | null;
    viewportSize?: XY;
    actions: {
        left: null | Action;
        right: null | Action;
        up: null | Action;
        down: null | Action;
    };
};

// Note: this is a funny style, but avoids scanning arrays
export type Items = {
    key?: true;
    door?: "locked" | "open" | "closed";
};

export class Sprites {
    private spriteMap: { [name: string]: Sprite } = {};
    private spriteList: Sprite[] = [];
    public addSprite(name: string, sprite: Sprite) {
        this.spriteMap[name] = sprite;
        // TODO check for name collisions
        this.spriteList.push(sprite);
    }
    public getSpriteByName(name: string): Sprite | undefined {
        return this.spriteMap[name];
    }
    // TODO implement removeSpriteByName
    public forEachSprite(callback: (sprite: Sprite) => unknown): void {
        this.spriteList.forEach(callback);
    }
}

export type Sprite = {
    position: XY;
    tile: XY;
    sprite: Rect;
};

export type Animation = {
    starttime: number;
    duration: number;
    type: "LEFT" | "RIGHT" | "UP" | "DOWN";
    spriteName: string;
};

export function createInitialState(): State {
    return {
        maze: new Array2<Tile>(1, 1, () => ({ roomId: 0, solid: true, type: "outside" })),
        sprites: new Sprites(),
        animation: null,
        actions: {
            left: new WalkLeftAction(),
            right: new WalkRightAction(),
            up: null,
            down: null,
        },
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
    };
}
