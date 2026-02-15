import { ActionDirection, Action, WalkAction } from "../action";
import { ActionAnimation, walkAnimation } from "../animation";
import { State } from "../state";
import { XY } from "../util/xy";
import { Entity } from "./entity";

const SPEED_MS = 150;

export class RatEntity extends Entity {
    constructor(tile: XY) {
        super(tile);
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
        const [left, leftWall, rightWall, right] = state.maze.getKernel([x, y], [[-2, 0], [ - 1, 0], [ 1, 0], [ 2, 0]]);
        const canGoLeft = leftWall && !leftWall.solid && left && !left.solid;
        const canGoRight = rightWall && !rightWall.solid && right && !right.solid;

        if (canGoLeft) {
            if (canGoRight) {
                return walkAnimation(Math.random() >= 0.5 ? -1 : 1, 0, this, SPEED_MS);
            } else {
                return walkAnimation(-1, 0, this, SPEED_MS);
            }
        } else {
            if (canGoRight) {
                return walkAnimation(1, 0, this, SPEED_MS);
            } else {
                return undefined;
            }
        }
    }
}