"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelRules = exports.checkFuel = exports.refuels = exports.turnsAloft = exports.aloftOf = exports.fuelRange = void 0;
const Rules_1 = require("./Rules");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Aloft_1 = require("./Aloft");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fuel_1 = require("./Fuel");
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
 * A ruleset's fuel rules: a `TurnEnd` rule that counts the turns each unit with a range ends away from a refuelling
 *  point (see `checkFuel`), and an `OutOfFuel` rule that destroys a unit that runs out. A game adds its own `Refuel`
 *  rules (see `refuel`), and its own `OutOfFuel` rules for anything else that should happen (a notice, say).
 *
 * Fuel is counted at the end of each turn, so it doesn't matter whether a unit spent its moves.
 */
const fuelRules = ({ ruleRegistry = RuleRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, }, { prefix, range = exports.fuelRange } = {}) => {
    const id = (name) => prefix === undefined ? [] : [`${prefix}:${name}`];
    return [
        new TurnEnd_1.default(...id('player/turn-end/fuel'), new Effect_1.default((0, exports.checkFuel)(ruleRegistry, unitImprovementRegistry, unitRegistry, range))),
        new Rules_1.OutOfFuel(...id('unit/out-of-fuel/destroy'), new Effect_1.default((unit) => unit.destroy())),
    ];
};
exports.fuelRules = fuelRules;
exports.default = exports.fuelRules;
//# sourceMappingURL=fuelRules.js.map