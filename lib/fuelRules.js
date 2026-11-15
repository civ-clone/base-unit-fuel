"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelRules = exports.checkFuelAfterMove = exports.checkFuel = exports.refuels = exports.turnsAloft = exports.aloftOf = exports.fuelRange = void 0;
const Rules_1 = require("./Rules");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Aloft_1 = require("./Aloft");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fuel_1 = require("./Fuel");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const TurnEnd_1 = require("@civ-clone/core-player/Rules/TurnEnd");
/** A unit's `Fuel` yield. */
const fuelRange = (unit) => {
    const [range] = unit.yield(new Fuel_1.default());
    return range.value();
};
exports.fuelRange = fuelRange;
/** `unit`'s `Aloft` mark, if it has one. */
const aloftOf = (unitImprovementRegistry, unit) => unitImprovementRegistry
    .getByUnit(unit)
    .find((unitImprovement) => unitImprovement instanceof Aloft_1.default);
exports.aloftOf = aloftOf;
/** How many turns `unit` has ended away from a refuelling point since it last refuelled. */
const turnsAloft = (unitImprovementRegistry, unit) => { var _a, _b; return (_b = (_a = (0, exports.aloftOf)(unitImprovementRegistry, unit)) === null || _a === void 0 ? void 0 : _a.turns()) !== null && _b !== void 0 ? _b : 0; };
exports.turnsAloft = turnsAloft;
/** Whether `unit` refuels on `tile` (see `Refuel`). */
const refuels = (ruleRegistry, unit, tile = unit.tile()) => ruleRegistry
    .process(Rules_1.Refuel, unit, tile)
    .some((answer) => answer === true);
exports.refuels = refuels;
/**
 * At the end of `player`'s turn, for each of its units with a range (above 0): one that refuels where it is loses its
 *  `Aloft` mark; any other has ended one more turn out, and runs out of fuel (`OutOfFuel`) once that reaches its range.
 */
const checkFuel = (ruleRegistry, unitImprovementRegistry, unitRegistry, range) => (player) => unitRegistry.getByPlayer(player).forEach((unit) => {
    var _a;
    if (unit.destroyed()) {
        return;
    }
    const unitRange = range(unit);
    if (!(unitRange > 0)) {
        return;
    }
    const aloft = (0, exports.aloftOf)(unitImprovementRegistry, unit);
    if ((0, exports.refuels)(ruleRegistry, unit)) {
        if (aloft !== undefined) {
            unitImprovementRegistry.unregister(aloft);
        }
        return;
    }
    const turns = ((_a = aloft === null || aloft === void 0 ? void 0 : aloft.turns()) !== null && _a !== void 0 ? _a : 0) + 1;
    if (turns < unitRange) {
        if (aloft === undefined) {
            unitImprovementRegistry.register(new Aloft_1.default(unit, turns));
            return;
        }
        aloft.setTurns(turns);
        return;
    }
    if (aloft !== undefined) {
        unitImprovementRegistry.unregister(aloft);
    }
    ruleRegistry.process(Rules_1.OutOfFuel, unit);
});
exports.checkFuel = checkFuel;
/**
 * After `unit` moves (OpenCiv2, `unit_move_dir_air_fuel`), for a unit with a range (above 0):
 *
 * - where it refuels, it loses its `Aloft` mark and its remaining moves (it has landed), except that a unit with a
 *   range of 1 that attacked and still has moves left hasn't landed;
 * - anywhere else, once it has no moves left, it has spent one more turn out, and runs out of fuel (`OutOfFuel`) when
 *   that reaches its range.
 */
const checkFuelAfterMove = (ruleRegistry, unitImprovementRegistry, range, isAttack) => (unit, action) => {
    var _a;
    if (unit.destroyed()) {
        return;
    }
    const unitRange = range(unit);
    if (!(unitRange > 0)) {
        return;
    }
    const aloft = (0, exports.aloftOf)(unitImprovementRegistry, unit), landed = (0, exports.refuels)(ruleRegistry, unit) &&
        !(unitRange === 1 &&
            unit.moves().value() > 0 &&
            isAttack(unit, action));
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
    const turns = ((_a = aloft === null || aloft === void 0 ? void 0 : aloft.turns()) !== null && _a !== void 0 ? _a : 0) + 1;
    if (turns < unitRange) {
        if (aloft === undefined) {
            unitImprovementRegistry.register(new Aloft_1.default(unit, turns));
            return;
        }
        aloft.setTurns(turns);
        return;
    }
    if (aloft !== undefined) {
        unitImprovementRegistry.unregister(aloft);
    }
    ruleRegistry.process(Rules_1.OutOfFuel, unit);
};
exports.checkFuelAfterMove = checkFuelAfterMove;
/**
 * A ruleset's fuel rules: one that counts the turns each unit with a range spends away from a refuelling point, and an
 *  `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel` rules (see `lib/refuel`), and its
 *  own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * With `countOn: 'turn-end'` (the default) the count is a `TurnEnd` rule (`checkFuel`): it doesn't matter whether a
 *  unit spent its moves. With `'out-of-moves'` it is a `Moved` rule (`checkFuelAfterMove`), as the original counts it.
 */
const fuelRules = ({ ruleRegistry = RuleRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, }, { prefix, range = exports.fuelRange, countOn = 'turn-end', countsAsMove = (unit, action) => action.from() !== action.to(), isAttack = (unit, action) => unit.tile() !== action.to(), } = {}) => {
    const id = (name) => prefix === undefined ? [] : [`${prefix}:${name}`];
    return [
        countOn === 'out-of-moves'
            ? new Moved_1.default(...id('unit/moved/fuel'), new Criterion_1.default(countsAsMove), new Effect_1.default((0, exports.checkFuelAfterMove)(ruleRegistry, unitImprovementRegistry, range, isAttack)))
            : new TurnEnd_1.default(...id('player/turn-end/fuel'), new Effect_1.default((0, exports.checkFuel)(ruleRegistry, unitImprovementRegistry, unitRegistry, range))),
        new Rules_1.OutOfFuel(...id('unit/out-of-fuel/destroy'), new Effect_1.default((unit) => unit.destroy())),
    ];
};
exports.fuelRules = fuelRules;
exports.default = exports.fuelRules;
//# sourceMappingURL=fuelRules.js.map