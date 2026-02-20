import type { Entity } from "./entities/entity";
import type { State } from "./state";

export type ActionAnimation = (delta: number, state: State) => boolean;

export function createParallelAnimation(animations: ActionAnimation[]): ActionAnimation {
    let anim = [...animations];
    return (delta: number, state: State) => {
        // run each and remove what's empty
        anim = anim.filter(a => !a(delta, state));
        return anim.length === 0;
    };
}

// TODO move to animation file or folder
export function walkAnimation(dx: number, dy: number, entity: Entity, timeMs:number = 300): ActionAnimation {
    let progress = 0;
    return (delta: number, state: State) => {
        progress += delta / timeMs;
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
            entity.setTile([t[0] + dx * 2, t[1] + dy * 2], state);
            // Reset sprite offset
            sprite.offset[0] = 0;
            sprite.offset[1] = 0;

            return true;
        }
        return false;
    };
}

export function collectAnimation(dx: number, dy: number, player: Entity, item: Entity): ActionAnimation {
    let progress = 0;
    return (delta: number, state: State) => {
        progress += delta / 300;
        const p = progress >= 0.5 ? 1 - progress : progress;

        const sprite = player.getSprite();
        if (sprite) {
            // Update sprite offset during animation
            sprite.offset[0] = Math.floor(p * 18) * dx; // TODO this magic number is W_LARGE + W_SMALL (or the H_ equivalent)
            sprite.offset[1] = Math.floor(p * 18) * dy;
        }

        const sprite2 = item.getSprite();
        if (sprite2) {
            // Update sprite offset during animation
            sprite2.offset[0] = Math.floor(p * 18) * -dx; // TODO this magic number is W_LARGE + W_SMALL (or the H_ equivalent)
            sprite2.offset[1] = Math.floor(p * 18) * -dy;
        }

        if(progress >= 0.5){
            item.die();
        }

        if (progress >= 1) {
            sprite && (sprite.offset = [0,0]);
            sprite2 && (sprite2.offset = [0,0]);
            return true;
        }
        return false;
    };
}

// fight
// fighter moves towards
// hud shows
// animate random selection
// 
export function createFightAnimation():ActionAnimation{
    // return createSequentialAnimation(
        // go together
    // )
    const point1 = [1,2,3];
    const point2 = [0,3,4]
    let progress = 0;
    let randomizeCounter = 100;
    return (delta: number, state: State) => {
        progress += delta / 300;
        randomizeCounter += delta;

        if(randomizeCounter >= 100){
            randomizeCounter -= 100;

            const p1 = Math.floor(Math.random() * 3);
            const p2 = Math.floor(Math.random() * 3);
    
            state.hudText = point1.map((p,i)=>i==p1 ? `[${p}]` : ` ${p} `).join("");
            state.hudText += " vs ";
            state.hudText += point2.map((p,i)=>i==p2 ? `[${p}]` : ` ${p} `).join("")
    
        }

        if (progress > 10){
            const p1 = Math.floor(Math.random() * 3);
            const p2 = Math.floor(Math.random() * 3);

            const v1 = point1[p1];
            const v2 = point2[p2];
            const ch = (v1 > v2 ? " > " : (v1 < v2 ? " < " : " x "))
    
            state.hudText = point1.map((p,i)=>i==p1 ? `[${p}]` : ` ${p} `).join("");
            state.hudText += ch;
            state.hudText += point2.map((p,i)=>i==p2 ? `[${p}]` : ` ${p} `).join("")
            return true;
        }
        return false;
    }
}