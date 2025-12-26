import { DomainEvent } from '../base/domain-event';

/**
 * Bequest Defined Event
 *
 * Emitted when a new bequest (beneficiary assignment) is created
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
 * Emitted when the description of a bequest changes
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
 * Emitted when a new condition is attached to a bequest
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
 * Emitted when an alternate beneficiary is defined
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
