import { type PokemonAggregate, pokemonSchema } from '@domain/aggregates/pokemon.aggregate';

describe('pokemonSchema', () => {
    const basePokemon: PokemonAggregate = {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Pikachu',
        type: 'electrique',
        level: 10,
        hp: 35,
        stats: { attack: 55, defense: 40, speed: 90, specialAttack: 50, specialDefense: 50 },
        moves: ['Thunderbolt', 'Quick Attack'],
        captured: true,
        createdAt: 0,
        updatedAt: 0
    };

    it('validates a correct pokemon', () => {
        expect(pokemonSchema.safeParse(basePokemon).success).toBe(true);
    });

    it('rejects non-uuid id', () => {
        expect(pokemonSchema.safeParse({ ...basePokemon, id: 'not-a-uuid' }).success).toBe(false);
    });

    it('rejects out-of-range stat', () => {
        const invalid = { ...basePokemon, stats: { ...basePokemon.stats, attack: -1 } };
        expect(pokemonSchema.safeParse(invalid).success).toBe(false);
    });
});
