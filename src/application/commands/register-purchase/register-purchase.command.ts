import type { NewPurchase } from '@domain/aggregates/purchase.aggregate';
import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class RegisterPurchaseCommand implements ICommand {
    public constructor(
        public readonly userId: string,
        public readonly purchase: NewPurchase
    ) {}
}
