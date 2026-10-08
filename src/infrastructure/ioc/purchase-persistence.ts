import { DynamoDBPokemonRepository } from '@adapters/secondary/database/dynamodb/pokemon.repository';
import { DynamoDBPurchaseRepository } from '@adapters/secondary/database/dynamodb/purchase.repository';
import { DynamoDBUserRepository } from '@adapters/secondary/database/dynamodb/user.repository';
import { type IPokemonRepository, PokemonRepositoryToken } from '@domain/ports/pokemon.repository.port';
import { type IPurchaseRepository, PurchaseRepositoryToken } from '@domain/ports/purchase.repository.port';
import { type IUserRepository, UserRepositoryToken } from '@domain/ports/user.repository.port';
import { bindDynamoDB } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import type { ContainerModuleLoadOptions } from 'inversify';

export function bindPurchasePersistence(options: ContainerModuleLoadOptions): void {
    bindDynamoDB(options);
    options.bind(EnvironmentService).toSelf().inSingletonScope();
    options.bind<IUserRepository>(UserRepositoryToken).to(DynamoDBUserRepository).inSingletonScope();
    options.bind<IPokemonRepository>(PokemonRepositoryToken).to(DynamoDBPokemonRepository).inSingletonScope();
    options.bind<IPurchaseRepository>(PurchaseRepositoryToken).to(DynamoDBPurchaseRepository).inSingletonScope();
}
