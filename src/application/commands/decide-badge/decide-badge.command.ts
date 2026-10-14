import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class DecideBadgeCommand implements ICommand {
    public constructor(
        public readonly userId: string,
        public readonly badgeId: string,
        public readonly decision: 'GRANTED' | 'REFUSED',
        public readonly reason?: string
    ) {}
}
