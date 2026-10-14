import { DecideBadgeCommand } from '@application/commands/decide-badge/decide-badge.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { createApiGatewayEventSchema } from '@garance-retraite/backend-core/parser/aws';
import { BadgeDecisionModule } from '@infrastructure/ioc/badge-decision.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';
import { z } from 'zod';

const pathParametersSchema = z.object({
    userId: z.string().min(1),
    badgeId: z.string().min(1)
});

const bodySchema = z.object({
    decision: z.enum(['GRANTED', 'REFUSED']),
    reason: z.string().optional()
});

const postDecisionEventSchema = createApiGatewayEventSchema({
    pathParameters: pathParametersSchema,
    body: bodySchema
});

@cors()
@apiEndpoint({
    summary: 'Submit badge decision',
    description: 'Approves or refuses a pending badge for a given user',
    tags: ['Badges'],
    responses: {
        200: { description: 'Decision processed' }
    }
})
export class PostUserBadgeDecisionLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<{ message: string }>> {
        const parsed = postDecisionEventSchema.safeParse(event);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid request payload', { issues: parsed.error.issues });
        }

        const { pathParameters, body } = parsed.data;

        await this.commandBus.execute(
            new DecideBadgeCommand(pathParameters.userId, pathParameters.badgeId, body.decision, body.reason)
        );

        return HttpResponse.ok({ message: 'Decision submitted successfully' });
    }
}

export const logger = new Logger({ serviceName: PostUserBadgeDecisionLambda.name });
export const handler: Handler = createLambdaHandler(PostUserBadgeDecisionLambda, [BadgeDecisionModule], logger);
