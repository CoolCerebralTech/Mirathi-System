// src/family-service/src/domain/entities/family-relationship.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  RelationshipCreatedEvent,
  RelationshipDissolvedEvent,
  RelationshipUpdatedEvent,
  RelationshipVerifiedEvent,
} from '../events/family-relationship-events';
import { KenyanLawSection, RelationshipType } from '../value-objects/family-enums.vo';

/**
 * Family Relationship Entity
 *
 * Innovations:
 * 1. Multi-dimensional relationship tracking (biological, legal, customary)
 * 2. Relationship strength and verification scoring
 * 3. Temporal relationship tracking (relationships that change over time)
 * 4. Legal entitlement mapping (S.26, S.29, S.35, S.40)
 * 5. Smart relationship inference and validation
 */
export interface FamilyRelationshipProps {
  // Core Relationship
  familyId: UniqueEntityID;
  fromMemberId: UniqueEntityID;
  toMemberId: UniqueEntityID;

  // Relationship Type
  relationshipType: RelationshipType;
  inverseRelationshipType: RelationshipType; // Auto-calculated but stored for performance

  // Relationship Dimensions
  isBiological: boolean;
  isLegal: boolean;
  isCustomary: boolean;
  isSpiritual: boolean; // Godparent, etc.

  // Temporal Aspects
  startDate?: Date; // When relationship began (birth, marriage, adoption)
  endDate?: Date; // When relationship ended (death, divorce, emancipation)
  isActive: boolean;

  // Legal Context
  legalBasis?: KenyanLawSection[]; // Which laws recognize this relationship
  legalDocuments: string[]; // IDs of documents proving relationship
  courtOrderId?: string; // For court-established relationships

  // Verification Status
  verificationLevel: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'FULLY_VERIFIED' | 'DISPUTED';
  verificationMethod?: 'DNA' | 'DOCUMENT' | 'FAMILY_CONSENSUS' | 'COURT_ORDER' | 'TRADITIONAL';
  verificationScore: number; // 0-100
  lastVerifiedAt?: Date;
  verifiedBy?: UniqueEntityID;

  // Biological Details (if applicable)
  biologicalConfidence?: number; // 0-100% confidence of biological connection
  dnaTestId?: string;
  dnaMatchPercentage?: number;

  // Legal Details (if applicable)
  adoptionOrderId?: string;
  guardianshipOrderId?: string;
  marriageId?: UniqueEntityID; // Link to marriage entity

  // Customary Details
  customaryRecognition: boolean;
  clanRecognized: boolean;
  elderWitnesses: string[];
  traditionalRite?: string;

  // Relationship Strength
  relationshipStrength: number; // 0-100, based on factors
  closenessIndex: number; // 0-100, perceived closeness
  contactFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'RARELY' | 'NEVER';

  // Dependency & Support
  isFinancialDependent: boolean;
  isCareDependent: boolean;
  dependencyLevel?: 'FULL' | 'PARTIAL' | 'TEMPORARY';
  supportProvided?: {
    financial: boolean;
    housing: boolean;
    medical: boolean;
    educational: boolean;
  };

  // Inheritance Rights
  inheritanceRights: 'FULL' | 'PARTIAL' | 'CUSTOMARY' | 'NONE' | 'PENDING';
  inheritancePercentage?: number;
  disinherited: boolean;
  disinheritanceReason?: string;

  // Communication & Conflict
  communicationLanguage?: string;
  hasConflict: boolean;
  conflictResolutionStatus?: 'RESOLVED' | 'PENDING' | 'MEDIATION' | 'COURT';

  // Cultural Context
  relationshipTerm?: string; // Local language term (e.g., "Mama mdogo")
  culturalSignificance?: string;
  taboos?: string[]; // Cultural taboos related to this relationship

  // Metadata
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;
  notes?: string;

  // Audit
  isArchived: boolean;
}

export class FamilyRelationship extends Entity<FamilyRelationshipProps> {
  public getProps(): FamilyRelationshipProps {
    return { ...this.props };
  }
  private constructor(props: FamilyRelationshipProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Family Relationship
   */
  public static create(props: FamilyRelationshipProps, id?: UniqueEntityID): FamilyRelationship {
    // Validate creation invariants
    FamilyRelationship.validateCreation(props);

    const relationship = new FamilyRelationship(props, id);

    // Calculate initial verification score
    if ((props as any).verificationScore === undefined) {
      (relationship.props as any).verificationScore =
        relationship.calculateInitialVerificationScore();
    }

    // Calculate relationship strength
    if ((props as any).relationshipStrength === undefined) {
      (relationship.props as any).relationshipStrength =
        relationship.calculateRelationshipStrength();
    }

    // Record creation event
    relationship.addDomainEvent(
      new RelationshipCreatedEvent({
        relationshipId: relationship.id.toString(),
        fromMemberId: relationship.props.fromMemberId.toString(),
        toMemberId: relationship.props.toMemberId.toString(),
        relationshipType: relationship.props.relationshipType,
        createdBy: relationship.props.createdBy.toString(),
        timestamp: relationship.createdAt,
      }),
    );

    return relationship;
  }

  /**
   * Restore from persistence
   */
  public static restore(
    props: FamilyRelationshipProps,
    id: UniqueEntityID,
    createdAt: Date,
  ): FamilyRelationship {
    return new FamilyRelationship(props, id, createdAt);
  }

  /**
   * Update relationship information
   */
  public updateInformation(
    updates: Partial<FamilyRelationshipProps>,
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

        // Special handling for relationship type changes
        if (key === 'relationshipType') {
          this.validateRelationshipTypeChange(value as RelationshipType);
        }

        // Apply update
        (this.props as any)[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      (this.props as any).lastUpdatedBy = updatedBy;

      // Recalculate derived fields
      if (
        Object.keys(changes).some((k) =>
          [
            'isBiological',
            'isLegal',
            'isCustomary',
            'verificationMethod',
            'legalDocuments',
          ].includes(k),
        )
      ) {
        (this.props as any).verificationScore = this.calculateVerificationScore();
      }

      if (
        Object.keys(changes).some((k) =>
          ['contactFrequency', 'closenessIndex', 'hasConflict', 'supportProvided'].includes(k),
        )
      ) {
        (this.props as any).relationshipStrength = this.calculateRelationshipStrength();
      }

      this.addDomainEvent(
        new RelationshipUpdatedEvent({
          relationshipId: this.id.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Verify relationship with evidence
   */
  public verifyRelationship(
    verificationMethod: FamilyRelationshipProps['verificationMethod'],
    evidence: {
      documentIds?: string[];
      dnaTestId?: string;
      witnessStatements?: string[];
      courtOrderId?: string;
    },
    verifiedBy: UniqueEntityID,
    _confidenceLevel: number, // 0-100
  ): void {
    this.ensureNotArchived();

    // Update verification details
    (this.props as any).verificationMethod = verificationMethod;
    (this.props as any).lastVerifiedAt = new Date();
    (this.props as any).verifiedBy = verifiedBy;

    // Add evidence
    if (evidence.documentIds) {
      (this.props as any).legalDocuments = [
        ...new Set([...this.props.legalDocuments, ...evidence.documentIds]),
      ];
    }

    if (evidence.dnaTestId) {
      (this.props as any).dnaTestId = evidence.dnaTestId;
      (this.props as any).isBiological = true;
    }

    if (evidence.courtOrderId) {
      (this.props as any).courtOrderId = evidence.courtOrderId;
      (this.props as any).isLegal = true;
    }

    // Update verification level
    const newVerificationScore = this.calculateVerificationScore();
    const oldVerificationScore = this.props.verificationScore;

    (this.props as any).verificationScore = newVerificationScore;
    (this.props as any).verificationLevel = this.mapVerificationScoreToLevel(newVerificationScore);

    // Record verification event
    this.addDomainEvent(
      new RelationshipVerifiedEvent({
        relationshipId: this.id.toString(),
        fromMemberId: this.props.fromMemberId.toString(),
        toMemberId: this.props.toMemberId.toString(),
        verificationMethod,
        oldScore: oldVerificationScore,
        newScore: newVerificationScore,
        verifiedBy: verifiedBy.toString(),
        timestamp: new Date(),
      }),
    );

    (this.props as any).lastUpdatedBy = verifiedBy;
  }

  /**
   * Mark relationship as biologically confirmed
   */
  public confirmBiologicalRelationship(
    dnaTestId: string,
    matchPercentage: number,
    _testingLab: string,
    _testDate: Date,
    confirmedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.isBiological = true;
    props.biologicalConfidence = matchPercentage;
    props.dnaTestId = dnaTestId;
    props.dnaMatchPercentage = matchPercentage;

    // Add DNA test as legal document
    props.legalDocuments.push(`DNA_TEST_${dnaTestId}`);

    this.verifyRelationship('DNA', { dnaTestId }, confirmedBy, matchPercentage);
  }

  /**
   * Establish legal relationship (adoption, guardianship)
   */
  public establishLegalRelationship(
    courtOrderId: string,
    orderType: 'ADOPTION' | 'GUARDIANSHIP' | 'CUSTODY' | 'PARENTAGE',
    orderDate: Date,
    _courtDetails: {
      caseNumber: string;
      courtStation: string;
      judgeName: string;
    },
    establishedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.isLegal = true;
    props.courtOrderId = courtOrderId;
    props.startDate = orderDate;

    // Set appropriate relationship type based on order type
    switch (orderType) {
      case 'ADOPTION':
        if (this.props.relationshipType === RelationshipType.PARENT) {
          props.relationshipType = RelationshipType.ADOPTED_CHILD;
        } else if (this.props.relationshipType === RelationshipType.CHILD) {
          props.relationshipType = RelationshipType.ADOPTED_CHILD;
        }
        props.adoptionOrderId = courtOrderId;
        break;
      case 'GUARDIANSHIP':
        props.relationshipType = RelationshipType.GUARDIAN;
        props.guardianshipOrderId = courtOrderId;
        break;
    }

    // Add court order as legal document
    props.legalDocuments.push(`COURT_ORDER_${courtOrderId}`);

    this.verifyRelationship(
      'COURT_ORDER',
      { courtOrderId },
      establishedBy,
      100, // Court orders are 100% confidence
    );
  }

  /**
   * Recognize customary relationship
   */
  public recognizeCustomaryRelationship(
    elders: string[],
    recognitionDate: Date,
    customaryRite: string,
    _clanRepresentatives: string[],
    recognizedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.isCustomary = true;
    props.customaryRecognition = true;
    props.clanRecognized = true;
    props.elderWitnesses = elders;
    props.traditionalRite = customaryRite;
    props.startDate = recognitionDate;

    // Generate customary document reference
    const customaryDocId = `CUSTOMARY_RECOGNITION_${this.id.toString().substring(0, 8)}`;
    props.legalDocuments.push(customaryDocId);

    this.verifyRelationship(
      'TRADITIONAL',
      { witnessStatements: elders },
      recognizedBy,
      80, // Customary recognition is high confidence
    );
  }

  /**
   * Dissolve relationship (death, divorce, emancipation)
   */
  public dissolveRelationship(
    endDate: Date,
    reason:
      | 'DEATH'
      | 'DIVORCE'
      | 'ANNULMENT'
      | 'EMANCIPATION'
      | 'ADOPTION_REVERSAL'
      | 'CUSTOMARY_DISSOLUTION',
    details: {
      deathCertificateId?: string;
      divorceDecreeId?: string;
      courtOrderId?: string;
      customaryDissolutionDetails?: string;
    },
    dissolvedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    if (endDate < (this.props.startDate || new Date(0))) {
      throw new Error('End date cannot be before start date');
    }

    const props = this.props as any;
    props.endDate = endDate;
    props.isActive = false;
    props.lastUpdatedBy = dissolvedBy;

    // Add relevant documents
    if (details.deathCertificateId) {
      props.legalDocuments.push(details.deathCertificateId);
    }

    if (details.divorceDecreeId) {
      props.legalDocuments.push(details.divorceDecreeId);
    }

    if (details.courtOrderId) {
      props.courtOrderId = details.courtOrderId;
    }

    // Record dissolution event
    this.addDomainEvent(
      new RelationshipDissolvedEvent({
        relationshipId: this.id.toString(),
        fromMemberId: this.props.fromMemberId.toString(),
        toMemberId: this.props.toMemberId.toString(),
        relationshipType: this.props.relationshipType,
        endDate,
        reason,
        dissolvedBy: dissolvedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Update dependency status
   */
  public updateDependencyStatus(
    isFinancialDependent: boolean,
    isCareDependent: boolean,
    dependencyLevel: FamilyRelationshipProps['dependencyLevel'],
    supportDetails: FamilyRelationshipProps['supportProvided'],
    updatedBy: UniqueEntityID,
  ): void {
    const props = this.props as any;
    props.isFinancialDependent = isFinancialDependent;
    props.isCareDependent = isCareDependent;
    props.dependencyLevel = dependencyLevel;
    props.supportProvided = supportDetails;
    props.lastUpdatedBy = updatedBy;

    // Recalculate relationship strength
    props.relationshipStrength = this.calculateRelationshipStrength();
  }

  /**
   * Update inheritance rights
   */
  public updateInheritanceRights(
    inheritanceRights: FamilyRelationshipProps['inheritanceRights'],
    updatedBy: UniqueEntityID,
    inheritancePercentage?: number,
    disinherited?: boolean,
    disinheritanceReason?: string,
  ): void {
    const props = this.props as any;
    props.inheritanceRights = inheritanceRights;
    props.inheritancePercentage = inheritancePercentage;

    if (disinherited !== undefined) {
      props.disinherited = disinherited;
      props.disinheritanceReason = disinheritanceReason;
    }

    props.lastUpdatedBy = updatedBy;
  }

  /**
   * Record conflict or resolution
   */
  public recordConflict(
    recordedBy: UniqueEntityID,
    hasConflict: boolean,
    resolutionStatus?: FamilyRelationshipProps['conflictResolutionStatus'],
    _mediationDetails?: {
      mediator?: string;
      mediationDate?: Date;
      outcome?: string;
    },
  ): void {
    const props = this.props as any;
    props.hasConflict = hasConflict;
    props.conflictResolutionStatus = resolutionStatus;
    props.lastUpdatedBy = recordedBy;

    // Recalculate relationship strength
    props.relationshipStrength = this.calculateRelationshipStrength();
  }

  /**
   * Calculate relationship eligibility for legal claims
   */
  public getLegalEligibility(): {
    s29Eligible: boolean; // Dependency claim
    s35Eligible: boolean; // Spousal/child share
    s40Eligible: boolean; // Polygamous house distribution
    reasons: string[];
  } {
    const reasons: string[] = [];
    let s29Eligible = false;
    let s35Eligible = false;
    let s40Eligible = false;

    // Check basic requirements
    if (!this.props.isActive) {
      reasons.push('Relationship is not active');
      return { s29Eligible, s35Eligible, s40Eligible, reasons };
    }

    if (this.props.disinherited) {
      reasons.push('Member has been disinherited');
      return { s29Eligible, s35Eligible, s40Eligible, reasons };
    }

    // S.29 Eligibility (Dependency)
    if (this.props.isFinancialDependent || this.props.isCareDependent) {
      s29Eligible = true;
      reasons.push('Qualifies as dependent under S.29');
    }

    // S.35 Eligibility (Spouse/Child share)
    if (
      this.props.relationshipType === RelationshipType.SPOUSE ||
      this.props.relationshipType === RelationshipType.CHILD ||
      this.props.relationshipType === RelationshipType.ADOPTED_CHILD
    ) {
      s35Eligible = true;
      reasons.push('Qualifies for share under S.35');
    }

    // S.40 Eligibility (Polygamous house)
    if (
      this.props.relationshipType === RelationshipType.CHILD &&
      this.props.isCustomary &&
      this.props.customaryRecognition
    ) {
      s40Eligible = true;
      reasons.push('Child in polygamous house under S.40');
    }

    // Additional checks
    if (this.props.verificationLevel !== 'FULLY_VERIFIED') {
      reasons.push('Relationship not fully verified');
    }

    if (this.props.hasConflict && this.props.conflictResolutionStatus !== 'RESOLVED') {
      reasons.push('Active conflict may affect claims');
    }

    return { s29Eligible, s35Eligible, s40Eligible, reasons };
  }

  /**
   * Get relationship timeline
   */
  public getTimeline(): Array<{
    date: Date;
    event: string;
    details: string;
  }> {
    const timeline: Array<{ date: Date; event: string; details: string }> = [];

    if (this.props.startDate) {
      timeline.push({
        date: this.props.startDate,
        event: 'Relationship Started',
        details: `Type: ${this.props.relationshipType}`,
      });
    }

    if (this.props.lastVerifiedAt) {
      timeline.push({
        date: this.props.lastVerifiedAt,
        event: 'Relationship Verified',
        details: `Method: ${this.props.verificationMethod}, Score: ${this.props.verificationScore}`,
      });
    }

    if (this.props.endDate) {
      timeline.push({
        date: this.props.endDate,
        event: 'Relationship Ended',
        details: `Active: ${this.props.isActive}`,
      });
    }

    // Sort by date
    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calculate verification score (0-100)
   */
  private calculateVerificationScore(): number {
    let score = 0;

    // Evidence-based scoring
    if (this.props.legalDocuments.length > 0) {
      score += Math.min(this.props.legalDocuments.length * 10, 40);
    }

    if (this.props.dnaTestId) {
      score += Math.min(this.props.dnaMatchPercentage || 0, 30);
    }

    if (this.props.courtOrderId) {
      score += 30;
    }

    // Recognition-based scoring
    if (this.props.isBiological) score += 20;
    if (this.props.isLegal) score += 20;
    if (this.props.isCustomary && this.props.clanRecognized) score += 15;

    // Method-based scoring
    switch (this.props.verificationMethod) {
      case 'DNA':
        score += 25;
        break;
      case 'COURT_ORDER':
        score += 30;
        break;
      case 'DOCUMENT':
        score += 20;
        break;
      case 'FAMILY_CONSENSUS':
        score += 15;
        break;
      case 'TRADITIONAL':
        score += 10;
        break;
    }

    // Cap at 100
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculate initial verification score
   */
  private calculateInitialVerificationScore(): number {
    // Base score based on relationship type
    let baseScore = 0;

    switch (this.props.relationshipType) {
      case RelationshipType.PARENT:
      case RelationshipType.CHILD:
        baseScore = 30; // Usually well-documented
        break;
      case RelationshipType.SPOUSE:
        baseScore = 40; // Usually legally documented
        break;
      case RelationshipType.SIBLING:
        baseScore = 25;
        break;
      default:
        baseScore = 10;
    }

    // Adjust based on dimensions
    if (this.props.isBiological) baseScore += 20;
    if (this.props.isLegal) baseScore += 25;
    if (this.props.isCustomary) baseScore += 15;

    return Math.min(baseScore, 100);
  }

  /**
   * Calculate relationship strength (0-100)
   */
  private calculateRelationshipStrength(): number {
    let strength = 50; // Base strength

    // Contact frequency factor
    const contactScores = {
      DAILY: 30,
      WEEKLY: 25,
      MONTHLY: 20,
      YEARLY: 10,
      RARELY: 5,
      NEVER: 0,
    };
    strength += contactScores[this.props.contactFrequency] || 0;

    // Closeness index factor
    strength += (this.props.closenessIndex || 0) * 0.2;

    // Dependency factor
    if (this.props.isFinancialDependent || this.props.isCareDependent) {
      strength += 15;
    }

    // Support provided factor
    if (this.props.supportProvided) {
      let supportScore = 0;
      if (this.props.supportProvided.financial) supportScore += 5;
      if (this.props.supportProvided.housing) supportScore += 5;
      if (this.props.supportProvided.medical) supportScore += 5;
      if (this.props.supportProvided.educational) supportScore += 5;
      strength += supportScore;
    }

    // Conflict factor (negative)
    if (this.props.hasConflict && this.props.conflictResolutionStatus !== 'RESOLVED') {
      strength -= 20;
    }

    // Cap at 0-100
    return Math.min(Math.max(strength, 0), 100);
  }

  /**
   * Map verification score to level
   */
  private mapVerificationScoreToLevel(score: number): FamilyRelationshipProps['verificationLevel'] {
    if (score >= 90) return 'FULLY_VERIFIED';
    if (score >= 70) return 'PARTIALLY_VERIFIED';
    if (score >= 30) return 'UNVERIFIED';
    return 'DISPUTED';
  }

  /**
   * Validate relationship type change
   */
  private validateRelationshipTypeChange(newType: RelationshipType): void {
    const oldType = this.props.relationshipType;

    // Some changes are not allowed
    const forbiddenTransitions = [
      [RelationshipType.PARENT, RelationshipType.CHILD], // Can't swap parent-child
      [RelationshipType.CHILD, RelationshipType.PARENT],
    ];

    for (const [from, to] of forbiddenTransitions) {
      if (oldType === from && newType === to) {
        throw new Error(`Cannot change relationship from ${from} to ${to}`);
      }
    }

    // Update inverse relationship
    (this.props as any).inverseRelationshipType = this.calculateInverseRelationshipType(newType);
  }

  /**
   * Calculate inverse relationship type
   */
  private calculateInverseRelationshipType(type: RelationshipType): RelationshipType {
    const inverseMap: Record<RelationshipType, RelationshipType> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.GUARDIAN]: RelationshipType.OTHER,
      [RelationshipType.OTHER]: RelationshipType.OTHER,
    };

    return inverseMap[type] || RelationshipType.OTHER;
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: FamilyRelationshipProps): void {
    // Members cannot be the same
    if (props.fromMemberId.equals(props.toMemberId)) {
      throw new Error('Cannot create relationship to self');
    }

    // Must have at least one dimension
    if (!props.isBiological && !props.isLegal && !props.isCustomary && !props.isSpiritual) {
      throw new Error(
        'Relationship must have at least one dimension (biological, legal, customary, or spiritual)',
      );
    }

    // Start date cannot be in future
    if (props.startDate && props.startDate > new Date()) {
      throw new Error('Relationship start date cannot be in the future');
    }

    // End date must be after start date if both exist
    if (props.startDate && props.endDate && props.endDate < props.startDate) {
      throw new Error('Relationship end date cannot be before start date');
    }

    // Active relationships cannot have end date
    if (props.isActive && props.endDate) {
      throw new Error('Active relationship cannot have an end date');
    }

    // Verification score must be 0-100
    if (props.verificationScore < 0 || props.verificationScore > 100) {
      throw new Error('Verification score must be between 0 and 100');
    }

    // Biological confidence must be 0-100 if provided
    if (props.biologicalConfidence !== undefined) {
      if (props.biologicalConfidence < 0 || props.biologicalConfidence > 100) {
        throw new Error('Biological confidence must be between 0 and 100');
      }
    }

    // DNA match percentage must be 0-100 if provided
    if (props.dnaMatchPercentage !== undefined) {
      if (props.dnaMatchPercentage < 0 || props.dnaMatchPercentage > 100) {
        throw new Error('DNA match percentage must be between 0 and 100');
      }
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived relationship: ${this.id.toString()}`);
    }
  }

  /**
   * Archive relationship (soft delete)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Relationship is already archived');
    }

    const props = this.props as any;
    props.isArchived = true;
    props.lastUpdatedBy = archivedBy;
    props.notes = `${this.props.notes || ''}\nArchived: ${reason}`;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Relationship is not archived');
    }

    const props = this.props as any;
    props.isArchived = false;
    props.lastUpdatedBy = restoredBy;
  }

  /**
   * Get relationship summary for display
   */
  public getSummary(): Record<string, any> {
    const eligibility = this.getLegalEligibility();

    return {
      id: this.id.toString(),
      fromMemberId: this.props.fromMemberId.toString(),
      toMemberId: this.props.toMemberId.toString(),
      relationshipType: this.props.relationshipType,
      inverseType: this.props.inverseRelationshipType,
      dimensions: {
        biological: this.props.isBiological,
        legal: this.props.isLegal,
        customary: this.props.isCustomary,
        spiritual: this.props.isSpiritual,
      },
      verification: {
        level: this.props.verificationLevel,
        score: this.props.verificationScore,
        method: this.props.verificationMethod,
        lastVerifiedAt: this.props.lastVerifiedAt,
      },
      status: {
        isActive: this.props.isActive,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        hasConflict: this.props.hasConflict,
        conflictResolution: this.props.conflictResolutionStatus,
      },
      strength: {
        relationshipStrength: this.props.relationshipStrength,
        closenessIndex: this.props.closenessIndex,
        contactFrequency: this.props.contactFrequency,
      },
      legalEligibility: eligibility,
      inheritance: {
        rights: this.props.inheritanceRights,
        percentage: this.props.inheritancePercentage,
        disinherited: this.props.disinherited,
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
    const eligibility = this.getLegalEligibility();
    const timeline = this.getTimeline();

    return {
      eligibility,
      timeline,
      relationshipHealth: this.calculateRelationshipHealth(),
      evidenceSummary: this.getEvidenceSummary(),
      culturalContext: this.getCulturalContext(),
      dependencyAnalysis: this.getDependencyAnalysis(),
      inheritanceAnalysis: this.getInheritanceAnalysis(),
      relationshipQuality: this.getRelationshipQuality(),
    };
  }

  private calculateRelationshipHealth(): string {
    const strength = this.props.relationshipStrength;
    const verification = this.props.verificationScore;
    const conflict = this.props.hasConflict;

    if (conflict && this.props.conflictResolutionStatus !== 'RESOLVED') {
      return 'CONFLICTED';
    }

    if (strength >= 80 && verification >= 90) {
      return 'EXCELLENT';
    }

    if (strength >= 60 && verification >= 70) {
      return 'GOOD';
    }

    if (strength >= 40 && verification >= 50) {
      return 'FAIR';
    }

    return 'POOR';
  }

  private getEvidenceSummary(): Record<string, any> {
    return {
      documentCount: this.props.legalDocuments.length,
      hasDNAEvidence: !!this.props.dnaTestId,
      hasCourtOrder: !!this.props.courtOrderId,
      hasCustomaryRecognition: this.props.customaryRecognition,
      elderWitnesses: this.props.elderWitnesses.length,
      evidenceGaps: this.identifyEvidenceGaps(),
    };
  }

  private identifyEvidenceGaps(): string[] {
    const gaps: string[] = [];

    if (this.props.isBiological && !this.props.dnaTestId) {
      gaps.push('Missing DNA evidence for biological claim');
    }

    if (this.props.isLegal && !this.props.courtOrderId) {
      gaps.push('Missing court order for legal claim');
    }

    if (this.props.isCustomary && this.props.elderWitnesses.length < 2) {
      gaps.push('Insufficient elder witnesses for customary claim');
    }

    if (this.props.legalDocuments.length === 0) {
      gaps.push('No supporting documents');
    }

    return gaps;
  }

  private getCulturalContext(): Record<string, any> {
    return {
      relationshipTerm: this.props.relationshipTerm,
      culturalSignificance: this.props.culturalSignificance,
      taboos: this.props.taboos,
      clanRecognized: this.props.clanRecognized,
      traditionalRite: this.props.traditionalRite,
      communicationLanguage: this.props.communicationLanguage,
    };
  }

  private getDependencyAnalysis(): Record<string, any> {
    return {
      isDependent: this.props.isFinancialDependent || this.props.isCareDependent,
      dependencyLevel: this.props.dependencyLevel,
      supportAreas: this.props.supportProvided,
      s29Eligibility: this.props.isFinancialDependent || this.props.isCareDependent,
      dependencyScore: this.calculateDependencyScore(),
    };
  }

  private calculateDependencyScore(): number {
    let score = 0;

    if (this.props.isFinancialDependent) score += 40;
    if (this.props.isCareDependent) score += 40;

    if (this.props.dependencyLevel === 'FULL') score += 20;
    else if (this.props.dependencyLevel === 'PARTIAL') score += 10;

    return Math.min(score, 100);
  }

  private getInheritanceAnalysis(): Record<string, any> {
    return {
      inheritanceRights: this.props.inheritanceRights,
      inheritancePercentage: this.props.inheritancePercentage,
      disinherited: this.props.disinherited,
      disinheritanceReason: this.props.disinheritanceReason,
      legalBasis: this.props.legalBasis,
      inheritanceStrength: this.calculateInheritanceStrength(),
    };
  }

  private calculateInheritanceStrength(): number {
    let strength = 0;

    switch (this.props.inheritanceRights) {
      case 'FULL':
        strength = 100;
        break;
      case 'PARTIAL':
        strength = 70;
        break;
      case 'CUSTOMARY':
        strength = 60;
        break;
      case 'NONE':
        strength = 0;
        break;
      case 'PENDING':
        strength = 30;
        break;
    }

    if (this.props.disinherited) {
      strength = 0;
    }

    return strength;
  }

  private getRelationshipQuality(): Record<string, any> {
    return {
      health: this.calculateRelationshipHealth(),
      strength: this.props.relationshipStrength,
      closeness: this.props.closenessIndex,
      contact: this.props.contactFrequency,
      trustLevel: this.calculateTrustLevel(),
      resilience: this.calculateResilience(),
      recommendations: this.getRelationshipRecommendations(),
    };
  }

  private calculateTrustLevel(): string {
    const verification = this.props.verificationScore;
    const strength = this.props.relationshipStrength;

    if (verification >= 90 && strength >= 80) return 'HIGH';
    if (verification >= 70 && strength >= 60) return 'MEDIUM';
    return 'LOW';
  }

  private calculateResilience(): string {
    const conflict = this.props.hasConflict;
    const resolution = this.props.conflictResolutionStatus;
    const strength = this.props.relationshipStrength;

    if (!conflict && strength >= 70) return 'RESILIENT';
    if (conflict && resolution === 'RESOLVED' && strength >= 60) return 'RECOVERING';
    if (conflict && resolution === 'PENDING') return 'VULNERABLE';
    return 'FRAGILE';
  }

  private getRelationshipRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.props.verificationScore < 70) {
      recommendations.push('Gather additional evidence to verify relationship');
    }

    if (this.props.hasConflict && this.props.conflictResolutionStatus !== 'RESOLVED') {
      recommendations.push('Consider mediation to resolve conflicts');
    }

    if (this.props.contactFrequency === 'NEVER' || this.props.contactFrequency === 'RARELY') {
      recommendations.push('Increase contact to strengthen relationship');
    }

    if (this.props.inheritanceRights === 'PENDING') {
      recommendations.push('Clarify inheritance rights through legal channels');
    }

    if (this.props.legalDocuments.length === 0) {
      recommendations.push('Collect supporting documents for legal protection');
    }

    return recommendations;
  }

  /**
   * Get relationship for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      familyId: this.props.familyId.toString(),
      members: {
        fromMemberId: this.props.fromMemberId.toString(),
        toMemberId: this.props.toMemberId.toString(),
      },
      relationship: {
        type: this.props.relationshipType,
        inverseType: this.props.inverseRelationshipType,
        dimensions: {
          biological: this.props.isBiological,
          legal: this.props.isLegal,
          customary: this.props.isCustomary,
          spiritual: this.props.isSpiritual,
        },
      },
      timeline: {
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        isActive: this.props.isActive,
      },
      verification: {
        level: this.props.verificationLevel,
        score: this.props.verificationScore,
        method: this.props.verificationMethod,
        lastVerifiedAt: this.props.lastVerifiedAt,
        verifiedBy: this.props.verifiedBy?.toString(),
      },
      evidence: {
        legalDocuments: this.props.legalDocuments,
        dnaTestId: this.props.dnaTestId,
        dnaMatchPercentage: this.props.dnaMatchPercentage,
        biologicalConfidence: this.props.biologicalConfidence,
        courtOrderId: this.props.courtOrderId,
        adoptionOrderId: this.props.adoptionOrderId,
        guardianshipOrderId: this.props.guardianshipOrderId,
        marriageId: this.props.marriageId?.toString(),
      },
      customary: {
        customaryRecognition: this.props.customaryRecognition,
        clanRecognized: this.props.clanRecognized,
        elderWitnesses: this.props.elderWitnesses,
        traditionalRite: this.props.traditionalRite,
      },
      strength: {
        relationshipStrength: this.props.relationshipStrength,
        closenessIndex: this.props.closenessIndex,
        contactFrequency: this.props.contactFrequency,
      },
      dependency: {
        isFinancialDependent: this.props.isFinancialDependent,
        isCareDependent: this.props.isCareDependent,
        dependencyLevel: this.props.dependencyLevel,
        supportProvided: this.props.supportProvided,
      },
      inheritance: {
        inheritanceRights: this.props.inheritanceRights,
        inheritancePercentage: this.props.inheritancePercentage,
        disinherited: this.props.disinherited,
        disinheritanceReason: this.props.disinheritanceReason,
        legalBasis: this.props.legalBasis,
      },
      conflict: {
        hasConflict: this.props.hasConflict,
        resolutionStatus: this.props.conflictResolutionStatus,
      },
      cultural: {
        relationshipTerm: this.props.relationshipTerm,
        culturalSignificance: this.props.culturalSignificance,
        taboos: this.props.taboos,
        communicationLanguage: this.props.communicationLanguage,
      },
      computedProperties: this.computedProperties,
      audit: {
        createdBy: this.props.createdBy.toString(),
        lastUpdatedBy: this.props.lastUpdatedBy.toString(),
        notes: this.props.notes,
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
