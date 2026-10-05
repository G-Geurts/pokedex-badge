import type { NewPokemon } from '@domain/aggregates/pokemon.aggregate';
import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class CreatePokemonCommand implements ICommand {
    public constructor(public readonly pokemon: NewPokemon) {}
}
