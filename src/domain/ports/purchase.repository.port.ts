import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

export interface IPurchaseRepository {
    save: (purchase: PokemonAggregate) => Promise<void>;
}

export const PokemonRepositoryToken = Symbol.for('PokemonRepository');
