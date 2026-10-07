import { randomUUID } from 'node:crypto';

import type { Logger } from '@aws-lambda-powertools/logger';
import { UserAggregate, userSchema } from '@domain/aggregates/user.aggregate';
import { IUserRepository, UserRepositoryToken } from '@domain/ports/user.repository.port';
import { CommandHandler, type ICommandHandler } from '@garance-retraite/backend-core/cqs';
import { LOGGER_TOKENS } from '@garance-retraite/backend-core/logger';
import { inject } from 'inversify';

import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserAggregate> {
    public constructor(
        @inject(UserRepositoryToken)
        private readonly repository: IUserRepository,
        @inject(LOGGER_TOKENS.Logger)
        private readonly logger: Logger
    ) {}

    public async execute(command: CreateUserCommand): Promise<UserAggregate> {
        const now = Date.now();
        const uuid = randomUUID();
        const user = userSchema.parse({
            ...command.user,
            pk: `USR#${uuid}`,
            sk: 'PROFILE',
            id: randomUUID(),
            createdAt: now,
            updatedAt: now
        });
        this.logger.info('Creating user', { id: user.id, name: user.name });
        await this.repository.save(user);
        return user;
    }
}
