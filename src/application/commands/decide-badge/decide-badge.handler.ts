import type { Logger } from '@aws-lambda-powertools/logger';
import { BadgeNotFoundError, BadgeNotPendingError } from '@domain/errors/badge.errors';
import { BadgeRepositoryToken, type IBadgeRepository } from '@domain/ports/badge.repository.port';
import { WorkflowResumerToken, type IWorkflowResumer } from '@domain/ports/workflow-resumer.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { DecideBadgeCommand } from './decide-badge.command';

@CommandHandler(DecideBadgeCommand)
export class DecideBadgeHandler implements ICommandHandler<DecideBadgeCommand, void> {
    public constructor(
        @inject(BadgeRepositoryToken)
        private readonly badgeRepository: IBadgeRepository,
        @inject(WorkflowResumerToken)
        private readonly workflowResumer: IWorkflowResumer,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: DecideBadgeCommand): Promise<void> {
        const badge = await this.badgeRepository.getBadge(command.userId, command.badgeId);
        if (!badge) {
            throw new BadgeNotFoundError(`Badge [${command.badgeId}] not found for user [${command.userId}].`);
        }

        if (badge.status !== 'PENDING' || !badge.taskToken) {
            throw new BadgeNotPendingError(`Badge [${command.badgeId}] is not pending decision or taskToken is missing.`);
        }

        await this.workflowResumer.sendDecisionSuccess(badge.taskToken, {
            decision: command.decision,
            reason: command.reason
        });

        this.logger.info(
            `Sent decision [${command.decision}] for badge [${command.badgeId}] and user [${command.userId}].`
        );
    }
}
