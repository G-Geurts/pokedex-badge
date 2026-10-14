import { DynamoDBBadgeRepository } from '@adapters/secondary/database/dynamodb/badge.repository';
import { BadgeRepositoryToken, type IBadgeRepository } from '@domain/ports/badge.repository.port';
import { bindDynamoDB } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import type { ContainerModuleLoadOptions } from 'inversify';

export function bindBadgePersistence(options: ContainerModuleLoadOptions): void {
    bindDynamoDB(options);
    options.bind(EnvironmentService).toSelf().inSingletonScope();
    options.bind<IBadgeRepository>(BadgeRepositoryToken).to(DynamoDBBadgeRepository).inSingletonScope();
}
