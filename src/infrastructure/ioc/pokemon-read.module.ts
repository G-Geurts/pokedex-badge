import { GetPokemonListHandler } from '@application/queries/get-pokemon/get-pokemon-list.handler';
import { GetUserListHandler } from '@application/queries/get-user/get-user-list.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { ContainerModule } from 'inversify';

import { bindPokemonPersistence } from './pokemon-persistence';

export const PokemonReadModule = new ContainerModule(options => {
    bindPokemonPersistence(options);
    configureCqs(options.bind.bind(options), [GetPokemonListHandler, GetUserListHandler]);
});
