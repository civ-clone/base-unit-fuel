# base-unit-fuel

Fuel for units that must return to base: a range, the turns a unit has ended out, where it refuels, and running out. A
library: nothing registers on import, and a game that registers none of it has no fuel.

## API

Deep-import the modules; there is no index.

- `lib/Fuel`: `Fuel`, the unit yield that gives a unit's range: how many of its player's turns it can end away from a
  refuelling point, counting the one it set out in (1: it must refuel every turn; 2: it can stay out one turn). 0, as
  with no `Yield` rule for it, needs no fuel.
- `lib/fuelRules`: `fuelRules({ engine?, ruleRegistry, unitImprovementRegistry, unitRegistry }, { prefix?, range?, countOn?,
  countsAsMove?, isAttack? })`:
  - a rule that counts turns out, as `countOn` says (see below);
  - an `OutOfFuel` rule that destroys the unit. A game adds its own `OutOfFuel` rules for anything else;
  - given an `engine`, a `High` `OutOfFuel` rule that emits `unit:out-of-fuel` with the unit, before it is destroyed, so
    the client can say the unit ran out of fuel (not that it was lost at sea).
  - `range(unit)` is the unit's `Fuel` yield by default (`fuelRange`); a game can read its own table instead.
  - helpers: `refuels(ruleRegistry, unit, tile?)`, `turnsAloft(unitImprovementRegistry, unit)`, `aloftOf(...)`,
    `checkFuel(...)` and `checkFuelAfterMove(...)`.
  - Rule ids `<prefix>:player/turn-end/fuel` (or `<prefix>:unit/moved/fuel`) and `<prefix>:unit/out-of-fuel/destroy`, plus `<prefix>:unit/out-of-fuel/emit` with an engine.
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

`countOn` chooses:

- `'turn-end'` (the default): a `TurnEnd` rule. At the end of each of the player's turns, a unit with a range that
  refuels where it is loses its count; any other has ended one more turn out, and runs out of fuel (`OutOfFuel`) when
  that reaches its range. It doesn't matter whether the unit spent its moves. This is how civ1-unit's own fuel rule
  counts, so that rule can move onto this package later with the same behaviour.
- `'out-of-moves'`: a `Moved` rule, as OpenCiv2 (github.com/richardpenman/civ2, read at 49f26ec,
  `unit_move_dir_air_fuel`) counts. After a move (`countsAsMove`, by default an action to another square), a unit that
  refuels where it is has landed: it loses its count and its remaining moves. The exception is a unit with a range of 1
  that attacked (`isAttack`, by default it didn't end up on its target) and still has moves, which hasn't landed. A unit
  anywhere else, left with no moves, has spent one more turn out, and runs out of fuel when that reaches its range. A
  unit that ends its turn with moves unspent isn't counted, as in the original.

The places the original refuels (a city, an airbase, a stack with a unit that carries it) are the rules in
`lib/refuel`.

## The count is saved

`Aloft` (a `UnitImprovement` holding the count) exists only for a unit that is out, and goes when it refuels, so a
unit at its base carries and saves nothing extra. A game that saves registers it in its
`AvailableUnitImprovementRegistry` (`tests/save.test.ts` round-trips it through core-save-game; without that, loading
fails with "Unknown entity type 'Aloft'"). It is also sent to clients in a unit's `improvements`, so a client should leave it
out of what it shows (or show the count).
