import Aloft from '../lib/Aloft';
import { Game } from '@civ-clone/core-game/Game';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import { gameForLoad } from '@civ-clone/core-save-game/gameForLoad';
import { hydrate } from '@civ-clone/core-save-game/hydrate';
import { registerClasses } from '@civ-clone/core-save-game/registerClasses';
import { save } from '@civ-clone/core-save-game/save';

class Flyer extends Unit {}

describe('saving `Aloft`', (): void => {
  it('should round-trip the count through core-save-game, once the game offers the class', (): void => {
    const game = new Game(),
      player = new Player(game.rules),
      out = new Flyer(null, player, null as unknown as Tile, game.rules),
      home = new Flyer(null, player, null as unknown as Tile, game.rules);

    game.engine.registerPlugins({ '@civ-clone/base-unit-fuel': 'test' });
    // What a ruleset does: offer the class, as it offers `Veteran`.
    game.availableUnitImprovements.register(Aloft);
    registerClasses(game);
    game.classes.register(Flyer);
    game.units.register(out, home);
    game.unitImprovements.register(new Aloft(out, 2));

    const file = save(game, { name: 'test', createdAt: 0 }),
      loaded = gameForLoad({
        availableUnitImprovements: game.availableUnitImprovements,
        classes: game.classes,
        engine: game.engine,
        rules: game.rules,
      });

    hydrate(file, loaded);

    const [loadedOut, loadedHome] = loaded.units.entries(),
      [aloft] = loaded.unitImprovements.getByUnit(loadedOut) as Aloft[];

    expect(aloft).to.be.instanceOf(Aloft);
    expect(aloft.turns()).to.equal(2);
    expect(aloft.unit()).to.equal(loadedOut);
    expect(loaded.unitImprovements.getByUnit(loadedHome)).to.deep.equal([]);
    // Saved again, the entities are the same (the id counters move with each new `Game`).
    expect(
      JSON.stringify(save(loaded, { name: 'test', createdAt: 0 }).entities)
    ).to.equal(JSON.stringify(file.entities));
    expect(
      file.entities.find(({ id }) => id === aloft.id())!.state
    ).to.have.property('_turns', 2);
  });
});
