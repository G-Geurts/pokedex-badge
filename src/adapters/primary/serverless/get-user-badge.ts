import { GetUserBadgesQuery } from '@application/queries/get-user-badges/get-user-badges.query';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { UserBadgeRecord, userBadgeRecordSchema } from '@domain/aggregates/badge.aggregate';
import { type IQueryBus,QueryBusToken } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { createApiGatewayEventSchema } from '@garance-retraite/backend-core/parser/aws';
import { BadgeReadModule } from '@infrastructure/ioc/badge-read.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';
import { z } from 'zod';

const pathParametersSchema = z.object({
    userId: z.string().min(1)
});

const getUserBadgesEventSchema = createApiGatewayEventSchema({
    pathParameters: pathParametersSchema
});

@cors()
@apiEndpoint({
    summary: 'Get User Badges',
    description: 'Retrieves all badges associated with a given user',
    tags: ['Badges'],
    responses: {
        200: { description: 'List of user badges', schema: z.array(userBadgeRecordSchema) }
    }
})
export class GetUserBadgeLambda implements LambdaInterface {
    public constructor(
        @inject(QueryBusToken)
        private readonly queryBus: IQueryBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<UserBadgeRecord[]>> {
        const parsed = getUserBadgesEventSchema.safeParse(event);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid request parameters', { issues: parsed.error.issues });
        }

        const badges = await this.queryBus.execute<UserBadgeRecord[]>(
            new GetUserBadgesQuery(parsed.data.pathParameters.userId)
        );

        return HttpResponse.ok(badges);
    }
}

export const logger = new Logger({ serviceName: GetUserBadgeLambda.name });
export const handler: Handler = createLambdaHandler(GetUserBadgeLambda, [BadgeReadModule], logger);
