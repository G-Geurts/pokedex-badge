import type { UserLevelAggregate, UserPurchaseAggregate } from '@domain/aggregates/user.aggregate';

export interface IUserLevelRepository {
    getUserLevel(userId: string): Promise<UserLevelAggregate | undefined>;
    getPurchase(userId: string, purchaseId: string): Promise<UserPurchaseAggregate | undefined>;
    save: (user: UserPurchaseAggregate | UserLevelAggregate) => Promise<void>;
}

export const UserLevelRepositoryToken = Symbol.for('UserLevelRepository');
