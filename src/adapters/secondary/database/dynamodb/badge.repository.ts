import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { UserBadgeRecord, userBadgeRecordSchema } from '@domain/aggregates/badge.aggregate';
import type { IBadgeRepository } from '@domain/ports/badge.repository.port';
import { type DynamoDBDocument, DynamoDBDocumentToken } from '@garance-retraite/aws/dynamodb';
import { EnvironmentService } from '@garance-retraite/backend-core/env';
import { inject, injectable } from 'inversify';

@injectable()
export class DynamoDBBadgeRepository implements IBadgeRepository {
    protected readonly tableName: string;

    public constructor(
        @inject(DynamoDBDocumentToken)
        private readonly client: DynamoDBDocument,
        @inject(EnvironmentService)
        environmentService: EnvironmentService
    ) {
        this.tableName = environmentService.getEnvironment('POKEMON_TABLE_NAME');
    }

    private normalizeUserId(userId: string): string {
        return userId.startsWith('USER#') ? userId : `USER#${userId.replace(/^USR#/, '')}`;
    }

    private normalizeBadgeId(badgeId: string): string {
        return badgeId.startsWith('BADGE#') ? badgeId : `BADGE#${badgeId}`;
    }

    public async createPendingBadgeIfNotExist(badge: UserBadgeRecord): Promise<boolean> {
        try {
            await this.client.send(
                new PutCommand({
                    TableName: this.tableName,
                    Item: badge,
                    ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
                })
            );
            return true;
        } catch (error: unknown) {
            if (error instanceof ConditionalCheckFailedException) {
                return false;
            }
            throw error;
        }
    }

    public async saveTaskToken(userId: string, badgeId: string, taskToken: string): Promise<void> {
        const pk = this.normalizeUserId(userId);
        const sk = this.normalizeBadgeId(badgeId);

        await this.client.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { pk, sk },
                UpdateExpression: 'SET taskToken = :token, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':token': taskToken,
                    ':updatedAt': Date.now()
                }
            })
        );
    }

    public async getBadge(userId: string, badgeId: string): Promise<UserBadgeRecord | undefined> {
        const pk = this.normalizeUserId(userId);
        const sk = this.normalizeBadgeId(badgeId);

        const result = await this.client.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { pk, sk }
            })
        );

        if (!result.Item) {
            return undefined;
        }

        return userBadgeRecordSchema.parse(result.Item);
    }

    public async listUserBadges(userId: string): Promise<UserBadgeRecord[]> {
        const pk = this.normalizeUserId(userId);

        const result = await this.client.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'pk = :pk AND begins_with(sk, :badgePrefix)',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':badgePrefix': 'BADGE#'
                }
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return [];
        }

        return result.Items.map(item => userBadgeRecordSchema.parse(item));
    }
}
