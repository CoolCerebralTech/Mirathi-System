// domain/value-objects/asset-verification-status.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Asset Verification Status Value Object
 *
 * Tracks asset verification for estate accuracy
 *
 * Legal Context:
 * - S.83 LSA: Executors must provide accurate estate inventory
 * - Court requires verified asset values before grant
 * - Disputed assets block distribution
 *
 * Business Rules:
 * - All assets must reach VERIFIED before distribution
 * - DISPUTED assets require court intervention
 * - REJECTED assets removed from estate inventory
 *
 * Workflow:
 * UNVERIFIED -> PENDING_VERIFICATION -> VERIFIED (happy path)
 *                                   -> REJECTED (error path)
 *                                   -> DISPUTED (requires intervention)
 */

export enum AssetVerificationStatusEnum {
  UNVERIFIED = 'UNVERIFIED', // Initial state
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Documents submitted
  VERIFIED = 'VERIFIED', // Confirmed accurate
  REJECTED = 'REJECTED', // Invalid/fraudulent
  DISPUTED = 'DISPUTED', // Family/creditor dispute
}

export class AssetVerificationStatus extends SimpleValueObject<AssetVerificationStatusEnum> {
  private constructor(value: AssetVerificationStatusEnum) {
    super(value);
  }

  public static create(value: string): AssetVerificationStatus {
    const normalized = value.toUpperCase().replace(/\s+/g, '_');

    if (
      !Object.values(AssetVerificationStatusEnum).includes(
        normalized as AssetVerificationStatusEnum,
      )
    ) {
      throw new ValueObjectValidationError(
        `Invalid verification status: ${value}`,
        'verificationStatus',
      );
    }

    return new AssetVerificationStatus(normalized as AssetVerificationStatusEnum);
  }

  // Factory methods
  public static unverified(): AssetVerificationStatus {
    return new AssetVerificationStatus(AssetVerificationStatusEnum.UNVERIFIED);
  }

  public static pendingVerification(): AssetVerificationStatus {
    return new AssetVerificationStatus(AssetVerificationStatusEnum.PENDING_VERIFICATION);
  }

  public static verified(): AssetVerificationStatus {
    return new AssetVerificationStatus(AssetVerificationStatusEnum.VERIFIED);
  }

  public static rejected(): AssetVerificationStatus {
    return new AssetVerificationStatus(AssetVerificationStatusEnum.REJECTED);
  }

  public static disputed(): AssetVerificationStatus {
    return new AssetVerificationStatus(AssetVerificationStatusEnum.DISPUTED);
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new ValueObjectValidationError('Verification status cannot be empty');
    }

    if (!Object.values(AssetVerificationStatusEnum).includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid verification status: ${this.props.value}`);
    }
  }

  /**
   * Check if asset is verified and ready for distribution
   */
  public isVerified(): boolean {
    return this.value === AssetVerificationStatusEnum.VERIFIED;
  }

  /**
   * Check if asset is pending verification
   */
  public isPending(): boolean {
    return this.value === AssetVerificationStatusEnum.PENDING_VERIFICATION;
  }

  /**
   * Check if asset is unverified
   */
  public isUnverified(): boolean {
    return this.value === AssetVerificationStatusEnum.UNVERIFIED;
  }

  /**
   * Check if asset is rejected
   */
  public isRejected(): boolean {
    return this.value === AssetVerificationStatusEnum.REJECTED;
  }

  /**
   * Check if asset is disputed
   */
  public isDisputed(): boolean {
    return this.value === AssetVerificationStatusEnum.DISPUTED;
  }

  /**
   * Check if asset blocks estate distribution
   */
  public blocksDistribution(): boolean {
    return [
      AssetVerificationStatusEnum.UNVERIFIED,
      AssetVerificationStatusEnum.PENDING_VERIFICATION,
      AssetVerificationStatusEnum.DISPUTED,
    ].includes(this.value);
  }

  /**
   * Check if asset can be included in estate value
   */
  public canBeIncluded(): boolean {
    return [
      AssetVerificationStatusEnum.VERIFIED,
      AssetVerificationStatusEnum.PENDING_VERIFICATION,
    ].includes(this.value);
  }

  /**
   * Check if requires action
   */
  public requiresAction(): boolean {
    return [AssetVerificationStatusEnum.UNVERIFIED, AssetVerificationStatusEnum.DISPUTED].includes(
      this.value,
    );
  }

  /**
   * Get valid transitions from current status
   */
  public getValidTransitions(): AssetVerificationStatusEnum[] {
    switch (this.value) {
      case AssetVerificationStatusEnum.UNVERIFIED:
        return [AssetVerificationStatusEnum.PENDING_VERIFICATION];
      case AssetVerificationStatusEnum.PENDING_VERIFICATION:
        return [
          AssetVerificationStatusEnum.VERIFIED,
          AssetVerificationStatusEnum.REJECTED,
          AssetVerificationStatusEnum.DISPUTED,
        ];
      case AssetVerificationStatusEnum.VERIFIED:
        return [AssetVerificationStatusEnum.DISPUTED]; // Can be disputed later
      case AssetVerificationStatusEnum.DISPUTED:
        return [AssetVerificationStatusEnum.VERIFIED, AssetVerificationStatusEnum.REJECTED];
      case AssetVerificationStatusEnum.REJECTED:
        return []; // Terminal state
    }
  }

  /**
   * Check if transition is allowed
   */
  public canTransitionTo(newStatus: AssetVerificationStatus): boolean {
    const validTransitions = this.getValidTransitions();
    return validTransitions.includes(newStatus.value);
  }

  /**
   * Transition to new status (returns new VO)
   */
  public transitionTo(newStatus: AssetVerificationStatusEnum): AssetVerificationStatus {
    const newVO = new AssetVerificationStatus(newStatus);

    if (!this.canTransitionTo(newVO)) {
      throw new ValueObjectValidationError(
        `Invalid transition from ${this.value} to ${newStatus}`,
        'verificationStatus',
      );
    }

    return newVO;
  }

  /**
   * Get description
   */
  public getDescription(): string {
    switch (this.value) {
      case AssetVerificationStatusEnum.UNVERIFIED:
        return 'Asset not yet submitted for verification';
      case AssetVerificationStatusEnum.PENDING_VERIFICATION:
        return 'Asset verification in progress - documents under review';
      case AssetVerificationStatusEnum.VERIFIED:
        return 'Asset verified and ready for distribution';
      case AssetVerificationStatusEnum.REJECTED:
        return 'Asset rejected - invalid or fraudulent documentation';
      case AssetVerificationStatusEnum.DISPUTED:
        return 'Asset under dispute - requires court intervention';
    }
  }

  /**
   * Get action required
   */
  public getActionRequired(): string | null {
    switch (this.value) {
      case AssetVerificationStatusEnum.UNVERIFIED:
        return 'Submit supporting documents for verification';
      case AssetVerificationStatusEnum.PENDING_VERIFICATION:
        return 'Awaiting verification - no action required';
      case AssetVerificationStatusEnum.DISPUTED:
        return 'Court intervention required - consult legal advisor';
      case AssetVerificationStatusEnum.REJECTED:
        return 'Asset removed from estate - review rejection reason';
      case AssetVerificationStatusEnum.VERIFIED:
        return null;
    }
  }

  /**
   * Get priority level for processing
   */
  public getPriorityLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (this.value) {
      case AssetVerificationStatusEnum.DISPUTED:
        return 'HIGH';
      case AssetVerificationStatusEnum.PENDING_VERIFICATION:
        return 'MEDIUM';
      case AssetVerificationStatusEnum.UNVERIFIED:
        return 'MEDIUM';
      case AssetVerificationStatusEnum.VERIFIED:
      case AssetVerificationStatusEnum.REJECTED:
        return 'LOW';
    }
  }

  public getDisplayName(): string {
    return this.value
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get color code for UI display
   */
  public getColorCode(): string {
    switch (this.value) {
      case AssetVerificationStatusEnum.VERIFIED:
        return '#10B981'; // Green
      case AssetVerificationStatusEnum.PENDING_VERIFICATION:
        return '#F59E0B'; // Amber
      case AssetVerificationStatusEnum.UNVERIFIED:
        return '#6B7280'; // Gray
      case AssetVerificationStatusEnum.REJECTED:
        return '#EF4444'; // Red
      case AssetVerificationStatusEnum.DISPUTED:
        return '#DC2626'; // Dark Red
    }
  }
}
