import { StepFunctionsWorkflowStarter } from '@adapters/secondary/step-functions/step-functions-workflow-starter';
import { ProcessBadgeEventHandler } from '@application/commands/process-badge-event/process-badge-event.handler';
import { WorkflowStarterToken, type IWorkflowStarter } from '@domain/ports/workflow-starter.port';
import { configureCqs } from '@garance-retraite/backend-core/cqs';
import { bindBadgePersistence } from '@infrastructure/ioc/badge-persistence';
import { ContainerModule } from 'inversify';

export const BadgeConsumerModule = new ContainerModule(options => {
    bindBadgePersistence(options);
    options.bind<IWorkflowStarter>(WorkflowStarterToken).to(StepFunctionsWorkflowStarter).inSingletonScope();
    configureCqs(options.bind.bind(options), [ProcessBadgeEventHandler]);
});
