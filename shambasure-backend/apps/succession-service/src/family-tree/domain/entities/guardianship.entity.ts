import { AggregateRoot } from '@nestjs/cqrs';
import { GuardianAppointmentSource, GuardianType, Prisma } from '@prisma/client';

import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { GuardianRemovedEvent } from '../events/guardian-removed.event';
import { GuardianshipAuthorityUpdatedEvent } from '../events/guardianship-authority-updated.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

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

// Guardianship Reconstitution Interface matching Prisma schema
export interface GuardianshipReconstitutionProps {
  id: string;

  // Core relationships
  guardianId: string;
  wardId: string;
  type: GuardianType;

  // Legal appointment
  appointedBy: string | null;
  appointmentDate: Date;
  validUntil: Date | null;

  // Kenyan Court Order Fields
  courtOrderNumber: string | null;
  courtName: string | null;
  caseNumber: string | null;
  issuingJudge: string | null;
  courtStation: string | null;

  // Guardianship Conditions (Prisma Json Types)
  conditions: Prisma.JsonValue;
  reportingRequirements: Prisma.JsonValue;
  restrictedPowers: Prisma.JsonValue;
  specialInstructions: Prisma.JsonValue;

  // Status & Review
  isTemporary: boolean;
  reviewDate: Date | null;

  // Status
  isActive: boolean;
  notes: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: GUARDIANSHIP
// -----------------------------------------------------------------------------

export class Guardianship extends AggregateRoot {
  private readonly id: string;

  // Core relationships
  private readonly guardianId: string;
  private readonly wardId: string;
  private readonly type: GuardianType;

  // Legal appointment
  private appointedBy: string | null;
  private readonly appointmentDate: Date;
  private validUntil: Date | null;

  // Kenyan Court Order Fields
  private courtOrderNumber: string | null;
  private courtName: string | null;
  private caseNumber: string | null;
  private issuingJudge: string | null;
  private courtStation: string | null;

  // Guardianship Conditions
  private conditions: string[];
  private reportingRequirements: string[];
  private restrictedPowers: string[];
  private specialInstructions: string[];

  // Status & Review
  private isTemporary: boolean;
  private reviewDate: Date | null;

  // Status
  private isActive: boolean;
  private notes: string | null;

  // Timestamps
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentDate: Date,
    // Lifecycle injection for reconstitution
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super();

    // Basic Validation
    if (guardianId === wardId) {
      throw new Error('A person cannot be their own guardian under Kenyan law.');
    }

    this.id = id;
    this.guardianId = guardianId;
    this.wardId = wardId;
    this.type = type;
    this.appointmentDate = appointmentDate;

    // Defaults
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

    // Lifecycle
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

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

    guardianship.appointedBy = details?.appointedBy || null;

    if (details?.validUntil) {
      guardianship.validUntil = details.validUntil;
    }

    // Kenyan Court Order Fields Logic
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

    guardianship.conditions = details?.conditions || [];
    guardianship.reportingRequirements = details?.reportingRequirements || [];
    guardianship.restrictedPowers = details?.restrictedPowers || [];
    guardianship.specialInstructions = details?.specialInstructions || [];

    guardianship.isTemporary = details?.isTemporary || false;
    if (details?.reviewDate) {
      guardianship.reviewDate = details.reviewDate;
    }

    guardianship.notes = details?.notes || null;

    guardianship.apply(
      new GuardianAssignedEvent(guardianship.id, {
        // Passed as args to match Event constructor
        guardianId: guardianship.guardianId,
        wardId: guardianship.wardId,
        type: guardianship.type,
        appointedBy: appointmentSource, // Use the Source Enum passed in
        appointmentDate: guardianship.appointmentDate,
        validUntil: guardianship.validUntil || undefined,
        courtOrderNumber: guardianship.courtOrderNumber || undefined,
        isTemporary: guardianship.isTemporary,
        notes: guardianship.notes || undefined,
      }),
    );

    return guardianship;
  }

  static reconstitute(props: GuardianshipReconstitutionProps): Guardianship {
    const guardianship = new Guardianship(
      props.id,
      props.guardianId,
      props.wardId,
      props.type,
      props.appointmentDate,
      props.createdAt,
      props.updatedAt,
    );

    guardianship.appointedBy = props.appointedBy;
    guardianship.validUntil = props.validUntil;
    guardianship.courtOrderNumber = props.courtOrderNumber;
    guardianship.courtName = props.courtName;
    guardianship.caseNumber = props.caseNumber;
    guardianship.issuingJudge = props.issuingJudge;
    guardianship.courtStation = props.courtStation;

    // Safe JSON Parsing for Arrays
    guardianship.conditions = Array.isArray(props.conditions) ? (props.conditions as string[]) : [];
    guardianship.reportingRequirements = Array.isArray(props.reportingRequirements)
      ? (props.reportingRequirements as string[])
      : [];
    guardianship.restrictedPowers = Array.isArray(props.restrictedPowers)
      ? (props.restrictedPowers as string[])
      : [];
    guardianship.specialInstructions = Array.isArray(props.specialInstructions)
      ? (props.specialInstructions as string[])
      : [];

    guardianship.isTemporary = props.isTemporary;
    guardianship.reviewDate = props.reviewDate;
    guardianship.isActive = props.isActive;
    guardianship.notes = props.notes;

    return guardianship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  revoke(reason: string, revokedBy: string, courtOrderNumber?: string): void {
    if (!this.isActive) {
      throw new Error('Guardianship is already inactive.');
    }

    // Children's Act: Court-appointed guardians must be removed by court
    if (this.type === GuardianType.LEGAL_GUARDIAN && !courtOrderNumber) {
      throw new Error('Legal guardianship revocation requires a court order number.');
    }

    this.isActive = false;
    this.updatedAt = new Date();

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

  extendGuardianship(
    newExpiryDate: Date,
    extensionReason: string,
    authorizedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) {
      throw new Error('Cannot extend an inactive guardianship.');
    }

    const currentExpiry = this.validUntil || new Date();
    if (newExpiryDate <= currentExpiry) {
      throw new Error('New expiry date must be after current expiry date.');
    }

    const previousExpiry = this.validUntil;
    this.validUntil = newExpiryDate;
    this.updatedAt = new Date();

    this.conditions.push(
      `Extended until ${newExpiryDate.toLocaleDateString()} - ${extensionReason} (Authorized by: ${authorizedBy})`,
    );

    if (this.type === GuardianType.LEGAL_GUARDIAN && courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.apply(
      new GuardianshipAuthorityUpdatedEvent(this.id, {
        previousExpiry: previousExpiry || undefined,
        newExpiry: newExpiryDate,
        reason: extensionReason,
        authorizedBy,
        courtOrderNumber,
      }),
    );
  }

  updateConditions(conditions: string[]): void {
    this.validateConditions(conditions);
    this.conditions = conditions;
    this.updatedAt = new Date();
  }

  addReportingRequirement(requirement: string): void {
    this.reportingRequirements.push(requirement);
    this.updatedAt = new Date();
  }

  restrictPowers(powers: string[]): void {
    this.restrictedPowers.push(...powers);
    this.updatedAt = new Date();
  }

  addSpecialInstruction(instruction: string): void {
    this.specialInstructions.push(instruction);
    this.updatedAt = new Date();
  }

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

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // LEGAL VALIDATION
  // --------------------------------------------------------------------------

  validateLegalCompliance(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isActive) errors.push('Guardianship is not active.');

    if (this.validUntil && new Date() > this.validUntil) {
      errors.push('Guardianship has expired.');
    }

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

    if (this.isTemporary) {
      if (!this.reviewDate) {
        errors.push('Temporary guardianships require a review date.');
      } else if (this.reviewDate < new Date()) {
        warnings.push('Temporary guardianship review date has passed.');
      }
    }

    if (this.validUntil) {
      const yearsUntilExpiry =
        (this.validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsUntilExpiry > 5) {
        warnings.push('Long-term guardianship detected - consider periodic court reviews.');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  isValid(): boolean {
    const compliance = this.validateLegalCompliance();
    return compliance.isValid && this.isActive;
  }

  getRemainingDuration(): number | null {
    if (!this.validUntil || !this.isActive) return null;
    const now = new Date();
    if (this.validUntil <= now) return 0;
    const diffTime = this.validUntil.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // months
  }

  isReviewOverdue(): boolean {
    if (!this.isTemporary || !this.reviewDate) return false;
    return new Date() > this.reviewDate;
  }

  private validateConditions(conditions: string[]): void {
    const illegalConditions = conditions.filter(
      (c) =>
        c.toLowerCase().includes('disinherit') || c.toLowerCase().includes('prevent inheritance'),
    );
    if (illegalConditions.length > 0) {
      throw new Error(
        'Guardianship conditions cannot restrict inheritance rights under Kenyan law.',
      );
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS
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

  getGuardianshipSummary() {
    const compliance = this.validateLegalCompliance();
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
      remainingMonths: this.getRemainingDuration(),
      courtOrder: this.getKenyanCourtOrder(),
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

  getGuardianshipConditions(): GuardianshipConditions {
    return new GuardianshipConditions(
      this.conditions,
      this.reportingRequirements,
      this.restrictedPowers,
      this.specialInstructions,
    );
  }
}
