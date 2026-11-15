import { OutOfFuel } from './Rules';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Aloft from './Aloft';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import Unit from '@civ-clone/core-unit/Unit';
export interface FuelDependencies {
  ruleRegistry?: RuleRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitRegistry?: UnitRegistry;
}
/** A unit's range: how many turns it can end away from a refuelling point. */
export type Range = (unit: Unit) => number;
export interface FuelOptions {
  /** The rules' ids are `<prefix>:player/turn-end/fuel` and `<prefix>:unit/out-of-fuel/destroy`. Unnamed without. */
  prefix?: string;
  /** A unit's range: its `Fuel` yield by default. */
  range?: Range;
}
/** A unit's `Fuel` yield. */
export declare const fuelRange: Range;
/** `unit`'s `Aloft` mark, if it has one. */
export declare const aloftOf: (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit
) => Aloft | undefined;
/** How many turns `unit` has ended away from a refuelling point since it last refuelled. */
export declare const turnsAloft: (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit
) => number;
/** Whether `unit` refuels on `tile` (see `Refuel`). */
export declare const refuels: (
  ruleRegistry: RuleRegistry,
  unit: Unit,
  tile?: Tile
) => boolean;
/**
 * At the end of `player`'s turn, for each of its units with a range (above 0): one that refuels where it is loses its
 *  `Aloft` mark; any other has ended one more turn out, and runs out of fuel (`OutOfFuel`) once that reaches its range.
 */
export declare const checkFuel: (
  ruleRegistry: RuleRegistry,
  unitImprovementRegistry: UnitImprovementRegistry,
  unitRegistry: UnitRegistry,
  range: Range
) => (player: Player) => void;
/**
 * A ruleset's fuel rules: a `TurnEnd` rule that counts the turns each unit with a range ends away from a refuelling
 *  point (see `checkFuel`), and an `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel`
 *  rules (see `refuel`), and its own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * Fuel is counted at the end of each turn, so it doesn't matter whether a unit spent its moves.
 */
export declare const fuelRules: (
  { ruleRegistry, unitImprovementRegistry, unitRegistry }: FuelDependencies,
  { prefix, range }?: FuelOptions
) => (TurnEnd | OutOfFuel)[];
export default fuelRules;
