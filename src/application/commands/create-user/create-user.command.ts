import type { NewUser } from '@domain/aggregates/user.aggregate';
import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class CreateUserCommand implements ICommand {
    public constructor(public readonly user: NewUser) {}
}
