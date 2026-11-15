import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
/**
 * How many of its player's turns a fuelled unit has ended away from somewhere it refuels. Only a unit that is out has
 *  one, and it goes when the unit refuels, so a unit at its base carries and saves nothing extra. A game that saves
 *  needs it in its `AvailableUnitImprovementRegistry`.
 */
export declare class Aloft extends UnitImprovement {
  private _turns;
  constructor(unit: Unit, turns?: number);
  turns(): number;
  setTurns(turns: number): void;
}
export default Aloft;
