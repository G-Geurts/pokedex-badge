import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { type IQueryHandler, QueryHandler } from '@garance-retraite/backend-core/cqs';
import { inject } from 'inversify';

import { GetPokemonListQuery } from './get-pokemon-list.query';

@QueryHandler(GetPokemonListQuery)
export class GetPokemonListHandler implements IQueryHandler<GetPokemonListQuery, PokemonAggregate[]> {
    public constructor(
        @inject(PokemonRepositoryToken)
        private readonly repository: IPokemonRepository
    ) {}

    public async execute(_query: GetPokemonListQuery): Promise<PokemonAggregate[]> {
        return await this.repository.getPokemonList();
    }
}
