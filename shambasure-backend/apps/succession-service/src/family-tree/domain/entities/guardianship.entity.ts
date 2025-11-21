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
  private familyId: string | null; // For cross-referencing

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

    // Defaults
    this.appointedBy = null;
    this.validUntil = null;
    this.isActiveRecord = true;
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.familyId = null;

    // Kenyan metadata defaults
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

    // Set family context
    guardianship.familyId = familyId;

    // Calculate expiry based on Kenyan law (age 18)
    guardianship.validUntil = guardianship.calculateExpiryDate(wardDateOfBirth);

    if (details?.appointedBy) guardianship.appointedBy = details.appointedBy;

    // Set Kenyan legal metadata
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

    // Safe assignments
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

    // Metadata
    if (props.metadata) {
      guardianship.metadata = {
        ...props.metadata, // first spread incoming metadata
        conditions: props.metadata.conditions ?? [], // ensure arrays have defaults
        reportingRequirements: props.metadata.reportingRequirements ?? [],
        restrictedPowers: props.metadata.restrictedPowers ?? [],
        isTemporary: props.metadata.isTemporary ?? false, // default if undefined
      };
    }

    return guardianship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - KENYAN LEGAL COMPLIANCE
  // --------------------------------------------------------------------------

  /**
   * Terminate the guardianship with Kenyan legal considerations
   */
  revoke(reason: string, revokedBy: string, courtOrderNumber?: string): void {
    if (!this.isActiveRecord) return;

    this.isActiveRecord = false;
    this.updatedAt = new Date();

    // Update metadata if court order provided
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

  /**
   * Extend guardianship beyond age 18 for special cases (disability, etc.)
   */
  extendGuardianship(newExpiryDate: Date, extensionReason: string, authorizedBy: string): void {
    if (!this.isActiveRecord) {
      throw new Error('Cannot extend an inactive guardianship.');
    }

    if (newExpiryDate <= this.validUntil!) {
      throw new Error('New expiry date must be after current expiry date.');
    }

    const previousExpiry = this.validUntil;
    this.validUntil = newExpiryDate;
    this.updatedAt = new Date();

    // Add condition about extension
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

  /**
   * Update guardianship conditions as per court orders
   */
  updateConditions(conditions: string[]): void {
    this.metadata.conditions = conditions;
    this.updatedAt = new Date();

    // We could emit an event here for significant condition changes
  }

  /**
   * Add reporting requirements (e.g., annual reports to court)
   */
  addReportingRequirement(requirement: string): void {
    this.metadata.reportingRequirements = [
      ...(this.metadata.reportingRequirements || []),
      requirement,
    ];
    this.updatedAt = new Date();
  }

  /**
   * Restrict specific powers of the guardian
   */
  restrictPowers(powers: string[]): void {
    this.metadata.restrictedPowers = [...(this.metadata.restrictedPowers || []), ...powers];
    this.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS - KENYAN LAW COMPLIANCE
  // --------------------------------------------------------------------------

  /**
   * Validates if the guardianship is legally compliant under Kenyan law
   */
  validateLegalCompliance(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.isActiveRecord) {
      issues.push('Guardianship is not active.');
    }

    // Check expiry
    if (this.validUntil && new Date() > this.validUntil) {
      issues.push('Guardianship has expired.');
    }

    // Court-ordered guardianships must have court details
    if (this.type === 'LEGAL_GUARDIAN' && !this.metadata.courtOrderNumber) {
      issues.push('Legal guardianships require a court order number.');
    }

    // Testamentary guardianships must have appointedBy (will reference)
    if (this.type === 'TESTAMENTARY' && !this.appointedBy) {
      issues.push('Testamentary guardianships require a will reference.');
    }

    // Temporary guardianships must have review dates
    if (this.metadata.isTemporary && !this.metadata.reviewDate) {
      issues.push('Temporary guardianships require a review date.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Checks if the guardianship is currently legally valid under Kenyan law
   */
  isValid(): boolean {
    const compliance = this.validateLegalCompliance();
    return compliance.isValid && this.isActiveRecord;
  }

  /**
   * Gets the remaining duration of the guardianship in months
   */
  getRemainingDuration(): number | null {
    if (!this.validUntil || !this.isActiveRecord) return null;

    const now = new Date();
    const expiry = this.validUntil;

    if (expiry <= now) return 0;

    const diffTime = Math.abs(expiry.getTime() - now.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

    return diffMonths;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private validateGuardianship(guardianId: string, wardId: string, type: GuardianType): void {
    if (guardianId === wardId) {
      throw new Error('A member cannot be their own guardian.');
    }

    const validTypes: GuardianType[] = [
      'LEGAL_GUARDIAN',
      'FINANCIAL_GUARDIAN',
      'PROPERTY_GUARDIAN',
      'TESTAMENTARY',
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid guardian type: ${type}`);
    }
  }

  private calculateExpiryDate(wardDateOfBirth: Date): Date {
    // Kenyan law: Guardianship typically expires when ward turns 18
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
