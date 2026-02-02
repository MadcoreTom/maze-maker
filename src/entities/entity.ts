import { Action, CollectAction } from "../action";
import { Sprite, State } from "../state";
import { cloneXY, equalsXY, Rect, XY, XYReadOnly } from "../util/xy";

export abstract class Entity {
    private tile: XY;
    protected sprite?: Sprite;
    private dead: boolean = false;

    public constructor(tile: XY, state: State) {
        this.tile = cloneXY(tile);
    }

    public getTile(): XYReadOnly {
        return this.tile;
    }

    public setTile(newPos: XYReadOnly, state: State) {
        if (!equalsXY(newPos, this.tile)) {
            // Get the old and new tiles
            const oldTile = state.maze.get(this.tile[0], this.tile[1]);
            const newTile = state.maze.get(newPos[0], newPos[1]);

            // Check if there's already an entity at the new position
            if (newTile?.entity && newTile.entity !== this) {
                console.warn(`Entity moving to tile [${newPos[0]}, ${newPos[1]}] but there's already an entity there`);
            }

            // Deregister this entity from the old tile
            if (oldTile?.entity === this) {
                oldTile.entity = undefined;
            }

            // Register this entity to the new tile
            if (newTile) {
                newTile.entity = this;
            }

            // Update the entity's internal tile position
            this.tile = cloneXY(newPos as XY);
        }
    }

    public getSprite(): Sprite | undefined {
        return this.sprite;
    }

    public getAction(state: State): Action | undefined {
        return undefined;
    }

    public onFrame(state: State) {}

    public isDead(): boolean {
        return this.dead;
    }

    public die() {
        this.dead = true;
    }
}

// Test the idea of implementation

export class KeyEntity extends Entity {
    constructor(tile: XY, state: State) {
        super(tile, state);
        this.sprite = {
            offset: [0, 0],
            sprite: "key",
        };
    }

    public getAction(state: State): Action | undefined {
        return new CollectAction("key", this);
    }
}

export class PlayerEntity extends Entity {
    constructor(tile: XY, state: State) {
        super(tile, state);
        this.sprite = {
            offset: [0, 0],
            sprite: { left: 0, top: 0, width: 16, height: 12 },
        };
    }
}

export class StaticEntity extends Entity {
    constructor(tile: XY, state: State, sprite: string | Rect) {
        super(tile, state);
        this.sprite = {
            offset: [0, 0],
            sprite: sprite,
        };
    }
}
