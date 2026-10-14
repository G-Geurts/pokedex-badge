import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class RegisterBadgeDecisionCommand implements ICommand {
    public constructor(
        public readonly userId: string,
        public readonly badgeId: string,
        public readonly taskToken: string
    ) {}
}
