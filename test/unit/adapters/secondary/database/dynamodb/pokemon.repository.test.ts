import 'reflect-metadata';

import { DynamoDBPokemonRepository } from '@adapters/secondary/database/dynamodb/pokemon.repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import type { EnvironmentService } from '@garance-retraite/backend-core/env';
import { mockClient } from 'aws-sdk-client-mock';

const buildPokemon = (): PokemonAggregate => ({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Pikachu',
    type: 'electrique',
    level: 50,
    hp: 200,
    stats: { attack: 120, defense: 110, speed: 90, specialAttack: 95, specialDefense: 80 },
    moves: ['Thunderbolt', 'Quick Attack'],
    captured: true,
    createdAt: 1,
    updatedAt: 1
});

describe('DynamoDBPokemonRepository', () => {
    const dynamoMock = mockClient(DynamoDBDocumentClient);
    const envService = { getEnvironment: jest.fn().mockReturnValue('Pokemon') } as unknown as EnvironmentService;
    let repository: DynamoDBPokemonRepository;

    beforeEach(() => {
        dynamoMock.reset();
        // mockClient intercepte `send` sur toutes les instances : on passe un vrai client.
        repository = new DynamoDBPokemonRepository(DynamoDBDocument.from(new DynamoDBClient({})), envService);
    });

    it('reads the table name from EnvironmentService', () => {
        expect(envService.getEnvironment).toHaveBeenCalledWith('POKEMON_TABLE_NAME');
    });

    it('returns a pokemon when one exists', async () => {
        const pokemon = buildPokemon();
        dynamoMock.on(GetCommand).resolves({ Item: { ...pokemon } });

        await expect(repository.findById(pokemon.id)).resolves.toEqual(pokemon);
    });

    it('returns undefined when the pokemon is missing', async () => {
        dynamoMock.on(GetCommand).resolves({ Item: undefined });

        await expect(repository.findById('missing')).resolves.toBeUndefined();
    });

    it('persists a pokemon', async () => {
        const pokemon = buildPokemon();
        dynamoMock.on(PutCommand).resolves({});

        await repository.save(pokemon);
        expect(dynamoMock.calls()[0]?.args[0].input).toMatchObject({
            TableName: 'Pokemon',
            Item: { id: pokemon.id }
        });
    });
});
