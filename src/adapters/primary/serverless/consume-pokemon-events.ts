import { CreatePokemonCommand } from '@application/commands/create-pokemon/create-pokemon.command';
import { Logger } from '@aws-lambda-powertools/logger';
import { newPokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { createSqsBatchHandler, type SqsRecordHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { parseSqsJsonBody } from '@garance-retraite/backend-core/parser/aws';
import { PokemonWriteModule } from '@infrastructure/ioc/pokemon-write.module';
import type { SQSRecord } from 'aws-lambda';
import { inject, injectable } from 'inversify';

export const logger = new Logger({ serviceName: 'ConsumePokemonEventsLambda' });

@injectable()
export class ConsumePokemonEventsLambda implements SqsRecordHandler {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handleRecord(record: SQSRecord): Promise<void> {
        const payload = parseSqsJsonBody(record.body, newPokemonSchema);
        await this.commandBus.execute(new CreatePokemonCommand(payload));
    }
}

export const handler = createSqsBatchHandler(ConsumePokemonEventsLambda, [PokemonWriteModule], logger);
