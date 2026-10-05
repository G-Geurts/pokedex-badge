import { GetPokemonQuery } from '@application/queries/get-pokemon/get-pokemon.query';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { type IQueryBus, QueryBusToken } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { errorResponseSchema } from '@garance-retraite/backend-core/http/error-response-schema';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { createApiGatewayEventSchema } from '@garance-retraite/backend-core/parser/aws';
import { PokemonReadModule } from '@infrastructure/ioc/pokemon-read.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';
import { z } from 'zod';

export const logger = new Logger({ serviceName: 'GetPokemonLambda' });

const pathParametersSchema = z.object({ id: z.string().min(1) });

// Compose a typed event schema from the shared API Gateway base via @garance-retraite/backend-core/parser/aws.
const getPokemonEventSchema = createApiGatewayEventSchema({ pathParameters: pathParametersSchema });

// @cors au-dessus d'@apiEndpoint : l'API Gateway ne répond qu'au preflight OPTIONS, la réponse réelle
// (succès ou erreur) doit porter Access-Control-Allow-Origin elle-même.
@cors()
@apiEndpoint({
    summary: 'Get a pokemon by id',
    description: 'Retrieves a single pokemon by its unique identifier',
    tags: ['Pokemon'],
    request: { params: pathParametersSchema },
    responses: {
        200: { description: 'Pokemon found', schema: pokemonSchema },
        404: { description: 'Pokemon not found', schema: errorResponseSchema },
        422: { description: 'Validation error', schema: errorResponseSchema }
    }
})
export class GetPokemonLambda implements LambdaInterface {
    public constructor(
        @inject(QueryBusToken)
        private readonly queryBus: IQueryBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<PokemonAggregate>> {
        const parsed = getPokemonEventSchema.safeParse(event);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid request', { issues: parsed.error.issues });
        }
        const pokemon = await this.queryBus.execute<PokemonAggregate>(
            new GetPokemonQuery(parsed.data.pathParameters.id)
        );
        return HttpResponse.ok(pokemon);
    }
}

export const handler: Handler = createLambdaHandler(GetPokemonLambda, [PokemonReadModule], logger);
