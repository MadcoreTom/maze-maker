import type { Sprite, State } from "./state";

export type ActionAnimation = ((delta: number) => boolean);

export type ActionDirection = [-1, 0] | [1, 0] | [0, -1] | [0, 1];

export abstract class Action {
    public constructor(public readonly displayName: string) { }
    public onClick(state: State): void { }
    public getAnimation(state: State): null | ActionAnimation {
        return null;
    };
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
