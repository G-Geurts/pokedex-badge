import type { UserBadgeRecord } from '@domain/aggregates/badge.aggregate';

export interface IBadgeRepository {
    createPendingBadgeIfNotExist(badge: UserBadgeRecord): Promise<boolean>;
    saveTaskToken(userId: string, badgeId: string, taskToken: string): Promise<void>;
    getBadge(userId: string, badgeId: string): Promise<UserBadgeRecord | undefined>;
    listUserBadges(userId: string): Promise<UserBadgeRecord[]>;
}

export const BadgeRepositoryToken = Symbol.for('BadgeRepository');
