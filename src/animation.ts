import { State } from "./state";

export type ActionAnimation = (delta: number, state: State) => boolean;

export function createParallelAnimation(animations: ActionAnimation[]): ActionAnimation {
    let anim = [...animations]
    return (delta: number, state: State) => {
        // run each and remove what's empty
        anim = animations.filter(a => a(delta, state));
        return anim.length == 0;
    }
}
