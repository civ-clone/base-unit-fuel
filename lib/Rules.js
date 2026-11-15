"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutOfFuel = exports.Refuel = void 0;
const Rule_1 = require("@civ-clone/core-rule/Rule");
/**
 * Whether `unit` refuels on `tile`: it does if any rule's criteria match and its effect returns `true`. A game says
 *  where with its criteria (see `refuelInOwnCity`, `refuelOnTileImprovement`, `refuelInStackWith`, `refuelAboard`).
 */
class Refuel extends Rule_1.default {
}
exports.Refuel = Refuel;
/** `unit` ran out of fuel away from anywhere it refuels. `fuelRules` adds one that destroys it. */
class OutOfFuel extends Rule_1.default {
}
exports.OutOfFuel = OutOfFuel;
//# sourceMappingURL=Rules.js.map