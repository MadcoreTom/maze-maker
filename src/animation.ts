import type { Entity } from "./entities/entity";
import { State } from "./state";

export type ActionAnimation = (delta: number, state: State) => boolean;

export function createParallelAnimation(animations: ActionAnimation[]): ActionAnimation {
    let anim = [...animations]
    return (delta: number, state: State) => {
        // run each and remove what's empty
        anim = animations.filter(a => !a(delta, state));
        console.log("Animations pending", anim.length)
        return anim.length === 0;
    }
}


// TODO move to animation file or folder
export function walkAnimation(dx: number, dy: number, entity: Entity): ActionAnimation {
    let progress = 0;
    return (delta: number, state:State) => {
        progress += delta / 300;
        const sprite = entity.getSprite();
        if (!sprite) return false;

        // Calculate current world position based on tile and sprite offset
        // const currentTile = entity.getTile();
        // const currentWorldX = 2 + ((currentTile[0] - 1) * 18) / 2;
        // const currentWorldY = 6 + ((currentTile[1] - 1) * 18) / 2;

        // Update sprite offset during animation
        sprite.offset[0] = Math.floor(progress * 18) * dx; // TODO this magic number is W_LARGE + W_SMALL (or the H_ equivalent)
        sprite.offset[1] = Math.floor(progress * 18) * dy;

        if (progress >= 1) {
            // Update entity tile position
            const t = entity.getTile();
            entity.setTile([
                t[0] + dx * 2,
                t[1] + dy * 2
            ], state)
            // Reset sprite offset
            sprite.offset[0] = 0;
            sprite.offset[1] = 0;

            return true;
        }
        return false;
    };
}
