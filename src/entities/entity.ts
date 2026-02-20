import { type Action, ActionDirection, CollectAction, EndAction, FightAction, NoopAction, OpenDoorAction } from "../action";
import { type ActionAnimation, walkAnimation } from "../animation";
import type { Sprite, State, Tile } from "../state";
import { KERNEL_UDLR } from "../util/distance";
import { addXY, cloneXY, equalsXY, type Rect, type XY, type XYReadOnly } from "../util/xy";

export abstract class Entity {
    private tile: XY;
    protected sprite?: Sprite;
    private dead: boolean = false;

    public constructor(tile: XY) {
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
            if (newTile?.entities && newTile.entities.indexOf(this) >= 0) {
                console.warn(`Entity moving to tile [${newPos[0]}, ${newPos[1]}] but there's already an entity there`);
            }

            // Deregister this entity from the old tile
            if (oldTile?.entities && oldTile.entities.indexOf(this) >= 0) {
                oldTile.entities = oldTile.entities.filter(e=>e!=this);
            }

            // Register this entity to the new tile
            if (newTile) {
                if(newTile.entities && newTile.entities.indexOf(this) <0){
                    newTile.entities.push(this);
                } else {
                    newTile.entities = [this];
                }
            }

            // Update the entity's internal tile position
            this.tile = cloneXY(newPos as XY);
        }
    }

    public getSprite(): Sprite | undefined {
        return this.sprite;
    }

    public getAction(state: State, direction: ActionDirection): Action | undefined {
        return undefined;
    }

    public onTurn(state: State): ActionAnimation | undefined {
        return undefined;
    }

    public isDead(): boolean {
        return this.dead;
    }

    public die() {
        this.dead = true;
    }

    protected canMove(state: State, x: number, y: number, dx: number, dy: number): { wall?: Tile, tile?: Tile, okay: boolean } {
        const [tile, wall] = state.maze.getKernel([x, y], [[dx * 2, dy * 2], [dx, dy]]);
        return {
            wall,
            tile,
            okay: !!(wall && !wall.solid && tile && !tile.solid)
        }
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

    public getAction(state: State, direction: ActionDirection): Action | undefined {
        return new CollectAction("key", this, direction);
    }
}

export class PlayerEntity extends Entity {
    constructor(tile: XY, state: State) {
        super(tile);
        this.sprite = {
            offset: [0, 0],
            sprite: { left: 0, top: 0, width: 16, height: 12 },
        };
    }
}

export class StaticEntity extends Entity {
    constructor(tile: XY, state: State, sprite: string | Rect) {
        super(tile);
        this.sprite = {
            offset: [0, 0],
            sprite: sprite,
        };
    }
}

export class EndEntity extends Entity {
    constructor(tile: XY, state: State) {
        super(tile);
        this.sprite = {
            offset: [0, 0],
            sprite: "end",
        };
    }
    public getAction(state: State, direction: ActionDirection): Action | undefined {
        return new EndAction(direction);
    }
}

const KERNEL_UDLR2: XY[] = [
    [0, -1],
    [0, -2],
    [0, 1],
    [0, 2],
    [-1, 0],
    [-2, 0],
    [1, 0],
    [2, 0],
];

export class FollowerEntity extends Entity {
    constructor(tile: XY, state: State) {
        super(tile);
        this.sprite = {
            offset: [0, 0],
            sprite: "imp",
        };
    }

    private allClear(tiles: [Tile?, Tile?]): number | null {
        return tiles[0] && !tiles[0].solid && tiles[1] && !tiles[1].solid && tiles[1].entity == undefined
            ? tiles[1].visDistance
            : null;
    }

    public getAction(state: State, direction: ActionDirection): Action | undefined {
        return new FightAction(state.entities.getEntityByName("player") as Entity, this, direction);
    }

    public onTurn(state: State): ActionAnimation | undefined {
        const t = this.getTile();
        const results = state.maze.getKernel(t, KERNEL_UDLR2);

        const up = this.allClear([results[0], results[1]]); //(results[0] && results[1] && !results[0].solid && !results[1].solid) ? results[1].visDistance : null;
        const dn = this.allClear([results[2], results[3]]);
        const lf = this.allClear([results[4], results[5]]);
        const rt = this.allClear([results[6], results[7]]);

        const option = [
            { dist: up, dir: KERNEL_UDLR2[1] },
            { dist: dn, dir: KERNEL_UDLR2[3] },
            { dist: lf, dir: KERNEL_UDLR2[5] },
            { dist: rt, dir: KERNEL_UDLR2[7] },
        ]
            .filter(x => x.dist != null)
            .sort((a, b) => a.dist! - b.dist!)[0]; // TODO not sure if this is sorting in the right direction

        if (option) {
            if (option.dir[0] < 0) {
                return walkAnimation(-1, 0, this);
            }
            if (option.dir[0] > 0) {
                return walkAnimation(1, 0, this);
            }
            if (option.dir[1] < 0) {
                return walkAnimation(0, -1, this);
            }
            if (option.dir[1] > 0) {
                return walkAnimation(0, 1, this);
            }
        }

        return undefined;
    }
}

export class DoorEntity extends Entity {
    public constructor(tile: XY, public mode: "open" | "locked" | "closed") {
        super(tile);
    }

    public getAction(state: State, direction: ActionDirection): Action | undefined {
        if (this.mode == "open") {
            return undefined;
        } else if (this.mode == "closed") {
            return new OpenDoorAction(direction, undefined, this);
        } else {
            if (state.inventory.indexOf("key") >= 0) {
                return new OpenDoorAction(direction, "Unlock", this);
            }
            return new NoopAction("REQUIRES KEY", direction);
        }
    }
}