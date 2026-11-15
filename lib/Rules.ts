import Rule from '@civ-clone/core-rule/Rule';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

/**
 * Whether `unit` refuels on `tile`: it does if any rule's criteria match and its effect returns `true`. A game says
 *  where with its criteria (see `refuelInOwnCity`, `refuelOnTileImprovement`, `refuelInStackWith`, `refuelAboard`).
 */
export class Refuel extends Rule<[unit: Unit, tile: Tile], boolean> {}

/** `unit` ran out of fuel away from anywhere it refuels. `fuelRules` adds one that destroys it. */
export class OutOfFuel extends Rule<[unit: Unit], void> {}
