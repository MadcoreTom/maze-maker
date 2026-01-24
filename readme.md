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