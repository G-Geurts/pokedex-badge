import { GetCommand, GetCommandOutput, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
    UserLevelAggregate,
    userLevelSchema,
    UserPurchaseAggregate,
    userPurchaseSchema
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
    public async getUserLevel(userId: string): Promise<UserLevelAggregate | undefined> {

        userId = userId.startsWith('USR#') ? userId : `USR#${userId}`;

        const cmd: GetCommand = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: userId,
                sk: `LEVEL`
            }
        });
        const output: GetCommandOutput = await this.client.send(cmd);
        return !output.Item ? undefined : userLevelSchema.parse(output.Item);
    }

    public async getPurchase(userId: string, purchaseId: string): Promise<UserPurchaseAggregate | undefined> {
        const cmd: GetCommand = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: userId,
                sk: `PURCHASE#${purchaseId}`,
            }
        });
        const output: GetCommandOutput = await this.client.send(cmd);
        return !output.Item ? undefined : userPurchaseSchema.parse(output.Item);
    }

    public async save(input: UserPurchaseAggregate | UserLevelAggregate): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: input
            })
        );
    }
}
