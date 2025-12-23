// domain/value-objects/will-status.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Will Status Value Object
 *
 * Kenyan Legal Context:
 * - Section 11 LSA: A will must be signed by testator and 2 witnesses
 * - Section 9 LSA: Testator must have testamentary capacity
 * - Section 17 LSA: Marriage revokes prior wills (unless will made in contemplation)
 *
 * Status Flow:
 * DRAFT → PENDING_WITNESS → WITNESSED → ACTIVE → [REVOKED/SUPERSEDED/EXECUTED]
 *
 * Business Rules:
 * - Only one ACTIVE will per testator
 * - EXECUTED means testator died and distribution completed
 * - CONTESTED enters legal dispute process
 */
export enum WillStatusEnum {
  DRAFT = 'DRAFT', // Initial creation, fully editable
  PENDING_WITNESS = 'PENDING_WITNESS', // Awaiting witness signatures
  WITNESSED = 'WITNESSED', // Legally witnessed, not yet active
  ACTIVE = 'ACTIVE', // Current valid will (testator alive)
  REVOKED = 'REVOKED', // Invalidated by testator
  SUPERSEDED = 'SUPERSEDED', // Replaced by newer will
  EXECUTED = 'EXECUTED', // Testator deceased, distribution complete
  CONTESTED = 'CONTESTED', // Under legal dispute (S.26 dependant claim)
  PROBATE = 'PROBATE', // In court for grant of probate
}

export class WillStatus extends SimpleValueObject<WillStatusEnum> {
  private constructor(value: WillStatusEnum) {
    super(value);
  }

  protected validate(): void {
    if (!Object.values(WillStatusEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid will status: ${this.props.value}`, 'status');
    }
  }

  // Factory methods for type safety
  static draft(): WillStatus {
    return new WillStatus(WillStatusEnum.DRAFT);
  }

  static pendingWitness(): WillStatus {
    return new WillStatus(WillStatusEnum.PENDING_WITNESS);
  }

  static witnessed(): WillStatus {
    return new WillStatus(WillStatusEnum.WITNESSED);
  }

  static active(): WillStatus {
    return new WillStatus(WillStatusEnum.ACTIVE);
  }

  static revoked(): WillStatus {
    return new WillStatus(WillStatusEnum.REVOKED);
  }

  static superseded(): WillStatus {
    return new WillStatus(WillStatusEnum.SUPERSEDED);
  }

  static executed(): WillStatus {
    return new WillStatus(WillStatusEnum.EXECUTED);
  }

  static contested(): WillStatus {
    return new WillStatus(WillStatusEnum.CONTESTED);
  }

  static probate(): WillStatus {
    return new WillStatus(WillStatusEnum.PROBATE);
  }

  // Business Logic: State transitions
  public canTransitionTo(newStatus: WillStatus): boolean {
    const validTransitions: Record<WillStatusEnum, WillStatusEnum[]> = {
      [WillStatusEnum.DRAFT]: [WillStatusEnum.PENDING_WITNESS, WillStatusEnum.REVOKED],
      [WillStatusEnum.PENDING_WITNESS]: [
        WillStatusEnum.DRAFT, // Allow back to draft for corrections
        WillStatusEnum.WITNESSED,
        WillStatusEnum.REVOKED,
      ],
      [WillStatusEnum.WITNESSED]: [WillStatusEnum.ACTIVE, WillStatusEnum.REVOKED],
      [WillStatusEnum.ACTIVE]: [
        WillStatusEnum.REVOKED,
        WillStatusEnum.SUPERSEDED,
        WillStatusEnum.PROBATE,
        WillStatusEnum.CONTESTED,
      ],
      [WillStatusEnum.PROBATE]: [
        WillStatusEnum.EXECUTED,
        WillStatusEnum.CONTESTED,
        WillStatusEnum.ACTIVE, // If probate denied
      ],
      [WillStatusEnum.CONTESTED]: [
        WillStatusEnum.ACTIVE, // If challenge fails
        WillStatusEnum.REVOKED, // If challenge succeeds
        WillStatusEnum.PROBATE, // Return to probate
      ],
      [WillStatusEnum.REVOKED]: [], // Terminal state
      [WillStatusEnum.SUPERSEDED]: [], // Terminal state
      [WillStatusEnum.EXECUTED]: [], // Terminal state
    };

    return validTransitions[this.value]?.includes(newStatus.value) ?? false;
  }

  // Query methods
  public isDraft(): boolean {
    return this.value === WillStatusEnum.DRAFT;
  }

  public isPendingWitness(): boolean {
    return this.value === WillStatusEnum.PENDING_WITNESS;
  }

  public isWitnessed(): boolean {
    return this.value === WillStatusEnum.WITNESSED;
  }

  public isActive(): boolean {
    return this.value === WillStatusEnum.ACTIVE;
  }

  public isRevoked(): boolean {
    return this.value === WillStatusEnum.REVOKED;
  }

  public isSuperseded(): boolean {
    return this.value === WillStatusEnum.SUPERSEDED;
  }

  public isExecuted(): boolean {
    return this.value === WillStatusEnum.EXECUTED;
  }

  public isContested(): boolean {
    return this.value === WillStatusEnum.CONTESTED;
  }

  public isInProbate(): boolean {
    return this.value === WillStatusEnum.PROBATE;
  }

  public isEditable(): boolean {
    return this.isDraft();
  }

  public isFinalized(): boolean {
    return this.isRevoked() || this.isSuperseded() || this.isExecuted();
  }

  public canBeActivated(): boolean {
    return this.isWitnessed();
  }

  public requiresWitnesses(): boolean {
    return this.isDraft() || this.isPendingWitness();
  }
}
