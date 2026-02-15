import type { State } from "../state";
import type { ReturnsGenerator } from "../types";
import type { Rect } from "../util/xy";
import { LayerLogic } from "./layer";

export class RoomLayer extends LayerLogic {
    constructor() {
        super("Rooms", [
            {
                name: "Rooms",
                min: 0,
                max: 100,
                value: 9,
                type: "number",
            },
            {
                name: "Width Range",
                min: 0,
                max: 5,
                type: "number",
                value: 2,
            },
            {
                name: "Height Range",
                min: 0,
                max: 5,
                type: "number",
                value: 2,
            },
        ]);
    }

    private pickRoom(state: State, maxWidth: number, maxHeight: number): Rect & { roomId: number } {
        const attempts = 20;
        maxWidth = Math.min(maxWidth,Math.floor(state.maze.w/2-1));
        maxHeight = Math.min(maxHeight,Math.floor(state.maze.h/2-1));
        let w = 0;
        let h = 0;
        let x = 0;
        let y = 0;
        let tryAgain = true;
        let roomId = 0;
        for (let i = 0; i < attempts && tryAgain; i++) {
            roomId = 0;
            tryAgain = false;
            w = 3 + 2 * Math.floor(Math.random() * maxWidth);
            h = 3 + 2 * Math.floor(Math.random() * maxHeight);
            x = 1 + 2 * Math.floor(Math.random() * (Math.max(0,state.maze.w / 2 - w)));
            y = 1 + 2 * Math.floor(Math.random() * (Math.max(0,state.maze.h / 2 - h))); // h = 5, minimum is 1 + 2 * floor(1 * 5 / 2 - 3) = 1+2*floor(-0.5) = 1-2
            console.log("Attempt", x, y, w, h);
            // find any neighbouring rooms
            state.maze.forEachRect(
                { left: x - 1, top: y - 1, width: w + 2, height: h + 2 },
                (xx, yy, t) => {
                    if (t.type === "room") {
                        tryAgain = true;
                    }
                    roomId = Math.max(roomId, t.roomId);
                }
            );
        }
        return {
            left: x,
            top: y,
            width: w,
            height: h,
            roomId: roomId,
        };
    }

    apply(): ReturnsGenerator {
        const state = this.state!;
        const count = this.getNumberParam("Rooms", 0);
        // width and height ranges
        const wr = this.getNumberParam("Width Range", 0);
        const hr = this.getNumberParam("Height Range", 0);
        const me = this;
        return function* () {
            for (let i = 0; i < count; i++) {
                // Pick a random location
                const rect = me.pickRoom(state, wr, hr);
                const roomIdsToReplace:Set<number> = new Set();
                // set all the rooms
                state.maze.forEach((xx, yy, t) => {
                    if (
                        xx >= rect.left &&
                        xx < rect.left + rect.width &&
                        yy >= rect.top &&
                        yy < rect.top + rect.height
                    ) {
                        if(!t.solid){
                            roomIdsToReplace.add(t.roomId);
                        }
                        t.type = "room";
                        t.solid = false;
                        t.roomId = rect.roomId;
                    }
                });
                // update any other rooms if there was an overlap
                state.maze.forEach((xx, yy, t) => {
                    if(roomIdsToReplace.has(t.roomId)){
                        t.roomId = rect.roomId;
                    }
                });


                yield;
            }
        };
    }
}
