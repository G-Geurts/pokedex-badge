import { SendTaskSuccessCommand, SFNClient } from '@aws-sdk/client-sfn';
import { BadgeNotPendingError } from '@domain/errors/badge.errors';
import type { DecisionPayload, IWorkflowResumer } from '@domain/ports/workflow-resumer.port';
import { injectable } from 'inversify';

@injectable()
export class StepFunctionsWorkflowResumer implements IWorkflowResumer {
    private readonly client = new SFNClient({});

    public async sendDecisionSuccess(taskToken: string, payload: DecisionPayload): Promise<void> {
        try {
            const command = new SendTaskSuccessCommand({
                taskToken,
                output: JSON.stringify(payload)
            });

            await this.client.send(command);
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === 'TaskDoesNotExist' || error.name === 'InvalidToken')) {
                throw new BadgeNotPendingError('Badge task token does not exist or has already expired/completed.');
            }
            throw error;
        }
    }
}
