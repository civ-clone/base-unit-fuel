import { OutOfFuel, Refuel } from '../lib/Rules';
import fuelRules, { refuels, turnsAloft } from '../lib/fuelRules';
import { fuelState, refuelInReach } from '../lib/reach';
import {
  refuelAboard,
  refuelInOwnCity,
  refuelInStackWith,
  refuelOnTileImprovement,
} from '../lib/refuel';
import Aloft from '../lib/Aloft';
import City from '@civ-clone/core-city/City';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Criterion from '@civ-clone/core-rule/Criterion';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Fuel from '../lib/Fuel';
import Generator from '@civ-clone/core-world-generator/Generator';
import { Movement } from '@civ-clone/core-unit/Yields';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TransportManifest from '@civ-clone/core-unit-transport/TransportManifest';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import TurnEnd from '@civ-clone/core-player/Rules/TurnEnd';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import World from '@civ-clone/core-world/World';
import { Yield as YieldRule } from '@civ-clone/core-unit/Rules/Yield';
import YieldValue from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';

// OpenCiv2 (github.com/richardpenman/civ2, read at 49f26ec), `unit_move_dir_air_fuel`: a unit refuels in a city, on an
//  airbase or in a stack with a unit that carries it; each time it is left out its count goes up, and it is lost once
//  the count reaches its range. A range of 1 must refuel every turn; 2 can stay out one turn. Counted here at the end
//  of each turn, as civ1-unit's fuel rule counts it.

class Airfield extends TileImprovement {}

const setUp = () => {
  const ruleRegistry = new RuleRegistry(),
    unitRegistry = new UnitRegistry(),
    cityRegistry = new CityRegistry(),
    unitImprovementRegistry = new UnitImprovementRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    transportRegistry = new TransportRegistry(),
    world = new World(new Generator(1, 10)),
    tiles = Array.from(
      { length: 10 },
      (_, x: number): Tile => new Tile(x, 0, new Terrain(), world)
    ),
    player = new Player(),
    ranges = new Map<Unit, number>(),
    events: [string, Unit][] = [],
    unit = (
      tile: Tile,
      range: number = 0,
      owner: Player = player,
      movement: number = 10
    ): Unit => {
      const created = new Unit(null, owner, tile, ruleRegistry);

      ranges.set(created, range);
      unitRegistry.register(created);
      created.moves().set(movement);

      return created;
    },
    city = (tile: Tile, owner: Player = player): City => {
      const created = new City(owner, tile, 'City', ruleRegistry);

      cityRegistry.register(created);

      return created;
    };

  ruleRegistry.register(
    new YieldRule(
      new Criterion((unit: Unit): boolean => ranges.has(unit)),
      new Effect((unit: Unit, unitYield: YieldValue): void => {
        if (unitYield instanceof Fuel) {
          unitYield.set(ranges.get(unit)!);
        }

        if (unitYield instanceof Movement) {
          unitYield.set(10);
        }
      })
    ),
    new Destroyed(
      new Effect((destroyed: Unit): void => {
        events.push(['destroyed', destroyed]);
        destroyed.setDestroyed();
      })
    ),
    new OutOfFuel(
      new Effect((lost: Unit): void => {
        events.push(['out-of-fuel', lost]);
      })
    ),
    ...fuelRules(
      { ruleRegistry, unitImprovementRegistry, unitRegistry },
      { prefix: 'test' }
    ),
    refuelInOwnCity(cityRegistry),
    refuelOnTileImprovement(Airfield, tileImprovementRegistry)
  );

  const endTurn = (forPlayer: Player = player): void =>
    ruleRegistry.process(TurnEnd, forPlayer);

  return {
    city,
    endTurn,
    events,
    player,
    ruleRegistry,
    tileImprovementRegistry,
    tiles,
    transportRegistry,
    unit,
    unitImprovementRegistry,
    unitRegistry,
  };
};

describe('fuelRules', (): void => {
  it('should lose a range-1 unit that ends its turn away from a refuelling point', (): void => {
    const { endTurn, events, tiles, unit } = setUp(),
      out = unit(tiles[3], 1);

    endTurn();

    expect(events).to.deep.equal([
      ['out-of-fuel', out],
      ['destroyed', out],
    ]);
  });

  it('should let a range-2 unit stay out one turn, counting it, and lose it at the second', (): void => {
    const { endTurn, events, tiles, unit, unitImprovementRegistry } = setUp(),
      out = unit(tiles[3], 2);

    endTurn();

    expect(events).to.deep.equal([]);
    expect(turnsAloft(unitImprovementRegistry, out)).to.equal(1);

    endTurn();

    expect(events.map(([name]) => name)).to.deep.equal([
      'out-of-fuel',
      'destroyed',
    ]);
    expect(unitImprovementRegistry.getByUnit(out)).to.deep.equal([]);
  });

  it('should refuel in an own city or on the improvement, clearing the count', (): void => {
    const {
        city,
        endTurn,
        events,
        tileImprovementRegistry,
        tiles,
        unit,
        unitImprovementRegistry,
      } = setUp(),
      inCity = unit(tiles[0], 1),
      onAirfield = unit(tiles[3], 2);

    city(tiles[0]);
    endTurn();

    expect(turnsAloft(unitImprovementRegistry, onAirfield)).to.equal(1);

    tileImprovementRegistry.register(new Airfield(tiles[3]));
    endTurn();

    expect(events).to.deep.equal([]);
    expect(turnsAloft(unitImprovementRegistry, inCity)).to.equal(0);
    expect(unitImprovementRegistry.getByUnit(onAirfield)).to.deep.equal([]);
  });

  it("should not refuel in another player's city", (): void => {
    const { city, endTurn, events, tiles, unit } = setUp(),
      out = unit(tiles[0], 1);

    city(tiles[0], new Player());
    endTurn();

    expect(events[0]).to.deep.equal(['out-of-fuel', out]);
  });

  it("should leave units with no range, and other players' units, alone", (): void => {
    const { endTurn, events, tiles, unit, unitImprovementRegistry } = setUp(),
      grounded = unit(tiles[3]),
      foreign = unit(tiles[3], 1, new Player());

    endTurn();

    expect(events).to.deep.equal([]);
    expect(unitImprovementRegistry.getByUnit(grounded)).to.deep.equal([]);
    expect(foreign.destroyed()).to.equal(false);
  });

  it('should keep the count on a saved field of the mark only', (): void => {
    const { endTurn, tiles, unit, unitImprovementRegistry } = setUp(),
      out = unit(tiles[3], 3);

    endTurn();
    endTurn();

    const [aloft] = unitImprovementRegistry.getByUnit(out) as Aloft[];

    expect(aloft).to.be.instanceOf(Aloft);
    expect(aloft.turns()).to.equal(2);
    expect(Object.keys(out)).not.to.include('_turns');
  });

  it('should name its rules with the prefix', (): void => {
    expect(
      fuelRules({}, { prefix: 'test' }).map((rule) => rule.id())
    ).to.deep.equal([
      'test:player/turn-end/fuel',
      'test:unit/out-of-fuel/destroy',
    ]);
  });
});

describe('refuel rules', (): void => {
  it('should refuel in a stack with a base, only for the units it applies to', (): void => {
    const { player, ruleRegistry, tiles, unit, unitRegistry } = setUp(),
      mothership = unit(tiles[5]),
      plane = unit(tiles[5], 1),
      other = unit(tiles[5], 1),
      bases = new Set<Unit>([mothership]);

    ruleRegistry.register(
      refuelInStackWith(
        (base: Unit): boolean => bases.has(base),
        unitRegistry,
        (refuelling: Unit): boolean => refuelling !== other
      )
    );

    expect(refuels(ruleRegistry, plane)).to.equal(true);
    expect(refuels(ruleRegistry, other)).to.equal(false);
    expect(refuels(ruleRegistry, mothership)).to.equal(false);
    expect(player).to.be.instanceOf(Player);
  });

  it('should refuel aboard a transport', (): void => {
    const { ruleRegistry, tiles, transportRegistry, unit } = setUp(),
      transport = unit(tiles[5]),
      plane = unit(tiles[5], 1);

    ruleRegistry.register(refuelAboard(transportRegistry));

    expect(refuels(ruleRegistry, plane)).to.equal(false);

    transportRegistry.register(
      new TransportManifest(transport as any, plane, tiles[5])
    );

    expect(refuels(ruleRegistry, plane)).to.equal(true);
  });

  it('should ignore a rule whose effect does not answer true', (): void => {
    const { ruleRegistry, tiles, unit } = setUp(),
      plane = unit(tiles[5], 1);

    ruleRegistry.register(new Refuel(new Effect((): boolean => false)));

    expect(refuels(ruleRegistry, plane)).to.equal(false);
  });
});

describe('reach', (): void => {
  it('should give the turns left and the moves before the last of them', (): void => {
    const { endTurn, tiles, unit, unitImprovementRegistry } = setUp(),
      out = unit(tiles[3], 2, undefined, 4);

    expect(fuelState(unitImprovementRegistry, out)).to.deep.equal({
      range: 2,
      turnsAloft: 0,
      turnsLeft: 2,
      reach: 14,
    });

    endTurn();

    expect(fuelState(unitImprovementRegistry, out)).to.deep.equal({
      range: 2,
      turnsAloft: 1,
      turnsLeft: 1,
      reach: 4,
    });
    expect(fuelState(unitImprovementRegistry, unit(tiles[3]))).to.equal(null);
  });

  it('should find the nearest refuelling point within reach', (): void => {
    const {
        city,
        endTurn,
        ruleRegistry,
        tiles,
        unit,
        unitImprovementRegistry,
      } = setUp(),
      out = unit(tiles[5], 2, undefined, 2),
      options = {
        distance: (from: Tile, to: Tile): number => Math.abs(from.x() - to.x()),
        candidates: (): Tile[] => tiles,
      };

    city(tiles[0]);
    city(tiles[9]);

    // 2 moves left and 10 more next turn: both cities, 4 and 5 away; the nearer.
    expect(
      refuelInReach(ruleRegistry, unitImprovementRegistry, out, options)
    ).to.equal(tiles[9]);

    endTurn();
    out.moves().set(3);

    // Out a turn already, with 3 moves: neither.
    expect(
      refuelInReach(ruleRegistry, unitImprovementRegistry, out, options)
    ).to.equal(null);

    out.moves().set(4);

    expect(
      refuelInReach(ruleRegistry, unitImprovementRegistry, out, options)
    ).to.equal(tiles[9]);
  });
});
