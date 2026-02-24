# Agent Changes

> This file lists any changes made via the AI agent (except for those made before I started tracking it)

* Extracted entity placement logic to entity-placer.ts
  * src/entity-placer.ts (new file)
  * src/components/game-component.ts: Replaced inline logic with placeEntities() call
* Updated game-component.ts to pass names to entity constructors
  * src/components/game-component.ts
* Removed first param from Entities.addEntity, now gets name solely from entity.name
  * src/entities/entities.ts
* Added optional `name` constructor param to Entity class and all subclasses
  * src/entities/entity.ts, src/entities/rat.entity.ts
* Moved queue from state to local scope in MazeSolverLayer#apply()
  * src/layers/solver-layer.ts
* Fixed entity removal bug: calculateAllActions now calls removeDeadEntities before calculating actions
  * src/action.ts: Added `state.entities.removeDeadEntities(state)` at start of calculateAllActions
  * src/components/game-component.ts: Removed duplicate removeDeadEntities call from updateActions
* Improved entity removal debugging in entities.ts and entity.ts
  * src/entities/entities.ts: Added warn logging when entity not found in tile
  * src/entities/entity.ts: Added warn logging when entity not found in oldTile during move
* Implemented TODOs in entity-placer.ts: added hallway follower entity placement logic
  * src/entity-placer.ts
