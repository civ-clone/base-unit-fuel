"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aloft = void 0;
const UnitImprovement_1 = require("@civ-clone/core-unit-improvement/UnitImprovement");
/**
 * How many of its player's turns a fuelled unit has ended away from somewhere it refuels. Only a unit that is out has
 *  one, and it goes when the unit refuels, so a unit at its base carries and saves nothing extra. A game that saves
 *  needs it in its `AvailableUnitImprovementRegistry`.
 */
class Aloft extends UnitImprovement_1.default {
    constructor(unit, turns = 1) {
        super(unit);
        this._turns = turns;
        this.addKey('turns');
    }
    turns() {
        return this._turns;
    }
    setTurns(turns) {
        this._turns = turns;
    }
}
exports.Aloft = Aloft;
exports.default = Aloft;
//# sourceMappingURL=Aloft.js.map