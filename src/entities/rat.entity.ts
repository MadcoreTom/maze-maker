import { type Action, type ActionDirection, WalkAction } from "../action";
import { type ActionAnimation, walkAnimation } from "../animation";
import type { State } from "../state";
import { cloneXY, type XY } from "../util/xy";
import { Entity } from "./entity";

const SPEED_MS = 150;

export class RatEntity extends Entity {
    constructor(tile: XY, name?: string) {
        super(tile, name);
        this.sprite = {
            offset: [0, 0],
            sprite: "rat",
        };
    }

    public getAction(state: State, direction: ActionDirection): Action | undefined {
        // TODO reutrn a fight action
        return undefined;
    }

    public onTurn(state: State): ActionAnimation | undefined {
        // Don't move if unseen
        const [x, y] = this.getTile();
        const t = state.maze.get(x, y);
        if (!t || !t.discovered) {
            return undefined;
        }

        const left = this.canMove(state, x, y, -1, 0);
        const right = this.canMove(state, x, y, 1, 0);

        if (left.okay) {
            if (right.okay) {
                return walkAnimation(Math.random() >= 0.5 ? -1 : 1, 0, this, SPEED_MS);
            } else {
                return walkAnimation(-1, 0, this, SPEED_MS);
            }
        } else {
            if (right.okay) {
                return walkAnimation(1, 0, this, SPEED_MS);
            } else {
                return undefined;
            }
        }
    }
}
