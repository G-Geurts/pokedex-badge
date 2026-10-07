import { RegisterPurchaseCommand } from '@application/commands/register-purchase/register-purchase.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import { newPurchaseSchema, purchaseSchema } from '@domain/aggregates/purchase.aggregate';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { errorResponseSchema } from '@garance-retraite/backend-core/http/error-response-schema';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { CustomApiGatewayEnvelope } from '@garance-retraite/backend-core/parser/aws';
import { PokemonWriteModule } from '@infrastructure/ioc/pokemon-write.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';

export const logger = new Logger({ serviceName: 'CreatePokemonLambda' });

@cors()
@apiEndpoint({
    summary: 'Register a purchase',
    description: 'Register a pokemon purchase',
    tags: ['Pokemon'],
    request: { body: { schema: newPurchaseSchema } },
    responses: {
        201: { description: 'Pokemon created', schema: purchaseSchema },
        422: { description: 'Validation error', schema: errorResponseSchema }
    }
})
export class CreatePokemonLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<PokemonAggregate>> {
        const parsed = CustomApiGatewayEnvelope.safeParse(event, newPurchaseSchema);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid purchase payload', { cause: parsed.error.message });
        }
        const pokemon = await this.commandBus.execute<PokemonAggregate>(new RegisterPurchaseCommand(parsed.data));
        return HttpResponse.created(pokemon);
    }
}

export const handler: Handler = createLambdaHandler(CreatePokemonLambda, [PokemonWriteModule], logger);
