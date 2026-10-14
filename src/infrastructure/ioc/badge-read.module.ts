import { GetUserBadgesHandler } from '@application/queries/get-user-badges/get-user-badges.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindBadgePersistence } from '@infrastructure/ioc/badge-persistence';
import { ContainerModule } from 'inversify';

export const BadgeReadModule = new ContainerModule(options => {
    bindBadgePersistence(options);
    configureCqs(options.bind.bind(options), [GetUserBadgesHandler]);
});
