import { z } from 'zod';

export const pokemonTypeEnum = z.enum([
    'acier',
    'combat',
    'dragon',
    'eau',
    'electrique',
    'feu',
    'glace',
    'insecte',
    'normal',
    'plante',
    'poison',
    'psy',
    'roche',
    'sol',
    'spectre',
    'tenebres',
    'fee',
    'vol'
]);

export const pokemonSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    id: z.uuid(),
    name: z.string().min(1).max(50),
    type: pokemonTypeEnum,
    price: z.number().nonnegative(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});

export const newPokemonSchema = pokemonSchema.omit({ pk: true, sk: true, id: true, createdAt: true, updatedAt: true });

export type PokemonAggregate = z.infer<typeof pokemonSchema>;
export type NewPokemon = z.infer<typeof newPokemonSchema>;
