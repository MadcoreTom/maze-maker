import { type Action, type ActionAnimation, WalkAction } from "./action";
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
};

// Note: this is a funny style, but avoids scanning arrays
export type Items = {
    key?: true;
    door?: "locked" | "open" | "closed";
};
/*
export class Entities {
    private entityMap: { [name: string]: Entity } = {};
    private entityList: Entity[] = [];
    public addEntity(name: string, entity: Entity, state: State) {
        this.entityMap[name] = entity;
        // TODO check for name collisions
        // TODO kill entities already in this position
        this.entityList.push(entity);
        const t = state.maze.get(entity.getTile()[0], entity.getTile()[1]);
        if (t) {
            t.entity = entity;
        } else {
            console.warn("Entity added off the edge of the map", entity.getTile());
        }
    }
    public getEntityByName(name: string): Entity | undefined {
        return this.entityMap[name];
    }
    public getEntityByXY(xy: XY): Entity[] {
        // TODO redundant as you can get it from the maze
        return this.entityList.filter(e => equalsXY(xy, e.getTile()));
    }

    public removeSpriteByName(name: string): boolean {
        const sprite = this.entityMap[name];
        if (sprite) {
            delete this.entityMap[name];
            const index = this.entityList.indexOf(sprite);
            if (index > -1) {
                this.entityList.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    public removeEntity(entity: Entity): boolean {
        // Find the name for this sprite in the map
        for (const [name, e] of Object.entries(this.entityMap)) {
            if (e === entity) {
                return this.removeSpriteByName(name);
            }
        }
        return false;
    }

    public forEachSprite(callback: (entity: Entity) => unknown): void {
        this.entityList.forEach(callback);
    }

    // TODO check for dead
}
*/
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
