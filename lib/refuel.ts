import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Refuel } from './Rules';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';

/** The units it applies to: all, without. */
export type Refuels = (unit: Unit) => boolean;

const refuel = (
  id: string | undefined,
  applies: Refuels,
  where: (unit: Unit, tile: Tile) => boolean
): Refuel =>
  new Refuel(
    ...((id === undefined ? [] : [id]) as string[]),
    new Criterion((unit: Unit): boolean => applies(unit)),
    new Criterion(where),
    new Effect((): boolean => true)
  );

const all: Refuels = (): boolean => true;

/** A `Refuel` rule: in one of the unit's player's own cities. */
export const refuelInOwnCity = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  applies: Refuels = all,
  id?: string
): Refuel =>
  refuel(
    id,
    applies,
    (unit: Unit, tile: Tile): boolean =>
      cityRegistry.getByTile(tile)?.player() === unit.player()
  );

/** A `Refuel` rule: on a square with an `Improvement` (an airfield, say). */
export const refuelOnTileImprovement = (
  Improvement: typeof TileImprovement,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  applies: Refuels = all,
  id?: string
): Refuel =>
  refuel(id, applies, (unit: Unit, tile: Tile): boolean =>
    tileImprovementRegistry
      .getByTile(tile)
      .some(
        (tileImprovement: TileImprovement): boolean =>
          tileImprovement instanceof Improvement
      )
  );

/**
 * A `Refuel` rule: on a square with another of the player's units that `isBase` says the unit can refuel on (one that
 *  carries it, say).
 */
export const refuelInStackWith = (
  isBase: (base: Unit, unit: Unit) => boolean,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  applies: Refuels = all,
  id?: string
): Refuel =>
  refuel(id, applies, (unit: Unit, tile: Tile): boolean =>
    unitRegistry
      .getByTile(tile)
      .some(
        (base: Unit): boolean =>
          base !== unit &&
          !base.destroyed() &&
          base.player() === unit.player() &&
          isBase(base, unit)
      )
  );

/** A `Refuel` rule: aboard a transport. */
export const refuelAboard = (
  transportRegistry: TransportRegistry = transportRegistryInstance,
  applies: Refuels = all,
  id?: string
): Refuel =>
  refuel(id, applies, (unit: Unit): boolean => transportRegistry.hasUnit(unit));
