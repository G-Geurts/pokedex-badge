import type { Logger } from '@aws-lambda-powertools/logger';
import {
    LevelReachedInputAggregate,
    levelReachedInputSchema,
    UserBadgeRecord,
    userBadgeRecordSchema
} from '@domain/aggregates/badge.aggregate';
import { BadgeRepositoryToken, type IBadgeRepository } from '@domain/ports/badge.repository.port';
import { type IWorkflowStarter,WorkflowStarterToken } from '@domain/ports/workflow-starter.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { ProcessBadgeEventCommand } from './process-badge-event.command';

@CommandHandler(ProcessBadgeEventCommand)
export class ProcessBadgeEventHandler implements ICommandHandler<ProcessBadgeEventCommand, void> {
    public constructor(
        @inject(BadgeRepositoryToken)
        private readonly badgeRepository: IBadgeRepository,
        @inject(WorkflowStarterToken)
        private readonly workflowStarter: IWorkflowStarter,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: ProcessBadgeEventCommand): Promise<void> {
        const input: LevelReachedInputAggregate = levelReachedInputSchema.parse(command.payload);

        const badgeId = `LEVEL_${String(input.level)}`;
        const rawUserId = input.userId.replace(/^USR#/, '');

        const badgeRecord: UserBadgeRecord = userBadgeRecordSchema.parse({
            pk: `USER#${rawUserId}`,
            sk: `BADGE#${badgeId}`,
            userId: rawUserId,
            badgeId,
            level: input.level,
            status: 'PENDING',
            updatedAt: typeof input.reachedAt === 'number' ? input.reachedAt : new Date(input.reachedAt).getTime()
        });

        const created = await this.badgeRepository.createPendingBadgeIfNotExist(badgeRecord);
        if (!created) {
            this.logger.info(`Badge [${badgeId}] already exists for user [${rawUserId}], skipping.`);
            return;
        }

        await this.workflowStarter.startBadgeApprovalWorkflow(rawUserId, badgeId);
        this.logger.info(`Started approval workflow for user [${rawUserId}] and badge [${badgeId}].`);
    }
}
