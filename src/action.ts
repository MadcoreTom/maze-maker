import { type ActionAnimation, collectAnimation, walkAnimation } from "./animation";
import type { Entity } from "./entities/entity";
import type { Sprite, State } from "./state";
import { addXY, type XY } from "./util/xy";

export type ActionDirection = [-1, 0] | [1, 0] | [0, -1] | [0, 1];

export abstract class Action {
    public constructor(public readonly displayName: string, protected readonly direction: ActionDirection) {}
    public onClick(state: State): void {}
    public getAnimation(state: State): null | ActionAnimation {
        return null;
    }
}

export class WalkAction extends Action {
    public constructor( direction: ActionDirection) {
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
        super(displayName, direction);
    }

    public getAnimation(state: State): null | ActionAnimation {
        const entity = state.entities.getEntityByName("player");
        return entity ? walkAnimation(this.direction[0], this.direction[1], entity) : null;
    }
}

export class EndAction extends Action {
    constructor(direction: ActionDirection) {
        super("Next Level",direction);
    }
    public onClick(state: State): void {
        state.triggerNewLevel = true;
    }
}

export class CollectAction extends Action {
    public constructor(
        private readonly itemName: string,
        private readonly targetEntity: Entity,direction: ActionDirection
    ) {
        super(`Collect ${itemName}`, direction);
    }

    public onClick(state: State): void {
        console.log("Collect", this.itemName);
        state.inventory.push(this.itemName);
        console.log("Inventory", state.inventory);
    }

    public getAnimation(state: State): null | ActionAnimation {
        return collectAnimation(this.direction[0],this.direction[1],state.entities.getEntityByName("player"), this.targetEntity);
    }
}

export class OpenDoorAction extends Action {
    public constructor( direction: ActionDirection, displayName:string = "Open Door") {
        super(displayName, direction);
    }

    public onClick(state: State): void {
        const playerEntity = state.entities.getEntityByName("player");
        if (playerEntity) {
            const playerTile = playerEntity.getTile();
            const tile = state.maze.get(playerTile[0] + this.direction[0], playerTile[1] + this.direction[1]);
            
            if(tile && tile.entity && tile.items){
                tile.solid = false;
                tile.items.door = "open";
                console.log("open")
                tile.entity["mode"] = "open"; // TODO make it a public property or setter
            }
        }
    }
}

/**
 * Given the state, return the action for the given direction
 */
export function calculateAvailableAction(state: State, dx: number, dy: number): Action | null {
    const kernel: XY[] = [
        [dx, dy],
        [2 * dx, 2 * dy],
    ];
    const playerEntity = state.entities.getEntityByName("player");
    if (!playerEntity) return null;

    const coords = playerEntity.getTile() as XY;
    const result = state.maze.getKernel(coords, kernel);

    // check entities on the wall
    if (result[0]) {
        const targetPosition = addXY(coords, kernel[0]);
        const targetEntity = state.maze.get(targetPosition[0], targetPosition[1])?.entity;
        if (targetEntity) {
            const action = targetEntity.getAction(state, [dx,dy] as ActionDirection);
            if (action) {
                return action;
            }
        }
    }

    // if the wall isnt solid and has no entity, cehck the actual tile
    if (result[0] && !result[0].solid && result[1] ) {

        const targetPosition = addXY(coords, kernel[1]);
        const targetEntity = state.maze.get(targetPosition[0], targetPosition[1])?.entity;
        if (targetEntity) {
            const action = targetEntity.getAction(state, [dx,dy] as ActionDirection);
            if (action) {
                return action;
            }
        }
        if(!result[1].solid){
            return new WalkAction([dx, dy] as ActionDirection);
        }
    }
        
    return null;
}

export class NoopAction extends Action {
    public constructor( displayName: string, direction: ActionDirection) {
        super(displayName, direction);
    }
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
