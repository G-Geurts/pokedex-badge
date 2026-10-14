import { StepFunctionsWorkflowResumer } from '@adapters/secondary/step-functions/step-functions-workflow-resumer';
import { DecideBadgeHandler } from '@application/commands/decide-badge/decide-badge.handler';
import { type IWorkflowResumer, WorkflowResumerToken } from '@domain/ports/workflow-resumer.port';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindBadgePersistence } from '@infrastructure/ioc/badge-persistence';
import { ContainerModule } from 'inversify';

export const BadgeDecisionModule = new ContainerModule(options => {
    bindBadgePersistence(options);
    options.bind<IWorkflowResumer>(WorkflowResumerToken).to(StepFunctionsWorkflowResumer).inSingletonScope();
    configureCqs(options.bind.bind(options), [DecideBadgeHandler]);
});
