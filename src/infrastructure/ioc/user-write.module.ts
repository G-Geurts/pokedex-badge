import { RegisterPurchaseHandler } from '@application/commands/register-purchase/register-purchase.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindUserPersistence } from '@infrastructure/ioc/user-persistence';
import { ContainerModule } from 'inversify';

export const UserWriteModule = new ContainerModule(options => {
    bindUserPersistence(options);
    configureCqs(options.bind.bind(options), [RegisterPurchaseHandler]);
});
