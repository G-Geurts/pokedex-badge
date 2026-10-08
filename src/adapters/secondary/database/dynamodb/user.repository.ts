import { GetCommand, GetCommandOutput, PutCommand, QueryCommand, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { UserAggregate, userSchema } from '@domain/aggregates/user.aggregate';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBUserRepository implements IUserRepository {
    protected readonly tableName: string;
    private readonly SHARD_COUNT = 2;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    public async getUserList(): Promise<UserAggregate[]> {
        const queries: Promise<QueryCommandOutput>[] = Array.from({ length: this.SHARD_COUNT }).map(
            (_, shardId: number) => {
                const query: QueryCommand = new QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'gsi1',
                    KeyConditionExpression: 'gsi1pk = :pk',
                    ExpressionAttributeValues: {
                        ':pk': `PROFILE#${shardId.toString()}`
                    }
                });
                return this.client.send(query);
            }
        );
        const output: QueryCommandOutput[] = await Promise.all(queries);
        const results = output.flatMap((row: QueryCommandOutput) => row.Items ?? []);
        return results.map((pkm): UserAggregate => userSchema.parse(pkm));
    }

    public async getUser(userId: string): Promise<UserAggregate | undefined> {
        const cmd: GetCommand = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: `USR#${userId}`,
                sk: `PROFILE`
            }
        });
        const output: GetCommandOutput = await this.client.send(cmd);
        return !output.Item ? undefined : userSchema.parse(output.Item);
    }

    public async save(user: UserAggregate): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: { ...user }
            })
        );
    }
}
