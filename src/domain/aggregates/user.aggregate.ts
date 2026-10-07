import { z } from 'zod';

export const userSchema = z.object({
    pk: z.string(),
    sk: z.string(),
    id: z.uuid(),
    name: z.string().min(1).max(50),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative()
});

export const newUserSchema = userSchema.omit({ pk: true, sk: true, id: true, createdAt: true, updatedAt: true });

export type UserAggregate = z.infer<typeof userSchema>;
export type NewUser = z.infer<typeof newUserSchema>;
