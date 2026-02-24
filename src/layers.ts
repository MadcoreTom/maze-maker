import { DoorLayer } from "./layers/door-layer";
import { EntityLayer } from "./layers/entity.layer";
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
const L9 = new EntityLayer();
registerLayer(L1);
registerLayer(L1_5, L1);
registerLayer(L2, L1_5);
registerLayer(L3, L2);
registerLayer(L5, L3);
registerLayer(L6, L5);
registerLayer(L7, L6);
registerLayer(L8, L7);
registerLayer(L9, L8);


type ParamConfigItem = { [name: string]: number };

let allParams: ParamConfigItem[] = [];
let cur: LayerLogic | undefined = L1;

while (cur !== undefined) {
    const curItem: ParamConfigItem = {};
    cur.params.forEach(p => {
        curItem[p.name] = p.value;
    });
    allParams.push(curItem);
    cur = cur.next;
}

console.log("PARAMS", JSON.stringify(allParams, null, 2));

// I grabbed the params and override them here



// then i can apply them
export function applyParams(params: ParamConfigItem[]) {
    cur = L1;

    let i = 0;
    while (cur !== undefined) {
        const p = params[i++] || {};
        Object.entries(p).forEach(([k, v]) => {
            cur!.params.filter(p => p.name === k).forEach(p => p.value = v);
        });
        cur = cur.next;
    }
}