# TODO

## Structure and minor things
- consider making doors entities with actions, which means we first test resut[0] for actions
- create a "composite action" that just performs actions one after another
- create a "parallel action" that runs actions in parallel
- pass direction in when getting an action from an entity
- some entities should extend static entity
- a key should extend a collectable entity
- collectable entities should have little animation where the character moves slightly toward, then back

## Bigger things
- create a locked door entity that requires a key to change its tile from solid
- randomly spread other static entities around the place
- create a "follower" entity that just moves in the direction of the player (using the vis distance)
- add onFrame updates to entities on discoverd tiles