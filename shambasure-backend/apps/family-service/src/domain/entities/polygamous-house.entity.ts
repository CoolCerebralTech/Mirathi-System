// src/family-service/src/domain/entities/polygamous-house.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  ChildAddedToHouseEvent,
  HouseHeadAssignedEvent,
  PolygamousHouseCreatedEvent,
  PolygamousHouseUpdatedEvent,
} from '../events/polygamous-house-events';
import { KenyanCounty } from '../value-objects/family-enums.vo';

/**
 * Polygamous House Entity (S.40 LSA Structure)
 *
 * Innovations:
 * 1. Dynamic house structure for S.40 property distribution
 * 2. Multi-wife management with hierarchical ordering
 * 3. House asset allocation and tracking
 * 4. Automatic house head succession
 * 5. Cultural and legal compliance checks
 */
export interface PolygamousHouseProps {
  // Core House Identity
  familyId: UniqueEntityID;
  houseName: string;
  houseOrder: number; // 1st, 2nd, 3rd... (chronological order of establishment)
  houseCode: string; // Unique code for the house (e.g., "HOUSE_A", "HOUSE_B")

  // House Leadership
  houseHeadId?: UniqueEntityID; // Current head (wife or eldest son if wife deceased)
  originalWifeId: UniqueEntityID; // The wife who established this house
  currentWifeId?: UniqueEntityID; // Current wife (if still alive)

  // Establishment Details
  establishedDate: Date;
  establishmentType: 'CUSTOMARY' | 'ISLAMIC' | 'TRADITIONAL' | 'COURT_RECOGNIZED';
  establishmentWitnesses: string[];
  establishmentLocation?: string;

  // Legal Status
  courtRecognized: boolean;
  courtRecognitionDate?: Date;
  courtCaseNumber?: string;
  recognitionDocumentId?: string; // Link to court document

  // House Members
  wifeIds: UniqueEntityID[]; // Multiple wives if this house has sub-wives (rare)
  childrenIds: UniqueEntityID[];
  memberCount: number; // Denormalized for performance

  // House Assets (References to Estate Service)
  houseAssets: {
    assetId: string;
    assetType: string;
    estimatedValue: number;
    allocationPercentage: number; // What % of this asset belongs to this house
  }[];

  // S.40 Distribution Rules
  distributionWeight: number; // Base weight for distribution (usually 1.0)
  specialAllocation?: {
    reason: string;
    percentage: number;
    courtOrdered: boolean;
  };

  // House Status
  isActive: boolean;
  dissolutionDate?: Date;
  dissolutionReason?: 'WIFE_DECEASED' | 'WIFE_DIVORCED' | 'HOUSE_MERGED' | 'COURT_ORDER';

  // Cultural Context
  houseColor?: string; // For visual identification
  houseSymbol?: string; // Emoji or icon
  traditionalName?: string; // In mother tongue
  houseMotto?: string;

  // Residential Information
  primaryResidence?: string;
  residentialCounty?: KenyanCounty;
  hasSeparateHomestead: boolean;

  // Financial Information
  houseMonthlyExpenses?: number;
  houseAnnualIncome?: number;
  financialDependents: number;

  // Succession Planning
  successorId?: UniqueEntityID; // Next house head
  successionRules?: string; // Custom succession rules

  // Metadata
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'DISPUTED' | 'PENDING_COURT';
  verificationNotes?: string;

  // Audit
  lastAuditedAt?: Date;
  isArchived: boolean;
}

export class PolygamousHouse extends Entity<PolygamousHouseProps> {
  public getProps(): PolygamousHouseProps {
    return { ...this.props };
  }
  private constructor(props: PolygamousHouseProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Polygamous House
   */
  public static create(props: PolygamousHouseProps, id?: UniqueEntityID): PolygamousHouse {
    // Validate creation invariants
    PolygamousHouse.validateCreation(props);

    const house = new PolygamousHouse(props, id);

    // Generate house code if not provided
    if (!props.houseCode) {
      (house.props as any).houseCode = house.generateHouseCode();
    }

    // Record creation event
    house.addDomainEvent(
      new PolygamousHouseCreatedEvent({
        houseId: house.id.toString(),
        houseName: house.props.houseName,
        houseOrder: house.props.houseOrder,
        familyId: house.props.familyId.toString(),
        establishedDate: house.props.establishedDate,
        establishedBy: house.props.createdBy.toString(),
        timestamp: house.createdAt,
      }),
    );

    return house;
  }

  /**
   * Restore from persistence
   */
  public static restore(
    props: PolygamousHouseProps,
    id: UniqueEntityID,
    createdAt: Date,
  ): PolygamousHouse {
    return new PolygamousHouse(props, id, createdAt);
  }

  /**
   * Update house information
   */
  public updateInformation(
    updates: Partial<PolygamousHouseProps>,
    updatedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    const changes: Record<string, any> = {};
    const props = this.props as any;

    // Validate updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const oldValue = props[key];

        // Skip if no change
        if (JSON.stringify(oldValue) === JSON.stringify(value)) return;

        // Apply update
        props[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      props.lastUpdatedBy = updatedBy;

      // Update member count if children/wives changed
      if (updates.childrenIds || updates.wifeIds) {
        this.updateMemberCount();
      }

      this.addDomainEvent(
        new PolygamousHouseUpdatedEvent({
          houseId: this.id.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Assign house head (wife or eldest son)
   */
  public assignHouseHead(
    headId: UniqueEntityID,
    reason: 'WIFE_APPOINTMENT' | 'SUCCESSION' | 'COURT_ORDER' | 'FAMILY_CONSENSUS',
    effectiveDate: Date,
    appointedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    // Validate head is a member of the house
    if (!this.isHouseMember(headId)) {
      throw new Error('House head must be a member of the house');
    }

    const previousHead = this.props.houseHeadId;
    const props = this.props as any;
    props.houseHeadId = headId;
    props.lastUpdatedBy = appointedBy;

    this.addDomainEvent(
      new HouseHeadAssignedEvent({
        houseId: this.id.toString(),
        houseName: this.props.houseName,
        previousHeadId: previousHead?.toString(),
        newHeadId: headId.toString(),
        reason,
        effectiveDate,
        appointedBy: appointedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Add child to house
   */
  public addChild(
    childId: UniqueEntityID,
    motherId: UniqueEntityID,
    addedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    // Validate mother belongs to this house
    if (!this.props.wifeIds.some((id) => id.equals(motherId))) {
      throw new Error('Mother must be a wife in this house');
    }

    if (this.props.childrenIds.some((id) => id.equals(childId))) {
      throw new Error('Child already exists in this house');
    }

    const props = this.props as any;
    props.childrenIds.push(childId);
    this.updateMemberCount();
    props.lastUpdatedBy = addedBy;

    this.addDomainEvent(
      new ChildAddedToHouseEvent({
        houseId: this.id.toString(),
        houseName: this.props.houseName,
        childId: childId.toString(),
        motherId: motherId.toString(),
        addedBy: addedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Add wife to house (for Islamic marriages with multiple wives in same house)
   */
  public addWife(
    wifeId: UniqueEntityID,
    marriageDate: Date,
    marriageId: UniqueEntityID,
    addedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    if (this.props.wifeIds.some((id) => id.equals(wifeId))) {
      throw new Error('Wife already exists in this house');
    }

    // Validate this is allowed (some traditions don't allow multiple wives in same house)
    if (!this.allowsMultipleWives()) {
      throw new Error('This house type does not allow multiple wives');
    }

    const props = this.props as any;
    props.wifeIds.push(wifeId);

    // If this is the first wife, set as original wife
    if (props.wifeIds.length === 1) {
      props.originalWifeId = wifeId;
    }

    // If no current wife set, set as current wife
    if (!props.currentWifeId) {
      props.currentWifeId = wifeId;
    }

    this.updateMemberCount();
    props.lastUpdatedBy = addedBy;
  }

  /**
   * Remove wife from house (divorce or death)
   */
  public removeWife(
    wifeId: UniqueEntityID,
    reason: 'DIVORCE' | 'DEATH' | 'RELOCATION',
    effectiveDate: Date,
    removedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();

    const props = this.props as any;
    const wifeIndex = props.wifeIds.findIndex((id: UniqueEntityID) => id.equals(wifeId));
    if (wifeIndex === -1) {
      throw new Error('Wife not found in this house');
    }

    props.wifeIds.splice(wifeIndex, 1);

    // Update current wife if removed wife was current
    if (props.currentWifeId?.equals(wifeId)) {
      props.currentWifeId = props.wifeIds[0] || undefined;
    }

    // If original wife was removed, update original wife
    if (props.originalWifeId.equals(wifeId)) {
      props.originalWifeId = props.wifeIds[0] || new UniqueEntityID();
    }

    // If house head was this wife, reassign house head
    if (props.houseHeadId?.equals(wifeId)) {
      this.reassignHouseHeadAfterWifeRemoval(wifeId, reason, removedBy);
    }

    this.updateMemberCount();
    props.lastUpdatedBy = removedBy;

    // If no wives left, consider dissolving the house
    if (props.wifeIds.length === 0) {
      this.considerHouseDissolution(reason, effectiveDate, removedBy);
    }
  }

  /**
   * Add asset to house (for S.40 distribution tracking)
   */
  public addAsset(
    assetId: string,
    assetType: string,
    estimatedValue: number,
    allocationPercentage: number,
    addedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    if (allocationPercentage < 0 || allocationPercentage > 100) {
      throw new Error('Allocation percentage must be between 0 and 100');
    }

    // Check if asset already exists
    const props = this.props as any;
    const existingAssetIndex = props.houseAssets.findIndex((a: any) => a.assetId === assetId);

    if (existingAssetIndex !== -1) {
      // Update existing asset
      props.houseAssets[existingAssetIndex] = {
        assetId,
        assetType,
        estimatedValue,
        allocationPercentage,
      };
    } else {
      // Add new asset
      props.houseAssets.push({
        assetId,
        assetType,
        estimatedValue,
        allocationPercentage,
      });
    }

    props.lastUpdatedBy = addedBy;
  }

  /**
   * Calculate house share for S.40 distribution
   */
  public calculateHouseShare(totalEstateValue: number): {
    baseShare: number;
    adjustedShare: number;
    sharePercentage: number;
    assetsValue: number;
  } {
    if (!this.props.isActive) {
      return {
        baseShare: 0,
        adjustedShare: 0,
        sharePercentage: 0,
        assetsValue: 0,
      };
    }

    // Calculate assets value owned by the house
    const assetsValue = this.props.houseAssets.reduce(
      (sum, asset) => sum + asset.estimatedValue * (asset.allocationPercentage / 100),
      0,
    );

    // Base share: Equal share among active houses
    const baseShare = totalEstateValue / this.getActiveHouseCount();

    // Adjusted share: Base share * distribution weight
    const adjustedShare = baseShare * this.props.distributionWeight;

    // Add special allocation if any
    let finalShare = adjustedShare;
    if (this.props.specialAllocation) {
      finalShare += (totalEstateValue * this.props.specialAllocation.percentage) / 100;
    }

    const sharePercentage = (finalShare / totalEstateValue) * 100;

    return {
      baseShare,
      adjustedShare: finalShare,
      sharePercentage,
      assetsValue,
    };
  }

  /**
   * Get house eligibility for S.40 distribution
   */
  public getEligibilityStatus(): {
    eligible: boolean;
    reasons: string[];
    requirements: string[];
  } {
    const reasons: string[] = [];
    const requirements: string[] = [];

    // Check basic requirements
    if (!this.props.isActive) {
      reasons.push('House is not active');
    }

    if (!this.props.courtRecognized && this.props.establishmentType !== 'CUSTOMARY') {
      reasons.push('House not recognized by court');
      requirements.push('Obtain court recognition');
    }

    if (this.props.wifeIds.length === 0) {
      reasons.push('No wives in the house');
      requirements.push('Add at least one wife to the house');
    }

    if (this.props.memberCount === 0) {
      reasons.push('No members in the house');
      requirements.push('Add members to the house');
    }

    // Check if house has been active for at least 1 year
    const establishmentAge = this.getEstablishmentAge();
    if (establishmentAge.years < 1) {
      reasons.push('House established less than 1 year ago');
      requirements.push('Wait until house is at least 1 year old');
    }

    const eligible = reasons.length === 0;

    return {
      eligible,
      reasons,
      requirements,
    };
  }

  /**
   * Dissolve house (court order, wife deceased, etc.)
   */
  public dissolveHouse(
    reason: PolygamousHouseProps['dissolutionReason'],
    dissolutionDate: Date,
    details: {
      courtOrderNumber?: string;
      dissolutionDocumentId?: string;
      assetDistributionPlan?: string;
    },
    dissolvedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    if (dissolutionDate < this.props.establishedDate) {
      throw new Error('Dissolution date cannot be before establishment date');
    }

    const props = this.props as any;
    props.isActive = false;
    props.dissolutionDate = dissolutionDate;
    props.dissolutionReason = reason;
    props.lastUpdatedBy = dissolvedBy;

    // Archive house assets
    props.houseAssets = [];

    // Record dissolution in metadata
    props.verificationNotes = `House dissolved on ${dissolutionDate.toISOString()}. Reason: ${reason}.`;

    if (details.courtOrderNumber) {
      props.courtCaseNumber = details.courtOrderNumber;
    }
  }

  /**
   * Merge house with another (rare, but possible)
   */
  public mergeWithHouse(
    targetHouseId: UniqueEntityID,
    mergeDate: Date,
    mergeDetails: {
      reason: string;
      mergedBy: string;
      assetTransferPlan: string;
    },
    mergedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureHouseActive();

    const props = this.props as any;
    // Mark this house as dissolved due to merge
    props.isActive = false;
    props.dissolutionDate = mergeDate;
    props.dissolutionReason = 'HOUSE_MERGED';
    props.lastUpdatedBy = mergedBy;

    // Transfer assets to target house (in practice, this would update target house)
    props.verificationNotes = `Merged with house ${targetHouseId.toString()} on ${mergeDate.toISOString()}. ${mergeDetails.reason}`;
  }

  /**
   * Verify house with court records
   */
  public verifyHouse(
    verified: boolean,
    courtDocumentId: string,
    verifiedBy: UniqueEntityID,
    notes?: string,
  ): void {
    const props = this.props as any;
    props.courtRecognized = verified;
    props.recognitionDocumentId = courtDocumentId;
    props.verificationStatus = verified ? 'VERIFIED' : 'DISPUTED';
    props.verificationNotes = notes;
    props.lastUpdatedBy = verifiedBy;
    props.lastAuditedAt = new Date();

    if (verified) {
      props.courtRecognitionDate = new Date();
    }
  }

  /**
   * Update member count (denormalized)
   */
  private updateMemberCount(): void {
    const props = this.props as any;
    props.memberCount = props.childrenIds.length + props.wifeIds.length;
  }

  /**
   * Reassign house head after wife removal
   */
  private reassignHouseHeadAfterWifeRemoval(
    removedWifeId: UniqueEntityID,
    reason: string,
    reassignedBy: UniqueEntityID,
  ): void {
    // Priority order for new house head:
    // 1. Another wife in the house
    // 2. Eldest son in the house
    // 3. Other adult male relative
    // 4. Court-appointed administrator

    let newHeadId: UniqueEntityID | undefined;

    // Try another wife
    if (this.props.wifeIds.length > 0) {
      newHeadId = this.props.wifeIds[0];
    }

    // TODO: In practice, we would need to fetch children and determine eldest son
    // For now, we'll leave it unassigned

    (this.props as any).houseHeadId = newHeadId;

    if (newHeadId) {
      this.addDomainEvent(
        new HouseHeadAssignedEvent({
          houseId: this.id.toString(),
          houseName: this.props.houseName,
          previousHeadId: removedWifeId.toString(),
          newHeadId: newHeadId.toString(),
          reason: `SUCCESSION_AFTER_${reason}`,
          effectiveDate: new Date(),
          appointedBy: reassignedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Consider dissolving house if conditions met
   */
  private considerHouseDissolution(
    reason: string,
    effectiveDate: Date,
    consideredBy: UniqueEntityID,
  ): void {
    // Auto-dissolve if no wives left and no children
    if (this.props.childrenIds.length === 0) {
      this.dissolveHouse(
        'WIFE_DECEASED' as PolygamousHouseProps['dissolutionReason'],
        effectiveDate,
        {
          dissolutionDocumentId: 'AUTO_DISSOLVED_NO_MEMBERS',
          assetDistributionPlan: 'Assets revert to family estate',
        },
        consideredBy,
      );
    }
  }

  /**
   * Check if house allows multiple wives
   */
  private allowsMultipleWives(): boolean {
    return this.props.establishmentType === 'ISLAMIC';
  }

  /**
   * Get establishment age
   */
  private getEstablishmentAge(): { years: number; months: number; days: number } {
    const now = new Date();
    const established = this.props.establishedDate;

    let years = now.getFullYear() - established.getFullYear();
    let months = now.getMonth() - established.getMonth();
    let days = now.getDate() - established.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  /**
   * Get count of active houses (would need family context)
   */
  private getActiveHouseCount(): number {
    // In practice, this would query the family aggregate
    // For now, return 1 as default
    return 1;
  }

  /**
   * Check if person is a house member
   */
  private isHouseMember(personId: UniqueEntityID): boolean {
    return (
      this.props.wifeIds.some((id) => id.equals(personId)) ||
      this.props.childrenIds.some((id) => id.equals(personId))
    );
  }

  /**
   * Generate unique house code
   */
  private generateHouseCode(): string {
    const familyCode = this.props.familyId.toString().substring(0, 4).toUpperCase();
    const houseNum = this.props.houseOrder.toString().padStart(2, '0');
    return `HOUSE_${familyCode}_${houseNum}`;
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: PolygamousHouseProps): void {
    // House order must be positive
    if (props.houseOrder < 1) {
      throw new Error('House order must be at least 1');
    }

    // Establishment date must be in the past
    if (props.establishedDate > new Date()) {
      throw new Error('Establishment date cannot be in the future');
    }

    // Must have at least one wife at creation
    if (props.wifeIds.length === 0 && !props.originalWifeId) {
      throw new Error('Polygamous house must have at least one wife');
    }

    // If original wife is provided, she must be in wifeIds
    if (props.originalWifeId && !props.wifeIds.some((id) => id.equals(props.originalWifeId))) {
      throw new Error('Original wife must be included in wifeIds');
    }

    // Distribution weight must be positive
    if (props.distributionWeight <= 0) {
      throw new Error('Distribution weight must be positive');
    }

    // Special allocation percentage must be 0-100 if provided
    if (props.specialAllocation?.percentage) {
      if (props.specialAllocation.percentage < 0 || props.specialAllocation.percentage > 100) {
        throw new Error('Special allocation percentage must be between 0 and 100');
      }
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived house: ${this.id.toString()}`);
    }
  }

  private ensureHouseActive(): void {
    if (!this.props.isActive) {
      throw new Error(`Cannot modify inactive house: ${this.id.toString()}`);
    }
  }

  /**
   * Archive house (soft delete)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('House is already archived');
    }

    const props = this.props as any;
    props.isArchived = true;
    props.lastUpdatedBy = archivedBy;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('House is not archived');
    }

    const props = this.props as any;
    props.isArchived = false;
    props.lastUpdatedBy = restoredBy;
  }

  /**
   * Get house summary for display
   */
  public getSummary(): Record<string, any> {
    const eligibility = this.getEligibilityStatus();
    const establishmentAge = this.getEstablishmentAge();

    return {
      id: this.id.toString(),
      houseCode: this.props.houseCode,
      houseName: this.props.houseName,
      houseOrder: this.props.houseOrder,
      familyId: this.props.familyId.toString(),
      houseHeadId: this.props.houseHeadId?.toString(),
      originalWifeId: this.props.originalWifeId.toString(),
      currentWifeId: this.props.currentWifeId?.toString(),
      memberCount: this.props.memberCount,
      childrenCount: this.props.childrenIds.length,
      wivesCount: this.props.wifeIds.length,
      isActive: this.props.isActive,
      courtRecognized: this.props.courtRecognized,
      verificationStatus: this.props.verificationStatus,
      establishmentAge: `${establishmentAge.years} years, ${establishmentAge.months} months`,
      eligibility: eligibility.eligible,
      dissolutionDate: this.props.dissolutionDate,
      dissolutionReason: this.props.dissolutionReason,
      isArchived: this.props.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get computed properties for business logic
   */
  public get computedProperties() {
    const establishmentAge = this.getEstablishmentAge();
    const eligibility = this.getEligibilityStatus();

    return {
      establishmentAge,
      eligibility,
      houseStrength: this.calculateHouseStrength(),
      successionReadiness: this.getSuccessionReadiness(),
      assetPortfolio: this.getAssetPortfolioSummary(),
      demographicBreakdown: this.getDemographicBreakdown(),
      nextMilestone: this.getNextMilestone(),
      legalCompliance: this.getLegalCompliance(),
    };
  }

  private calculateHouseStrength(): number {
    const establishmentAge = this.getEstablishmentAge();
    let score = 50; // Base score

    // Member count factor
    if (this.props.memberCount >= 5) score += 15;
    else if (this.props.memberCount >= 2) score += 10;
    else if (this.props.memberCount >= 1) score += 5;

    // Establishment age factor
    if (establishmentAge.years >= 10) score += 20;
    else if (establishmentAge.years >= 5) score += 15;
    else if (establishmentAge.years >= 1) score += 10;

    // Court recognition factor
    if (this.props.courtRecognized) score += 15;

    // Active status factor
    if (this.props.isActive) score += 10;

    // House head factor
    if (this.props.houseHeadId) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  private getSuccessionReadiness(): Record<string, any> {
    const hasSuccessor = !!this.props.successorId;
    const successorIsAdult = true; // Would check age in practice
    const successorIsHouseMember = hasSuccessor
      ? this.isHouseMember(this.props.successorId)
      : false;

    return {
      hasSuccessor,
      successorIsAdult,
      successorIsHouseMember,
      successionRulesDefined: !!this.props.successionRules,
      readinessScore: this.calculateSuccessionReadinessScore(),
      recommendations: this.getSuccessionRecommendations(),
    };
  }

  private calculateSuccessionReadinessScore(): number {
    let score = 0;

    if (this.props.successorId) score += 40;
    if (this.props.successionRules) score += 30;
    if (this.props.houseHeadId) score += 30; // Current head means succession planning is relevant

    return score;
  }

  private getSuccessionRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.props.successorId) {
      recommendations.push('Appoint a successor for the house head position');
    }

    if (!this.props.successionRules) {
      recommendations.push('Define clear succession rules for the house');
    }

    if (this.props.houseHeadId && !this.props.successorId) {
      recommendations.push('Consider appointing an eldest son as successor');
    }

    return recommendations;
  }

  private getAssetPortfolioSummary(): Record<string, any> {
    const totalValue = this.props.houseAssets.reduce((sum, asset) => sum + asset.estimatedValue, 0);
    const assetTypes = [...new Set(this.props.houseAssets.map((a) => a.assetType))];

    return {
      totalAssets: this.props.houseAssets.length,
      totalValue,
      assetTypes,
      topAssets: this.props.houseAssets
        .sort((a, b) => b.estimatedValue - a.estimatedValue)
        .slice(0, 5),
      allocationBreakdown: this.getAllocationBreakdown(),
    };
  }

  private getAllocationBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    this.props.houseAssets.forEach((asset) => {
      if (!breakdown[asset.assetType]) {
        breakdown[asset.assetType] = 0;
      }
      breakdown[asset.assetType] += asset.estimatedValue;
    });

    return breakdown;
  }

  private getDemographicBreakdown(): Record<string, any> {
    // In practice, would fetch member details
    return {
      totalMembers: this.props.memberCount,
      wives: this.props.wifeIds.length,
      children: this.props.childrenIds.length,
      adultChildren: 0, // Would calculate from children ages
      minorChildren: this.props.childrenIds.length, // Would calculate
      maleCount: 0, // Would calculate
      femaleCount: 0, // Would calculate
    };
  }

  private getNextMilestone(): { milestone: string; date: Date; daysUntil: number } | null {
    const now = new Date();
    const establishmentYear = this.props.establishedDate.getFullYear();

    // Check upcoming anniversaries
    for (let i = 1; i <= 10; i++) {
      const anniversaryDate = new Date(
        establishmentYear + i,
        this.props.establishedDate.getMonth(),
        this.props.establishedDate.getDate(),
      );

      if (anniversaryDate > now) {
        const daysUntil = Math.ceil(
          (anniversaryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          milestone: `${i} Year Anniversary`,
          date: anniversaryDate,
          daysUntil,
        };
      }
    }

    return null;
  }

  private getLegalCompliance(): Record<string, boolean> {
    return {
      courtRecognized: this.props.courtRecognized,
      hasRecognitionDocument: !!this.props.recognitionDocumentId,
      hasHouseHead: !!this.props.houseHeadId,
      hasOriginalWife: !!this.props.originalWifeId,
      establishmentWitnessesPresent: this.props.establishmentWitnesses.length >= 2,
      hasEstablishmentDate: !!this.props.establishedDate,
      activeStatusValid: this.props.isActive === !this.props.dissolutionDate,
      memberCountAccurate:
        this.props.memberCount === this.props.childrenIds.length + this.props.wifeIds.length,
    };
  }

  /**
   * Get house for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      identity: {
        houseCode: this.props.houseCode,
        houseName: this.props.houseName,
        traditionalName: this.props.traditionalName,
        houseOrder: this.props.houseOrder,
        familyId: this.props.familyId.toString(),
        houseMotto: this.props.houseMotto,
      },
      leadership: {
        houseHeadId: this.props.houseHeadId?.toString(),
        originalWifeId: this.props.originalWifeId.toString(),
        currentWifeId: this.props.currentWifeId?.toString(),
        successorId: this.props.successorId?.toString(),
        successionRules: this.props.successionRules,
      },
      establishment: {
        establishedDate: this.props.establishedDate,
        establishmentType: this.props.establishmentType,
        establishmentLocation: this.props.establishmentLocation,
        establishmentWitnesses: this.props.establishmentWitnesses,
      },
      legal: {
        courtRecognized: this.props.courtRecognized,
        courtRecognitionDate: this.props.courtRecognitionDate,
        courtCaseNumber: this.props.courtCaseNumber,
        recognitionDocumentId: this.props.recognitionDocumentId,
      },
      members: {
        wifeIds: this.props.wifeIds.map((id) => id.toString()),
        childrenIds: this.props.childrenIds.map((id) => id.toString()),
        memberCount: this.props.memberCount,
      },
      assets: {
        houseAssets: this.props.houseAssets,
        distributionWeight: this.props.distributionWeight,
        specialAllocation: this.props.specialAllocation,
      },
      status: {
        isActive: this.props.isActive,
        dissolutionDate: this.props.dissolutionDate,
        dissolutionReason: this.props.dissolutionReason,
      },
      cultural: {
        houseColor: this.props.houseColor || this.generateHouseColor(),
        houseSymbol: this.props.houseSymbol || this.generateHouseSymbol(),
        residentialCounty: this.props.residentialCounty,
        primaryResidence: this.props.primaryResidence,
        hasSeparateHomestead: this.props.hasSeparateHomestead,
      },
      financial: {
        houseMonthlyExpenses: this.props.houseMonthlyExpenses,
        houseAnnualIncome: this.props.houseAnnualIncome,
        financialDependents: this.props.financialDependents,
      },
      computedProperties: this.computedProperties,
      verification: {
        status: this.props.verificationStatus,
        notes: this.props.verificationNotes,
        lastAuditedAt: this.props.lastAuditedAt,
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

  private generateHouseColor(): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#FFD166', // Yellow
      '#06D6A0', // Green
      '#118AB2', // Blue
      '#7209B7', // Purple
      '#F15BB5', // Pink
      '#00BBF9', // Light Blue
      '#00F5D4', // Cyan
      '#FF9E00', // Orange
    ];

    return colors[(this.props.houseOrder - 1) % colors.length];
  }

  private generateHouseSymbol(): string {
    const symbols = ['👑', '🏰', '🛡️', '⚔️', '🏹', '🪶', '🌳', '🔥', '💎', '⭐'];
    return symbols[(this.props.houseOrder - 1) % symbols.length];
  }
}
