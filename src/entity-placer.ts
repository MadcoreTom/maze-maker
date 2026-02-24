import { DoorEntity, EndEntity, FollowerEntity, KeyEntity, PlayerEntity, StaticEntity } from "./entities/entity";
import { RatEntity } from "./entities/rat.entity";
import type { State } from "./state";
import { shuffle } from "./util/random";
import type { XY } from "./util/xy";

export function placeEntities(state: State): void {
    const pos: XY = state.start || [1, 1];

    state.entities.addEntity(new PlayerEntity(pos, state, "player"), state);
    state.start && state.entities.addEntity(new StaticEntity(state.start, state, "start", "start"), state);
    state.end && state.entities.addEntity(new EndEntity(state.end, state, "end"), state);

    state.maze.forEach((x, y, t) => {
        // if (x % 2 == 1 && y % 2 == 1 && !t.solid && (!t.entities || t.entities.length == 0)) {
        //     if (Math.random() > 0.92) {
        //         // state.entities.addEntity(new FollowerEntity([x, y], state), state);
        //     } else if (Math.random() > 0.9) {
        //         state.entities.addEntity(new RatEntity([x, y]), state);
        //     }
        // }

        if (t.type == "door") {
            // TODO introduce some sort of unnamed entity
            if (t.items && t.items.door && t.items.door !== "open") {
                state.entities.addEntity(
                    new DoorEntity([x, y], t.items && t.items.door && t.items.door == "closed" ? "closed" : "locked"),
                    state,
                );
            }
        }
    });

    // const hallwayTiles: XY[] = [];
    // state.maze.forEach((x, y, t) => {
    //     if (x % 2 == 1 && y % 2 == 1 && t.type === "hall") {
    //         hallwayTiles.push([x, y]);
    //     }
    // });

    // hallwayTiles.sort((b,a) => {
    //     const tileA = state.maze.get(a[0], a[1]);
    //     const tileB = state.maze.get(b[0], b[1]);
    //     return (tileB?.distanceFromPath ?? 0) - (tileA?.distanceFromPath ?? 0);
    // });

    // const farthestThird = hallwayTiles.slice(Math.floor((hallwayTiles.length * 2) / 3));
    // shuffle(farthestThird);

    // for (let i = 0; i < 5 && i < farthestThird.length; i++) {
    //     state.entities.addEntity(new FollowerEntity(farthestThird[i], state), state);
    // }

    // Find the tile with the "key" item and add an entity
    state.maze.forEach((x, y, t) => {
        if (t.items && t.items.key) {
            const e = new KeyEntity([x, y], state, "key");
            state.entities.addEntity(e, state);

            if (!t.entities) {
                t.entities = [];
            }
            t.entities.push(e);
        }
    });
}
