import type { LevelReachedInputAggregate } from '@domain/aggregates/badge.aggregate';
import type { ICommand } from '@garance-retraite/backend-core/cqs';

export class ProcessBadgeEventCommand implements ICommand {
    public constructor(public readonly payload: LevelReachedInputAggregate) {}
}
