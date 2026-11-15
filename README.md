# base-unit-fuel

Fuel for units that must return to base: a range, the turns a unit has ended out, where it refuels, and running out. A
library: nothing registers on import, and a game that registers none of it has no fuel.

## API

Deep-import the modules; there is no index.

- `lib/Fuel`: `Fuel`, the unit yield that gives a unit's range: how many of its player's turns it can end away from a
  refuelling point, counting the one it set out in (1: it must refuel every turn; 2: it can stay out one turn). 0, as
  with no `Yield` rule for it, needs no fuel.
- `lib/fuelRules`: `fuelRules({ ruleRegistry, unitImprovementRegistry, unitRegistry }, { prefix?, range? })`:
  - a `TurnEnd` rule: for each of the player's units with a range, one that refuels where it is loses its count;
    any other has ended one more turn out, and runs out of fuel (`OutOfFuel`) when that reaches its range;
  - an `OutOfFuel` rule that destroys the unit. A game adds its own `OutOfFuel` rules for anything else (a notice).
  - `range(unit)` is the unit's `Fuel` yield by default (`fuelRange`); a game can read its own table instead.
  - helpers: `refuels(ruleRegistry, unit, tile?)`, `turnsAloft(unitImprovementRegistry, unit)`, `aloftOf(...)`,
    `checkFuel(...)`.
  - Rule ids `<prefix>:player/turn-end/fuel` and `<prefix>:unit/out-of-fuel/destroy`.
- `lib/Rules`: `Refuel(unit, tile) → boolean` (a unit refuels on a square if any rule's criteria match and its effect
  answers `true`) and `OutOfFuel(unit)`.
- `lib/refuel`, `Refuel` rules a game registers, each with an optional `applies(unit)` filter and id:
  `refuelInOwnCity(cityRegistry)`, `refuelOnTileImprovement(Improvement, tileImprovementRegistry)`,
  `refuelInStackWith(isBase(base, unit), unitRegistry)` (another of the player's units on the square, such as one that
  carries it) and `refuelAboard(transportRegistry)`.
- `lib/reach`, for computer players:
  - `fuelState(unitImprovementRegistry, unit, range?)`: `{ range, turnsAloft, turnsLeft, reach }`, `turnsLeft` counting
    this turn, and `reach` the moves before the end of the last of them (moves left, then full movement each turn);
    `null` for a unit with no range.
  - `refuelInReach(ruleRegistry, unitImprovementRegistry, unit, { range?, distance?, candidates? })`: the nearest
    square within reach where the unit refuels, or `null`.

## When fuel is counted

At the end of each of the player's turns, wherever the unit is, as civ1-unit's own fuel rule counts it, so that rule
can move onto this package later with the same behaviour. OpenCiv2 (github.com/richardpenman/civ2, read at 49f26ec,
`unit_move_dir_air_fuel`) counts instead when a move leaves the unit out with no moves left, which can't tell a unit
that ends its turn with moves unspent. Its places to refuel (a city, an airbase, a stack with a unit that carries
it) are the rules in `lib/refuel`.

## The count is saved

`Aloft` (a `UnitImprovement` holding the count) exists only for a unit that is out, and goes when it refuels, so a
unit at its base carries and saves nothing extra. A game that saves registers it in its
`AvailableUnitImprovementRegistry`. It is also sent to clients in a unit's `improvements`, so a client should leave it
out of what it shows (or show the count).
