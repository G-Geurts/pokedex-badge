import { randomUUID } from 'node:crypto';

import type { Logger } from '@aws-lambda-powertools/logger';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { CreatePokemonCommand } from './create-pokemon.command';

@CommandHandler(CreatePokemonCommand)
export class CreatePokemonHandler implements ICommandHandler<CreatePokemonCommand, PokemonAggregate> {
    public constructor(
        @inject(PokemonRepositoryToken)
        private readonly repository: IPokemonRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: CreatePokemonCommand): Promise<PokemonAggregate> {
        const now = Date.now();
        const uuid = randomUUID();
        const pokemon = pokemonSchema.parse({
            ...command.pokemon,
            pk: 'POKEMON',
            sk: `PKM#${uuid}`,
            id: uuid,
            createdAt: now,
            updatedAt: now
        });
        this.logger.info('Creating pokemon', { id: pokemon.id, name: pokemon.name });
        await this.repository.save(pokemon);
        return pokemon;
    }
}
