import { Range } from './fuelRules';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
export interface FuelState {
  /** The unit's range. */
  range: number;
  /** The turns it has ended away from a refuelling point since it last refuelled. */
  turnsAloft: number;
  /**
   * The turns it has left, this one included: it must be somewhere it refuels by the end of the last of them. 1 means
   *  by the end of this turn.
   */
  turnsLeft: number;
  /** How many moves it has before then: its moves left, and its full movement for each turn after this one. */
  reach: number;
}
/** Where a fuelled `unit` stands, for a computer player deciding where to send it; `null` for a unit with no range. */
export declare const fuelState: (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit,
  range?: Range
) => FuelState | null;
export interface RefuelInReachOptions {
  range?: Range;
  /** How many moves apart two squares are: `Tile.distanceFrom` by default. */
  distance?: (from: Tile, to: Tile) => number;
  /** The squares to look at: by default the area around the unit as far as its reach. */
  candidates?: (unit: Unit, reach: number) => Tile[];
}
/**
 * The nearest square within `unit`'s reach (see `fuelState`) where it refuels (`Refuel`), its own square first; `null`
 *  if there is none, or the unit has no range. The first of equally near squares.
 */
export declare const refuelInReach: (
  ruleRegistry: RuleRegistry,
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit,
  { range, distance, candidates }?: RefuelInReachOptions
) => Tile | null;
