import { AppError, NotFoundError } from '@garance-retraite/backend-core/errors';

export class UserNotFoundError extends NotFoundError {
    readonly code = 'USER_NOT_FOUND';
}
export class UserIdMissingError extends AppError {
    readonly code = 'USER_ID_MISSING';
    readonly httpStatus = 400;
}
