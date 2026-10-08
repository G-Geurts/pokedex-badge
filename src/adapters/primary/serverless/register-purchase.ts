import { RegisterPurchaseCommand } from '@application/commands/register-purchase/register-purchase.command';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { newPurchaseSchema, PurchaseAggregate, purchaseSchema } from '@domain/aggregates/purchase.aggregate';
import { UserIdMissingError } from '@domain/errors/user.errors';
import { CommandBusToken, type ICommandBus } from '@garance-retraite/backend-core/cqs';
import { RequestValidationError } from '@garance-retraite/backend-core/errors';
import { apiEndpoint, cors, createLambdaHandler } from '@garance-retraite/backend-core/handlers/lambda';
import { errorResponseSchema } from '@garance-retraite/backend-core/http/error-response-schema';
import { type APIGatewayProxyResponse, HttpResponse } from '@garance-retraite/backend-core/http/response';
import { CustomApiGatewayEnvelope } from '@garance-retraite/backend-core/parser/aws';
import { PurchaseWriteModule } from '@infrastructure/ioc/purchase-write.module';
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
        201: { description: 'Purchase registered', schema: purchaseSchema },
        422: { description: 'Validation error', schema: errorResponseSchema }
    }
})
export class RegisterPurchaseLambda implements LambdaInterface {
    public constructor(
        @inject(CommandBusToken)
        private readonly commandBus: ICommandBus
    ) {}

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResponse<PurchaseAggregate>> {
        const parsed = CustomApiGatewayEnvelope.safeParse(event, newPurchaseSchema);
        if (!parsed.success) {
            throw new RequestValidationError('Invalid purchase payload', { cause: parsed.error.message });
        }
        const userId: string | undefined = event.pathParameters?.userId;
        if (!userId) {
            throw new UserIdMissingError('UserId parameter is mandatory');
        }
        const purchase: PurchaseAggregate = await this.commandBus.execute<PurchaseAggregate>(
            new RegisterPurchaseCommand(userId, parsed.data)
        );
        return HttpResponse.created(purchase);
    }
}

export const handler: Handler = createLambdaHandler(RegisterPurchaseLambda, [PurchaseWriteModule], logger);
