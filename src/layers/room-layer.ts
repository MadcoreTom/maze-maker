import { renderInitState, renderRoomIds } from "../layers";
import { ReturnsGenerator, State, Tile } from "../types";
import { Layer3 } from "./layer";

export class RoomLayer extends Layer3 {
    constructor() {
        super("Rooms", [
            {
                name: "Rooms",
                min:0,
                max:100,
                value:3,
                type:"number"
            },{
                name: "Width Range",
                min:0, 
                max:5,
                type: "number",
                value: 3
            },{
                name: "Height Range",
                min:0, 
                max:5,
                type: "number",
                value: 3
            }
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
    apply(): ReturnsGenerator {
        const state = this.state!;
        const count = this.getNumberParam("Rooms", 0);
        // width and height ranges
        const wr = this.getNumberParam("Width Range", 0);
        const hr = this.getNumberParam("Height Range", 0);
        return function* () {
          for(let i=0;i<count;i++){
            const w = Math.floor(Math.random() * wr) * 2 + 3;
            const h = Math.floor(Math.random() * hr) * 2 + 3; 
            const xr = Math.floor((state.maze.w - w)/2);
            const yr = Math.floor((state.maze.h - h)/2);
            let xo = Math.floor(Math.random() * xr) * 2 + 1;
            let yo = Math.floor(Math.random() * yr) * 2 + 1;
            let roomId = 0;
              let overlapsRoom = true;
              for (let a = 0; a < 10 && overlapsRoom; a++) {
                overlapsRoom = false;
                xo = Math.floor(Math.random() * xr) * 2 + 1;
                yo = Math.floor(Math.random() * yr) * 2 + 1;
                  for (let x = 0; x < w; x++) {
                      for (let y = 0; y < h; y++) {
                          const t = state.maze.get(xo + x, yo + y);
                          roomId = (t && t.roomId) ? Math.max(t.roomId, roomId) : roomId;
                          if(t && !t.solid && (x%2==0 || y%2==0) && !overlapsRoom){
                             console.log("overlaps. maybe try again", t)
                            overlapsRoom = true;
                          }
                      }
                  }
              }
            console.log("room", roomId, xo,yo,w,h)
            if(roomId > 0){
                const roomIdsToReplace:number[] = [];
                for(let x=0;x<w;x++){
                    for(let y=0;y<h;y++){
                        const t = state.maze.get(xo + x,yo + y);
                        if(t){
                            if(!t.solid && t.roomId != roomId){
                                roomIdsToReplace.push(t.roomId);
                            }
                            t.solid = false;
                            t.roomId = roomId;
                            // todo replace other room ids tht != roomid in cases of overlzpping multiple roos or room and a tile thst has a hiher tile id
                        } else {
                            console.log("room out of range",xo+x,yo+y);
                        }
                    }
                }
                state.maze.forEach((x,y,v)=>{
                    if(roomIdsToReplace.indexOf(v.roomId) >=0){
                        v.roomId = roomId;
                    }
                })
            }
            yield;
          }
        }
    }
}
