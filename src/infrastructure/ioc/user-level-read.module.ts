import { GetUserListHandler } from '@application/queries/get-user/get-user-list.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindUserPersistence } from '@infrastructure/ioc/user-persistence';
import { ContainerModule } from 'inversify';

export const UserLevelReadModule = new ContainerModule(options => {
    bindUserPersistence(options);
    configureCqs(options.bind.bind(options), [GetUserListHandler]);
});
