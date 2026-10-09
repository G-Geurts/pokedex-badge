import { z } from 'zod';

export const userLevelSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    level: z.number(),
    point: z.number(),
    updatedAt: z.string(),
});

export const userPurchaseSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    pokemonId: z.string(),
    occurredAt: z.string()
});

export const userPurchaseInputSchema = z.object({
    eventVersion: z.string(),
    purchaseId: z.string(),
    userId: z.string(),
    pokemonId: z.string(),
    occurredAt: z.string()
});

export type UserLevelAggregate = z.infer<typeof userLevelSchema>;
export type UserPurchaseAggregate = z.infer<typeof userPurchaseSchema>;
export type UserPurchaseInputAggregate = z.infer<typeof userPurchaseInputSchema>;
