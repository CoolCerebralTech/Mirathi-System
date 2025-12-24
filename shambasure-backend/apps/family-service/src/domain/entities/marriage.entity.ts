// src/family-service/src/domain/entities/marriage.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  MarriageEndedEvent,
  MarriageRegisteredEvent,
  MarriageUpdatedEvent,
  PolygamousHouseAssignedEvent,
} from '../events/marriage-events';
import {
  KenyanCounty,
  MarriageEndReason,
  MarriageStatus,
  MarriageType,
} from '../value-objects/family-enums.vo';

/**
 * Marriage Entity
 *
 * Innovations:
 * 1. Multi-religious marriage support (Civil, Christian, Islamic, Hindu, Customary)
 * 2. Polygamy management with S.40 compliance
 * 3. Cohabitation tracking (Come-we-stay) with legal evidence
 * 4. Marriage timeline with legal milestones
 * 5. Smart validation of marriage legality
 */
export interface MarriageProps {
  // Core Marriage Information
  spouse1Id: UniqueEntityID;
  spouse2Id: UniqueEntityID;

  // Marriage Details
  marriageType: MarriageType;
  marriageStatus: MarriageStatus;

  // Dates
  startDate: Date;
  endDate?: Date;
  endReason?: MarriageEndReason;

  // Legal Registration
  registrationNumber?: string; // Marriage certificate number
  registrationDistrict?: string;
  registeredBy?: string; // Registrar, Pastor, Imam, etc.

  // Ceremony Details
  ceremonyLocation?: string;
  ceremonyCounty?: KenyanCounty;
  witnesses: string[]; // Names of witnesses

  // Customary Marriage Specifics
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency?: string;
  bridePaidInFull: boolean;
  customaryDetails?: {
    eldersPresent: string[];
    location: string;
    clanRepresentatives: string[];
    traditionalRitesPerformed: string[];
    livestockExchanged?: number;
  };

  // Polygamy Context
  isPolygamous: boolean;
  polygamousHouseId?: UniqueEntityID;
  marriageOrder?: number; // 1st, 2nd, 3rd marriage for polygamous

  // Children & Family
  numberOfChildren: number;
  childrenIds: UniqueEntityID[];

  // Legal Documents
  marriageCertificateId?: string; // Link to document service
  cohabitationAffidavitId?: string;
  divorceDecreeId?: string;

  // Financial Arrangements
  prenuptialAgreement?: boolean;
  prenuptialDocumentId?: string;
  jointProperty: boolean;
  separatePropertyDeclaration?: boolean;

  // Health & Status
  isMarriageDissolved: boolean;
  dissolutionDate?: Date;
  dissolutionReason?: string;
  waitingPeriodCompleted: boolean; // For divorce/remarriage

  // Cultural Context
  marriageSeason?: string; // "Harvest", "Rainy", "Dry"
  marriageBlessings?: string[];
  traditionalGiftsExchanged?: string[];

  // Metadata
  createdBy: UniqueEntityID;
  lastUpdatedBy: UniqueEntityID;
  verifiedBy?: UniqueEntityID;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'PENDING_VERIFICATION';
  verificationNotes?: string;

  // Audit
  lastVerifiedAt?: Date;
  isArchived: boolean;
}

export class Marriage extends Entity<MarriageProps> {
  private constructor(props: MarriageProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Marriage
   * Handles different marriage types with appropriate validations
   */
  public static create(props: MarriageProps, id?: UniqueEntityID): Marriage {
    // Validate creation invariants
    Marriage.validateCreation(props);

    const marriage = new Marriage(props, id);

    // Determine marriage status based on dates
    marriage.updateMarriageStatus();

    // Record creation event
    marriage.addDomainEvent(
      new MarriageRegisteredEvent({
        marriageId: marriage.id.toString(),
        spouse1Id: marriage.props.spouse1Id.toString(),
        spouse2Id: marriage.props.spouse2Id.toString(),
        marriageType: marriage.props.marriageType,
        startDate: marriage.props.startDate,
        registeredBy: marriage.props.createdBy.toString(),
        timestamp: new Date(),
      }),
    );

    return marriage;
  }

  /**
   * Restore from persistence
   */
  public static restore(props: MarriageProps, id: UniqueEntityID, createdAt: Date): Marriage {
    return new Marriage(props, id, createdAt);
  }

  /**
   * Update marriage information
   */
  public updateInformation(updates: Partial<MarriageProps>, updatedBy: UniqueEntityID): void {
    this.ensureNotArchived();
    this.ensureMarriageNotDissolved();

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
      (this.props as any).lastUpdatedBy = updatedBy;

      // Update marriage status if dates changed
      if (updates.startDate || updates.endDate) {
        this.updateMarriageStatus();
      }

      this.addDomainEvent(
        new MarriageUpdatedEvent({
          marriageId: this.id.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * End marriage (divorce, death, annulment)
   */
  public endMarriage(
    endReason: MarriageEndReason,
    endDate: Date,
    details: {
      courtCaseNumber?: string;
      divorceDecreeId?: string;
      deathCertificateId?: string;
      annulmentReason?: string;
      waitingPeriod?: number; // In days
    },
    endedBy: UniqueEntityID,
  ): void {
    this.ensureNotArchived();
    this.ensureMarriageNotDissolved();

    // Validate end date
    if (endDate < this.props.startDate) {
      throw new Error('End date cannot be before start date');
    }

    if (endDate > new Date()) {
      throw new Error('End date cannot be in the future');
    }

    // Update marriage details
    const previousStatus = this.props.marriageStatus;
    const props = this.props as any;
    props.endDate = endDate;
    props.endReason = endReason;
    props.isMarriageDissolved = true;
    props.dissolutionDate = endDate;
    props.dissolutionReason = this.getDissolutionReason(endReason);
    props.lastUpdatedBy = endedBy;

    // Update waiting period based on marriage type
    props.waitingPeriodCompleted = this.calculateWaitingPeriod(endDate, endReason);

    // Update related documents
    if (details.divorceDecreeId) {
      props.divorceDecreeId = details.divorceDecreeId;
    }

    // Record end event
    this.addDomainEvent(
      new MarriageEndedEvent({
        marriageId: this.id.toString(),
        spouse1Id: this.props.spouse1Id.toString(),
        spouse2Id: this.props.spouse2Id.toString(),
        endReason,
        endDate,
        previousStatus,
        newStatus: this.props.marriageStatus,
        endedBy: endedBy.toString(),
        timestamp: new Date(),
      }),
    );

    // Update marriage status
    this.updateMarriageStatus();
  }

  /**
   * Assign to polygamous house (S.40 compliance)
   */
  public assignToPolygamousHouse(
    houseId: UniqueEntityID,
    marriageOrder: number,
    assignedBy: UniqueEntityID,
  ): void {
    if (
      this.props.marriageType !== MarriageType.ISLAMIC &&
      this.props.marriageType !== MarriageType.CUSTOMARY
    ) {
      throw new Error('Only Islamic or Customary marriages can be polygamous');
    }

    const props = this.props as any;
    props.polygamousHouseId = houseId;
    props.marriageOrder = marriageOrder;
    props.isPolygamous = true;
    props.lastUpdatedBy = assignedBy;

    this.addDomainEvent(
      new PolygamousHouseAssignedEvent({
        marriageId: this.id.toString(),
        polygamousHouseId: houseId.toString(),
        marriageOrder,
        assignedBy: assignedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Add child to marriage
   */
  public addChild(childId: UniqueEntityID, updatedBy: UniqueEntityID): void {
    if (this.props.childrenIds.includes(childId)) {
      throw new Error('Child already exists in this marriage');
    }

    const props = this.props as any;
    props.childrenIds.push(childId);
    props.numberOfChildren = props.childrenIds.length;
    props.lastUpdatedBy = updatedBy;

    // No event needed as child creation is handled by FamilyMember
  }

  /**
   * Record bride price payment
   */
  public recordBridePricePayment(
    amount: number,
    currency: string,
    paidInFull: boolean,
    paymentDetails: {
      date: Date;
      paymentMethod: string;
      receiptNumber?: string;
      witnesses: string[];
    },
    recordedBy: UniqueEntityID,
  ): void {
    if (this.props.marriageType !== MarriageType.CUSTOMARY) {
      throw new Error('Bride price only applies to customary marriages');
    }

    const props = this.props as any;
    props.bridePricePaid = true;
    props.bridePriceAmount = amount;
    props.bridePriceCurrency = currency;
    props.bridePaidInFull = paidInFull;

    // Add to customary details if not present
    if (!props.customaryDetails) {
      props.customaryDetails = {
        eldersPresent: [],
        location: '',
        clanRepresentatives: [],
        traditionalRitesPerformed: [],
      };
    }

    // Record payment in customary details
    props.customaryDetails.bridePricePayments = [
      ...(props.customaryDetails.bridePricePayments || []),
      {
        ...paymentDetails,
        recordedBy: recordedBy.toString(),
      },
    ];

    props.lastUpdatedBy = recordedBy;
  }

  /**
   * Verify marriage with official records
   */
  public verifyMarriage(
    verified: boolean,
    registrationNumber: string,
    verifiedBy: UniqueEntityID,
    notes?: string,
  ): void {
    const props = this.props as any;
    props.registrationNumber = registrationNumber;
    props.verificationStatus = verified ? 'VERIFIED' : 'REJECTED';
    props.verificationNotes = notes;
    props.verifiedBy = verifiedBy;
    props.lastVerifiedAt = new Date();
    props.lastUpdatedBy = verifiedBy;
  }

  /**
   * Calculate marriage duration
   */
  public calculateDuration(): {
    years: number;
    months: number;
    days: number;
    totalDays: number;
  } {
    const endDate = this.props.endDate || new Date();
    const startDate = this.props.startDate;

    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return {
      years,
      months,
      days,
      totalDays,
    };
  }

  /**
   * Check if marriage is legally recognized
   */
  public isLegallyRecognized(): boolean {
    // Different marriage types have different recognition criteria
    switch (this.props.marriageType) {
      case MarriageType.CIVIL:
      case MarriageType.CHRISTIAN:
        return !!this.props.registrationNumber;

      case MarriageType.ISLAMIC:
        return (
          !!this.props.registrationNumber ||
          (this.props.customaryDetails?.eldersPresent?.length || 0) >= 2
        );

      case MarriageType.CUSTOMARY:
        return (
          this.props.bridePricePaid &&
          (this.props.customaryDetails?.eldersPresent?.length || 0) >= 2
        );

      case MarriageType.HINDU:
        return !!this.props.registrationNumber;

      case MarriageType.OTHER:
        return (
          this.calculateDuration().totalDays >= 730 && // 2 years minimum for cohabitation
          !!this.props.cohabitationAffidavitId
        );

      default:
        return false;
    }
  }

  /**
   * Check if marriage qualifies for S.40 distribution
   */
  public qualifiesForS40Distribution(): boolean {
    return (
      this.props.isPolygamous &&
      this.isLegallyRecognized() &&
      this.calculateDuration().totalDays >= 365
    ); // At least 1 year
  }

  /**
   * Get marriage milestone anniversaries
   */
  public getAnniversaries(): Array<{
    milestone: string;
    date: Date;
    years: number;
    passed: boolean;
  }> {
    const duration = this.calculateDuration();
    const milestones = [
      { name: 'Paper', years: 1 },
      { name: 'Cotton', years: 2 },
      { name: 'Leather', years: 3 },
      { name: 'Linen', years: 4 },
      { name: 'Wood', years: 5 },
      { name: 'Iron', years: 6 },
      { name: 'Copper', years: 7 },
      { name: 'Bronze', years: 8 },
      { name: 'Pottery', years: 9 },
      { name: 'Tin', years: 10 },
      { name: 'Steel', years: 11 },
      { name: 'Silk', years: 12 },
      { name: 'Lace', years: 13 },
      { name: 'Ivory', years: 14 },
      { name: 'Crystal', years: 15 },
      { name: 'Porcelain', years: 20 },
      { name: 'Silver', years: 25 },
      { name: 'Pearl', years: 30 },
      { name: 'Coral', years: 35 },
      { name: 'Ruby', years: 40 },
      { name: 'Sapphire', years: 45 },
      { name: 'Gold', years: 50 },
      { name: 'Emerald', years: 55 },
      { name: 'Diamond', years: 60 },
      { name: 'Platinum', years: 70 },
    ];

    return milestones
      .map((milestone) => {
        const milestoneDate = new Date(this.props.startDate);
        milestoneDate.setFullYear(milestoneDate.getFullYear() + milestone.years);

        return {
          milestone: `${milestone.name} Anniversary (${milestone.years} years)`,
          date: milestoneDate,
          years: milestone.years,
          passed: duration.years >= milestone.years,
        };
      })
      .filter((_m) => duration.years <= 70); // Only show up to 70 years
  }

  /**
   * Update marriage status based on dates and end reason
   */
  private updateMarriageStatus(): void {
    const now = new Date();
    const props = this.props as any;

    if (this.props.endDate && this.props.endDate <= now) {
      // Marriage has ended
      switch (this.props.endReason) {
        case MarriageEndReason.DIVORCE:
          props.marriageStatus = MarriageStatus.DIVORCED;
          break;
        case MarriageEndReason.DEATH_OF_SPOUSE:
          props.marriageStatus = MarriageStatus.WIDOWED;
          break;
        case MarriageEndReason.ANNULMENT:
          props.marriageStatus = MarriageStatus.DIVORCED; // Using DIVORCED for annulment
          break;
        case MarriageEndReason.CUSTOMARY_DISSOLUTION:
          props.marriageStatus = MarriageStatus.SEPARATED;
          break;
        default:
          props.marriageStatus = MarriageStatus.MARRIED;
      }
    } else if (this.props.isPolygamous) {
      props.marriageStatus = MarriageStatus.MARRIED; // Polygamous marriages are still MARRIED
    } else {
      props.marriageStatus = MarriageStatus.MARRIED;
    }
  }

  /**
   * Calculate waiting period for remarriage
   */
  private calculateWaitingPeriod(endDate: Date, endReason: MarriageEndReason): boolean {
    const now = new Date();
    const daysSinceEnd = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (endReason) {
      case MarriageEndReason.DIVORCE:
        // 6 months waiting period for divorce
        return daysSinceEnd >= 180;

      case MarriageEndReason.DEATH_OF_SPOUSE:
        // 4 months and 10 days for Islamic, 1 year customary
        if (this.props.marriageType === MarriageType.ISLAMIC) {
          return daysSinceEnd >= 130; // 4 months * 30 + 10 days
        }
        return daysSinceEnd >= 365;

      case MarriageEndReason.CUSTOMARY_DISSOLUTION:
        return daysSinceEnd >= 90; // 3 months customary waiting period

      default:
        return true;
    }
  }

  private getDissolutionReason(endReason: MarriageEndReason): string {
    const reasons: Record<MarriageEndReason, string> = {
      [MarriageEndReason.DIVORCE]: 'Divorce granted by court',
      [MarriageEndReason.DEATH_OF_SPOUSE]: 'Death of spouse',
      [MarriageEndReason.ANNULMENT]: 'Marriage annulled',
      [MarriageEndReason.CUSTOMARY_DISSOLUTION]: 'Customary dissolution by elders',
      [MarriageEndReason.STILL_ACTIVE]: 'Marriage still active',
    };

    return reasons[endReason] || 'Unknown';
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: MarriageProps): void {
    // Spouses must be different
    if (props.spouse1Id.equals(props.spouse2Id)) {
      throw new Error('A person cannot marry themselves');
    }

    // Start date must be in the past
    if (props.startDate > new Date()) {
      throw new Error('Marriage start date cannot be in the future');
    }

    // End date must be after start date if provided
    if (props.endDate && props.endDate <= props.startDate) {
      throw new Error('Marriage end date must be after start date');
    }

    // Polygamy validations
    if (props.isPolygamous) {
      if (!props.polygamousHouseId) {
        throw new Error('Polygamous marriage must be assigned to a house');
      }

      if (
        props.marriageType !== MarriageType.ISLAMIC &&
        props.marriageType !== MarriageType.CUSTOMARY
      ) {
        throw new Error('Only Islamic or Customary marriages can be polygamous');
      }
    }

    // Customary marriage validations
    if (props.marriageType === MarriageType.CUSTOMARY) {
      if (
        !props.customaryDetails?.eldersPresent ||
        props.customaryDetails.eldersPresent.length < 2
      ) {
        throw new Error('Customary marriages require at least 2 elders as witnesses');
      }
    }

    // Islamic marriage validations
    if (props.marriageType === MarriageType.ISLAMIC && props.isPolygamous) {
      if (!props.marriageOrder || props.marriageOrder < 1 || props.marriageOrder > 4) {
        throw new Error('Islamic polygamous marriages must be 1st, 2nd, 3rd, or 4th');
      }
    }

    // Cohabitation validations (handled as MarriageType.OTHER)
    if (props.marriageType === MarriageType.OTHER) {
      if (!props.cohabitationAffidavitId) {
        throw new Error('Cohabitation requires an affidavit');
      }
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived marriage: ${this.id.toString()}`);
    }
  }

  private ensureMarriageNotDissolved(): void {
    if (this.props.isMarriageDissolved) {
      throw new Error(`Cannot modify dissolved marriage: ${this.id.toString()}`);
    }
  }

  /**
   * Archive marriage (soft delete)
   */
  public archive(_reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Marriage is already archived');
    }

    const props = this.props as any;
    props.isArchived = true;
    props.lastUpdatedBy = archivedBy;
    // Don't mark as deleted, just archived for legal retention
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Marriage is not archived');
    }

    const props = this.props as any;
    props.isArchived = false;
    props.lastUpdatedBy = restoredBy;
  }

  /**
   * Get marriage summary for display
   */
  public getSummary(): Record<string, any> {
    const duration = this.calculateDuration();

    return {
      id: this.id.toString(),
      spouse1Id: this.props.spouse1Id.toString(),
      spouse2Id: this.props.spouse2Id.toString(),
      marriageType: this.props.marriageType,
      marriageStatus: this.props.marriageStatus,
      duration: `${duration.years} years, ${duration.months} months`,
      totalDays: duration.totalDays,
      isLegallyRecognized: this.isLegallyRecognized(),
      isPolygamous: this.props.isPolygamous,
      polygamousHouseId: this.props.polygamousHouseId?.toString(),
      numberOfChildren: this.props.numberOfChildren,
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      endReason: this.props.endReason,
      qualifiesForS40: this.qualifiesForS40Distribution(),
      verificationStatus: this.props.verificationStatus,
      isArchived: this.props.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get computed properties for business logic
   */
  public get computedProperties() {
    const duration = this.calculateDuration();

    return {
      duration,
      isActive: this.props.marriageStatus === MarriageStatus.MARRIED,
      isEnded:
        this.props.marriageStatus === MarriageStatus.DIVORCED ||
        this.props.marriageStatus === MarriageStatus.WIDOWED ||
        this.props.marriageStatus === MarriageStatus.SEPARATED,
      isLegallyRecognized: this.isLegallyRecognized(),
      qualifiesForS40: this.qualifiesForS40Distribution(),
      waitingPeriodCompleted: this.props.waitingPeriodCompleted,
      nextAnniversary: this.getNextAnniversary(),
      marriageStrength: this.calculateMarriageStrength(),
      legalCompliance: this.getLegalCompliance(),
    };
  }

  private getNextAnniversary(): { milestone: string; date: Date; daysUntil: number } | null {
    const anniversaries = this.getAnniversaries();
    const now = new Date();

    for (const anniversary of anniversaries) {
      if (!anniversary.passed && anniversary.date > now) {
        const daysUntil = Math.ceil(
          (anniversary.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          milestone: anniversary.milestone,
          date: anniversary.date,
          daysUntil,
        };
      }
    }

    return null;
  }

  private calculateMarriageStrength(): number {
    let score = 50; // Base score

    // Duration factor
    const duration = this.calculateDuration();
    if (duration.years >= 10) score += 20;
    else if (duration.years >= 5) score += 10;
    else if (duration.years >= 1) score += 5;

    // Children factor
    if (this.props.numberOfChildren > 0) score += 10;
    if (this.props.numberOfChildren >= 3) score += 5;

    // Legal recognition
    if (this.isLegallyRecognized()) score += 15;

    // Financial arrangements
    if (this.props.jointProperty) score += 5;
    if (this.props.prenuptialAgreement) score += 5;

    // No dissolution
    if (!this.props.isMarriageDissolved) score += 10;

    return Math.min(Math.max(score, 0), 100);
  }

  private getLegalCompliance(): Record<string, boolean> {
    return {
      legallyRecognized: this.isLegallyRecognized(),
      registrationComplete: !!this.props.registrationNumber,
      customaryRequirementsMet: this.areCustomaryRequirementsMet(),
      bridePriceComplete: this.props.bridePricePaid && this.props.bridePaidInFull,
      witnessesPresent:
        this.props.witnesses.length >= 2 ||
        (this.props.customaryDetails?.eldersPresent?.length || 0) >= 2,
      waitingPeriodCompleted: this.props.waitingPeriodCompleted,
      documentationComplete: !!(
        this.props.marriageCertificateId || this.props.cohabitationAffidavitId
      ),
    };
  }

  private areCustomaryRequirementsMet(): boolean {
    if (this.props.marriageType !== MarriageType.CUSTOMARY) {
      return true;
    }

    return (
      this.props.bridePricePaid &&
      (this.props.customaryDetails?.eldersPresent?.length || 0) >= 2 &&
      (this.props.customaryDetails?.traditionalRitesPerformed?.length || 0) > 0
    );
  }

  /**
   * Get marriage for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      spouses: {
        spouse1Id: this.props.spouse1Id.toString(),
        spouse2Id: this.props.spouse2Id.toString(),
      },
      details: {
        marriageType: this.props.marriageType,
        marriageStatus: this.props.marriageStatus,
        startDate: this.props.startDate,
        endDate: this.props.endDate,
        endReason: this.props.endReason,
        registrationNumber: this.props.registrationNumber,
        registrationDistrict: this.props.registrationDistrict,
        registeredBy: this.props.registeredBy,
        ceremonyLocation: this.props.ceremonyLocation,
        ceremonyCounty: this.props.ceremonyCounty,
        witnesses: this.props.witnesses,
      },
      customaryDetails: this.props.customaryDetails,
      polygamy: {
        isPolygamous: this.props.isPolygamous,
        polygamousHouseId: this.props.polygamousHouseId?.toString(),
        marriageOrder: this.props.marriageOrder,
      },
      family: {
        numberOfChildren: this.props.numberOfChildren,
        childrenIds: this.props.childrenIds.map((id) => id.toString()),
      },
      financial: {
        bridePricePaid: this.props.bridePricePaid,
        bridePriceAmount: this.props.bridePriceAmount,
        bridePriceCurrency: this.props.bridePriceCurrency,
        bridePaidInFull: this.props.bridePaidInFull,
        prenuptialAgreement: this.props.prenuptialAgreement,
        jointProperty: this.props.jointProperty,
        separatePropertyDeclaration: this.props.separatePropertyDeclaration,
      },
      legal: {
        marriageCertificateId: this.props.marriageCertificateId,
        cohabitationAffidavitId: this.props.cohabitationAffidavitId,
        divorceDecreeId: this.props.divorceDecreeId,
        isMarriageDissolved: this.props.isMarriageDissolved,
        dissolutionDate: this.props.dissolutionDate,
        dissolutionReason: this.props.dissolutionReason,
        waitingPeriodCompleted: this.props.waitingPeriodCompleted,
      },
      cultural: {
        marriageSeason: this.props.marriageSeason,
        marriageBlessings: this.props.marriageBlessings,
        traditionalGiftsExchanged: this.props.traditionalGiftsExchanged,
      },
      computedProperties: this.computedProperties,
      verification: {
        status: this.props.verificationStatus,
        notes: this.props.verificationNotes,
        verifiedBy: this.props.verifiedBy?.toString(),
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
