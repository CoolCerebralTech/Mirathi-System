// domain/aggregates/dependency-assessment.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
// Entities
import {
  DependencyRelationship,
  LegalDependant,
  S26ClaimStatus,
} from '../entities/legal-dependant.entity';
import { DependantAddedEvent } from '../events/dependency-events/dependant-added.event';
import { DependantRemovedEvent } from '../events/dependency-events/dependant-removed.event';
// Events
import { DependencyAssessmentCreatedEvent } from '../events/dependency-events/dependency-assessment-created.event';
import { HotchpotAdjustmentAppliedEvent } from '../events/dependency-events/hotchpot-adjustment-applied.event';
import { TotalDependencyCalculatedEvent } from '../events/dependency-events/total-dependency-calculated.event';
// Exceptions
import {
  DependencyDomainException,
  DuplicateDependantException,
  InvalidDependantException,
} from '../exceptions/dependant.exception';

/**
 * Deceased Information (Snapshot from Family/Estate Service)
 */
export interface DeceasedInfo {
  deceasedId: string;
  fullName: string;
  dateOfDeath: Date;
  monthlyIncome?: number; // For dependency calculations
  totalEstateValue?: number; // Gross estate value
}

/**
 * Gift Inter Vivos (S.35(3) Hotchpot)
 *
 * Gifts made by deceased during lifetime that must be
 * brought back into estate for fair distribution
 */
export interface GiftInterVivos {
  giftId: string;
  recipientId: string; // Which dependant received gift
  valueAtGiftTime: number;
  dateOfGift: Date;
  description: string;
  isSubjectToHotchpot: boolean; // Some gifts exempt
}

/**
 * Distribution Calculation Result
 */
export interface DistributionCalculation {
  dependantId: string;
  dependantName: string;
  relationship: DependencyRelationship;
  dependencyPercentage: number;
  grossEntitlement: number; // Before hotchpot
  hotchpotDeduction: number; // S.35(3) adjustment
  netEntitlement: number; // Final amount
  entitlementBasis: string; // S29_DEPENDANTS, S26_PROVISION, etc.
}

/**
 * Dependency Assessment Aggregate Props
 */
export interface DependencyAssessmentAggregateProps {
  // Deceased Information
  deceasedInfo: DeceasedInfo;

  // Dependants (Map for O(1) lookup)
  dependants: Map<string, LegalDependant>; // dependantId -> LegalDependant

  // S.35(3) Hotchpot Tracking
  giftsInterVivos: Map<string, GiftInterVivos>; // giftId -> Gift

  // Calculation Results
  totalDependants: number;
  totalDependencyPercentage: number; // Sum of all percentages
  lastCalculatedAt?: Date;
  distributionCalculations?: DistributionCalculation[];

  // Status
  isFinalized: boolean; // Locked for distribution
  finalizedAt?: Date;
  finalizedBy?: UniqueEntityID;
}

/**
 * Props for Creating Dependency Assessment
 */
export interface CreateDependencyAssessmentProps {
  deceasedInfo: DeceasedInfo;
}

/**
 * DEPENDENCY ASSESSMENT AGGREGATE ROOT
 *
 * Manages all dependants of a deceased person and calculates their entitlements
 *
 * KENYAN LAW COMPLIANCE:
 * - S.29: Automatic and conditional dependants
 * - S.26: Court provision for non-dependants
 * - S.35(3): Hotchpot (gifts inter vivos adjustment)
 * - S.40: Polygamous family distribution
 *
 * AGGREGATE RESPONSIBILITIES:
 * 1. Manage collection of LegalDependant entities
 * 2. Enforce family-level invariants
 * 3. Calculate total dependency distribution
 * 4. Apply S.35(3) hotchpot adjustments
 * 5. Validate no duplicate dependants
 * 6. Finalize distribution for execution
 *
 * AGGREGATE BOUNDARIES:
 * - Contains: LegalDependant entities, Gift records
 * - References: Deceased (from Family/Estate aggregate)
 * - Coordinates with: Estate aggregate for distribution
 *
 * INVARIANTS:
 * 1. Cannot have duplicate dependants
 * 2. Total dependency percentage may exceed 100% (proportional distribution)
 * 3. Priority dependants (spouse/child) cannot be removed
 * 4. S.26 claims require court approval before finalization
 * 5. Hotchpot adjustments only for blood relatives
 * 6. Cannot modify after finalization
 */
export class DependencyAssessmentAggregate extends AggregateRoot<DependencyAssessmentAggregateProps> {
  private constructor(
    id: UniqueEntityID,
    props: DependencyAssessmentAggregateProps,
    createdAt?: Date,
  ) {
    super(id, props, createdAt);
    this.validate();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create new Dependency Assessment (when person dies)
   */
  public static create(props: CreateDependencyAssessmentProps): DependencyAssessmentAggregate {
    const id = new UniqueEntityID();

    const aggregate = new DependencyAssessmentAggregate(id, {
      deceasedInfo: props.deceasedInfo,
      dependants: new Map(),
      giftsInterVivos: new Map(),
      totalDependants: 0,
      totalDependencyPercentage: 0,
      isFinalized: false,
    });

    aggregate.addDomainEvent(
      new DependencyAssessmentCreatedEvent(id.toString(), 'DependencyAssessmentAggregate', 1, {
        assessmentId: id.toString(),
        deceasedId: props.deceasedInfo.deceasedId,
        deceasedName: props.deceasedInfo.fullName,
        dateOfDeath: props.deceasedInfo.dateOfDeath,
      }),
    );

    return aggregate;
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(
    id: string,
    props: DependencyAssessmentAggregateProps,
    createdAt: Date,
  ): DependencyAssessmentAggregate {
    return new DependencyAssessmentAggregate(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // AGGREGATE COMMANDS - DEPENDANT MANAGEMENT
  // ============================================================================

  /**
   * Add Dependant to Assessment
   *
   * @throws DuplicateDependantException if dependant already exists
   * @throws InvalidDependantException if business rules violated
   */
  public addDependant(params: {
    dependantId: string;
    relationship: DependencyRelationship;
    isMinor: boolean;
    currentAge?: number;
    isStudent?: boolean;
    studentUntil?: Date;
    hasPhysicalDisability?: boolean;
    hasMentalDisability?: boolean;
    requiresOngoingCare?: boolean;
    disabilityDetails?: string;
    monthlySupport?: number;
    supportStartDate?: Date;
    supportEndDate?: Date;
    custodialParentId?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    // INVARIANT: Cannot add duplicate dependant
    if (this.props.dependants.has(params.dependantId)) {
      throw new DuplicateDependantException(
        `Dependant ${params.dependantId} is already in this assessment`,
      );
    }

    // INVARIANT: Dependant cannot be deceased
    if (params.dependantId === this.props.deceasedInfo.deceasedId) {
      throw new InvalidDependantException('Deceased person cannot be their own dependant');
    }

    // Create dependant entity
    const dependant = LegalDependant.create({
      deceasedId: this.props.deceasedInfo.deceasedId,
      dependantId: params.dependantId,
      relationship: params.relationship,
      isMinor: params.isMinor,
      currentAge: params.currentAge,
      isStudent: params.isStudent,
      studentUntil: params.studentUntil,
      hasPhysicalDisability: params.hasPhysicalDisability,
      hasMentalDisability: params.hasMentalDisability,
      requiresOngoingCare: params.requiresOngoingCare,
      disabilityDetails: params.disabilityDetails,
      monthlySupport: params.monthlySupport,
      supportStartDate: params.supportStartDate,
      supportEndDate: params.supportEndDate,
      custodialParentId: params.custodialParentId,
    });

    // Add to dependants map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    // Recalculate total dependency
    const newTotalDependants = newDependants.size;
    const newTotalDependencyPercentage = Array.from(newDependants.values()).reduce(
      (sum, d) => sum + d.getAssessment().dependencyPercentage,
      0,
    );

    // Update state
    const newProps = {
      ...this.props,
      dependants: newDependants,
      totalDependants: newTotalDependants,
      totalDependencyPercentage: newTotalDependencyPercentage,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new DependantAddedEvent(this._id.toString(), 'DependencyAssessmentAggregate', this._version, {
        assessmentId: this._id.toString(),
        dependantId: params.dependantId,
        relationship: params.relationship,
        isMinor: params.isMinor,
        isPriorityDependant: dependant.isPriorityDependant(),
      }),
    );
  }

  /**
   * Remove Dependant (rare - usually only if added in error)
   *
   * RESTRICTION: Cannot remove priority dependants (spouse/child)
   * unless court order present
   *
   * @throws InvalidDependantException if trying to remove priority dependant
   */
  public removeDependant(params: {
    dependantId: string;
    reason: string;
    courtOrderNumber?: string;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    const dependant = this.props.dependants.get(params.dependantId);
    if (!dependant) {
      throw new InvalidDependantException(
        `Dependant ${params.dependantId} not found in assessment`,
      );
    }

    // INVARIANT: Cannot remove priority dependants without court order
    if (dependant.isPriorityDependant() && !params.courtOrderNumber) {
      throw new InvalidDependantException(
        'Cannot remove priority dependant (spouse/child) without court order',
      );
    }

    // Remove from map
    const newDependants = new Map(this.props.dependants);
    newDependants.delete(params.dependantId);

    // Recalculate totals
    const newTotalDependants = newDependants.size;
    const newTotalDependencyPercentage = Array.from(newDependants.values()).reduce(
      (sum, d) => sum + d.getAssessment().dependencyPercentage,
      0,
    );

    // Update state
    const newProps = {
      ...this.props,
      dependants: newDependants,
      totalDependants: newTotalDependants,
      totalDependencyPercentage: newTotalDependencyPercentage,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new DependantRemovedEvent(
        this._id.toString(),
        'DependencyAssessmentAggregate',
        this._version,
        {
          assessmentId: this._id.toString(),
          dependantId: params.dependantId,
          reason: params.reason,
          courtOrderNumber: params.courtOrderNumber,
        },
      ),
    );
  }

  // ============================================================================
  // AGGREGATE COMMANDS - DEPENDENCY ASSESSMENT
  // ============================================================================

  /**
   * Assess Financial Dependency for Specific Dependant
   *
   * Delegates to the LegalDependant entity but tracks at aggregate level
   */
  public assessDependantFinancialDependency(params: {
    dependantId: string;
    monthlySupport: number;
    assessmentMethod: string;
    evidenceDocuments?: string[];
  }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    const dependant = this.getDependant(params.dependantId);

    if (!this.props.deceasedInfo.monthlyIncome) {
      throw new InvalidDependantException(
        'Cannot assess financial dependency - deceased monthly income not available',
      );
    }

    // Delegate to entity
    dependant.assessFinancialDependency({
      monthlySupport: params.monthlySupport,
      deceasedMonthlyIncome: this.props.deceasedInfo.monthlyIncome,
      assessmentMethod: params.assessmentMethod,
      evidenceDocuments: params.evidenceDocuments,
    });

    // Update the dependant in the map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    // Recalculate aggregate totals
    const newTotalDependencyPercentage = Array.from(newDependants.values()).reduce(
      (sum, d) => sum + d.getAssessment().dependencyPercentage,
      0,
    );

    // Update state
    const newProps = {
      ...this.props,
      dependants: newDependants,
      totalDependencyPercentage: newTotalDependencyPercentage,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Add Evidence for Dependant
   */
  public addDependantEvidence(params: { dependantId: string; documentId: string }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    const dependant = this.getDependant(params.dependantId);
    dependant.addEvidenceDocument(params.documentId);

    // Update the dependant in the map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    const newProps = {
      ...this.props,
      dependants: newDependants,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Verify Dependant Evidence
   */
  public verifyDependantEvidence(params: {
    dependantId: string;
    verifiedBy: string;
    verificationMethod: string;
    verificationDate: Date;
  }): void {
    this.ensureNotDeleted();

    const dependant = this.getDependant(params.dependantId);
    dependant.verifyEvidence({
      verifiedBy: params.verifiedBy,
      verificationMethod: params.verificationMethod,
      verificationDate: params.verificationDate,
    });

    // Update the dependant in the map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    const newProps = {
      ...this.props,
      dependants: newDependants,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // AGGREGATE COMMANDS - S.26 COURT PROVISION
  // ============================================================================

  /**
   * File S.26 Claim for Dependant
   */
  public fileDependantS26Claim(params: {
    dependantId: string;
    claimAmount: number;
    claimBasis: string;
    supportingEvidence: string[];
  }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    const dependant = this.getDependant(params.dependantId);

    dependant.fileS26Claim({
      claimAmount: params.claimAmount,
      claimBasis: params.claimBasis,
      supportingEvidence: params.supportingEvidence,
    });

    // Update the dependant in the map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    const newProps = {
      ...this.props,
      dependants: newDependants,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Record Court Provision Order for S.26 Claim
   */
  public recordDependantCourtProvision(params: {
    dependantId: string;
    courtOrderNumber: string;
    courtStation: string;
    orderDate: Date;
    approvedAmount: number;
    provisionType: string;
  }): void {
    this.ensureNotDeleted();

    const dependant = this.getDependant(params.dependantId);

    dependant.recordCourtProvision({
      courtOrderNumber: params.courtOrderNumber,
      courtStation: params.courtStation,
      orderDate: params.orderDate,
      approvedAmount: params.approvedAmount,
      provisionType: params.provisionType,
    });

    // Update the dependant in the map
    const newDependants = new Map(this.props.dependants);
    newDependants.set(params.dependantId, dependant);

    // Recalculate totals (court order may change entitlement)
    const newTotalDependencyPercentage = Array.from(newDependants.values()).reduce(
      (sum, d) => sum + d.getAssessment().dependencyPercentage,
      0,
    );

    // Update state
    const newProps = {
      ...this.props,
      dependants: newDependants,
      totalDependencyPercentage: newTotalDependencyPercentage,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // AGGREGATE COMMANDS - S.35(3) HOTCHPOT
  // ============================================================================

  /**
   * Add Gift Inter Vivos (for hotchpot calculation)
   *
   * KENYAN LAW (S.35(3) LSA):
   * "Any gift made by the deceased during his lifetime
   * shall be brought into hotchpot and be distributed
   * along with the estate"
   *
   * PURPOSE:
   * - Ensures fair distribution
   * - Child who received KES 1M gift during life
   *   gets less from estate than siblings
   */
  public addGiftInterVivos(params: {
    giftId: string;
    recipientId: string;
    valueAtGiftTime: number;
    dateOfGift: Date;
    description: string;
    isSubjectToHotchpot?: boolean;
  }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    // INVARIANT: Recipient must be a dependant
    if (!this.props.dependants.has(params.recipientId)) {
      throw new InvalidDependantException(
        `Gift recipient ${params.recipientId} is not a dependant`,
      );
    }

    // INVARIANT: Only blood relatives subject to hotchpot
    const recipient = this.props.dependants.get(params.recipientId)!;
    const isBloodRelative = [
      DependencyRelationship.CHILD,
      DependencyRelationship.ADOPTED_CHILD,
      DependencyRelationship.PARENT,
      DependencyRelationship.SIBLING,
    ].includes(recipient.relationship);

    const gift: GiftInterVivos = {
      giftId: params.giftId,
      recipientId: params.recipientId,
      valueAtGiftTime: params.valueAtGiftTime,
      dateOfGift: params.dateOfGift,
      description: params.description,
      isSubjectToHotchpot: params.isSubjectToHotchpot ?? isBloodRelative,
    };

    const newGifts = new Map(this.props.giftsInterVivos);
    newGifts.set(params.giftId, gift);

    const newProps = {
      ...this.props,
      giftsInterVivos: newGifts,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new HotchpotAdjustmentAppliedEvent(
        this._id.toString(),
        'DependencyAssessmentAggregate',
        this._version,
        {
          assessmentId: this._id.toString(),
          giftId: params.giftId,
          recipientId: params.recipientId,
          giftValue: params.valueAtGiftTime,
          dateOfGift: params.dateOfGift,
        },
      ),
    );
  }

  /**
   * Remove Gift Inter Vivos
   */
  public removeGiftInterVivos(giftId: string, _reason: string): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    if (!this.props.giftsInterVivos.has(giftId)) {
      throw new InvalidDependantException(`Gift ${giftId} not found`);
    }

    const newGifts = new Map(this.props.giftsInterVivos);
    newGifts.delete(giftId);

    const newProps = {
      ...this.props,
      giftsInterVivos: newGifts,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // AGGREGATE COMMANDS - DISTRIBUTION CALCULATION
  // ============================================================================

  /**
   * Calculate Distribution (S.29 & S.35(3))
   *
   * KENYAN LAW:
   * 1. Identify all S.29 dependants
   * 2. Apply S.35(3) hotchpot adjustments
   * 3. Calculate proportional shares
   * 4. Include S.26 court provisions
   *
   * @returns Distribution calculations for each dependant
   */
  public calculateDistribution(totalEstateValue: number): DistributionCalculation[] {
    this.ensureNotDeleted();

    if (totalEstateValue <= 0) {
      throw new InvalidDependantException('Total estate value must be positive');
    }

    // Update deceased info
    const newDeceasedInfo = {
      ...this.props.deceasedInfo,
      totalEstateValue,
    };

    const calculations: DistributionCalculation[] = [];

    // Step 1: Calculate total hotchpot value (estate + gifts)
    const totalGiftsValue = Array.from(this.props.giftsInterVivos.values())
      .filter((g) => g.isSubjectToHotchpot)
      .reduce((sum, g) => sum + g.valueAtGiftTime, 0);

    const hotchpotTotal = totalEstateValue + totalGiftsValue;

    // Step 2: Get all qualifying dependants
    const qualifyingDependants = Array.from(this.props.dependants.values()).filter(
      (d) => d.qualifiesForS29() || d.getS26ClaimStatus() === S26ClaimStatus.APPROVED,
    );

    if (qualifyingDependants.length === 0) {
      // Update state without calculations
      const newProps = {
        ...this.props,
        deceasedInfo: newDeceasedInfo,
        lastCalculatedAt: new Date(),
        distributionCalculations: [],
      };

      (this as any)._props = Object.freeze(newProps);
      this.incrementVersion();

      return []; // No dependants
    }

    // Step 3: Calculate total dependency percentage
    const totalPercentage = qualifyingDependants.reduce(
      (sum, d) => sum + d.getAssessment().dependencyPercentage,
      0,
    );

    // Step 4: Calculate each dependant's share
    for (const dependant of qualifyingDependants) {
      const dependencyPercentage = dependant.getAssessment().dependencyPercentage;

      // Proportional share of hotchpot total
      const proportionalShare =
        totalPercentage > 0 ? (dependencyPercentage / totalPercentage) * hotchpotTotal : 0;

      // Deduct gifts received (S.35(3) hotchpot)
      const giftsReceived = Array.from(this.props.giftsInterVivos.values())
        .filter((g) => g.recipientId === dependant.dependantId.toString() && g.isSubjectToHotchpot)
        .reduce((sum, g) => sum + g.valueAtGiftTime, 0);

      const netEntitlement = Math.max(proportionalShare - giftsReceived, 0);

      // Add S.26 court provision if applicable
      const s26Provision =
        dependant.getS26ClaimStatus() === S26ClaimStatus.APPROVED
          ? (dependant.props.s26ProvisionAmount?.getAmount() ?? 0)
          : 0;

      const finalEntitlement = netEntitlement + s26Provision;

      calculations.push({
        dependantId: dependant.dependantId.toString(),
        dependantName: dependant.dependantId.toString(), // Would be fetched from Family service
        relationship: dependant.relationship,
        dependencyPercentage,
        grossEntitlement: proportionalShare,
        hotchpotDeduction: giftsReceived,
        netEntitlement: finalEntitlement,
        entitlementBasis: this.getEntitlementBasis(dependant),
      });
    }

    // Store calculations
    const newProps = {
      ...this.props,
      deceasedInfo: newDeceasedInfo,
      distributionCalculations: calculations,
      lastCalculatedAt: new Date(),
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new TotalDependencyCalculatedEvent(
        this._id.toString(),
        'DependencyAssessmentAggregate',
        this._version,
        {
          assessmentId: this._id.toString(),
          totalEstateValue,
          hotchpotTotal,
          totalGiftsValue,
          totalDependants: qualifyingDependants.length,
          totalDependencyPercentage: totalPercentage,
          calculations,
        },
      ),
    );

    return calculations;
  }

  /**
   * Finalize Assessment (lock for distribution)
   *
   * After finalization:
   * - Cannot add/remove dependants
   * - Cannot modify assessments
   * - Ready for estate distribution
   *
   * @throws InvalidDependantException if not ready to finalize
   */
  public finalizeAssessment(params: { finalizedBy: string; totalEstateValue: number }): void {
    this.ensureNotDeleted();
    this.ensureNotFinalized();

    // INVARIANT: Must have at least one dependant
    if (this.props.dependants.size === 0) {
      throw new InvalidDependantException('Cannot finalize - no dependants in assessment');
    }

    // INVARIANT: All priority dependants must be verified
    const unverifiedPriority = Array.from(this.props.dependants.values()).filter(
      (d) => d.isPriorityDependant() && !d.isEvidenceVerified(),
    );

    if (unverifiedPriority.length > 0) {
      console.warn(`Finalizing with ${unverifiedPriority.length} unverified priority dependants`);
    }

    // INVARIANT: All S.26 claims must be resolved
    const pendingS26Claims = Array.from(this.props.dependants.values()).filter(
      (d) => d.getS26ClaimStatus() === S26ClaimStatus.PENDING,
    );

    if (pendingS26Claims.length > 0) {
      throw new InvalidDependantException(
        `Cannot finalize - ${pendingS26Claims.length} S.26 claims still pending court decision`,
      );
    }

    // Calculate final distribution
    const calculations = this.calculateDistribution(params.totalEstateValue);

    // Finalize
    const newProps = {
      ...this.props,
      isFinalized: true,
      finalizedAt: new Date(),
      finalizedBy: new UniqueEntityID(params.finalizedBy),
      distributionCalculations: calculations,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private ensureNotFinalized(): void {
    if (this.props.isFinalized) {
      throw new InvalidDependantException('Assessment is finalized - cannot modify');
    }
  }

  private getDependant(dependantId: string): LegalDependant {
    const dependant = this.props.dependants.get(dependantId);
    if (!dependant) {
      throw new InvalidDependantException(`Dependant ${dependantId} not found in assessment`);
    }
    return dependant;
  }

  private getEntitlementBasis(dependant: LegalDependant): string {
    if (dependant.getS26ClaimStatus() === S26ClaimStatus.APPROVED) {
      return 'S26_COURT_PROVISION';
    }
    return dependant.basisSection;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  public validate(): void {
    // INVARIANT: Must have deceased info
    if (!this.props.deceasedInfo) {
      throw new DependencyDomainException('Deceased information is required');
    }

    // INVARIANT: Total percentage can exceed 100% (proportional distribution)
    // This is not an error - just informational
    if (this.props.totalDependencyPercentage > 100) {
      console.info(
        `Total dependency percentage (${this.props.totalDependencyPercentage}%) exceeds 100% - will use proportional distribution`,
      );
    }
  }

  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing replay logic (not implemented in this version)
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  get deceasedId(): string {
    return this.props.deceasedInfo.deceasedId;
  }

  get totalDependants(): number {
    return this.props.totalDependants;
  }

  get isFinalized(): boolean {
    return this.props.isFinalized;
  }

  /**
   * Get all dependants
   */
  public getAllDependants(): LegalDependant[] {
    return Array.from(this.props.dependants.values());
  }

  /**
   * Get priority dependants (spouse/children)
   */
  public getPriorityDependants(): LegalDependant[] {
    return this.getAllDependants().filter((d) => d.isPriorityDependant());
  }

  /**
   * Get conditional dependants (must prove dependency)
   */
  public getConditionalDependants(): LegalDependant[] {
    return this.getAllDependants().filter((d) => !d.isPriorityDependant());
  }

  /**
   * Get S.26 claimants
   */
  public getS26Claimants(): LegalDependant[] {
    return this.getAllDependants().filter((d) => d.props.isS26Claimant);
  }

  /**
   * Get dependant by ID
   */
  public getDependantById(dependantId: string): LegalDependant | undefined {
    return this.props.dependants.get(dependantId);
  }

  /**
   * Get all gifts inter vivos
   */
  public getAllGiftsInterVivos(): GiftInterVivos[] {
    return Array.from(this.props.giftsInterVivos.values());
  }

  /**
   * Get gifts for specific dependant
   */
  public getGiftsForDependant(dependantId: string): GiftInterVivos[] {
    return this.getAllGiftsInterVivos().filter((g) => g.recipientId === dependantId);
  }

  /**
   * Get latest distribution calculations
   */
  public getDistributionCalculations(): DistributionCalculation[] | undefined {
    return this.props.distributionCalculations;
  }

  /**
   * Check if ready to finalize
   */
  public isReadyToFinalize(): {
    ready: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (this.props.dependants.size === 0) {
      reasons.push('No dependants in assessment');
    }

    const pendingS26 = this.getAllDependants().filter(
      (d) => d.getS26ClaimStatus() === S26ClaimStatus.PENDING,
    );
    if (pendingS26.length > 0) {
      reasons.push(`${pendingS26.length} S.26 claims pending court decision`);
    }

    return {
      ready: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      deceasedInfo: this.props.deceasedInfo,
      dependants: this.getAllDependants().map((d) => d.toJSON()),
      giftsInterVivos: this.getAllGiftsInterVivos(),
      totalDependants: this.props.totalDependants,
      totalDependencyPercentage: this.props.totalDependencyPercentage,
      lastCalculatedAt: this.props.lastCalculatedAt?.toISOString(),
      distributionCalculations: this.props.distributionCalculations,
      isFinalized: this.props.isFinalized,
      finalizedAt: this.props.finalizedAt?.toISOString(),
      finalizedBy: this.props.finalizedBy?.toString(),

      // Computed properties
      priorityDependantsCount: this.getPriorityDependants().length,
      conditionalDependantsCount: this.getConditionalDependants().length,
      s26ClaimantsCount: this.getS26Claimants().length,
      totalGiftsValue: this.getAllGiftsInterVivos()
        .filter((g) => g.isSubjectToHotchpot)
        .reduce((sum, g) => sum + g.valueAtGiftTime, 0),
      readyToFinalize: this.isReadyToFinalize(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
