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
import Action from '@civ-clone/core-unit/Action';
import Aloft from './Aloft';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fuel from './Fuel';
import Moved from '@civ-clone/core-unit/Rules/Moved';
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
 * After `unit` moves (OpenCiv2, `unit_move_dir_air_fuel`), for a unit with a range (above 0):
 *
 * - where it refuels, it loses its `Aloft` mark and its remaining moves (it has landed), except that a unit with a
 *   range of 1 that attacked and still has moves left hasn't landed;
 * - anywhere else, once it has no moves left, it has spent one more turn out, and runs out of fuel (`OutOfFuel`) when
 *   that reaches its range.
 */
export const checkFuelAfterMove =
  (
    ruleRegistry: RuleRegistry,
    unitImprovementRegistry: UnitImprovementRegistry,
    range: Range,
    isAttack: (unit: Unit, action: Action) => boolean
  ) =>
  (unit: Unit, action: Action): void => {
    if (unit.destroyed()) {
      return;
    }

    const unitRange = range(unit);

    if (!(unitRange > 0)) {
      return;
    }

    const aloft = aloftOf(unitImprovementRegistry, unit),
      landed =
        refuels(ruleRegistry, unit) &&
        !(
          unitRange === 1 &&
          unit.moves().value() > 0 &&
          isAttack(unit, action)
        );

    if (landed) {
      if (aloft !== undefined) {
        unitImprovementRegistry.unregister(aloft);
      }

      unit.moves().set(0);

      return;
    }

    if (unit.moves().value() > 0) {
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
  };

/**
 * A ruleset's fuel rules: one that counts the turns each unit with a range spends away from a refuelling point, and an
 *  `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel` rules (see `lib/refuel`), and its
 *  own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * With `countOn: 'turn-end'` (the default) the count is a `TurnEnd` rule (`checkFuel`): it doesn't matter whether a
 *  unit spent its moves. With `'out-of-moves'` it is a `Moved` rule (`checkFuelAfterMove`), as the original counts it.
 */
export const fuelRules = (
  {
    ruleRegistry = ruleRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: FuelDependencies,
  {
    prefix,
    range = fuelRange,
    countOn = 'turn-end',
    countsAsMove = (unit: Unit, action: Action): boolean =>
      action.from() !== action.to(),
    isAttack = (unit: Unit, action: Action): boolean =>
      unit.tile() !== action.to(),
  }: FuelOptions = {}
): (TurnEnd | Moved | OutOfFuel)[] => {
  const id = (name: string): string[] =>
    prefix === undefined ? [] : [`${prefix}:${name}`];

  return [
    countOn === 'out-of-moves'
      ? new Moved(
          ...id('unit/moved/fuel'),
          new Criterion(countsAsMove),
          new Effect(
            checkFuelAfterMove(
              ruleRegistry,
              unitImprovementRegistry,
              range,
              isAttack
            )
          )
        )
      : new TurnEnd(
          ...id('player/turn-end/fuel'),
          new Effect(
            checkFuel(
              ruleRegistry,
              unitImprovementRegistry,
              unitRegistry,
              range
            )
          )
        ),
    new OutOfFuel(
      ...id('unit/out-of-fuel/destroy'),
      new Effect((unit: Unit): void => unit.destroy())
    ),
  ];
};

export default fuelRules;
