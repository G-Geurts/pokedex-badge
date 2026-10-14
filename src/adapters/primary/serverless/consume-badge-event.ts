import { ProcessBadgeEventCommand } from '@application/commands/process-badge-event/process-badge-event.command';
import { Logger } from '@aws-lambda-powertools/logger';
import {
    type LevelReachedInputAggregate,
    levelReachedInputSchema
} from '@domain/aggregates/badge.aggregate';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { createSqsBatchHandler, type SqsRecordHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { parseSqsJsonBody } from '@garance-retraite/backend-core/parser/aws';
import { BadgeConsumerModule } from '@infrastructure/ioc/badge-consumer.module';
import type { EventBridgeEvent, SQSRecord } from 'aws-lambda';
import { inject, injectable } from 'inversify';

@injectable()
export class ConsumeBadgeEventsLambda implements SqsRecordHandler {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handleRecord(record: SQSRecord): Promise<void> {
        const ebEvent = JSON.parse(record.body) as EventBridgeEvent<string, unknown>;
        const payload: LevelReachedInputAggregate =
            typeof ebEvent.detail === 'string'
                ? parseSqsJsonBody(ebEvent.detail, levelReachedInputSchema)
                : levelReachedInputSchema.parse(ebEvent.detail);

        await this.commandBus.execute(new ProcessBadgeEventCommand(payload));
    }
}

export const logger = new Logger({ serviceName: ConsumeBadgeEventsLambda.name });
export const handler = createSqsBatchHandler(ConsumeBadgeEventsLambda, [BadgeConsumerModule], logger);
