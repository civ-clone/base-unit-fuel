"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuelInReach = exports.fuelState = void 0;
const fuelRules_1 = require("./fuelRules");
/** Where a fuelled `unit` stands, for a computer player deciding where to send it; `null` for a unit with no range. */
const fuelState = (unitImprovementRegistry, unit, range = fuelRules_1.fuelRange) => {
    const unitRange = range(unit);
    if (!(unitRange > 0)) {
        return null;
    }
    const aloft = (0, fuelRules_1.turnsAloft)(unitImprovementRegistry, unit), turnsLeft = Math.max(0, unitRange - aloft);
    return {
        range: unitRange,
        turnsAloft: aloft,
        turnsLeft,
        reach: turnsLeft === 0
            ? 0
            : unit.moves().value() + unit.movement().value() * (turnsLeft - 1),
    };
};
exports.fuelState = fuelState;
/**
 * The nearest square within `unit`'s reach (see `fuelState`) where it refuels (`Refuel`), its own square first; `null`
 *  if there is none, or the unit has no range. The first of equally near squares.
 */
const refuelInReach = (ruleRegistry, unitImprovementRegistry, unit, { range = fuelRules_1.fuelRange, distance = (from, to) => from.distanceFrom(to), candidates = (candidate, reach) => candidate.tile().getSurroundingArea(Math.floor(reach)).entries(), } = {}) => {
    const state = (0, exports.fuelState)(unitImprovementRegistry, unit, range);
    if (state === null) {
        return null;
    }
    const from = unit.tile();
    if ((0, fuelRules_1.refuels)(ruleRegistry, unit, from)) {
        return from;
    }
    let nearest = null;
    candidates(unit, state.reach).forEach((tile) => {
        const away = distance(from, tile);
        if (away <= state.reach &&
            (nearest === null || away < nearest[1]) &&
            (0, fuelRules_1.refuels)(ruleRegistry, unit, tile)) {
            nearest = [tile, away];
        }
    });
    return nearest === null ? null : nearest[0];
};
exports.refuelInReach = refuelInReach;
//# sourceMappingURL=reach.js.map