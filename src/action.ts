import { type ActionAnimation, collectAnimation, createFightAnimation, walkAnimation } from "./animation";
import type { DoorEntity, Entity } from "./entities/entity";
import type { Sprite, State } from "./state";
import { addXY, type XY } from "./util/xy";

export type ActionDirection = [-1, 0] | [1, 0] | [0, -1] | [0, 1];

export abstract class Action {
    public constructor(
        public readonly displayName: string,
        protected readonly direction: ActionDirection,
    ) {}
    public onClick(state: State): void {}
    public getAnimation(state: State): null | ActionAnimation {
        return null;
    }
}

export class WalkAction extends Action {
    public constructor(direction: ActionDirection) {
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
        super("Next Level", direction);
    }
    public onClick(state: State): void {
        state.triggerNewLevel = true;
    }
}

export class CollectAction extends Action {
    public constructor(
        private readonly itemName: string,
        private readonly targetEntity: Entity,
        direction: ActionDirection,
    ) {
        super(`Collect ${itemName}`, direction);
    }

    public onClick(state: State): void {
        console.log("Collect", this.itemName);
        state.inventory.push(this.itemName);
        console.log("Inventory", state.inventory);
    }

    public getAnimation(state: State): null | ActionAnimation {
        return collectAnimation(
            this.direction[0],
            this.direction[1],
            state.entities.getEntityByName("player") as Entity,
            this.targetEntity,
        );
    }
}

export class FightAction extends Action {
    public constructor(
        private readonly e1: Entity,
        private readonly e2: Entity,
        direction: ActionDirection,
    ) {
        super("Fight", direction);
    }

    public onClick(state: State): void {}

    public getAnimation(state: State): null | ActionAnimation {
        return createFightAnimation(this.e1, this.e2);
        // return collectAnimation(this.direction[0],this.direction[1],state.entities.getEntityByName("player"), this.targetEntity);
    }
}

export class OpenDoorAction extends Action {
    public constructor(
        direction: ActionDirection,
        displayName: string = "Open Door",
        private readonly entity: DoorEntity,
    ) {
        super(displayName, direction);
    }

    public onClick(state: State): void {
        const playerEntity = state.entities.getEntityByName("player");
        if (playerEntity) {
            const playerTile = playerEntity.getTile();
            const tile = state.maze.get(playerTile[0] + this.direction[0], playerTile[1] + this.direction[1]);

            if (tile && tile.items) {
                tile.solid = false;
                tile.items.door = "open";
                console.log("open");
            }
            this.entity.mode = "open";
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
        const targetEntities= state.maze.get(targetPosition[0], targetPosition[1])?.entities;
        if (targetEntities) {
            const action = targetEntities.map(e=>e.getAction(state, [dx,dy] as ActionDirection)).filter(a=>!!a)[0];
            if (action) {
                return action;
            }
        }
    }

    // if the wall isnt solid and has no entity, cehck the actual tile
    if (result[0] && !result[0].solid && result[1] ) {

        const targetPosition = addXY(coords, kernel[1]);
        const targetEntities= state.maze.get(targetPosition[0], targetPosition[1])?.entities;
        if (targetEntities) {
            const action = targetEntities.map(e=>e.getAction(state, [dx,dy] as ActionDirection)).filter(a=>!!a)[0];
            if (action) {
                console.log("ENT", targetEntities, targetEntities.map(e=>state.entities["entityList"].indexOf(e)))
                return action;
            }
        }
    }

    // if the wall isnt solid and has no entity, cehck the actual tile
    if (result[0] && !result[0].solid && result[1]) {
        const targetPosition = addXY(coords, kernel[1]);
        const targetEntities = state.maze.get(targetPosition[0], targetPosition[1])?.entities;
        if (targetEntities) {
            const aliveTargetEntities = targetEntities.filter(e => !e.isDead());
            const action = aliveTargetEntities
                .map(e => e.getAction(state, [dx, dy] as ActionDirection))
                .filter(a => !!a)[0];
            if (action) {
                return action;
            }
        }
        if (!result[1].solid) {
            return new WalkAction([dx, dy] as ActionDirection);
        }
    }

    return null;
}

export class NoopAction extends Action {
    public constructor(displayName: string, direction: ActionDirection) {
        super(displayName, direction);
    }
}

export function calculateAllActions(state: State): {
    left: Action | null;
    right: Action | null;
    up: Action | null;
    down: Action | null;
} {
    state.entities.removeDeadEntities(state);
    return {
        left: calculateAvailableAction(state, -1, 0),
        right: calculateAvailableAction(state, 1, 0),
        up: calculateAvailableAction(state, 0, -1),
        down: calculateAvailableAction(state, 0, 1),
    };
}
