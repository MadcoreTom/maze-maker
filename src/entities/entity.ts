import { Action, CollectAction } from "../action";
import { Sprite, State } from "../state";
import { cloneXY, XY, XYReadOnly } from "../util/xy";



export abstract class Entity {
    protected tile: XY;
    protected sprite?: Sprite;
    private dead: boolean = false;

    public constructor(tile: XY, state: State) {
        this.tile = cloneXY(tile);
    }

    public getTile(): XYReadOnly {
        return this.tile;
    }

    public getSprite(): Sprite | undefined {
        return this.sprite;
    }

    public getAction(state: State): Action | undefined {
        return undefined;
    }

    public onFrame(state: State) {

    }

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
            sprite: "key"
        }
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
        }
    } 
}