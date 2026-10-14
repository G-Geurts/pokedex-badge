export interface DecisionPayload {
    decision: 'GRANTED' | 'REFUSED';
    reason?: string;
}

export interface IWorkflowResumer {
    sendDecisionSuccess(taskToken: string, payload: DecisionPayload): Promise<void>;
}

export const WorkflowResumerToken = Symbol.for('WorkflowResumer');
