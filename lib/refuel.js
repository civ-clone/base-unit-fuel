"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refuelAboard = exports.refuelInStackWith = exports.refuelOnTileImprovement = exports.refuelInOwnCity = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Rules_1 = require("./Rules");
const refuel = (id, applies, where) => new Rules_1.Refuel(...(id === undefined ? [] : [id]), new Criterion_1.default((unit) => applies(unit)), new Criterion_1.default(where), new Effect_1.default(() => true));
const all = () => true;
/** A `Refuel` rule: in one of the unit's player's own cities. */
const refuelInOwnCity = (cityRegistry = CityRegistry_1.instance, applies = all, id) => refuel(id, applies, (unit, tile) => { var _a; return ((_a = cityRegistry.getByTile(tile)) === null || _a === void 0 ? void 0 : _a.player()) === unit.player(); });
exports.refuelInOwnCity = refuelInOwnCity;
/** A `Refuel` rule: on a square with an `Improvement` (an airfield, say). */
const refuelOnTileImprovement = (Improvement, tileImprovementRegistry = TileImprovementRegistry_1.instance, applies = all, id) => refuel(id, applies, (unit, tile) => tileImprovementRegistry
    .getByTile(tile)
    .some((tileImprovement) => tileImprovement instanceof Improvement));
exports.refuelOnTileImprovement = refuelOnTileImprovement;
/**
 * A `Refuel` rule: on a square with another of the player's units that `isBase` says the unit can refuel on (one that
 *  carries it, say).
 */
const refuelInStackWith = (isBase, unitRegistry = UnitRegistry_1.instance, applies = all, id) => refuel(id, applies, (unit, tile) => unitRegistry
    .getByTile(tile)
    .some((base) => base !== unit &&
    !base.destroyed() &&
    base.player() === unit.player() &&
    isBase(base, unit)));
exports.refuelInStackWith = refuelInStackWith;
/** A `Refuel` rule: aboard a transport. */
const refuelAboard = (transportRegistry = TransportRegistry_1.instance, applies = all, id) => refuel(id, applies, (unit) => transportRegistry.hasUnit(unit));
exports.refuelAboard = refuelAboard;
//# sourceMappingURL=refuel.js.map