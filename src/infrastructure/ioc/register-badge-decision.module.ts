import { RegisterBadgeDecisionHandler } from '@application/commands/register-badge-decision/register-badge-decision.handler';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindBadgePersistence } from '@infrastructure/ioc/badge-persistence';
import { ContainerModule } from 'inversify';

export const RegisterBadgeDecisionModule = new ContainerModule(options => {
    bindBadgePersistence(options);
    configureCqs(options.bind.bind(options), [RegisterBadgeDecisionHandler]);
});
