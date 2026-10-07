import { randomUUID } from 'node:crypto';

import type { Logger } from '@aws-lambda-powertools/logger';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { RegisterPurchaseCommand } from './register-purchase.command';

@CommandHandler(RegisterPurchaseCommand)
export class RegisterPurchaseHandler implements ICommandHandler<RegisterPurchaseCommand, PokemonAggregate> {
    public constructor(
        @inject(PokemonRepositoryToken)
        private readonly repository: IPokemonRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: RegisterPurchaseCommand): Promise<PokemonAggregate> {
        const now = Date.now();
        const uuid = randomUUID();
        const pokemon = pokemonSchema.parse({
            ...command.purchase,
            sk: `PURCHASE#${uuid}`,
            id: uuid,
            createdAt: now,
            updatedAt: now
        });
        this.logger.info('Creating purchase', { id: pokemon.id, name: pokemon.name });
        await this.repository.save(pokemon);
        return pokemon;
    }
}
