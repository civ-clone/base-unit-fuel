import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { Refuel } from './Rules';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
/** The units it applies to: all, without. */
export type Refuels = (unit: Unit) => boolean;
/** A `Refuel` rule: in one of the unit's player's own cities. */
export declare const refuelInOwnCity: (
  cityRegistry?: CityRegistry,
  applies?: Refuels,
  id?: string
) => Refuel;
/** A `Refuel` rule: on a square with an `Improvement` (an airfield, say). */
export declare const refuelOnTileImprovement: (
  Improvement: typeof TileImprovement,
  tileImprovementRegistry?: TileImprovementRegistry,
  applies?: Refuels,
  id?: string
) => Refuel;
/**
 * A `Refuel` rule: on a square with another of the player's units that `isBase` says the unit can refuel on (one that
 *  carries it, say).
 */
export declare const refuelInStackWith: (
  isBase: (base: Unit, unit: Unit) => boolean,
  unitRegistry?: UnitRegistry,
  applies?: Refuels,
  id?: string
) => Refuel;
/** A `Refuel` rule: aboard a transport. */
export declare const refuelAboard: (
  transportRegistry?: TransportRegistry,
  applies?: Refuels,
  id?: string
) => Refuel;
