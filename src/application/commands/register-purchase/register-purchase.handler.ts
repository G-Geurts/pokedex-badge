import type { Logger } from '@aws-lambda-powertools/logger';
import {
    UserPurchaseAggregate,
    UserPurchaseInputAggregate,
    userPurchaseInputSchema,
    userPurchaseSchema
} from '@domain/aggregates/user.aggregate';
import { IUserLevelRepository, UserLevelRepositoryToken } from '@domain/ports/user.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { RegisterPurchaseCommand } from './register-purchase.command';

@CommandHandler(RegisterPurchaseCommand)
export class RegisterPurchaseHandler implements ICommandHandler<RegisterPurchaseCommand, UserPurchaseAggregate> {
    public constructor(
        @inject(UserLevelRepositoryToken)
        private readonly userLevelRepository: IUserLevelRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: RegisterPurchaseCommand): Promise<UserPurchaseAggregate> {
        const input: UserPurchaseInputAggregate = userPurchaseInputSchema.parse(command.purchase);

        const purchase = userPurchaseSchema.parse({
            pk: input.userId,
            sk: `PURCHASE#${input.purchaseId}`,
            pokemonId: input.pokemonId,
            occurredAt: input.occurredAt
        });

        const isNewPurchase = await this.userLevelRepository.savePurchaseIfNotExist(purchase);
        if (!isNewPurchase) {
            this.logger.info(`Purchase [${input.purchaseId}] already processed for user [${input.userId}].`);
            return purchase;
        }
        const updatedLevel = await this.userLevelRepository.incrementUserPoints(input.userId, 10, input.occurredAt);

        this.logger.info(
            `Registered user [${updatedLevel.pk}] level: ${String(updatedLevel.level)} (${String(updatedLevel.point)} pts)`
        );

        return purchase;
    }
}
