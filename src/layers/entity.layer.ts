import { FollowerEntity } from "../entities/entity";
import { RatEntity } from "../entities/rat.entity";
import { placeEntities } from "../entity-placer";
import { EntityRenderer } from "../render/render-progress";
import { ReturnsGenerator } from "../types";
import { XY } from "../util/xy";
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
            let scores: { skel: number, rat: number, pos: XY }[] = [];
            state.maze.forEach((x, y, t) => {
                if (!t.solid && x % 2 === 1 && y % 2 === 1) {
                    scores.push({
                        pos: [x, y],
                        skel: (t.type == "hall" ? 10 : 1) + (t.distanceFromPath && t.distanceFromPath < 999 ? t.distanceFromPath : 0) *2+ (t.entities && t.entities.length>0 ? -15:0),
                        rat: (t.type == "room" ? 3 : 1) + state.maze.getKernel([x, y], [[-2, 0], [-1,0],[1,0],[2, 0]]).filter(a => !!a && !a.solid).length * 9 + (t.entities && t.entities.length>0 ? -15:0)
                    });
                }
            });

            // Give scores with consecutive numbers
            scores.sort((a, b) => a.skel - b.skel).forEach((s, i) => s.skel = i);
            scores.sort((a, b) => a.rat - b.rat).forEach((s, i) => s.rat = i);
            // sort where rat score is most different to skel score
            scores.sort((b, a) => {
                return Math.abs(a.rat - a.skel) - Math.abs(b.rat - b.skel);
            });
            // trim the last third
            scores = scores.slice(0, Math.ceil(scores.length * 2 / 3));
            // add random score offsets
            scores.forEach(s=>{
                s.skel += Math.random() * 10;
                s.rat += Math.random() * 10;
            })
            // Sort by skel, place 5
            // TODO spawn more or less depending on size
            scores.sort((b, a) => a.skel - b.skel).splice(0, 5).forEach(s => {
                state.entities.addEntity(new FollowerEntity(s.pos, state), state);
            })
            yield;
            // sort by rat, place 8 
            // TODO spawn more or less depending on size
            scores.sort((b, a) => a.rat - b.rat).splice(0, 8).forEach(s => {
                state.entities.addEntity(new RatEntity(s.pos), state);
            })
            yield;
        }
    }
}