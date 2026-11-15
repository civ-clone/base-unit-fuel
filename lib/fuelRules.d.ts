import { OutOfFuel } from './Rules';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Aloft from './Aloft';
import Moved from '@civ-clone/core-unit/Rules/Moved';
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
/**
 * When a unit's turns out are counted:
 *
 * - `'turn-end'`: at the end of each of its player's turns, wherever it is (`checkFuel`);
 * - `'out-of-moves'`: after each move, as the original does (`checkFuelAfterMove`).
 */
export type CountOn = 'turn-end' | 'out-of-moves';
export interface FuelOptions {
  /**
   * The rules' ids are `<prefix>:player/turn-end/fuel` (or `<prefix>:unit/moved/fuel`) and
   *  `<prefix>:unit/out-of-fuel/destroy`. Unnamed without.
   */
  prefix?: string;
  /** A unit's range: its `Fuel` yield by default. */
  range?: Range;
  /** When turns out are counted: `'turn-end'` by default. */
  countOn?: CountOn;
  /** For `'out-of-moves'`, whether a `Moved` action is a move: by default, one to another square (attacks included). */
  countsAsMove?: (unit: Unit, action: Action) => boolean;
  /** For `'out-of-moves'`, whether the action was an attack: by default, the unit didn't end up on its target. */
  isAttack?: (unit: Unit, action: Action) => boolean;
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
 * After `unit` moves (OpenCiv2, `unit_move_dir_air_fuel`), for a unit with a range (above 0):
 *
 * - where it refuels, it loses its `Aloft` mark and its remaining moves (it has landed), except that a unit with a
 *   range of 1 that attacked and still has moves left hasn't landed;
 * - anywhere else, once it has no moves left, it has spent one more turn out, and runs out of fuel (`OutOfFuel`) when
 *   that reaches its range.
 */
export declare const checkFuelAfterMove: (
  ruleRegistry: RuleRegistry,
  unitImprovementRegistry: UnitImprovementRegistry,
  range: Range,
  isAttack: (unit: Unit, action: Action) => boolean
) => (unit: Unit, action: Action) => void;
/**
 * A ruleset's fuel rules: one that counts the turns each unit with a range spends away from a refuelling point, and an
 *  `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel` rules (see `lib/refuel`), and its
 *  own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * With `countOn: 'turn-end'` (the default) the count is a `TurnEnd` rule (`checkFuel`): it doesn't matter whether a
 *  unit spent its moves. With `'out-of-moves'` it is a `Moved` rule (`checkFuelAfterMove`), as the original counts it.
 */
export declare const fuelRules: (
  { ruleRegistry, unitImprovementRegistry, unitRegistry }: FuelDependencies,
  { prefix, range, countOn, countsAsMove, isAttack }?: FuelOptions
) => (TurnEnd | Moved | OutOfFuel)[];
export default fuelRules;
