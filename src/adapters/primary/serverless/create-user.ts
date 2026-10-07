import { CreateUserCommand } from '@application/commands/create-user/create-user.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { newUserSchema, UserAggregate, userSchema } from '@domain/aggregates/user.aggregate';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { errorResponseSchema } from '@garance-retraite/backend-core/http/error-response-schema';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { CustomApiGatewayEnvelope } from '@garance-retraite/backend-core/parser/aws';
import { UserWriteModule } from '@infrastructure/ioc/user-write.module';
import type { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { inject } from 'inversify';

@cors()
@apiEndpoint({
    summary: 'Create a user',
    description: 'Creates a new user with the provided data',
    tags: ['Pokemon'],
    request: { body: { schema: newUserSchema } },
    responses: {
        201: { description: 'User created', schema: userSchema },
        422: { description: 'Validation error', schema: errorResponseSchema }
    }
})
export class CreateUserLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<UserAggregate>> {
        const parsed = CustomApiGatewayEnvelope.safeParse(event, newUserSchema);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid user payload', { cause: parsed.error.message });
        }
        const user = await this.commandBus.execute<UserAggregate>(new CreateUserCommand(parsed.data));
        return HttpResponse.created(user);
    }
}
export const logger = new Logger({ serviceName: CreateUserLambda.name });

export const handler: Handler = createLambdaHandler(CreateUserLambda, [UserWriteModule], logger);
