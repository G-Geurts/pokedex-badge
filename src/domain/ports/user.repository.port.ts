import type { UserAggregate } from '@domain/aggregates/user.aggregate';

export interface IUserRepository {
    getUserList: () => Promise<UserAggregate[]>;
    getUser: (userId: string) => Promise<UserAggregate | undefined>;
    save: (user: UserAggregate) => Promise<void>;
}

export const UserRepositoryToken = Symbol.for('UserRepository');
