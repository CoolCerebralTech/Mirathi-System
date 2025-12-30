// src/estate-service/src/domain/events/will-bequest.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Bequest Defined Event
 *
 * Emitted when a new bequest is defined in a will
 */
export class BequestDefinedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  bequestType: string;
  description: string;
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    bequestType: string,
    description: string,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      bequestType,
      description,
    });
  }
}

/**
 * Bequest Description Updated Event
 *
 * Emitted when bequest description is updated
 */
export class BequestDescriptionUpdatedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  previousDescription: string;
  newDescription: string;
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    previousDescription: string,
    newDescription: string,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      previousDescription,
      newDescription,
    });
  }
}

/**
 * Bequest Condition Added Event
 *
 * Emitted when a condition is added to a bequest
 */
export class BequestConditionAddedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  condition: Record<string, any>;
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    condition: Record<string, any>,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      condition,
    });
  }
}

/**
 * Alternate Beneficiary Set Event
 *
 * Emitted when an alternate beneficiary is set for a bequest
 */
export class AlternateBeneficiarySetEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  primaryBeneficiary: Record<string, any>;
  alternateBeneficiary: Record<string, any>;
}> {
  constructor(
    willId: string,
    bequestId: string,
    primaryBeneficiary: Record<string, any>,
    alternateBeneficiary: Record<string, any>,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      primaryBeneficiary,
      alternateBeneficiary,
    });
  }
}

/**
 * Bequest Validation Failed Event
 *
 * Emitted when bequest validation fails
 */
export class BequestValidationFailedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  validationErrors: string[];
  severity: 'ERROR' | 'WARNING';
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    validationErrors: string[],
    severity: 'ERROR' | 'WARNING' = 'ERROR',
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      validationErrors,
      severity,
    });
  }
}

/**
 * Bequest Value Updated Event
 *
 * Emitted when bequest value is updated
 */
export class BequestValueUpdatedEvent extends DomainEvent<{
  bequestId: string;
  willId: string;
  beneficiary: Record<string, any>;
  previousValue: any;
  newValue: any;
  valueType: string;
}> {
  constructor(
    willId: string,
    bequestId: string,
    beneficiary: Record<string, any>,
    previousValue: any,
    newValue: any,
    valueType: string,
  ) {
    super(willId, 'Will', 1, {
      bequestId,
      willId,
      beneficiary,
      previousValue,
      newValue,
      valueType,
    });
  }
}
