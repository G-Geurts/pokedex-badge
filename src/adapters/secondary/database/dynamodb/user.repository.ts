import { QueryCommand, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import { UserAggregate } from '@domain/aggregates/user.aggregate';
import { IUserRepository } from '@domain/ports/user.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBUserRepository implements IUserRepository {
    protected readonly tableName: string;
    protected readonly MAX_SHARD: number = 1;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    public async getUserList(): Promise<PokemonAggregate[]> {
        const queries: Promise<QueryCommandOutput>[] = Array.from({ length: this.MAX_SHARD }).map(
            (_, shardId: number) => {
                const query: QueryCommand = new QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :pk',
                    ExpressionAttributeNames: {
                        ':pk': `PROFILE#${shardId.toString()}`
                    }
                });
                return this.client.send(query);
            }
        );
        const output: QueryCommandOutput[] = await Promise.all(queries);
        const results = output.flatMap((row: QueryCommandOutput) => row.Items ?? []);
        return results.map((pkm): PokemonAggregate => pokemonSchema.parse(pkm));
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
