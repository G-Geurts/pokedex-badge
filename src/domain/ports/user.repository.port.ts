import type { UserLevelAggregate, UserPurchaseAggregate } from '@domain/aggregates/user.aggregate';

export interface IUserLevelRepository {
    getUserLevel(userId: string): Promise<UserLevelAggregate | undefined>;
    savePurchaseIfNotExist(purchase: UserPurchaseAggregate): Promise<boolean>;
    incrementUserPoints(userId: string, pointsToAdd: number, updatedAt: number): Promise<UserLevelAggregate>;
}

export const UserLevelRepositoryToken = Symbol.for('UserLevelRepository');
