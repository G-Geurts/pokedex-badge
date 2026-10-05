import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import { PokemonNotFoundError } from '@domain/errors/pokemon.errors';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { type IQueryHandler, QueryHandler } from '@garance-retraite/backend-core/cqs';
import { inject } from 'inversify';

import { GetPokemonQuery } from './get-pokemon.query';

@QueryHandler(GetPokemonQuery)
export class GetPokemonHandler implements IQueryHandler<GetPokemonQuery, PokemonAggregate> {
    public constructor(
        @inject(PokemonRepositoryToken)
        private readonly repository: IPokemonRepository
    ) {}

    public async execute(query: GetPokemonQuery): Promise<PokemonAggregate> {
        const pokemon = await this.repository.findById(query.id);
        if (!pokemon) {
            throw new PokemonNotFoundError(`Pokemon ${query.id} not found`, { id: query.id });
        }
        return pokemon;
    }
}
