import { GetUserListQuery } from '@application/queries/get-user/get-user-list.query';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { UserAggregate } from '@domain/aggregates/user.aggregate';
import { type IQueryBus, QueryBusToken } from '@garance-retraite/backend-core/cqs';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { UserReadModule } from '@infrastructure/ioc/user-read.module';
import type { Handler } from 'aws-lambda';
import { inject } from 'inversify';

@cors()
@apiEndpoint({
    summary: 'Get Users list',
    description: 'Retrieves Users lists',
    tags: ['Users'],
    responses: {
        200: { description: 'Users list', schema: pokemonSchema }
    }
})
export class GetUsersListLambda implements LambdaInterface {
    public constructor(
        @inject(QueryBusToken)
        private readonly queryBus: IQueryBus
    ) {}

    public async handler(): Promise<APIGatewayProxyResponse<UserAggregate[]>> {
        const users: UserAggregate[] = await this.queryBus.execute<UserAggregate[]>(new GetUserListQuery());
        return HttpResponse.ok(users);
    }
}

export const logger = new Logger({ serviceName: GetUsersListLambda.name });
export const handler: Handler = createLambdaHandler(GetUsersListLambda, [UserReadModule], logger);
