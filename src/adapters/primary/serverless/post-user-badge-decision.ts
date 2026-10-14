import { DecideBadgeCommand } from '@application/commands/decide-badge/decide-badge.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
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
        const pathParsed = pathParametersSchema.safeParse(event.pathParameters ?? {});
        if (!pathParsed.success) {
            throw new RequestValidationError('Invalid path parameters', { issues: pathParsed.error.issues });
        }

        let rawBody: unknown;
        try {
            rawBody = event.body ? JSON.parse(event.body) : {};
        } catch {
            throw new RequestValidationError('Malformed JSON body', {
                issues: [
                    {
                        code: 'custom',
                        message: 'Request body must be a valid JSON string',
                        path: ['body']
                    }
                ]
            });
        }

        const bodyParsed = bodySchema.safeParse(rawBody);
        if (!bodyParsed.success) {
            throw new RequestValidationError('Invalid request payload', { issues: bodyParsed.error.issues });
        }

        const { userId, badgeId } = pathParsed.data;
        const { decision, reason } = bodyParsed.data;

        await this.commandBus.execute(new DecideBadgeCommand(userId, badgeId, decision, reason));

        return HttpResponse.ok({ message: 'Decision submitted successfully' });
    }
}

export const logger = new Logger({ serviceName: PostUserBadgeDecisionLambda.name });
export const handler: Handler = createLambdaHandler(PostUserBadgeDecisionLambda, [BadgeDecisionModule], logger);
