import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';

export interface IPokemonRepository {
    findById: (id: string) => Promise<PokemonAggregate | undefined>;
    save: (pokemon: PokemonAggregate) => Promise<void>;
}

/** Jeton d'injection du port : déclaré côté domaine pour que l'application l'injecte sans dépendre de l'infrastructure. */
export const PokemonRepositoryToken = Symbol.for('PokemonRepository');
