The idea here is to have various configurable layers.
we save the intermediate states, so any changes only have to regenerate downstream things

we can use generators

* width and height
* rooms (rectangles) count, width, height
* create maze, with bias for horizontal or vertical
* trim dead ends (depth)
* trim inner U shape (inerse of dead ends) (depth)
* add shortcuts (aStar depth between any 2 points should be X)

then maybe
* find deepest path (random -> a, a->b, b->c should be longest)
* find distance from path
* trim farthest from path?
* add doord to branches (percentage)
* add keys obtainable before doors


then maybe
* assign room types?
* replace boolean tiles with rectagnles of prefabs?
* place items in room
* place enemies on room

# Sources

* Some sprites used
    * **Urizen 1Bit Tileset** - https://vurmux.itch.io/urizen-onebit-tileset - CC0 License

# Structure

* **State** the definition of the level, and other data
* **Renderer** renders the state to a 2d canvas
* **Layers** make progressive changes on the State (the level) .take an input state, and produces a generator. when the generator is done, it is finished creating the output state. 
* **Entity** Base class for all interactive objects in the maze world, including players, enemies, items, and static objects. Entities manage their position on tiles, handle actions, and control their visual representation through sprites.
* **Action** Commands that can be performed by entities or triggered by player input, such as walking, collecting items, opening doors, or ending the level. Actions encapsulate specific gameplay behaviors with display names, click handlers, and optional animations.
* **ActionAnimation** Functions that animate entity movements and state changes over time, using delta time to calculate smooth transitions between positions. Animations update sprite offsets during movement and can be combined for parallel effects.
