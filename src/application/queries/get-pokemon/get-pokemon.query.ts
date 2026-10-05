import type { IQuery } from '@garance-retraite/backend-core/cqs';

export class GetPokemonQuery implements IQuery {
    public constructor(public readonly id: string) {}
}
