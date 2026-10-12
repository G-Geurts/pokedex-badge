import type { UserPurchaseInputAggregate } from '@domain/aggregates/user.aggregate';
import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class RegisterPurchaseCommand implements ICommand {
    public constructor(public readonly purchase: UserPurchaseInputAggregate) {}
}
