import { CreatePokemonHandler } from '@application/commands/create-pokemon/create-pokemon.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { ContainerModule } from 'inversify';

import { bindPokemonPersistence } from './pokemon-persistence';

export const PokemonWriteModule = new ContainerModule(options => {
    bindPokemonPersistence(options);
    configureCqs(options.bind.bind(options), [CreatePokemonHandler]);
});
