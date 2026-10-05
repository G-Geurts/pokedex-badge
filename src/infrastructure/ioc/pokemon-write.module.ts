import { CreatePokemonHandler } from '@application/commands/create-pokemon/create-pokemon.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { ContainerModule } from 'inversify';

import { bindPokemonPersistence } from './pokemon-persistence';

// Module IoC pour Lambdas en écriture (commands). À utiliser dans les handlers POST/PUT/DELETE.
// Ne charge ni les queries ni leurs schémas zod — économise ~100-200 ms de cold-start
// vs un module unifié qui binderait aussi les QueryHandlers (cf. bisection cold-start).
export const PokemonWriteModule = new ContainerModule(options => {
    bindPokemonPersistence(options);

    configureCqs(options.bind.bind(options), [CreatePokemonHandler]);
});
