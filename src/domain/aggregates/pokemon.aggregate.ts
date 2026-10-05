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

export const pokemonStatsSchema = z.object({
    attack: z.number().int().min(1).max(255),
    defense: z.number().int().min(1).max(255),
    speed: z.number().int().min(1).max(255),
    specialAttack: z.number().int().min(1).max(255),
    specialDefense: z.number().int().min(1).max(255)
});

export const pokemonSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1).max(50),
    type: pokemonTypeEnum,
    level: z.number().int().min(1).max(100),
    hp: z.number().int().positive().max(999),
    stats: pokemonStatsSchema,
    moves: z.array(z.string().min(1).max(30)).max(4),
    evolutions: z.array(z.string().min(1).max(50)).optional(),
    captured: z.boolean(),
    trainer: z.string().optional(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});

/** Données fournies à la création : l'identifiant et l'horodatage sont attribués par l'application. */
export const newPokemonSchema = pokemonSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type PokemonAggregate = z.infer<typeof pokemonSchema>;
export type NewPokemon = z.infer<typeof newPokemonSchema>;
export type PokemonStats = z.infer<typeof pokemonStatsSchema>;
export type PokemonType = z.infer<typeof pokemonTypeEnum>;
