import { randomUUID } from 'node:crypto';

import type { Logger } from '@aws-lambda-powertools/logger';
import { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import { PurchaseAggregate, purchaseSchema } from '@domain/aggregates/purchase.aggregate';
import { UserAggregate } from '@domain/aggregates/user.aggregate';
import { PokemonNotFoundError } from '@domain/errors/pokemon.errors';
import { UserNotFoundError } from '@domain/errors/user.errors';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { IPurchaseRepository, PurchaseRepositoryToken } from '@domain/ports/purchase.repository.port';
import { IUserRepository, UserRepositoryToken } from '@domain/ports/user.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { RegisterPurchaseCommand } from './register-purchase.command';

@CommandHandler(RegisterPurchaseCommand)
export class RegisterPurchaseHandler implements ICommandHandler<RegisterPurchaseCommand, PurchaseAggregate> {
    public constructor(
        @inject(PokemonRepositoryToken)
        private readonly pokemonRepository: IPokemonRepository,
        @inject(UserRepositoryToken)
        private readonly userRepository: IUserRepository,
        @inject(PurchaseRepositoryToken)
        private readonly purchaseRepository: IPurchaseRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: RegisterPurchaseCommand): Promise<PurchaseAggregate> {
        const user: UserAggregate | undefined = await this.userRepository.getUser(command.userId);
        if (!user) {
            throw new UserNotFoundError('This User Does Not Exist');
        }

        const pokemon: PokemonAggregate | undefined = await this.pokemonRepository.getPokemon(
            command.purchase.pokemonId
        );
        if (!pokemon) {
            throw new PokemonNotFoundError('This Pokemon Does Not Exist');
        }

        const now = Date.now();
        const uuid = randomUUID();
        const purchase = purchaseSchema.parse({
            pk: user.pk,
            sk: `PURCHASE#${pokemon.id}`,
            gsi1pk: pokemon.sk,
            gsi1sk: `PURCHASE#${user.id}`,
            pokemon: pokemon.pk,
            id: uuid,
            createdAt: now,
            updatedAt: now
        });
        this.logger.info('Creating purchase', { user: user.pk, name: pokemon.sk });
        await this.purchaseRepository.save(purchase);
        return purchase;
    }
}
