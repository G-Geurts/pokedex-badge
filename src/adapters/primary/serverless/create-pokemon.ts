import { CreatePokemonCommand } from '@application/commands/create-pokemon/create-pokemon.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { newPokemonSchema, type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
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

// @cors au-dessus d'@apiEndpoint : l'API Gateway ne répond qu'au preflight OPTIONS, la réponse réelle
// (succès ou erreur) doit porter Access-Control-Allow-Origin elle-même.
@cors()
@apiEndpoint({
    summary: 'Create a pokemon',
    description: 'Creates a new pokemon with the provided data',
    tags: ['Pokemon'],
    request: { body: { schema: newPokemonSchema } },
    responses: {
        201: { description: 'Pokemon created', schema: pokemonSchema },
        422: { description: 'Validation error', schema: errorResponseSchema }
    }
})
export class CreatePokemonLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<PokemonAggregate>> {
        // CustomApiGatewayEnvelope from backend-core unwraps + JSON-parses event.body in one pass.
        const parsed = CustomApiGatewayEnvelope.safeParse(event, newPokemonSchema);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid pokemon payload', { cause: parsed.error.message });
        }
        const pokemon = await this.commandBus.execute<PokemonAggregate>(new CreatePokemonCommand(parsed.data));
        return HttpResponse.created(pokemon);
    }
}

export const handler: Handler = createLambdaHandler(CreatePokemonLambda, [PokemonWriteModule], logger);
