import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

export interface IPokemonRepository {
    getPokemonList: () => Promise<PokemonAggregate[]>;
    save: (pokemon: PokemonAggregate) => Promise<void>;
}

export const PokemonRepositoryToken = Symbol.for('PokemonRepository');
