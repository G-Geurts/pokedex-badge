import { QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import type { IPokemonRepository } from '@domain/ports/pokemon.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBPokemonRepository implements IPokemonRepository {
    protected readonly tableName: string;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    public async getPokemonList(): Promise<PokemonAggregate[]> {
        const queryCommand: QueryCommand = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'POKEMON'
            }
        });
        const output: QueryCommandOutput = await this.client.send(queryCommand);

        return (output.Items ?? []).map((pkm): PokemonAggregate => pokemonSchema.parse(pkm));
    }

    public async save(pokemon: PokemonAggregate): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: { ...pokemon }
            })
        );
    }
}
