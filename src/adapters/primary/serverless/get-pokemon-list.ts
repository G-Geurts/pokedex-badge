import { GetPokemonListQuery } from '@application/queries/get-pokemon/get-pokemon-list.query';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { type IQueryBus, QueryBusToken } from '@garance-retraite/backend-core/cqs';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { PokemonReadModule } from '@infrastructure/ioc/pokemon-read.module';
import type { Handler } from 'aws-lambda';
import { inject } from 'inversify';

@cors()
@apiEndpoint({
    summary: 'Get Pokemon list',
    description: 'Retrieves Pokemon lists',
    tags: ['Pokemon'],
    responses: {
        200: { description: 'Pokemon list', schema: pokemonSchema }
    }
})
export class GetPokemonListLambda implements LambdaInterface {
    public constructor(
        @inject(QueryBusToken)
        private readonly queryBus: IQueryBus
    ) {}

    public async handler(): Promise<APIGatewayProxyResponse<PokemonAggregate[]>> {
        const pokemon: PokemonAggregate[] = await this.queryBus.execute<PokemonAggregate[]>(new GetPokemonListQuery());
        return HttpResponse.ok(pokemon);
    }
}
export const logger = new Logger({ serviceName: GetPokemonListLambda.name });
export const handler: Handler = createLambdaHandler(GetPokemonListLambda, [PokemonReadModule], logger);
