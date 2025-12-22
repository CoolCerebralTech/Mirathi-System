import { InvalidValueObjectException } from './base-domain.exception';

export class InvalidOwnershipPercentageException extends InvalidValueObjectException {
  constructor(message: string, field: string = 'ownership', context?: Record<string, any>) {
    super(message, field, { ...context, code: 'DOMAIN_OWNERSHIP_001' });
  }
}

export class OwnershipSumExceeds100Exception extends InvalidOwnershipPercentageException {
  constructor(total: number, context?: Record<string, any>) {
    super(`Total ownership percentage exceeds 100%: ${total}%`, 'totalPercentage', {
      ...context,
      total,
    });
  }
}

export class OwnershipSumLessThan100Exception extends InvalidOwnershipPercentageException {
  constructor(total: number, context?: Record<string, any>) {
    super(`Total ownership percentage is less than 100%: ${total}%`, 'totalPercentage', {
      ...context,
      total,
    });
  }
}

export class InvalidOwnershipTypeException extends InvalidOwnershipPercentageException {
  constructor(message: string, ownershipType: string, context?: Record<string, any>) {
    super(message, 'ownershipType', { ...context, ownershipType });
  }
}

export class LifeInterestMissingEndDateException extends InvalidOwnershipPercentageException {
  constructor(context?: Record<string, any>) {
    super('Life interest ownership must specify end date', 'lifeInterestEndsAt', context);
  }
}

export class ConditionalOwnershipMissingDescriptionException extends InvalidOwnershipPercentageException {
  constructor(context?: Record<string, any>) {
    super(
      'Conditional ownership must specify condition description',
      'conditionDescription',
      context,
    );
  }
}
