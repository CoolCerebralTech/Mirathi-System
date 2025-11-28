import { AggregateRoot } from '@nestjs/cqrs';
import { GuardianAppointmentSource, GuardianType } from '@prisma/client';

import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { GuardianRemovedEvent } from '../events/guardian-removed.event';
import { GuardianshipAuthorityUpdatedEvent } from '../events/guardianship-authority-updated.event';

// Kenyan Legal Value Objects
export class KenyanCourtOrder {
  constructor(
    public readonly courtOrderNumber: string,
    public readonly courtName: string,
    public readonly caseNumber: string,
    public readonly issuingJudge: string,
    public readonly courtStation: string,
  ) {}
}

export class GuardianshipConditions {
  constructor(
    public readonly conditions: string[],
    public readonly reportingRequirements: string[],
    public readonly restrictedPowers: string[],
    public readonly specialInstructions: string[],
  ) {}
}

// Guardianship Reconstitution Interface matching Prisma schema exactly
interface GuardianshipReconstitutionProps {
  id: string;

  // Core relationships (exactly matching Prisma schema)
  guardianId: string;
  wardId: string;
  type: GuardianType;

  // Legal appointment (exactly matching Prisma schema)
  appointedBy?: string | null;
  appointmentDate: Date;
  validUntil?: Date | null;

  // Kenyan Court Order Fields (exactly matching Prisma schema)
  courtOrderNumber?: string | null;
  courtName?: string | null;
  caseNumber?: string | null;
  issuingJudge?: string | null;
  courtStation?: string | null;

  // Guardianship Conditions (exactly matching Prisma schema)
  conditions?: any | null; // JSON field
  reportingRequirements?: any | null; // JSON field
  restrictedPowers?: any | null; // JSON field
  specialInstructions?: any | null; // JSON field

  // Status & Review (exactly matching Prisma schema)
  isTemporary: boolean;
  reviewDate?: Date | null;

  // Status (exactly matching Prisma schema)
  isActive: boolean;
  notes?: string | null;

  // Timestamps (exactly matching Prisma schema)
  createdAt: Date;
  updatedAt: Date;
}

export class Guardianship extends AggregateRoot {
  private id: string;

  // Core relationships (exactly matching Prisma schema)
  private guardianId: string;
  private wardId: string;
  private type: GuardianType;

  // Legal appointment (exactly matching Prisma schema)
  private appointedBy: string | null;
  private appointmentDate: Date;
  private validUntil: Date | null;

  // Kenyan Court Order Fields (exactly matching Prisma schema)
  private courtOrderNumber: string | null;
  private courtName: string | null;
  private caseNumber: string | null;
  private issuingJudge: string | null;
  private courtStation: string | null;

  // Guardianship Conditions (exactly matching Prisma schema)
  private conditions: string[];
  private reportingRequirements: string[];
  private restrictedPowers: string[];
  private specialInstructions: string[];

  // Status & Review (exactly matching Prisma schema)
  private isTemporary: boolean;
  private reviewDate: Date | null;

  // Status (exactly matching Prisma schema)
  private isActive: boolean;
  private notes: string | null;

  // Timestamps (exactly matching Prisma schema)
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentDate: Date,
  ) {
    super();

    this.validateGuardianshipCreation(guardianId, wardId, type);

    this.id = id;
    this.guardianId = guardianId;
    this.wardId = wardId;
    this.type = type;
    this.appointmentDate = appointmentDate;

    // Initialize Prisma schema fields with defaults
    this.appointedBy = null;
    this.validUntil = null;
    this.courtOrderNumber = null;
    this.courtName = null;
    this.caseNumber = null;
    this.issuingJudge = null;
    this.courtStation = null;
    this.conditions = [];
    this.reportingRequirements = [];
    this.restrictedPowers = [];
    this.specialInstructions = [];
    this.isTemporary = false;
    this.reviewDate = null;
    this.isActive = true;
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a new Guardianship with Kenyan legal compliance
   * Law of Succession Act and Children's Act provisions for guardianship
   */
  static create(
    id: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentSource: GuardianAppointmentSource,
    details?: {
      appointedBy?: string;
      validUntil?: Date;
      courtOrderNumber?: string;
      courtName?: string;
      caseNumber?: string;
      issuingJudge?: string;
      courtStation?: string;
      conditions?: string[];
      reportingRequirements?: string[];
      restrictedPowers?: string[];
      specialInstructions?: string[];
      isTemporary?: boolean;
      reviewDate?: Date;
      notes?: string;
    },
  ): Guardianship {
    const guardianship = new Guardianship(id, guardianId, wardId, type, new Date());

    // Set appointment source
    guardianship.appointedBy = details?.appointedBy || null;

    // Set validity period
    if (details?.validUntil) {
      guardianship.validUntil = details.validUntil;
    }

    // Kenyan Court Order Fields - required for court-appointed guardians
    if (appointmentSource === GuardianAppointmentSource.COURT) {
      if (!details?.courtOrderNumber) {
        throw new Error('Court-appointed guardianships require a court order number.');
      }
      guardianship.courtOrderNumber = details.courtOrderNumber;
      guardianship.courtName = details.courtName || null;
      guardianship.caseNumber = details.caseNumber || null;
      guardianship.issuingJudge = details.issuingJudge || null;
      guardianship.courtStation = details.courtStation || null;
    }

    // Set conditions and requirements
    guardianship.conditions = details?.conditions || [];
    guardianship.reportingRequirements = details?.reportingRequirements || [];
    guardianship.restrictedPowers = details?.restrictedPowers || [];
    guardianship.specialInstructions = details?.specialInstructions || [];

    // Set status and review
    guardianship.isTemporary = details?.isTemporary || false;
    if (details?.reviewDate) {
      guardianship.reviewDate = details.reviewDate;
    }

    // Set notes
    guardianship.notes = details?.notes || null;

    guardianship.apply(
      new GuardianAssignedEvent({
        id: guardianship.id,
        guardianId: guardianship.guardianId,
        wardId: guardianship.wardId,
        type: guardianship.type,
        appointmentDate: guardianship.appointmentDate,
        appointedBy: guardianship.appointedBy,
        validUntil: guardianship.validUntil,
        courtOrderNumber: guardianship.courtOrderNumber,
        isTemporary: guardianship.isTemporary,
        notes: guardianship.notes,
      }),
    );

    return guardianship;
  }

  /**
   * Reconstitutes Guardianship from persistence exactly matching Prisma schema
   */
  static reconstitute(props: GuardianshipReconstitutionProps): Guardianship {
    const guardianship = new Guardianship(
      props.id,
      props.guardianId,
      props.wardId,
      props.type,
      props.appointmentDate,
    );

    // Set all Prisma schema fields exactly
    guardianship.appointedBy = props.appointedBy || null;
    guardianship.validUntil = props.validUntil || null;
    guardianship.courtOrderNumber = props.courtOrderNumber || null;
    guardianship.courtName = props.courtName || null;
    guardianship.caseNumber = props.caseNumber || null;
    guardianship.issuingJudge = props.issuingJudge || null;
    guardianship.courtStation = props.courtStation || null;

    // Handle JSON array fields
    guardianship.conditions = Array.isArray(props.conditions) ? props.conditions : [];
    guardianship.reportingRequirements = Array.isArray(props.reportingRequirements)
      ? props.reportingRequirements
      : [];
    guardianship.restrictedPowers = Array.isArray(props.restrictedPowers)
      ? props.restrictedPowers
      : [];
    guardianship.specialInstructions = Array.isArray(props.specialInstructions)
      ? props.specialInstructions
      : [];

    guardianship.isTemporary = props.isTemporary;
    guardianship.reviewDate = props.reviewDate || null;
    guardianship.isActive = props.isActive;
    guardianship.notes = props.notes || null;
    guardianship.createdAt = props.createdAt;
    guardianship.updatedAt = props.updatedAt;

    return guardianship;
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Revokes guardianship with Kenyan legal formalities
   * Children's Act provides for revocation procedures
   */
  revoke(reason: string, revokedBy: string, courtOrderNumber?: string): void {
    if (!this.isActive) {
      throw new Error('Guardianship is already inactive.');
    }

    // Legal validation for revocation
    if (this.type === GuardianType.LEGAL_GUARDIAN && !courtOrderNumber) {
      throw new Error('Legal guardianship revocation requires a court order number.');
    }

    this.isActive = false;
    this.updatedAt = new Date();

    // Update court order if provided
    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.apply(
      new GuardianRemovedEvent(
        this.id,
        this.guardianId,
        this.wardId,
        reason,
        revokedBy,
        courtOrderNumber,
      ),
    );
  }

  /**
   * Extends guardianship with Kenyan legal compliance
   * Used when ward remains a minor beyond initial term
   */
  extendGuardianship(
    newExpiryDate: Date,
    extensionReason: string,
    authorizedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) {
      throw new Error('Cannot extend an inactive guardianship.');
    }

    // Legal validation
    const currentExpiry = this.validUntil || new Date();
    if (newExpiryDate <= currentExpiry) {
      throw new Error('New expiry date must be after current expiry date.');
    }

    const previousExpiry = this.validUntil;
    this.validUntil = newExpiryDate;
    this.updatedAt = new Date();

    // Add extension condition
    this.conditions = [
      ...this.conditions,
      `Extended until ${newExpiryDate.toLocaleDateString()} - ${extensionReason} (Authorized by: ${authorizedBy})`,
    ];

    // Update court order if provided for legal guardians
    if (this.type === GuardianType.LEGAL_GUARDIAN && courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.apply(
      new GuardianshipAuthorityUpdatedEvent(this.id, {
        previousExpiry,
        newExpiry: newExpiryDate,
        reason: extensionReason,
        authorizedBy,
        courtOrderNumber,
      }),
    );
  }

  /**
   * Updates guardianship conditions with Kenyan legal validation
   */
  updateConditions(conditions: string[]): void {
    this.validateConditions(conditions);
    this.conditions = conditions;
    this.updatedAt = new Date();
  }

  /**
   * Adds reporting requirement for court compliance
   */
  addReportingRequirement(requirement: string): void {
    this.reportingRequirements = [...this.reportingRequirements, requirement];
    this.updatedAt = new Date();
  }

  /**
   * Restricts guardian powers as per court order or family agreement
   */
  restrictPowers(powers: string[]): void {
    this.restrictedPowers = [...this.restrictedPowers, ...powers];
    this.updatedAt = new Date();
  }

  /**
   * Adds special instructions for guardianship administration
   */
  addSpecialInstruction(instruction: string): void {
    this.specialInstructions = [...this.specialInstructions, instruction];
    this.updatedAt = new Date();
  }

  /**
   * Schedules review for temporary guardianships as required by Kenyan law
   */
  scheduleReview(reviewDate: Date): void {
    if (!this.isTemporary) {
      throw new Error('Review dates are only required for temporary guardianships.');
    }

    if (reviewDate <= new Date()) {
      throw new Error('Review date must be in the future.');
    }

    this.reviewDate = reviewDate;
    this.updatedAt = new Date();
  }

  /**
   * Updates notes with legal context
   */
  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates guardianship compliance with Kenyan law
   * Children's Act and Law of Succession Act provisions
   */
  validateLegalCompliance(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Active status validation
    if (!this.isActive) {
      errors.push('Guardianship is not active.');
    }

    // Expiry validation
    if (this.validUntil && new Date() > this.validUntil) {
      errors.push('Guardianship has expired.');
    }

    // Kenyan legal requirements by guardian type
    if (this.type === GuardianType.LEGAL_GUARDIAN) {
      if (!this.courtOrderNumber) {
        errors.push('Legal guardianships require a court order number.');
      }
      if (!this.courtName) {
        warnings.push('Court name is recommended for legal guardianships.');
      }
    }

    if (this.type === GuardianType.TESTAMENTARY && !this.appointedBy) {
      warnings.push('Testamentary guardianships should reference the appointing will.');
    }

    // Temporary guardianship requirements
    if (this.isTemporary) {
      if (!this.reviewDate) {
        errors.push('Temporary guardianships require a review date.');
      } else if (this.reviewDate < new Date()) {
        warnings.push('Temporary guardianship review date has passed.');
      }
    }

    // Minor protection validation
    if (this.validUntil) {
      const yearsUntilExpiry =
        (this.validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsUntilExpiry > 5) {
        warnings.push('Long-term guardianship detected - consider periodic court reviews.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates if guardianship is currently valid under Kenyan law
   */
  isValid(): boolean {
    const compliance = this.validateLegalCompliance();
    return compliance.isValid && this.isActive;
  }

  /**
   * Calculates remaining duration in months for reporting purposes
   */
  getRemainingDuration(): number | null {
    if (!this.validUntil || !this.isActive) return null;

    const now = new Date();
    const expiry = this.validUntil;

    if (expiry <= now) return 0;

    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // months
  }

  /**
   * Determines if review is overdue for temporary guardianships
   */
  isReviewOverdue(): boolean {
    if (!this.isTemporary || !this.reviewDate) return false;
    return new Date() > this.reviewDate;
  }

  // --------------------------------------------------------------------------
  // PRIVATE VALIDATION METHODS
  // --------------------------------------------------------------------------

  private validateGuardianshipCreation(
    guardianId: string,
    wardId: string,
    type: GuardianType,
  ): void {
    // Legal prohibition - guardian cannot be the same as ward
    if (guardianId === wardId) {
      throw new Error('A person cannot be their own guardian under Kenyan law.');
    }

    // Validate guardian type
    const validTypes = Object.values(GuardianType);
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid guardian type: ${type}`);
    }
  }

  private validateConditions(conditions: string[]): void {
    // Validate that conditions don't violate Kenyan law
    const illegalConditions = conditions.filter(
      (condition) =>
        condition.toLowerCase().includes('disinherit') ||
        condition.toLowerCase().includes('prevent inheritance'),
    );

    if (illegalConditions.length > 0) {
      throw new Error(
        'Guardianship conditions cannot restrict inheritance rights under Kenyan law.',
      );
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS (exactly matching Prisma schema fields)
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getGuardianId(): string {
    return this.guardianId;
  }
  getWardId(): string {
    return this.wardId;
  }
  getType(): GuardianType {
    return this.type;
  }
  getAppointedBy(): string | null {
    return this.appointedBy;
  }
  getAppointmentDate(): Date {
    return this.appointmentDate;
  }
  getValidUntil(): Date | null {
    return this.validUntil;
  }
  getCourtOrderNumber(): string | null {
    return this.courtOrderNumber;
  }
  getCourtName(): string | null {
    return this.courtName;
  }
  getCaseNumber(): string | null {
    return this.caseNumber;
  }
  getIssuingJudge(): string | null {
    return this.issuingJudge;
  }
  getCourtStation(): string | null {
    return this.courtStation;
  }
  getConditions(): string[] {
    return [...this.conditions];
  }
  getReportingRequirements(): string[] {
    return [...this.reportingRequirements];
  }
  getRestrictedPowers(): string[] {
    return [...this.restrictedPowers];
  }
  getSpecialInstructions(): string[] {
    return [...this.specialInstructions];
  }
  getIsTemporary(): boolean {
    return this.isTemporary;
  }
  getReviewDate(): Date | null {
    return this.reviewDate;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getNotes(): string | null {
    return this.notes;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets comprehensive guardianship summary for Kenyan legal proceedings
   */
  getGuardianshipSummary() {
    const compliance = this.validateLegalCompliance();
    const remainingMonths = this.getRemainingDuration();

    return {
      id: this.id,
      guardianId: this.guardianId,
      wardId: this.wardId,
      type: this.type,
      isActive: this.isActive,
      isValid: compliance.isValid,
      legalIssues: compliance.errors,
      warnings: compliance.warnings,
      appointmentDate: this.appointmentDate,
      validUntil: this.validUntil,
      remainingMonths,
      courtOrder: this.courtOrderNumber
        ? {
            courtOrderNumber: this.courtOrderNumber,
            courtName: this.courtName,
            caseNumber: this.caseNumber,
            issuingJudge: this.issuingJudge,
            courtStation: this.courtStation,
          }
        : null,
      conditions: this.conditions,
      reportingRequirements: this.reportingRequirements,
      restrictedPowers: this.restrictedPowers,
      specialInstructions: this.specialInstructions,
      isTemporary: this.isTemporary,
      reviewDate: this.reviewDate,
      isReviewOverdue: this.isReviewOverdue(),
      notes: this.notes,
      appointedBy: this.appointedBy,
    };
  }

  /**
   * Gets Kenyan court order details for legal documentation
   */
  getKenyanCourtOrder(): KenyanCourtOrder | null {
    if (
      !this.courtOrderNumber ||
      !this.courtName ||
      !this.caseNumber ||
      !this.issuingJudge ||
      !this.courtStation
    ) {
      return null;
    }

    return new KenyanCourtOrder(
      this.courtOrderNumber,
      this.courtName,
      this.caseNumber,
      this.issuingJudge,
      this.courtStation,
    );
  }

  /**
   * Gets all guardianship conditions for court reporting
   */
  getGuardianshipConditions(): GuardianshipConditions {
    return new GuardianshipConditions(
      this.conditions,
      this.reportingRequirements,
      this.restrictedPowers,
      this.specialInstructions,
    );
  }
}
