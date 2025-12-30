import { renderRoomIds } from "../layers";
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
                value: 4,
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
    protected createInitialState(): State {
        throw new Error("RoomLayer requires an input state");
    }
    render(ctx: CanvasRenderingContext2D) {
        if (this.state) {
            renderRoomIds(ctx, this.state);
        }
    }
    private pickRoom(state: State, maxWidth: number, maxHeight: number): Rect & { roomId: number } {
        const attempts = 20;
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
            x = 1 + 2 * Math.floor(Math.random() * (state.maze.w / 2 - w));
            y = 1 + 2 * Math.floor(Math.random() * (state.maze.h / 2 - h));
            console.log("Attempt", x, y, w, h);
            // find any neighbouring rooms
            state.maze.forEach((xx, yy, t) => {
                if (xx >= x - 1 && xx < x + w + 1 && yy >= y - 1 && yy < y + h + 1) {
                    if (t.type === "room") {
                        tryAgain = true;
                    }
                    roomId = Math.max(roomId, t.roomId);
                }
            });
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
                console.log("R", rect);
                // set all the rooms
                state.maze.forEach((xx, yy, t) => {
                    if (
                        xx >= rect.left &&
                        xx < rect.left + rect.width &&
                        yy >= rect.top &&
                        yy < rect.top + rect.height
                    ) {
                        t.type = "room";
                        t.solid = false;
                        t.roomId = rect.roomId;
                    }
                });
                // update any other rooms if there was an overlap

                yield;
            }
        };
    }
}
