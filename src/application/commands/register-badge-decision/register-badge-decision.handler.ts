import type { Logger } from '@aws-lambda-powertools/logger';
import { BadgeRepositoryToken, type IBadgeRepository } from '@domain/ports/badge.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';
import { z } from 'zod';

import { RegisterBadgeDecisionCommand } from './register-badge-decision.command';

const registerBadgeDecisionInputSchema = z.object({
    userId: z.string().min(1),
    badgeId: z.string().min(1),
    taskToken: z.string().min(1)
});

@CommandHandler(RegisterBadgeDecisionCommand)
export class RegisterBadgeDecisionHandler implements ICommandHandler<RegisterBadgeDecisionCommand, void> {
    public constructor(
        @inject(BadgeRepositoryToken)
        private readonly badgeRepository: IBadgeRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: RegisterBadgeDecisionCommand): Promise<void> {
        const input = registerBadgeDecisionInputSchema.parse(command);

        await this.badgeRepository.saveTaskToken(input.userId, input.badgeId, input.taskToken);
        this.logger.info(`Successfully saved taskToken for user [${input.userId}] and badge [${input.badgeId}].`);
    }
}
