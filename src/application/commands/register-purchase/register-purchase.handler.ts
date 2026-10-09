import type { Logger } from '@aws-lambda-powertools/logger';
import {
    UserLevelAggregate,
    userLevelSchema,
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
        let userLevel: UserLevelAggregate | undefined = await this.userLevelRepository.getUserLevel(input.userId);
        let purchase: UserPurchaseAggregate | undefined = undefined;
        if (userLevel) {
            purchase = await this.userLevelRepository.getPurchase(input.userId, input.purchaseId);
        }
        let added = false;
        if (!purchase) {
            purchase = userPurchaseSchema.parse({
                pk: input.userId,
                sk: `PURCHASE#${input.purchaseId}`,
                pokemonId: input.pokemonId,
                occurredAt: input.occurredAt
            });

            await this.userLevelRepository.save(purchase);
            added = true;
        }
        if (added) {
            userLevel = userLevelSchema.parse({
                pk: userLevel?.pk ?? input.userId,
                sk: 'LEVEL',
                level: userLevel?.level ?? 0,
                point: userLevel?.point ?? 0,
                updatedAt: input.occurredAt
            });
            userLevel.point += 10;
            userLevel.level += userLevel.point % 100 == 0 ? 1 : 0;
            await this.userLevelRepository.save(userLevel);

            this.logger.info(`Registered user [${userLevel.pk}] level: ${String(userLevel.level)}`);
        }
        return purchase;
    }
}
