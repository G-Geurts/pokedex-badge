import { SendTaskSuccessCommand,SFNClient } from '@aws-sdk/client-sfn';
import { BadgeNotPendingError } from '@domain/errors/badge.errors';
import type { DecisionPayload, IWorkflowResumer } from '@domain/ports/workflow-resumer.port';
import { injectable } from 'inversify';

@injectable()
export class StepFunctionsWorkflowResumer implements IWorkflowResumer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    private readonly client = new SFNClient({});

    public async sendDecisionSuccess(taskToken: string, payload: DecisionPayload): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
            const command = new SendTaskSuccessCommand({
                taskToken,
                output: JSON.stringify(payload)
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.client.send(command);
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'TaskDoesNotExist' || error.name === 'InvalidToken')) {
                throw new BadgeNotPendingError('Badge task token does not exist or has already expired/completed.');
            }
            throw error;
        }
    }
}
