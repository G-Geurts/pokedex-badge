import { AppError, NotFoundError } from '@garance-retraite/backend-core/errors';

export class BadgeNotFoundError extends NotFoundError {
    readonly code = 'BADGE_NOT_FOUND';
}

export class BadgeNotPendingError extends AppError {
    readonly code = 'BADGE_NOT_PENDING';
    readonly httpStatus = 409;
}
