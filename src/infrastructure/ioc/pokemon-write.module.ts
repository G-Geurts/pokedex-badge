import { CreatePokemonHandler } from '@application/commands/create-pokemon/create-pokemon.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindUserPersistence } from '@infrastructure/ioc/user-persistence';
import { ContainerModule } from 'inversify';

import { bindPokemonPersistence } from './pokemon-persistence';

export const PokemonWriteModule = new ContainerModule(options => {
    bindPokemonPersistence(options);
    bindUserPersistence(options);
    configureCqs(options.bind.bind(options), [CreatePokemonHandler]);
});
