import { UserBadgeRecord } from '@domain/aggregates/badge.aggregate';
import { BadgeRepositoryToken, type IBadgeRepository } from '@domain/ports/badge.repository.port';
import { type IQueryHandler, QueryHandler } from '@garance-retraite/backend-core/cqs';
import { inject } from 'inversify';

import { GetUserBadgesQuery } from './get-user-badges.query';

@QueryHandler(GetUserBadgesQuery)
export class GetUserBadgesHandler implements IQueryHandler<GetUserBadgesQuery, UserBadgeRecord[]> {
    public constructor(
        @inject(BadgeRepositoryToken)
        private readonly repository: IBadgeRepository
    ) {}

    public async execute(query: GetUserBadgesQuery): Promise<UserBadgeRecord[]> {
        return this.repository.listUserBadges(query.userId);
    }
}
