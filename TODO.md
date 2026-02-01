# TODO

## Bugs

- [x] the action for "end" and "start" sprites show the EndAction instead of nothing

## Entity System Migration - ~95% Complete

### ✅ **Completed Core Infrastructure:**
- [x] Created abstract Entity class with tile position, sprite offset, and lifecycle management
- [x] Implemented Entities collection manager with proper tile-entity relationships
- [x] Added Entity reference to Tile type for direct tile-entity lookup
- [x] Created KeyEntity and PlayerEntity implementations
- [x] Updated State type to use entities instead of sprites
- [x] Migrated action system to work with entities (WalkAction, CollectAction, OpenDoorAction)
- [x] Updated renderer to use entity system instead of sprites
- [x] Fixed entity creation in game-component (KeyEntity properly added)
- [x] Resolved type typos and method naming inconsistencies

### ✅ **Recently Completed (Renderer System Fixes):**
- [x] Fixed viewport calculation to include player sprite offset
- [x] Fixed sprite rendering to use tile position + sprite offset
- [x] Improved rendering code to cache sprite reference and avoid repeated `getSprite()!` calls
- [x] Handled sprite offsets properly in rendering system

### 🔴 **Remaining Critical Issues:**

#### **Animation System - Partial Working**
**Issue**: Entity movement animation doesn't properly manage tile references
**Location**: `src/action.ts` walkAnimation function (lines 96-100)
**Current Behavior**: 
- Updates `entity["tile"]` position directly
- Updates sprite offset correctly during animation
- **Problem**: Old tile's entity reference isn't cleared, new tile's reference isn't set
**Fix Needed**:
```typescript
// After position update in walkAnimation:
const oldTile = state.maze.get(entity.getTile()[0] - dx * 2, entity.getTile()[1] - dy * 2);
const newTile = state.maze.get(entity.getTile()[0], entity.getTile()[1]);
if (oldTile?.entity === entity) oldTile.entity = undefined;
if (newTile) newTile.entity = entity;
```

#### **Entity Lifecycle Management - Missing**
**Issue**: Dead entities aren't cleaned up from the system
**Location**: `src/entities/entities.ts` - missing cleanup method
**Problem**: `entity.die()` only marks entity as dead, but doesn't remove it from entity lists/maps
**Fix Needed**: Add cleanup method and call it during game loop:
```typescript
public cleanupDeadEntities(state: State): void {
    const deadEntities = this.entityList.filter(e => e.isDead());
    deadEntities.forEach(entity => {
        this.removeEntity(entity, state);
    });
}
```
**Call location**: In game-component tick method, after entity updates

#### **Code Quality Issues**
**Issue 1**: Type assertion abuse still exists
**Location**: `src/action.ts` line 98-99
**Problem**: `entity["tile"]` bypasses type system for tile updates
**Fix Needed**: Add proper entity tile update method to Entity class

**Issue 2**: Redundant entity-tile relationship
**Location**: `src/entities/entities.ts` line 26
**Problem**: `getEntityByXY` duplicates functionality already available via `state.maze.get(xy).entity`
**Fix Needed**: Remove method and update callers to use tile entity reference

### 📝 **Housekeeping Tasks**
- [ ] Remove commented old sprite code in game-component.ts (lines 266-280)
- [ ] Add proper entity tile update method to Entity class to avoid type assertions
- [ ] Remove redundant `getEntityByXY` method in Entities class

## Feature Tasks

### High Priority
- [ ] The EndAction requires a "key" in the inventory, otherwise does nothing
  - **Current State**: EndAction exists but doesn't check inventory
  - **Implementation**: Add inventory check in `EndAction.onClick()`
  - **Location**: `src/action.ts` line 42

### Medium Priority
- [ ] Add a generic action that does nothing, but has a name that is set via the constructor
  - **Use Case**: For testing and placeholder actions
  - **Implementation**: Create `NoOpAction` class extending Action

### Low Priority  
- [x] Implement proper entity position updating when entities move between tiles
  - **Status**: Rendering system properly handles offsets, only tile reference management needed

## Architecture Ideas for Future Implementation

### Entity-Driven Actions (Currently Partially Implemented)
**Current State**: `Entity.getAction()` method exists and is used in `calculateAvailableAction`
**Enhancement Needed**:
- Each entity type should define its own interaction behaviors
- Actions should be entity-specific rather than position-based
- Example: `DoorEntity` returns `OpenDoorAction`, `KeyEntity` returns `CollectAction`

### Improved Entity Movement
**Current Approach**: Direct tile manipulation in animation
**Better Approach**:
- Entity should have `moveTo(newTile)` method
- Animation system should call entity methods rather than manipulating properties directly
- Entity should handle its own tile reference updates

### Component-Based Entity System
**Current**: Entity is a single class with sprite and behavior
**Future**: Entity could have components (PositionComponent, SpriteComponent, BehaviorComponent)

## Testing & Debugging Notes

### Known Issues to Verify When Picking Up:
1. **Entity cleanup**: Check that collected keys disappear from both display and entity list
2. **Tile reference integrity**: Ensure moving entities don't leave orphaned entity references in tiles
3. **Inventory persistence**: Verify collected keys persist across level changes
4. **Smooth animation**: Confirm viewport follows player smoothly during movement (✅ FIXED)

### Debug Commands for Testing:
- Check entity count: `state.entities.entityList.length`
- Check tile references: `state.maze.get(x,y).entity`
- Check inventory: `state.inventory`

## Migration Completion Checklist

- [ ] Animation tile reference management
- [ ] Dead entity cleanup system
- [ ] Code quality improvements (remove type assertions, remove redundant methods)
- [ ] Remove commented legacy code
- [ ] Complete feature implementation (EndAction inventory check)
- [ ] Testing and validation of all entity interactions