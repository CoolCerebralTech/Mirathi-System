// src/estate-service/src/domain/enums/will-status.enum.ts
/**
 * Will Status Enum
 *
 * Represents the lifecycle state of a will under Kenyan law
 *
 * Legal Context:
 * - DRAFT: Not yet legally binding, can be freely modified
 * - WITNESSED: Signed by testator and witnesses, becomes active
 * - ACTIVE: Current valid will (testator alive)
 * - REVOKED: Explicitly cancelled by testator
 * - SUPERSEDED: Replaced by newer will
 * - EXECUTED: Testator deceased, will is being executed
 * - CONTESTED: Under legal challenge
 * - PROBATE: Submitted to court for grant of probate
 */
export enum WillStatus {
  DRAFT = 'DRAFT',
  WITNESSED = 'WITNESSED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  SUPERSEDED = 'SUPERSEDED',
  EXECUTED = 'EXECUTED',
  CONTESTED = 'CONTESTED',
  PROBATE = 'PROBATE',
}

/**
 * Check if a will status transition is valid
 */
export function isValidWillStatusTransition(from: WillStatus, to: WillStatus): boolean {
  const validTransitions: Record<WillStatus, WillStatus[]> = {
    [WillStatus.DRAFT]: [WillStatus.WITNESSED, WillStatus.REVOKED],
    [WillStatus.WITNESSED]: [WillStatus.ACTIVE, WillStatus.REVOKED, WillStatus.DRAFT],
    [WillStatus.ACTIVE]: [
      WillStatus.REVOKED,
      WillStatus.SUPERSEDED,
      WillStatus.EXECUTED,
      WillStatus.CONTESTED,
    ],
    [WillStatus.REVOKED]: [WillStatus.DRAFT],
    [WillStatus.SUPERSEDED]: [],
    [WillStatus.EXECUTED]: [WillStatus.PROBATE],
    [WillStatus.CONTESTED]: [WillStatus.ACTIVE, WillStatus.REVOKED],
    [WillStatus.PROBATE]: [],
  };

  return validTransitions[from]?.includes(to) || false;
}

/**
 * Get human-readable description of will status
 */
export function getWillStatusDescription(status: WillStatus): string {
  const descriptions: Record<WillStatus, string> = {
    [WillStatus.DRAFT]: 'Draft will - not yet legally binding',
    [WillStatus.WITNESSED]: 'Signed by testator and witnesses',
    [WillStatus.ACTIVE]: 'Current valid will',
    [WillStatus.REVOKED]: 'Cancelled by testator',
    [WillStatus.SUPERSEDED]: 'Replaced by newer will',
    [WillStatus.EXECUTED]: 'Testator deceased - will in execution',
    [WillStatus.CONTESTED]: 'Under legal challenge',
    [WillStatus.PROBATE]: 'Submitted to court for grant',
  };

  return descriptions[status];
}
