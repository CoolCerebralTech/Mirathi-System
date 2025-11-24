import { AggregateRoot } from '@nestjs/cqrs';
import { GuardianType } from '@prisma/client';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { GuardianRemovedEvent } from '../events/guardian-removed.event';
import { GuardianshipAuthorityUpdatedEvent } from '../events/guardianship-authority-updated.event';

export interface KenyanGuardianshipMetadata {
  courtOrderNumber?: string;
  courtName?: string;
  caseNumber?: string;
  isTemporary: boolean;
  reviewDate?: Date;
  conditions?: string[]; // Court-imposed conditions
  reportingRequirements?: string[]; // e.g., "Annual report to court"
  restrictedPowers?: string[]; // Powers the guardian does NOT have
}

export interface GuardianshipReconstitutionProps {
  id: string;
  guardianId: string;
  wardId: string;
  type: GuardianType;
  appointmentDate: string | Date;
  appointedBy?: string | null;
  validUntil?: string | Date | null;
  isActiveRecord?: boolean;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  metadata?: KenyanGuardianshipMetadata;
  familyId?: string;
  wardDateOfBirth?: string | Date;
}

export class Guardianship extends AggregateRoot {
  private id: string;
  private guardianId: string;
  private wardId: string;
  private type: GuardianType;
  private appointedBy: string | null;
  private appointmentDate: Date;
  private validUntil: Date | null;
  private isActiveRecord: boolean;
  private notes: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  // Kenyan Legal Metadata
  private metadata: KenyanGuardianshipMetadata;
  private familyId: string | null;

  private constructor(
    id: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentDate: Date,
  ) {
    super();

    this.validateGuardianship(guardianId, wardId, type);

    this.id = id;
    this.guardianId = guardianId;
    this.wardId = wardId;
    this.type = type;
    this.appointmentDate = appointmentDate;

    this.appointedBy = null;
    this.validUntil = null;
    this.isActiveRecord = true;
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.familyId = null;

    this.metadata = {
      isTemporary: false,
      conditions: [],
      reportingRequirements: [],
      restrictedPowers: [],
    };
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    familyId: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    wardDateOfBirth: Date,
    details?: {
      appointedBy?: string;
      courtOrderNumber?: string;
      courtName?: string;
      caseNumber?: string;
      conditions?: string[];
      isTemporary?: boolean;
      reviewDate?: Date;
    },
  ): Guardianship {
    const guardianship = new Guardianship(id, guardianId, wardId, type, new Date());

    guardianship.familyId = familyId;
    guardianship.validUntil = guardianship.calculateExpiryDate(wardDateOfBirth);

    if (details?.appointedBy) guardianship.appointedBy = details.appointedBy;

    guardianship.metadata = {
      isTemporary: details?.isTemporary || false,
      courtOrderNumber: details?.courtOrderNumber,
      courtName: details?.courtName,
      caseNumber: details?.caseNumber,
      conditions: details?.conditions || [],
      reportingRequirements: [],
      restrictedPowers: [],
      reviewDate: details?.reviewDate,
    };

    guardianship.apply(
      new GuardianAssignedEvent(familyId, {
        guardianId: guardianId,
        wardId: wardId,
        guardianType: type,
        appointedBy: (guardianship.appointedBy as 'court' | 'family' | 'will') ?? 'family',
        validUntil: guardianship.validUntil ?? undefined,
        appointmentDate: guardianship.appointmentDate,
        notes: guardianship.notes ?? undefined,
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
      props.appointmentDate instanceof Date
        ? props.appointmentDate
        : new Date(props.appointmentDate),
    );

    guardianship.appointedBy = props.appointedBy || null;

    if (props.validUntil) {
      guardianship.validUntil =
        props.validUntil instanceof Date ? props.validUntil : new Date(props.validUntil);
    } else {
      guardianship.validUntil = null;
    }

    guardianship.isActiveRecord = props.isActiveRecord ?? true;
    guardianship.notes = props.notes || null;
    guardianship.createdAt =
      props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    guardianship.updatedAt =
      props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);
    guardianship.familyId = props.familyId || null;

    // Metadata reconstitution - FIX: Check if props.metadata exists first
    if (props.metadata) {
      guardianship.metadata = {
        ...props.metadata,
        conditions: props.metadata.conditions ?? [],
        reportingRequirements: props.metadata.reportingRequirements ?? [],
        restrictedPowers: props.metadata.restrictedPowers ?? [],
        isTemporary: props.metadata.isTemporary ?? false,
        // Handle Dates in metadata if they come as strings
        reviewDate: props.metadata.reviewDate
          ? props.metadata.reviewDate instanceof Date
            ? props.metadata.reviewDate
            : new Date(props.metadata.reviewDate)
          : undefined,
      };
    } else {
      // Default metadata if missing
      guardianship.metadata = {
        isTemporary: false,
        conditions: [],
        reportingRequirements: [],
        restrictedPowers: [],
      };
    }

    return guardianship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  revoke(reason: string, revokedBy: string, courtOrderNumber?: string): void {
    if (!this.isActiveRecord) return;

    this.isActiveRecord = false;
    this.updatedAt = new Date();

    if (courtOrderNumber) {
      this.metadata.courtOrderNumber = courtOrderNumber;
    }

    if (this.familyId) {
      this.apply(
        new GuardianRemovedEvent(
          this.id,
          this.familyId,
          this.guardianId,
          this.wardId,
          reason,
          revokedBy,
          courtOrderNumber,
        ),
      );
    }
  }

  extendGuardianship(newExpiryDate: Date, extensionReason: string, authorizedBy: string): void {
    if (!this.isActiveRecord) throw new Error('Cannot extend an inactive guardianship.');

    // Ensure validUntil is set before comparison (it might be null if reconstituted poorly, though factory sets it)
    const currentExpiry = this.validUntil || new Date();

    if (newExpiryDate <= currentExpiry) {
      throw new Error('New expiry date must be after current expiry date.');
    }

    const previousExpiry = this.validUntil;
    this.validUntil = newExpiryDate;
    this.updatedAt = new Date();

    this.metadata.conditions = [
      ...(this.metadata.conditions || []),
      `Extended until ${newExpiryDate.toDateString()} - ${extensionReason}`,
    ];

    if (this.familyId) {
      this.apply(
        new GuardianshipAuthorityUpdatedEvent(this.id, this.familyId, {
          previousExpiry,
          newExpiry: newExpiryDate,
          reason: extensionReason,
          authorizedBy,
        }),
      );
    }
  }

  updateConditions(conditions: string[]): void {
    this.metadata.conditions = conditions;
    this.updatedAt = new Date();
  }

  addReportingRequirement(requirement: string): void {
    this.metadata.reportingRequirements = [
      ...(this.metadata.reportingRequirements || []),
      requirement,
    ];
    this.updatedAt = new Date();
  }

  restrictPowers(powers: string[]): void {
    this.metadata.restrictedPowers = [...(this.metadata.restrictedPowers || []), ...powers];
    this.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  validateLegalCompliance(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.isActiveRecord) issues.push('Guardianship is not active.');
    if (this.validUntil && new Date() > this.validUntil) issues.push('Guardianship has expired.');

    if (this.type === 'LEGAL_GUARDIAN' && !this.metadata.courtOrderNumber) {
      issues.push('Legal guardianships require a court order number.');
    }
    if (this.type === 'TESTAMENTARY' && !this.appointedBy) {
      issues.push('Testamentary guardianships require a will reference.');
    }
    if (this.metadata.isTemporary && !this.metadata.reviewDate) {
      issues.push('Temporary guardianships require a review date.');
    }

    return { isValid: issues.length === 0, issues };
  }

  isValid(): boolean {
    const compliance = this.validateLegalCompliance();
    return compliance.isValid && this.isActiveRecord;
  }

  getRemainingDuration(): number | null {
    if (!this.validUntil || !this.isActiveRecord) return null;
    const now = new Date();
    const expiry = this.validUntil;
    if (expiry <= now) return 0;
    const diffTime = Math.abs(expiry.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private validateGuardianship(guardianId: string, wardId: string, type: GuardianType): void {
    if (guardianId === wardId) throw new Error('A member cannot be their own guardian.');
    const validTypes: GuardianType[] = [
      'LEGAL_GUARDIAN',
      'FINANCIAL_GUARDIAN',
      'PROPERTY_GUARDIAN',
      'TESTAMENTARY',
    ];
    if (!validTypes.includes(type)) throw new Error(`Invalid guardian type: ${type}`);
  }

  private calculateExpiryDate(wardDateOfBirth: Date): Date {
    const expiry = new Date(wardDateOfBirth);
    expiry.setFullYear(expiry.getFullYear() + 18);
    return expiry;
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
  getIsActiveRecord(): boolean {
    return this.isActiveRecord;
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
  getMetadata(): KenyanGuardianshipMetadata {
    return { ...this.metadata };
  }
  getFamilyId(): string | null {
    return this.familyId;
  }

  getGuardianshipSummary() {
    const compliance = this.validateLegalCompliance();
    return {
      id: this.id,
      guardianId: this.guardianId,
      wardId: this.wardId,
      type: this.type,
      isActive: this.isActiveRecord,
      isValid: compliance.isValid,
      legalIssues: compliance.issues,
      appointmentDate: this.appointmentDate,
      validUntil: this.validUntil,
      remainingMonths: this.getRemainingDuration(),
      metadata: this.metadata,
      appointedBy: this.appointedBy,
      familyId: this.familyId,
    };
  }
}
