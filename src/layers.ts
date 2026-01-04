import { DoorLayer } from "./layers/door-layer";
import { FarthestLayer } from "./layers/farthest-layer";
import { FirstLayer } from "./layers/first-layer";
import { IdentifierLayer } from "./layers/identifier-layer";
import { KeyLayer } from "./layers/key-layer";
import type { LayerLogic } from "./layers/layer";
import { RoomLayer } from "./layers/room-layer";
import { MazeSolverLayer } from "./layers/solver-layer";
import { EndTrimmerLayer } from "./layers/trim-layer";

function registerLayer(cur: LayerLogic, prev?: LayerLogic) {
    if (prev) {
        prev.next = cur;
        cur.prev = prev;
    }
    ALL_LAYERS[cur.title] = cur;
}

export const ALL_LAYERS: { [id: string]: LayerLogic } = {};

export const L1 = new FirstLayer();
const L1_5 = new RoomLayer();
const L2 = new MazeSolverLayer();
const L3 = new EndTrimmerLayer();
const L5 = new IdentifierLayer();
const L6 = new FarthestLayer();
const L7 = new DoorLayer();
const L8 = new KeyLayer();
registerLayer(L1);
registerLayer(L1_5, L1);
registerLayer(L2, L1_5);
registerLayer(L3, L2);
registerLayer(L5, L3);
registerLayer(L6, L5);
registerLayer(L7, L6);
registerLayer(L8, L7);
