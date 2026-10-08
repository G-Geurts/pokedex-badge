import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

export interface IPokemonRepository {
    getPokemonList: () => Promise<PokemonAggregate[]>;
    getPokemon: (pokemonId: string) => Promise<PokemonAggregate | undefined>;
    save: (pokemon: PokemonAggregate) => Promise<void>;
}

export const PokemonRepositoryToken = Symbol.for('PokemonRepository');
