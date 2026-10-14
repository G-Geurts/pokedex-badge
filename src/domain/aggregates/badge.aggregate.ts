import { z } from 'zod';

export const badgeStatusSchema = z.enum(['PENDING', 'GRANTED', 'REFUSED', 'EXPIRED']);
export type BadgeStatus = z.infer<typeof badgeStatusSchema>;

export const levelReachedInputSchema = z
    .object({
        userId: z.string().min(1),
        level: z.number().int().nonnegative().optional(),
        newLevel: z.number().int().nonnegative().optional(),
        points: z.number().int().nonnegative(),
        reachedAt: z.union([z.string(), z.number()]).optional(),
        updatedAt: z.union([z.string(), z.number()]).optional()
    })
    .transform(data => {
        const resolvedLevel = data.level ?? data.newLevel;
        if (resolvedLevel === undefined) {
            throw new Error("L'événement doit contenir soit 'level' soit 'newLevel'");
        }

        const resolvedDate = data.reachedAt ?? data.updatedAt ?? Date.now();

        return {
            userId: data.userId,
            level: resolvedLevel,
            points: data.points,
            reachedAt: resolvedDate
        };
    });

export type LevelReachedInputAggregate = z.infer<typeof levelReachedInputSchema>;

export const userBadgeRecordSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    userId: z.string(),
    badgeId: z.string(),
    level: z.number(),
    status: badgeStatusSchema,
    taskToken: z.string().optional(),
    reason: z.string().optional(),
    updatedAt: z.string().or(z.number())
});
export type UserBadgeRecord = z.infer<typeof userBadgeRecordSchema>;
