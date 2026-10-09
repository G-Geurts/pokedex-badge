import { UserLevelAggregate } from '@domain/aggregates/user.aggregate';
import { UserNotFoundError } from '@domain/errors/user.errors';
import { IUserLevelRepository, UserLevelRepositoryToken } from '@domain/ports/user.repository.port';
import { type IQueryHandler, QueryHandler } from '@garance-retraite/backend-core/cqs';
import { inject } from 'inversify';

import { GetUserLevelQuery } from './get-user-level.query';

@QueryHandler(GetUserLevelQuery)
export class GetUserListHandler implements IQueryHandler<GetUserLevelQuery, UserLevelAggregate> {
    public constructor(
        @inject(UserLevelRepositoryToken)
        private readonly repository: IUserLevelRepository
    ) {}

    public async execute(query: GetUserLevelQuery): Promise<UserLevelAggregate> {
        const user: UserLevelAggregate | undefined = await this.repository.getUserLevel(query.userId);
        if (!user) {
            throw new UserNotFoundError(`User [${query.userId}] not found`);
        }
        return user;
    }
}
