// src/family-service/src/domain/entities/cohabitation-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  CohabitationChildrenAddedEvent,
  CohabitationEndedEvent,
  CohabitationStartedEvent,
  CohabitationVerifiedEvent,
} from '../events/family-events';
import { KenyanCounty } from '../value-objects/family-enums.vo';

/**
 * Cohabitation Record Entity (S.29(5) LSA - "Come-We-Stay")
 *
 * Innovations:
 * 1. S.29(5) LSA compliance for dependency claims
 * 2. Progressive relationship validation (2+ years = legal recognition)
 * 3. Community and witness verification system
 * 4. Children tracking from cohabitation
 * 5. Smart duration calculation for legal qualification
 */
export interface CohabitationRecordProps {
  // Core Information
  familyId: UniqueEntityID;
  partner1Id: UniqueEntityID; // Usually male partner in Kenyan context
  partner2Id: UniqueEntityID; // Usually female partner

  // Cohabitation Details
  relationshipType: 'COME_WE_STAY' | 'LONG_TERM_PARTNERSHIP' | 'DATING' | 'ENGAGED';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;

  // Duration & Legal Qualification
  durationDays: number; // Denormalized for quick queries
  qualifiesForS29: boolean; // S.29(5) Law of Succession Act
  minimumPeriodMet: boolean; // 2+ years cohabitation

  // Residence Details
  sharedResidence: string;
  residenceCounty: KenyanCounty;
  isSeparateHousehold: boolean; // True if not living with parents

  // Evidence & Verification
  affidavitId?: string; // Sworn affidavit document ID
  witnesses: string[]; // Names of witnesses who can attest
  communityAcknowledged: boolean; // Known by neighbors/community
  hasJointUtilities: boolean; // Shared bills, bank accounts, etc.

  // Children from Cohabitation
  childrenIds: UniqueEntityID[];
  hasChildren: boolean;
  childrenBornDuringCohabitation: boolean;

  // Financial Interdependence
  jointFinancialAccounts: boolean;
  jointPropertyOwnership: boolean;
  financialSupportProvided: boolean;
  supportEvidence: string[]; // Receipts, bank transfers, etc.

  // Social Recognition
  knownAsCouple: boolean;
  socialMediaEvidence?: string[]; // Photos, posts together
  familyAcknowledged: boolean; // Both families accept relationship

  // Legal Proceedings
  hasCourtRecognition: boolean;
  courtCaseNumber?: string;
  courtOrderId?: string;

  // Dependency Claims (S.29)
  dependencyClaimFiled: boolean;
  dependencyClaimId?: string;
  dependencyClaimStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';

  // Relationship Quality
  relationshipStability: 'STABLE' | 'VOLATILE' | 'ON_OFF' | 'UNKNOWN';
  separationAttempts: number;
  reconciliationCount: number;

  // Customary Context
  customaryElements: boolean; // E.g., bride price discussions, clan involvement
  clanInvolved: boolean;
  elderMediation: boolean;

  // Health & Safety
  hasDomesticViolenceReports: boolean;
  safetyPlanInPlace: boolean;

  // Future Intentions
  marriagePlanned: boolean;
  plannedMarriageDate?: Date;
  childrenPlanned: boolean;

  // Metadata
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;
  verificationStatus: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verificationNotes?: string;

  // Audit
  lastVerifiedAt?: Date;
  isArchived: boolean;
}

export class CohabitationRecord extends Entity<CohabitationRecordProps> {
  private static readonly MINIMUM_DURATION_DAYS = 730; // 2 years for S.29 qualification
  private static readonly LEGAL_PRESUMPTION_DAYS = 1825; // 5 years for stronger presumption

  private constructor(props: CohabitationRecordProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Cohabitation Record
   */
  public static create(props: CohabitationRecordProps, id?: UniqueEntityID): CohabitationRecord {
    // Validate creation invariants
    CohabitationRecord.validateCreation(props);

    const record = new CohabitationRecord(props, id);

    // Calculate initial duration and qualifications
    record.updateDurationAndQualifications();

    // Record creation event
    record.addDomainEvent(
      new CohabitationStartedEvent({
        recordId: record.id.toString(),
        partner1Id: record.props.partner1Id.toString(),
        partner2Id: record.props.partner2Id.toString(),
        startDate: record.props.startDate,
        createdBy: record.props.createdBy.toString(),
        timestamp: record.createdAt,
      }),
    );

    return record;
  }

  /**
   * Restore from persistence
   */
  public static restore(
    props: CohabitationRecordProps,
    id: UniqueEntityID,
    createdAt: Date,
  ): CohabitationRecord {
    return new CohabitationRecord(props, id, createdAt);
  }

  /**
   * Update cohabitation information
   */
  public updateInformation(
    updates: Partial<CohabitationRecordProps>,
    updatedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    const changes: Record<string, any> = {};

    // Validate updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const oldValue = (this.props as any)[key];

        // Skip if no change
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;

        // Apply update
        (this.props as any)[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      this.props.lastUpdatedBy = updatedBy;

      // Recalculate derived fields if dates changed
      if (updates.startDate || updates.endDate) {
        this.updateDurationAndQualifications();
      }

      // Update children status if childrenIds changed
      if (updates.childrenIds) {
        this.props.hasChildren = this.props.childrenIds.length > 0;
      }
    }
  }

  /**
   * End cohabitation
   */
  public endCohabitation(
    endDate: Date,
    reason: 'SEPARATION' | 'MARRIAGE' | 'DEATH' | 'RELOCATION' | 'CONFLICT' | 'OTHER',
    details: {
      separationAgreementId?: string;
      deathCertificateId?: string;
      relocationProof?: string;
      conflictMediationReport?: string;
    },
    endedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    if (endDate < this.props.startDate) {
      throw new Error('End date cannot be before start date');
    }

    if (endDate > new Date()) {
      throw new Error('End date cannot be in the future');
    }

    const previousStatus = this.props.isActive;
    this.props.endDate = endDate;
    this.props.isActive = false;
    this.props.lastUpdatedBy = endedBy;

    // Update duration and qualifications
    this.updateDurationAndQualifications();

    // Add relevant evidence
    if (details.separationAgreementId) {
      // This would link to a document
    }

    if (details.deathCertificateId) {
      // Link to death certificate
    }

    // Record end event
    this.addDomainEvent(
      new CohabitationEndedEvent({
        recordId: this.id.toString(),
        partner1Id: this.props.partner1Id.toString(),
        partner2Id: this.props.partner2Id.toString(),
        endDate,
        reason,
        durationDays: this.props.durationDays,
        endedBy: endedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Add child from cohabitation
   */
  public addChild(
    childId: UniqueEntityID,
    birthDate: Date,
    isBiological: boolean,
    addedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    if (this.props.childrenIds.some((id) => id.equals(childId))) {
      throw new Error('Child already exists in this cohabitation');
    }

    // Validate child was born during cohabitation
    if (birthDate < this.props.startDate) {
      throw new Error('Child birth date cannot be before cohabitation started');
    }

    if (this.props.endDate && birthDate > this.props.endDate) {
      throw new Error('Child birth date cannot be after cohabitation ended');
    }

    this.props.childrenIds.push(childId);
    this.props.hasChildren = true;
    this.props.childrenBornDuringCohabitation = true;
    this.props.lastUpdatedBy = addedBy;

    // Record child addition event
    this.addDomainEvent(
      new CohabitationChildrenAddedEvent({
        recordId: this.id.toString(),
        childId: childId.toString(),
        partner1Id: this.props.partner1Id.toString(),
        partner2Id: this.props.partner2Id.toString(),
        birthDate,
        isBiological,
        addedBy: addedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Verify cohabitation with evidence
   */
  public verifyCohabitation(
    evidence: {
      affidavitId: string;
      witnessStatements: string[];
      jointBills?: string[]; // Utility bills, rent receipts
      photographs?: string[]; // Photos together at residence
      neighborAffidavits?: string[]; // Neighbor statements
    },
    verifiedBy: UniqueEntityID,
    confidenceLevel: number, // 0-100
  ): void {
    this.ensureNotArchived();

    this.props.affidavitId = evidence.affidavitId;
    this.props.witnesses = evidence.witnessStatements;
    this.props.communityAcknowledged = true;

    // Update verification status based on evidence strength
    let verificationScore = 0;

    if (evidence.affidavitId) verificationScore += 30;
    if (evidence.witnessStatements.length >= 2) verificationScore += 20;
    if (evidence.jointBills && evidence.jointBills.length > 0) verificationScore += 25;
    if (evidence.neighborAffidavits && evidence.neighborAffidavits.length > 0)
      verificationScore += 15;

    // Update verification status
    const oldStatus = this.props.verificationStatus;
    this.props.verificationStatus = verificationScore >= 70 ? 'VERIFIED' : 'PENDING_VERIFICATION';
    this.props.verificationNotes = `Verified with ${evidence.witnessStatements.length} witnesses, ${evidence.jointBills?.length || 0} joint bills`;
    this.props.lastVerifiedAt = new Date();
    this.props.lastUpdatedBy = verifiedBy;

    // Record verification event
    this.addDomainEvent(
      new CohabitationVerifiedEvent({
        recordId: this.id.toString(),
        partner1Id: this.props.partner1Id.toString(),
        partner2Id: this.props.partner2Id.toString(),
        oldStatus,
        newStatus: this.props.verificationStatus,
        evidenceCount: evidence.witnessStatements.length + (evidence.jointBills?.length || 0),
        verifiedBy: verifiedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Establish financial interdependence
   */
  public establishFinancialInterdependence(
    evidence: {
      jointBankAccount?: string;
      moneyTransferRecords?: string[];
      sharedLoanDocuments?: string[];
      propertyCoOwnership?: string[];
    },
    establishedBy: UniqueEntityID,
  ): void {
    this.props.jointFinancialAccounts = !!evidence.jointBankAccount;
    this.props.jointPropertyOwnership = !!(
      evidence.propertyCoOwnership && evidence.propertyCoOwnership.length > 0
    );
    this.props.financialSupportProvided = true;

    // Add evidence to supportEvidence
    if (evidence.jointBankAccount) {
      this.props.supportEvidence.push(`JOINT_ACCOUNT_${evidence.jointBankAccount}`);
    }

    if (evidence.moneyTransferRecords) {
      this.props.supportEvidence.push(
        ...evidence.moneyTransferRecords.map((r) => `MONEY_TRANSFER_${r}`),
      );
    }

    this.props.lastUpdatedBy = establishedBy;

    // Update S.29 qualification
    this.updateS29Qualification();
  }

  /**
   * File dependency claim (S.29(5))
   */
  public fileDependencyClaim(
    claimId: string,
    courtDetails: {
      caseNumber: string;
      courtStation: string;
      filingDate: Date;
    },
    filedBy: UniqueEntityID,
  ): void {
    if (!this.qualifiesForDependencyClaim()) {
      throw new Error('Cohabitation does not qualify for dependency claim');
    }

    this.props.dependencyClaimFiled = true;
    this.props.dependencyClaimId = claimId;
    this.props.dependencyClaimStatus = 'PENDING';
    this.props.hasCourtRecognition = true;
    this.props.courtCaseNumber = courtDetails.caseNumber;
    this.props.lastUpdatedBy = filedBy;

    // This would trigger estate service to create LegalDependant entity
  }

  /**
   * Update dependency claim status
   */
  public updateDependencyClaim(
    status: 'APPROVED' | 'REJECTED',
    courtOrderId: string,
    decisionDate: Date,
    updatedBy: UniqueEntityID,
  ): void {
    if (!this.props.dependencyClaimFiled) {
      throw new Error('No dependency claim has been filed');
    }

    this.props.dependencyClaimStatus = status;
    this.props.courtOrderId = courtOrderId;

    if (status === 'APPROVED') {
      this.props.hasCourtRecognition = true;
      // This would trigger estate service to update LegalDependant status
    }

    this.props.lastUpdatedBy = updatedBy;
  }

  /**
   * Calculate cohabitation duration and update qualifications
   */
  private updateDurationAndQualifications(): void {
    const endDate = this.props.endDate || new Date();
    const startDate = this.props.startDate;

    // Calculate duration in days
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

    this.props.durationDays = durationDays;

    // Check if minimum period met (2 years for S.29)
    this.props.minimumPeriodMet = durationDays >= CohabitationRecord.MINIMUM_DURATION_DAYS;

    // Update S.29 qualification
    this.updateS29Qualification();
  }

  /**
   * Update S.29 qualification status
   */
  private updateS29Qualification(): void {
    // Qualifies for S.29 if:
    // 1. Minimum period met (2+ years)
    // 2. Has children OR financial interdependence OR community acknowledgment
    // 3. Not ended by death before minimum period

    const meetsDuration = this.props.minimumPeriodMet;
    const hasStrongEvidence =
      this.props.hasChildren ||
      this.props.jointFinancialAccounts ||
      this.props.jointPropertyOwnership ||
      this.props.communityAcknowledged;

    // Check if ended by death before minimum period
    const endedByDeathBeforeQualification =
      this.props.endDate &&
      !this.props.minimumPeriodMet &&
      this.props.dependencyClaimStatus === 'PENDING';

    this.props.qualifiesForS29 =
      meetsDuration && hasStrongEvidence && !endedByDeathBeforeQualification;
  }

  /**
   * Check if cohabitation qualifies for dependency claim
   */
  public qualifiesForDependencyClaim(): boolean {
    return (
      this.props.qualifiesForS29 &&
      this.props.isActive &&
      this.props.verificationStatus === 'VERIFIED'
    );
  }

  /**
   * Get cohabitation strength score (0-100)
   */
  public calculateStrengthScore(): number {
    let score = 0;

    // Duration factor (max 30)
    if (this.props.durationDays >= CohabitationRecord.LEGAL_PRESUMPTION_DAYS) {
      score += 30;
    } else if (this.props.durationDays >= CohabitationRecord.MINIMUM_DURATION_DAYS) {
      score += 20;
    } else if (this.props.durationDays >= 365) {
      // 1 year
      score += 10;
    }

    // Evidence factor (max 25)
    if (this.props.affidavitId) score += 10;
    if (this.props.witnesses.length >= 2) score += 10;
    if (this.props.hasJointUtilities) score += 5;

    // Financial interdependence factor (max 20)
    if (this.props.jointFinancialAccounts) score += 10;
    if (this.props.jointPropertyOwnership) score += 10;

    // Social recognition factor (max 15)
    if (this.props.communityAcknowledged) score += 5;
    if (this.props.familyAcknowledged) score += 5;
    if (this.props.knownAsCouple) score += 5;

    // Children factor (max 10)
    if (this.props.hasChildren) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Get legal presumption level
   */
  public getLegalPresumption(): 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE' {
    const score = this.calculateStrengthScore();

    if (score >= 80) return 'STRONG';
    if (score >= 60) return 'MODERATE';
    if (score >= 40) return 'WEAK';
    return 'NONE';
  }

  /**
   * Get evidence gaps for stronger claim
   */
  public getEvidenceGaps(): string[] {
    const gaps: string[] = [];

    if (!this.props.affidavitId) {
      gaps.push('Missing sworn affidavit');
    }

    if (this.props.witnesses.length < 2) {
      gaps.push('Need at least 2 witnesses');
    }

    if (!this.props.hasJointUtilities) {
      gaps.push('No evidence of shared utilities or bills');
    }

    if (!this.props.communityAcknowledged) {
      gaps.push('Not acknowledged by community/neighbors');
    }

    if (!this.props.familyAcknowledged) {
      gaps.push('Not acknowledged by both families');
    }

    if (!this.props.jointFinancialAccounts && !this.props.jointPropertyOwnership) {
      gaps.push('No evidence of financial interdependence');
    }

    return gaps;
  }

  /**
   * Get timeline of cohabitation events
   */
  public getTimeline(): Array<{
    date: Date;
    event: string;
    details: string;
  }> {
    const timeline = [];

    // Start of cohabitation
    timeline.push({
      date: this.props.startDate,
      event: 'Cohabitation Started',
      details: `Moved to ${this.props.sharedResidence}, ${this.props.residenceCounty}`,
    });

    // Children births
    // In practice, would fetch child birth dates

    // Verification events
    if (this.props.lastVerifiedAt) {
      timeline.push({
        date: this.props.lastVerifiedAt,
        event: 'Relationship Verified',
        details: `Status: ${this.props.verificationStatus}`,
      });
    }

    // Dependency claim filed
    if (this.props.dependencyClaimFiled) {
      // Would have filing date from court
    }

    // End of cohabitation
    if (this.props.endDate) {
      timeline.push({
        date: this.props.endDate,
        event: 'Cohabitation Ended',
        details: `Active: ${this.props.isActive}, Duration: ${this.props.durationDays} days`,
      });
    }

    // Sort by date
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: CohabitationRecordProps): void {
    // Partners cannot be the same
    if (props.partner1Id.equals(props.partner2Id)) {
      throw new Error('Cannot cohabitate with oneself');
    }

    // Start date must be in the past
    if (props.startDate > new Date()) {
      throw new Error('Cohabitation start date cannot be in the future');
    }

    // End date must be after start date if provided
    if (props.endDate && props.endDate <= props.startDate) {
      throw new Error('Cohabitation end date must be after start date');
    }

    // Active cohabitation cannot have end date
    if (props.isActive && props.endDate) {
      throw new Error('Active cohabitation cannot have an end date');
    }

    // Minimum 1 witness required
    if (props.witnesses.length === 0) {
      throw new Error('At least one witness is required for cohabitation record');
    }

    // Residence must be provided
    if (!props.sharedResidence || props.sharedResidence.trim().length === 0) {
      throw new Error('Shared residence address must be provided');
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived cohabitation record: ${this.id.toString()}`);
    }
  }

  /**
   * Archive record (soft delete)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Cohabitation record is already archived');
    }

    this.props.isArchived = true;
    this.props.lastUpdatedBy = archivedBy;
    this.props.verificationNotes = `${this.props.verificationNotes || ''}\nArchived: ${reason}`;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Cohabitation record is not archived');
    }

    this.props.isArchived = false;
    this.props.lastUpdatedBy = restoredBy;
  }

  /**
   * Get cohabitation summary for display
   */
  public getSummary(): Record<string, any> {
    return {
      id: this.id.toString(),
      partner1Id: this.props.partner1Id.toString(),
      partner2Id: this.props.partner2Id.toString(),
      relationshipType: this.props.relationshipType,
      duration: {
        days: this.props.durationDays,
        years: Math.floor(this.props.durationDays / 365),
        months: Math.floor((this.props.durationDays % 365) / 30),
      },
      status: {
        isActive: this.props.isActive,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        qualifiesForS29: this.props.qualifiesForS29,
        minimumPeriodMet: this.props.minimumPeriodMet,
      },
      residence: {
        address: this.props.sharedResidence,
        county: this.props.residenceCounty,
        separateHousehold: this.props.isSeparateHousehold,
      },
      family: {
        hasChildren: this.props.hasChildren,
        childrenCount: this.props.childrenIds.length,
        childrenBornDuring: this.props.childrenBornDuringCohabitation,
      },
      legal: {
        verificationStatus: this.props.verificationStatus,
        dependencyClaimFiled: this.props.dependencyClaimFiled,
        dependencyClaimStatus: this.props.dependencyClaimStatus,
        hasCourtRecognition: this.props.hasCourtRecognition,
        legalPresumption: this.getLegalPresumption(),
      },
      isArchived: this.props.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get computed properties for business logic
   */
  public get computedProperties() {
    return {
      strengthScore: this.calculateStrengthScore(),
      legalPresumption: this.getLegalPresumption(),
      evidenceGaps: this.getEvidenceGaps(),
      timeline: this.getTimeline(),
      relationshipHealth: this.calculateRelationshipHealth(),
      financialInterdependence: this.getFinancialInterdependence(),
      socialRecognition: this.getSocialRecognition(),
      legalRecommendations: this.getLegalRecommendations(),
    };
  }

  private calculateRelationshipHealth(): 'HEALTHY' | 'STABLE' | 'VOLATILE' | 'TERMINATED' {
    if (!this.props.isActive) return 'TERMINATED';

    if (this.props.separationAttempts > 2) return 'VOLATILE';

    if (this.props.relationshipStability === 'STABLE' && this.props.reconciliationCount === 0) {
      return 'HEALTHY';
    }

    return 'STABLE';
  }

  private getFinancialInterdependence(): Record<string, any> {
    return {
      jointAccounts: this.props.jointFinancialAccounts,
      jointProperty: this.props.jointPropertyOwnership,
      financialSupport: this.props.financialSupportProvided,
      supportEvidenceCount: this.props.supportEvidence.length,
      interdependenceScore: this.calculateFinancialInterdependenceScore(),
    };
  }

  private calculateFinancialInterdependenceScore(): number {
    let score = 0;

    if (this.props.jointFinancialAccounts) score += 40;
    if (this.props.jointPropertyOwnership) score += 40;
    if (this.props.financialSupportProvided) score += 20;

    return score;
  }

  private getSocialRecognition(): Record<string, any> {
    return {
      communityAcknowledged: this.props.communityAcknowledged,
      familyAcknowledged: this.props.familyAcknowledged,
      knownAsCouple: this.props.knownAsCouple,
      witnessCount: this.props.witnesses.length,
      customaryElements: this.props.customaryElements,
      clanInvolved: this.props.clanInvolved,
      socialRecognitionScore: this.calculateSocialRecognitionScore(),
    };
  }

  private calculateSocialRecognitionScore(): number {
    let score = 0;

    if (this.props.communityAcknowledged) score += 25;
    if (this.props.familyAcknowledged) score += 25;
    if (this.props.knownAsCouple) score += 20;
    if (this.props.witnesses.length >= 2) score += 15;
    if (this.props.customaryElements) score += 10;
    if (this.props.clanInvolved) score += 5;

    return score;
  }

  private getLegalRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.props.qualifiesForS29 && this.props.isActive) {
      recommendations.push('Continue cohabitation to reach 2-year minimum for S.29 eligibility');
    }

    if (!this.props.affidavitId) {
      recommendations.push('File a sworn affidavit at the nearest commissioner of oaths');
    }

    if (this.props.witnesses.length < 2) {
      recommendations.push('Gather statements from at least 2 witnesses');
    }

    if (!this.props.jointFinancialAccounts && !this.props.jointPropertyOwnership) {
      recommendations.push(
        'Establish joint financial accounts or property ownership for stronger evidence',
      );
    }

    if (!this.props.communityAcknowledged) {
      recommendations.push('Make relationship known to neighbors and community');
    }

    if (this.props.hasChildren && !this.props.dependencyClaimFiled) {
      recommendations.push("Consider filing dependency claim for children's rights");
    }

    return recommendations;
  }

  /**
   * Get cohabitation for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      familyId: this.props.familyId.toString(),
      partners: {
        partner1Id: this.props.partner1Id.toString(),
        partner2Id: this.props.partner2Id.toString(),
      },
      relationship: {
        type: this.props.relationshipType,
        isActive: this.props.isActive,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        stability: this.props.relationshipStability,
        separationAttempts: this.props.separationAttempts,
        reconciliationCount: this.props.reconciliationCount,
      },
      duration: {
        days: this.props.durationDays,
        years: Math.floor(this.props.durationDays / 365),
        qualifiesForS29: this.props.qualifiesForS29,
        minimumPeriodMet: this.props.minimumPeriodMet,
      },
      residence: {
        address: this.props.sharedResidence,
        county: this.props.residenceCounty,
        isSeparateHousehold: this.props.isSeparateHousehold,
      },
      evidence: {
        affidavitId: this.props.affidavitId,
        witnesses: this.props.witnesses,
        hasJointUtilities: this.props.hasJointUtilities,
        supportEvidence: this.props.supportEvidence,
        socialMediaEvidence: this.props.socialMediaEvidence,
      },
      children: {
        childrenIds: this.props.childrenIds.map((id) => id.toString()),
        hasChildren: this.props.hasChildren,
        childrenBornDuringCohabitation: this.props.childrenBornDuringCohabitation,
      },
      financial: {
        jointFinancialAccounts: this.props.jointFinancialAccounts,
        jointPropertyOwnership: this.props.jointPropertyOwnership,
        financialSupportProvided: this.props.financialSupportProvided,
      },
      social: {
        communityAcknowledged: this.props.communityAcknowledged,
        familyAcknowledged: this.props.familyAcknowledged,
        knownAsCouple: this.props.knownAsCouple,
      },
      legal: {
        verificationStatus: this.props.verificationStatus,
        dependencyClaimFiled: this.props.dependencyClaimFiled,
        dependencyClaimId: this.props.dependencyClaimId,
        dependencyClaimStatus: this.props.dependencyClaimStatus,
        hasCourtRecognition: this.props.hasCourtRecognition,
        courtCaseNumber: this.props.courtCaseNumber,
        courtOrderId: this.props.courtOrderId,
      },
      customary: {
        customaryElements: this.props.customaryElements,
        clanInvolved: this.props.clanInvolved,
        elderMediation: this.props.elderMediation,
      },
      safety: {
        hasDomesticViolenceReports: this.props.hasDomesticViolenceReports,
        safetyPlanInPlace: this.props.safetyPlanInPlace,
      },
      future: {
        marriagePlanned: this.props.marriagePlanned,
        plannedMarriageDate: this.props.plannedMarriageDate,
        childrenPlanned: this.props.childrenPlanned,
      },
      computedProperties: this.computedProperties,
      verification: {
        status: this.props.verificationStatus,
        notes: this.props.verificationNotes,
        lastVerifiedAt: this.props.lastVerifiedAt,
      },
      audit: {
        createdBy: this.props.createdBy.toString(),
        lastUpdatedBy: this.props.lastUpdatedBy.toString(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        isArchived: this.props.isArchived,
      },
      metadata: {
        version: this.version,
        isDeleted: this.isDeleted,
      },
    };
  }
}
