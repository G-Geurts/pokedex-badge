import { DynamoDBUserRepository } from '@adapters/secondary/database/dynamodb/user.repository';
import { type IUserRepository, UserRepositoryToken } from '@domain/ports/user.repository.port';
import { bindDynamoDB } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import type { ContainerModuleLoadOptions } from 'inversify';

export function bindUserPersistence(options: ContainerModuleLoadOptions): void {
    bindDynamoDB(options);
    options.bind(EnvironmentService).toSelf().inSingletonScope();
    options.bind<IUserRepository>(UserRepositoryToken).to(DynamoDBUserRepository).inSingletonScope();
}
