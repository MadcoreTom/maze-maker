import type { State } from "../state";
import type { Entity } from "./entity";

export class Entities {
    private entityMap: { [name: string]: Entity } = {};
    private entityList: Entity[] = [];

    public addEntity(entity: Entity, state: State) {
        const entityName = entity.name;
        if (entityName) {
            this.entityMap[entityName] = entity;
        }
        this.entityList.push(entity);
        const t = state.maze.get(entity.getTile()[0], entity.getTile()[1]);
        if (t) {
            if (t.entities) {
                t.entities.push(entity);
            } else {
                t.entities = [entity];
            }
        } else {
            console.warn("Entity added off the edge of the map", entity.getTile());
        }
    }

    public getEntityByName(name: string): Entity | undefined {
        return this.entityMap[name];
    }

    private removeEntity(entity: Entity, state: State): void {
        const l1 = this.entityList.length;
        this.entityList = this.entityList.filter(e => e !== entity);
        console.log("Removed from list", l1 != this.entityList.length);
        const k = Object.entries(this.entityMap)
            .map(([k, v]) => (v === entity ? k : null))
            .filter(n => !!n)[0];
        if (k) {
            this.entityMap[k] = undefined;
            console.log("Removed from map");
        }
        const t = entity.getTile();
        if (t) {
            state.maze.doIf(t[0], t[1], (x, y, t) => {
                if (t.entities) {
                    const idx = t.entities.indexOf(entity);
                    if (idx >= 0) {
                        t.entities.splice(idx, 1);
                        console.log("Removed from tile", true);
                    } else {
                        console.warn("Entity not found in tile entities:", entity.name);
                    }
                } else {
                    console.warn("Tile has no entities array:", entity.name);
                }
            });
        }
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
