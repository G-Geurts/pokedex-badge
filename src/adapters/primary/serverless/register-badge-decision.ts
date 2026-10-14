import { RegisterBadgeDecisionCommand } from '@application/commands/register-badge-decision/register-badge-decision.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { RegisterBadgeDecisionModule } from '@infrastructure/ioc/register-badge-decision.module';
import type { Context, Handler } from 'aws-lambda';
import { inject, injectable } from 'inversify';

export interface StepFunctionTaskTokenEvent {
    userId: string;
    badgeId: string;
    taskToken: string;
}

@injectable()
export class RegisterBadgeDecisionLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: StepFunctionTaskTokenEvent, _context: Context): Promise<void> {
        await this.commandBus.execute(
            new RegisterBadgeDecisionCommand(event.userId, event.badgeId, event.taskToken)
        );
    }
}

export const logger = new Logger({ serviceName: RegisterBadgeDecisionLambda.name });
export const handler: Handler = createLambdaHandler(
    RegisterBadgeDecisionLambda,
    [RegisterBadgeDecisionModule],
    logger
);
