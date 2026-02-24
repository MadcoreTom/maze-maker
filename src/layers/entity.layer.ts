import { placeEntities } from "../entity-placer";
import { EntityRenderer } from "../render/render-progress";
import { ReturnsGenerator } from "../types";
import { LayerLogic } from "./layer";

export class EntityLayer extends LayerLogic {
    public constructor() {
        super("Entities", [], new EntityRenderer())
    }
    apply(): ReturnsGenerator {
        const state = this.state!;
        return function* () {
            placeEntities(state);
            yield;
        }
    }
}