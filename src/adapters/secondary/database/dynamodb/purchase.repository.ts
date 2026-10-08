import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { PurchaseAggregate } from '@domain/aggregates/purchase.aggregate';
import { IPurchaseRepository } from '@domain/ports/purchase.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBPurchaseRepository implements IPurchaseRepository {
    protected readonly tableName: string;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    public async save(purchase: PurchaseAggregate): Promise<void> {
        await this.client.send(
            new PutCommand({
                TableName: this.tableName,
                Item: { ...purchase }
            })
        );
    }
}
