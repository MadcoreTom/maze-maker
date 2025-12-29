import { FarthestLayer } from "./layers/farthest-layer";
import { FillHairpinsLayer } from "./layers/fill-hairpins-layer";
import { FirstLayer } from "./layers/first-layer";
import { IdentifierLayer } from "./layers/identifier-layer";
import type { LayerLogic } from "./layers/layer";
import { RoomLayer } from "./layers/room-layer";
import { MazeSolverLayer } from "./layers/solver-layer";
import { EndTrimmerLayer } from "./layers/trim-layer";
import type { State } from "./types";

export function renderInitState(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = "white";
  const w = 600,
    h = 600;
  ctx.fillRect(0, 0, w, h);
  const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h));
  state.maze.forEach((x, y, v) => {
    ctx.fillStyle = v.solid ? "navy" : "yellow";
    ctx.fillRect(x * s, y * s, s, s);
  });
  ctx.strokeStyle = "black";
  state.maze.forEach((x, y, v) => {
    ctx.strokeRect(x * s, y * s, s, s);
  });
}

export function renderRoomIds(ctx: CanvasRenderingContext2D, state: State) {
  ctx.fillStyle = "white";
  const w = 600,
    h = 600;
  ctx.fillRect(0, 0, w, h);
  const s = Math.floor(Math.min(w / state.maze.w, h / state.maze.h));
  state.maze.forEach((x, y, v) => {
    ctx.fillStyle = v.solid ? "navy" : `hsl(${v.roomId * 10},80%,60%)`;
    ctx.fillRect(x * s, y * s, s, s);
  });
  ctx.strokeStyle = "black";
  state.maze.forEach((x, y, v) => {
    ctx.strokeRect(x * s, y * s, s, s);
  });
}

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
const L4 = new FillHairpinsLayer();
const L5 = new IdentifierLayer();
const L6 = new FarthestLayer();
registerLayer(L1);
registerLayer(L1_5, L1);
registerLayer(L2, L1_5);
registerLayer(L3, L2);
registerLayer(L4, L3);
registerLayer(L5, L4);
registerLayer(L6, L5);
