import type { State } from "../state";
import { cloneXY, equalsXY, type XY } from "../util/xy";
import type { Entity } from "./entity";

export class Entities {
    private entityMap: { [name: string]: Entity } = {};
    private entityList: Entity[] = [];

    public addEntity(name: string, entity: Entity, state: State) {
        this.entityMap[name] = entity;
        // TODO check for name collisions
        this.entityList.push(entity);
        const t = state.maze.get(entity.getTile()[0], entity.getTile()[1]);
        if (t) {
            t.entity = entity;
        } else {
            console.warn("Entity added off the edge of the map", entity.getTile());
        }
    }

    public getEntityByName(name: string): Entity | undefined {
        return this.entityMap[name];
    }

    public removeEntityByName(name: string, state: State): boolean {
        const entity = this.entityMap[name];
        if (entity) {
            // Remove from tile
            const tile = entity.getTile();
            const t = state.maze.get(tile[0], tile[1]);
            if (t && t.entity === entity) {
                console.log("Removed entity of type ", typeof entity, "from", tile, t);
                t.entity = undefined;
            }

            delete this.entityMap[name];
            const index = this.entityList.indexOf(entity);
            if (index > -1) {
                this.entityList.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    public removeEntity(entity: Entity, state: State): boolean {
        // Find the name for this entity in the map
        for (const [name, e] of Object.entries(this.entityMap)) {
            if (e === entity) {
                return this.removeEntityByName(name, state);
            }
        }
        return false;
    }

    public forEachEntity(callback: (entity: Entity) => unknown): void {
        this.entityList.forEach(callback);
    }

    public removeDeadEntities(state: State): void {
        const deadEntities = this.entityList.filter(e => e.isDead());
        deadEntities.forEach(entity => {
            this.removeEntity(entity, state);
        });
    }
}
