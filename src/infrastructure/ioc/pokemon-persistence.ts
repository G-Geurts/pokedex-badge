import { DynamoDBPokemonRepository } from '@adapters/secondary/database/dynamodb/pokemon.repository';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { bindDynamoDB } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import type { ContainerModuleLoadOptions } from 'inversify';

/** Bindings communs aux modules lecture et écriture : client DynamoDB, environnement, repository. */
export function bindPokemonPersistence(options: ContainerModuleLoadOptions): void {
    bindDynamoDB(options);
    options.bind(EnvironmentService).toSelf().inSingletonScope();
    options.bind<IPokemonRepository>(PokemonRepositoryToken).to(DynamoDBPokemonRepository).inSingletonScope();
}
