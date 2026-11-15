import { OutOfFuel, Refuel } from './Rules';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Aloft from './Aloft';
import Effect from '@civ-clone/core-rule/Effect';
import Fuel from './Fuel';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';

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
export const fuelRange: Range = (unit: Unit): number => {
  const [range] = unit.yield(new Fuel());

  return range.value();
};

/** `unit`'s `Aloft` mark, if it has one. */
export const aloftOf = (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit
): Aloft | undefined =>
  unitImprovementRegistry
    .getByUnit(unit)
    .find(
      (unitImprovement: UnitImprovement): boolean =>
        unitImprovement instanceof Aloft
    ) as Aloft | undefined;

/** How many turns `unit` has ended away from a refuelling point since it last refuelled. */
export const turnsAloft = (
  unitImprovementRegistry: UnitImprovementRegistry,
  unit: Unit
): number => aloftOf(unitImprovementRegistry, unit)?.turns() ?? 0;

/** Whether `unit` refuels on `tile` (see `Refuel`). */
export const refuels = (
  ruleRegistry: RuleRegistry,
  unit: Unit,
  tile: Tile = unit.tile()
): boolean =>
  ruleRegistry
    .process(Refuel, unit, tile)
    .some((answer: boolean | void): boolean => answer === true);

/**
 * At the end of `player`'s turn, for each of its units with a range (above 0): one that refuels where it is loses its
 *  `Aloft` mark; any other has ended one more turn out, and runs out of fuel (`OutOfFuel`) once that reaches its range.
 */
export const checkFuel =
  (
    ruleRegistry: RuleRegistry,
    unitImprovementRegistry: UnitImprovementRegistry,
    unitRegistry: UnitRegistry,
    range: Range
  ) =>
  (player: Player): void =>
    unitRegistry.getByPlayer(player).forEach((unit: Unit): void => {
      if (unit.destroyed()) {
        return;
      }

      const unitRange = range(unit);

      if (!(unitRange > 0)) {
        return;
      }

      const aloft = aloftOf(unitImprovementRegistry, unit);

      if (refuels(ruleRegistry, unit)) {
        if (aloft !== undefined) {
          unitImprovementRegistry.unregister(aloft);
        }

        return;
      }

      const turns = (aloft?.turns() ?? 0) + 1;

      if (turns < unitRange) {
        if (aloft === undefined) {
          unitImprovementRegistry.register(new Aloft(unit, turns));

          return;
        }

        aloft.setTurns(turns);

        return;
      }

      if (aloft !== undefined) {
        unitImprovementRegistry.unregister(aloft);
      }

      ruleRegistry.process(OutOfFuel, unit);
    });

/**
 * A ruleset's fuel rules: a `TurnEnd` rule that counts the turns each unit with a range ends away from a refuelling
 *  point (see `checkFuel`), and an `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel`
 *  rules (see `refuel`), and its own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * Fuel is counted at the end of each turn, so it doesn't matter whether a unit spent its moves.
 */
export const fuelRules = (
  {
    ruleRegistry = ruleRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: FuelDependencies,
  { prefix, range = fuelRange }: FuelOptions = {}
): (TurnEnd | OutOfFuel)[] => {
  const id = (name: string): string[] =>
    prefix === undefined ? [] : [`${prefix}:${name}`];

  return [
    new TurnEnd(
      ...id('player/turn-end/fuel'),
      new Effect(
        checkFuel(ruleRegistry, unitImprovementRegistry, unitRegistry, range)
      )
    ),
    new OutOfFuel(
      ...id('unit/out-of-fuel/destroy'),
      new Effect((unit: Unit): void => unit.destroy())
    ),
  ];
};

export default fuelRules;
