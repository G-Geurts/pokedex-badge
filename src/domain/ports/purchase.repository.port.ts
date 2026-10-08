import type { PurchaseAggregate } from '@domain/aggregates/purchase.aggregate';

export interface IPurchaseRepository {
    save: (purchase: PurchaseAggregate) => Promise<void>;
}

export const PurchaseRepositoryToken = Symbol.for('PurchaseRepository');
