import { Range, fuelRange, refuels, turnsAloft } from './fuelRules';
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
export const fuelState = (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit,
  range: Range = fuelRange
): FuelState | null => {
  const unitRange = range(unit);

  if (!(unitRange > 0)) {
    return null;
  }

  const aloft = turnsAloft(unitImprovementRegistry, unit),
    turnsLeft = Math.max(0, unitRange - aloft);

  return {
    range: unitRange,
    turnsAloft: aloft,
    turnsLeft,
    reach:
      turnsLeft === 0
        ? 0
        : unit.moves().value() + unit.movement().value() * (turnsLeft - 1),
  };
};

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
export const refuelInReach = (
  ruleRegistry: RuleRegistry,
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit,
  {
    range = fuelRange,
    distance = (from: Tile, to: Tile): number => from.distanceFrom(to),
    candidates = (candidate: Unit, reach: number): Tile[] =>
      candidate.tile().getSurroundingArea(Math.floor(reach)).entries(),
  }: RefuelInReachOptions = {}
): Tile | null => {
  const state = fuelState(unitImprovementRegistry, unit, range);

  if (state === null) {
    return null;
  }

  const from = unit.tile();

  if (refuels(ruleRegistry, unit, from)) {
    return from;
  }

  let nearest: [Tile, number] | null = null;

  candidates(unit, state.reach).forEach((tile: Tile): void => {
    const away = distance(from, tile);

    if (
      away <= state.reach &&
      (nearest === null || away < nearest[1]) &&
      refuels(ruleRegistry, unit, tile)
    ) {
      nearest = [tile, away];
    }
  });

  return nearest === null ? null : (nearest as [Tile, number])[0];
};
