import { RegisterPurchaseCommand } from '@application/commands/register-purchase/register-purchase.command';
import { Logger } from '@aws-lambda-powertools/logger';
import { userPurchaseInputSchema } from '@domain/aggregates/user.aggregate';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { createSqsBatchHandler, type SqsRecordHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { parseSqsJsonBody } from '@garance-retraite/backend-core/parser/aws';
import { UserWriteModule } from '@infrastructure/ioc/user-write.module';
import type { EventBridgeEvent, SQSRecord } from 'aws-lambda';
import { inject, injectable } from 'inversify';

@injectable()
export class ConsumePurchaseEventsLambda implements SqsRecordHandler {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handleRecord(record: SQSRecord): Promise<void> {
        const ebEvent = JSON.parse(record.body) as EventBridgeEvent<string, unknown>;
        const payload =
            typeof ebEvent.detail === 'string'
                ? parseSqsJsonBody(ebEvent.detail, userPurchaseInputSchema)
                : ebEvent.detail;
        await this.commandBus.execute(new RegisterPurchaseCommand(payload));
    }
}
export const logger = new Logger({ serviceName: ConsumePurchaseEventsLambda.name });
export const handler = createSqsBatchHandler(ConsumePurchaseEventsLambda, [UserWriteModule], logger);
