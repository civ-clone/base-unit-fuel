import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';

/**
 * How many of its player's turns a fuelled unit has ended away from somewhere it refuels. Only a unit that is out has
 *  one, and it goes when the unit refuels, so a unit at its base carries and saves nothing extra. A game that saves
 *  needs it in its `AvailableUnitImprovementRegistry`.
 */
export class Aloft extends UnitImprovement {
  private _turns: number;

  constructor(unit: Unit, turns: number = 1) {
    super(unit);

    this._turns = turns;

    this.addKey('turns');
  }

  turns(): number {
    return this._turns;
  }

  setTurns(turns: number): void {
    this._turns = turns;
  }
}

export default Aloft;
