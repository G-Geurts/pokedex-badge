import { RegisterPurchaseHandler } from '@application/commands/register-purchase/register-purchase.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindPurchasePersistence } from '@infrastructure/ioc/purchase-persistence';
import { ContainerModule } from 'inversify';

export const PurchaseWriteModule = new ContainerModule(options => {
    bindPurchasePersistence(options);
    configureCqs(options.bind.bind(options), [RegisterPurchaseHandler]);
});
