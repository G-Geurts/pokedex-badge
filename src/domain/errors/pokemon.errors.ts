import { NotFoundError } from '@garance-retraite/backend-core/errors';

export class PokemonNotFoundError extends NotFoundError {
    readonly code = 'POKEMON_NOT_FOUND';
}
