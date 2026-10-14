export interface IWorkflowStarter {
    startBadgeApprovalWorkflow(userId: string, badgeId: string): Promise<void>;
}

export const WorkflowStarterToken = Symbol.for('WorkflowStarter');
