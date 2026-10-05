import 'reflect-metadata';

import { GetPokemonHandler } from '@application/queries/get-pokemon/get-pokemon.handler';
import { GetPokemonQuery } from '@application/queries/get-pokemon/get-pokemon.query';
import type { PokemonAggregate } from '@domain/aggregates/pokemon.aggregate';
import { PokemonNotFoundError } from '@domain/errors/pokemon.errors';
import type { IPokemonRepository } from '@domain/ports/pokemon.repository.port';

const buildPokemon = (): PokemonAggregate => ({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Pikachu',
    type: 'electrique',
    level: 10,
    hp: 35,
    stats: { attack: 55, defense: 40, speed: 90, specialAttack: 50, specialDefense: 50 },
    moves: ['Thunderbolt', 'Quick Attack'],
    captured: true,
    createdAt: 1,
    updatedAt: 1
});

describe('GetPokemonHandler', () => {
    const repository: jest.Mocked<IPokemonRepository> = {
        findById: jest.fn(),
        save: jest.fn()
    };
    let handler: GetPokemonHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        handler = new GetPokemonHandler(repository);
    });

    it('returns the pokemon when found', async () => {
        const pokemon = buildPokemon();
        repository.findById.mockResolvedValue(pokemon);

        await expect(handler.execute(new GetPokemonQuery(pokemon.id))).resolves.toEqual(pokemon);
    });

    it('throws PokemonNotFoundError when missing', async () => {
        repository.findById.mockResolvedValue(undefined);

        await expect(handler.execute(new GetPokemonQuery('missing'))).rejects.toBeInstanceOf(PokemonNotFoundError);
    });
});
