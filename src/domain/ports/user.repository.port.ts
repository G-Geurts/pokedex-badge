import type { UserAggregate } from '@domain/aggregates/user.aggregate';

export interface IUserRepository {
    getUserList: () => Promise<UserAggregate[]>;
    save: (user: UserAggregate) => Promise<void>;
}

export const UserRepositoryToken = Symbol.for('UserRepository');
