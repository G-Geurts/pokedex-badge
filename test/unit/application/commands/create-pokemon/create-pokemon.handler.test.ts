import 'reflect-metadata';

import { CreatePokemonCommand } from '@application/commands/create-pokemon/create-pokemon.command';
import { CreatePokemonHandler } from '@application/commands/create-pokemon/create-pokemon.handler';
import type { Logger } from '@aws-lambda-powertools/logger';
import type { IPokemonRepository } from '@domain/ports/pokemon.repository.port';

describe('CreatePokemonHandler', () => {
    const repository: jest.Mocked<IPokemonRepository> = {
        findById: jest.fn(),
        save: jest.fn()
    };
    const logger = { info: jest.fn() } as unknown as Logger;
    let handler: CreatePokemonHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        handler = new CreatePokemonHandler(repository, logger);
    });

    it('persists a new pokemon with a generated id and timestamps', async () => {
        repository.save.mockResolvedValue(undefined);

        const pokemon = await handler.execute(
            new CreatePokemonCommand({
                name: 'Eevee',
                type: 'normal',
                level: 15,
                hp: 55,
                stats: { attack: 40, defense: 50, speed: 55, specialAttack: 45, specialDefense: 65 },
                moves: ['Tackle', 'Growl'],
                captured: true
            })
        );

        expect(pokemon.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/v);
        expect(pokemon.createdAt).toBe(pokemon.updatedAt);
        expect(repository.save).toHaveBeenCalledWith(pokemon);
    });
});
