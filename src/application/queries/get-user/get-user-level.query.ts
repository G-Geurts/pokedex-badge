import type { IQuery } from '@garance-retraite/backend-core/cqs';

export class GetUserLevelQuery implements IQuery {
    constructor(public readonly userId: string) {}
}
