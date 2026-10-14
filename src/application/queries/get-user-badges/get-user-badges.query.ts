import type { IQuery } from '@garance-retraite/backend-core/cqs';

export class GetUserBadgesQuery implements IQuery {
    public constructor(public readonly userId: string) {}
}
