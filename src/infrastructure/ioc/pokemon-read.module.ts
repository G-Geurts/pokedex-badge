import { GetPokemonHandler } from '@application/queries/get-pokemon/get-pokemon.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { ContainerModule } from 'inversify';

import { bindPokemonPersistence } from './pokemon-persistence';

// Module IoC pour Lambdas en lecture (queries). À utiliser dans les handlers GET.
// Ne charge ni les commands ni leurs schémas zod — économise ~100-200 ms de cold-start
// vs un module unifié qui binderait aussi les CommandHandlers (cf. bisection cold-start).
export const PokemonReadModule = new ContainerModule(options => {
    bindPokemonPersistence(options);

    configureCqs(options.bind.bind(options), [GetPokemonHandler]);
});
