import { UserAggregate } from '@domain/aggregates/user.aggregate';
import { IUserRepository, UserRepositoryToken } from '@domain/ports/user.repository.port';
import { type IQueryHandler, QueryHandler } from '@garance-retraite/backend-core/cqs';
import { inject } from 'inversify';

import { GetUserListQuery } from './get-user-list.query';

@QueryHandler(GetUserListQuery)
export class GetUserListHandler implements IQueryHandler<GetUserListQuery, UserAggregate[]> {
    public constructor(
        @inject(UserRepositoryToken)
        private readonly repository: IUserRepository
    ) {}

    public async execute(): Promise<UserAggregate[]> {
        return await this.repository.getUserList();
    }
}
