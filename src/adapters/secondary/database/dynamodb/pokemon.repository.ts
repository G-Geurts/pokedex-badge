import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';
import type { IPokemonRepository } from '@domain/ports/pokemon.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken, GetCommand, PutCommand } from '@garance-retraite/aws/dynamodb';
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

    public async findById(id: string): Promise<PokemonAggregate | undefined> {
        const res = await this.client.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { id }
            })
        );
        if (!res.Item) {
            return undefined;
        }
        return pokemonSchema.parse(res.Item);
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
