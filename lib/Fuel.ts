import Yield from '@civ-clone/core-yield/Yield';

/**
 * How many of its player's turns a unit can end away from somewhere it refuels (see `Refuel`), counting the one it set
 *  out in: at 1 it must refuel by the end of each turn, at 2 it can stay out for one turn. A unit with none (0, as a
 *  game that registers no `Yield` rule for it leaves every unit) needs no fuel.
 */
export class Fuel extends Yield {}

export default Fuel;
