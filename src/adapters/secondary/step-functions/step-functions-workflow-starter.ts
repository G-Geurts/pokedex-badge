import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { IWorkflowStarter } from '@domain/ports/workflow-starter.port';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class StepFunctionsWorkflowStarter implements IWorkflowStarter {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    private readonly client = new SFNClient({});
    private readonly stateMachineArn: string;

    public constructor(
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.stateMachineArn = environmentService.getEnvironment('BADGE_STATE_MACHINE_ARN');
    }

    public async startBadgeApprovalWorkflow(userId: string, badgeId: string): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
            const command: StartExecutionCommand = new StartExecutionCommand({
                stateMachineArn: this.stateMachineArn,
                name: `${userId}-${badgeId}`,
                input: JSON.stringify({ userId, badgeId })
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.client.send(command);
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                (error.name === 'ExecutionAlreadyExists' || error.name === 'ExecutionAlreadyExistsException')
            ) {
                return;
            }
            throw error;
        }
    }
}
