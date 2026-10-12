import { z } from 'zod';

export const userLevelRecordSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    point: z.number().default(0),
    updatedAt: z.coerce.number()
});

export const userLevelSchema = userLevelRecordSchema.extend({
    level: z.number()
});

export const userPurchaseSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    pokemonId: z.string(),
    occurredAt: z.coerce.number()
});

export const userPurchaseInputSchema = z.object({
    eventVersion: z.string(),
    purchaseId: z.uuid(),
    userId: z.string(),
    pokemonId: z.string(),
    occurredAt: z.coerce.number()
});

export type UserLevelRecord = z.infer<typeof userLevelRecordSchema>;
export type UserLevelAggregate = z.infer<typeof userLevelSchema>;
export type UserPurchaseAggregate = z.infer<typeof userPurchaseSchema>;
export type UserPurchaseInputAggregate = z.infer<typeof userPurchaseInputSchema>;
export function toUserLevelAggregate(record: UserLevelRecord): UserLevelAggregate {
    return {
        ...record,
        level: Math.floor(record.point / 100)
    };
}
