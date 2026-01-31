import type { Sprite, State } from "./state";
import { addXY, type XY } from "./util/xy";

export type ActionAnimation = (delta: number) => boolean;

export type ActionDirection = [-1, 0] | [1, 0] | [0, -1] | [0, 1];

export abstract class Action {
    public constructor(public readonly displayName: string) {}
    public onClick(state: State): void {}
    public getAnimation(state: State): null | ActionAnimation {
        return null;
    }
}

export class WalkAction extends Action {
    public constructor(private readonly direction: ActionDirection) {
        let displayName = "";
        if (direction[0] < 0) {
            displayName = "< WALK";
        } else if (direction[0] > 0) {
            displayName = "WALK >";
        } else if (direction[1] < 0) {
            displayName = "^ WALK ^";
        } else {
            displayName = "v WALK v";
        }
        super(displayName);
    }

    public getAnimation(state: State): null | ActionAnimation {
        const sprite = state.sprites.getSpriteByName("player");
        return sprite ? walkAnimation(this.direction[0], this.direction[1], sprite) : null;
    }
}

class EndAction extends Action {
    constructor(){
        super("Next Level");
    }
    public onClick(state: State): void {
        state.triggerNewLevel = true;
    }
}

export class OpenDoorAction extends Action {
    public constructor(private readonly direction: ActionDirection) {
        super("Open Door");
    }

    public onClick(state: State): void {
        const sprite = state.sprites.getSpriteByName("player");
        if (sprite) {
            const tile = state.maze.get(sprite.tile[0] + this.direction[0], sprite.tile[1] + this.direction[1]);
            if (tile && tile.items && /*"closed" ==*/ tile.items.door) {
                // TODO handle locked doors
                tile.solid = false;
                tile.items.door = "open";
            }
        }
    }
}

function walkAnimation(dx: number, dy: number, sprite: Sprite): ActionAnimation {
    let progress = 0;
    return (delta: number) => {
        progress += delta / 300;
        sprite.position[0] = 2 + ((sprite.tile[0] - 1) * 18) / 2 + Math.floor(progress * 18) * dx;
        sprite.position[1] = 6 + ((sprite.tile[1] - 1) * 18) / 2 + Math.floor(progress * 18) * dy;
        if (progress >= 1) {
            sprite.tile[0] += dx * 2;
            sprite.tile[1] += dy * 2;
            sprite.position[0] = 2 + ((sprite.tile[0] - 1) * 18) / 2;
            sprite.position[1] = 6 + ((sprite.tile[1] - 1) * 18) / 2;
            return true;
        }
        return false;
    };
}

/**
 * Given the state, return the action for the given direction
 */
export function calculateAvailableAction(state: State, dx: number, dy: number): Action | null {
    const kernel: XY[] = [
        [dx, dy],
        [2 * dx, 2 * dy],
    ];
    const coords = state.sprites.getSpriteByName("player")!.tile;
    const result = state.maze.getKernel(coords, kernel);

    // check sprites
    if(result[0] && !result[0].solid){
        const s = state.sprites.getSpritesByXY(addXY(coords, kernel[1]));
        if(s.length > 0){
            const end = s.filter(a=>a.type === "end");
            if(end){
                return new EndAction(); 
            }
        }
    }

    if (result[0] && !result[0].solid && result[1] && !result[1].solid) {
        return new WalkAction([dx, dy] as ActionDirection);
    } else if (
        result[0] &&
        result[0].items &&
        result[1] &&
        !result[1].solid
    ) {
        if ("closed" == result[0].items.door) {
            return new OpenDoorAction([dx, dy] as ActionDirection);
        } else if ("locked" == result[0].items.door) {
            // TODO requires key
            return new OpenDoorAction([dx, dy] as ActionDirection);
        }
    } 
    return null;
}

export function calculateAllActions(state: State): {
    left: Action | null;
    right: Action | null;
    up: Action | null;
    down: Action | null;
} {
    return {
        left: calculateAvailableAction(state, -1, 0),
        right: calculateAvailableAction(state, 1, 0),
        up: calculateAvailableAction(state, 0, -1),
        down: calculateAvailableAction(state, 0, 1),
    };
}
