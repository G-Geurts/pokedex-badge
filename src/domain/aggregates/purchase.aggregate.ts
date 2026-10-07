import { z } from 'zod';

export const purchaseSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    id: z.uuid(),
    pokemon: z.string(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});

export const newPurchaseSchema = purchaseSchema.omit({ sk: true, id: true, createdAt: true, updatedAt: true });

export type PurchaseAggregate = z.infer<typeof purchaseSchema>;
export type NewPurchase = z.infer<typeof newPurchaseSchema>;
