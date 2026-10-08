import { z } from 'zod';

export const purchaseSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    gsi1pk: z.string(),
    gsi1sk: z.string(),
    id: z.uuid(),
    pokemon: z.string(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});

export const newPurchaseSchema = z.object({
    pokemonId: z.string()
});

export type PurchaseAggregate = z.infer<typeof purchaseSchema>;
export type NewPurchase = z.infer<typeof newPurchaseSchema>;
