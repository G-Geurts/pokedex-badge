import { GetUserLevelQuery } from '@application/queries/get-user/get-user-level.query';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { UserLevelAggregate, userLevelSchema } from '@domain/aggregates/user.aggregate';
import { type IQueryBus, QueryBusToken } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { createApiGatewayEventSchema } from '@garance-retraite/backend-core/parser/aws';
import { UserLevelReadModule } from '@infrastructure/ioc/user-level-read.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';
import { z } from 'zod';

const pathParametersSchema = z.object({ userId: z.string().min(1) });

const getUserLevelSchema = createApiGatewayEventSchema({ pathParameters: pathParametersSchema });


@cors()
@apiEndpoint({
    summary: 'Get Users level',
    description: 'Retrieves Users level',
    tags: ['Users'],
    responses: {
        200: { description: 'Users level', schema: userLevelSchema }
    }
})
export class GetUsersLevelLambda implements LambdaInterface {
    public constructor(
        @inject(QueryBusToken)
        private readonly queryBus: IQueryBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<UserLevelAggregate>> {
        const parsed = getUserLevelSchema.safeParse(event);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid request', { issues: parsed.error.issues });
        }
        const pokemon = await this.queryBus.execute<UserLevelAggregate>(
            new GetUserLevelQuery(parsed.data.pathParameters.userId)
        );
        return HttpResponse.ok(pokemon);
    }
}

export const logger = new Logger({ serviceName: GetUsersLevelLambda.name });
export const handler: Handler = createLambdaHandler(GetUsersLevelLambda, [UserLevelReadModule], logger);
