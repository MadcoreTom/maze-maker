import type { Sprite, State } from "./state";

export type ActionAnimation = (delta: number) => boolean;

export abstract class Action {
    public constructor(public readonly displayName: string) {}
    public onClick(state: State): void {}
    public abstract getAnimation(state: State): null | ActionAnimation;
}

export class WalkLeftAction extends Action {
    public constructor() {
        super("Left");
    }

    public getAnimation(state: State): null | ActionAnimation {
        const sprite = state.sprites.getSpriteByName("player");
        return sprite ? walkAnimation(-1, 0, sprite) : null;
    }
}
export class WalkRightAction extends Action {
    public constructor() {
        super("Right");
    }

    public getAnimation(state: State): null | ActionAnimation {
        const sprite = state.sprites.getSpriteByName("player");
        return sprite ? walkAnimation(1, 0, sprite) : null;
    }
}
export class WalkUpAction extends Action {
    public constructor() {
        super("Up");
    }

    public getAnimation(state: State): null | ActionAnimation {
        const sprite = state.sprites.getSpriteByName("player");
        return sprite ? walkAnimation(0, -1, sprite) : null;
    }
}
export class WalkDownAction extends Action {
    public constructor() {
        super("Down");
    }

    public getAnimation(state: State): null | ActionAnimation {
        const sprite = state.sprites.getSpriteByName("player");
        return sprite ? walkAnimation(0, 1, sprite) : null;
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

// class ActionMap {
//     readonly walkLeft: Action = {
//     }}

// export type ActionName = keyof ActionMap;

// const ACTION_MAP = new ActionMap;

// export function getAction(name: ActionName): Action {
//     return ACTION_MAP[name];
// }
