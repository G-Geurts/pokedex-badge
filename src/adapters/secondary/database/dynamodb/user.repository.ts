import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
    toUserLevelAggregate,
    UserLevelAggregate,
    userLevelRecordSchema,
    UserPurchaseAggregate
} from '@domain/aggregates/user.aggregate';
import { IUserLevelRepository } from '@domain/ports/user.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBUserRepository implements IUserLevelRepository {
    protected readonly tableName: string;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    private normalizeUserId(userId: string): string {
        return userId.startsWith('USR#') ? userId : `USR#${userId}`;
    }

    public async getUserLevel(userId: string): Promise<UserLevelAggregate | undefined> {
        const pk = this.normalizeUserId(userId);
        const cmd = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk,
                sk: 'LEVEL'
            }
        });
        const output = await this.client.send(cmd);
        if (!output.Item) {
            return undefined;
        }

        const record = userLevelRecordSchema.parse(output.Item);
        return toUserLevelAggregate(record);
    }

    public async savePurchaseIfNotExist(purchase: UserPurchaseAggregate): Promise<boolean> {
        try {
            await this.client.send(
                new PutCommand({
                    TableName: this.tableName,
                    Item: {
                        ...purchase,
                        pk: this.normalizeUserId(purchase.pk)
                    },
                    ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
                })
            );
            return true;
        } catch (error: unknown) {
            if (error instanceof ConditionalCheckFailedException) {
                return false;
            }
            throw error;
        }
    }

    public async incrementUserPoints(
        userId: string,
        pointsToAdd: number,
        updatedAt: number
    ): Promise<UserLevelAggregate> {
        const pk = this.normalizeUserId(userId);

        const updateCmd = new UpdateCommand({
            TableName: this.tableName,
            Key: {
                pk,
                sk: 'LEVEL'
            },
            UpdateExpression: 'SET #point = if_not_exists(#point, :zero) + :incr, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#point': 'point',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: {
                ':zero': 0,
                ':incr': pointsToAdd,
                ':updatedAt': updatedAt
            },
            ReturnValues: 'ALL_NEW'
        });

        const result = await this.client.send(updateCmd);
        const record = userLevelRecordSchema.parse(result.Attributes);

        return toUserLevelAggregate(record);
    }
}
