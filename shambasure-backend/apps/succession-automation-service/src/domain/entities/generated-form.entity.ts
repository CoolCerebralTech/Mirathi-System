// src/succession-automation/src/domain/entities/generated-form.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanFormType } from '../value-objects/kenyan-form-type.vo';

/**
 * Generated Form Entity
 *
 * PURPOSE: Represents a specific legal document generated for a probate application.
 * Owned by: ProbateApplication Aggregate
 *
 * LEGAL CONTEXT:
 * Each generated form is a snapshot of the estate/family data at a specific point in time.
 * Forms must be regenerated if underlying data changes before filing.
 *
 * LIFECYCLE:
 * 1. Created when FormStrategyService generates the form
 * 2. Draft → Awaiting Review → Approved → Filed
 * 3. Can be regenerated if data changes
 * 4. Immutable once filed (audit trail)
 *
 * STORAGE:
 * - Form data (JSON) stored in database for reconstruction
 * - Rendered documents (PDF/DOCX) stored in S3/cloud storage
 * - URLs have expiration for security
 */

export enum FormStatus {
  DRAFT = 'DRAFT', // Generated but not reviewed
  AWAITING_REVIEW = 'AWAITING_REVIEW', // Submitted for user review
  APPROVED = 'APPROVED', // User approved, ready to file
  FILED = 'FILED', // Submitted to court
  REJECTED = 'REJECTED', // Court rejected (needs revision)
  SUPERSEDED = 'SUPERSEDED', // Replaced by newer version
}

export enum FormFormat {
  PDF = 'PDF',
  DOCX = 'DOCX', // Editable Word document
  JSON = 'JSON', // Raw data only (no rendering)
}

interface GeneratedFormProps {
  formType: KenyanFormType;
  status: FormStatus;
  formData: Record<string, any>; // The actual data (petitioner, assets, etc.)
  version: number; // Form version (for regeneration tracking)

  // Storage
  storageUrl?: string; // S3/cloud URL to rendered document
  format: FormFormat;
  sizeBytes?: number;
  checksum?: string; // SHA-256 for integrity verification

  // Generation metadata
  generatedAt: Date;
  generatedBy: string; // User ID who triggered generation
  templateVersion: string; // Which template version was used?

  // Review & Approval
  reviewedAt?: Date;
  reviewedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;

  // Filing
  filedAt?: Date;
  courtCaseNumber?: string;
  courtReceiptNumber?: string;

  // Rejection
  rejectionReason?: string;
  rejectionDate?: Date;

  // Versioning (if superseded)
  supersededBy?: string; // ID of newer form
  supersededAt?: Date;

  // Expiry (for security)
  expiresAt?: Date; // URL expiration
}

export class GeneratedForm extends Entity<GeneratedFormProps> {
  private constructor(id: UniqueEntityID, props: GeneratedFormProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get formType(): KenyanFormType {
    return this.props.formType;
  }

  get status(): FormStatus {
    return this.props.status;
  }

  get formData(): Record<string, any> {
    return { ...this.props.formData }; // Return copy
  }

  get version(): number {
    return this.props.version;
  }

  get storageUrl(): string | undefined {
    return this.props.storageUrl;
  }

  get format(): FormFormat {
    return this.props.format;
  }

  get sizeBytes(): number | undefined {
    return this.props.sizeBytes;
  }

  get checksum(): string | undefined {
    return this.props.checksum;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  get generatedBy(): string {
    return this.props.generatedBy;
  }

  get templateVersion(): string {
    return this.props.templateVersion;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get filedAt(): Date | undefined {
    return this.props.filedAt;
  }

  get courtCaseNumber(): string | undefined {
    return this.props.courtCaseNumber;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this form ready to be filed?
   */
  public isReadyToFile(): boolean {
    return this.props.status === FormStatus.APPROVED;
  }

  /**
   * Has this form been filed?
   */
  public isFiled(): boolean {
    return this.props.status === FormStatus.FILED;
  }

  /**
   * Is this form editable?
   */
  public isEditable(): boolean {
    return [FormStatus.DRAFT, FormStatus.REJECTED].includes(this.props.status);
  }

  /**
   * Is this form expired? (URL no longer accessible)
   */
  public isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  /**
   * Has this form been superseded by a newer version?
   */
  public isSuperseded(): boolean {
    return this.props.status === FormStatus.SUPERSEDED;
  }

  /**
   * Get human-readable form name
   */
  public getFormName(): string {
    return `${this.props.formType.getFormCode()} - ${this.props.formType.displayName}`;
  }

  /**
   * Get file extension based on format
   */
  public getFileExtension(): string {
    return this.props.format.toLowerCase();
  }

  /**
   * Get suggested filename
   */
  public getSuggestedFilename(): string {
    const formCode = this.props.formType.getFormCode().replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = this.props.generatedAt.toISOString().split('T')[0];
    return `${formCode}_v${this.props.version}_${timestamp}.${this.getFileExtension()}`;
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Mark form as awaiting review
   * BUSINESS RULE: Can only transition from DRAFT
   */
  public submitForReview(): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.DRAFT) {
      throw new Error(`Cannot submit form with status ${this.props.status} for review`);
    }

    this.updateState({
      status: FormStatus.AWAITING_REVIEW,
    });
  }

  /**
   * Approve form
   * BUSINESS RULE: Must be in AWAITING_REVIEW or REJECTED status
   */
  public approve(approvedBy: string): void {
    this.ensureNotDeleted();

    if (![FormStatus.AWAITING_REVIEW, FormStatus.REJECTED].includes(this.props.status)) {
      throw new Error(`Cannot approve form with status ${this.props.status}`);
    }

    this.updateState({
      status: FormStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy,
    });
  }

  /**
   * Mark form as filed with court
   * BUSINESS RULE: Must be APPROVED first
   */
  public markAsFiled(courtCaseNumber?: string, courtReceiptNumber?: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.APPROVED) {
      throw new Error(`Cannot file form with status ${this.props.status}. Must be APPROVED first.`);
    }

    this.updateState({
      status: FormStatus.FILED,
      filedAt: new Date(),
      courtCaseNumber,
      courtReceiptNumber,
    });
  }

  /**
   * Reject form (court or internal review)
   * BUSINESS RULE: Cannot reject if already filed
   */
  public reject(reason: string): void {
    this.ensureNotDeleted();

    if (this.props.status === FormStatus.FILED) {
      throw new Error('Cannot reject a form that has already been filed');
    }

    this.updateState({
      status: FormStatus.REJECTED,
      rejectionReason: reason,
      rejectionDate: new Date(),
    });
  }

  /**
   * Supersede this form with a newer version
   * BUSINESS RULE: Form must not be filed
   */
  public supersede(newFormId: string, reason?: string): void {
    this.ensureNotDeleted();

    if (this.props.status === FormStatus.FILED) {
      throw new Error('Cannot supersede a form that has already been filed');
    }

    this.updateState({
      status: FormStatus.SUPERSEDED,
      supersededBy: newFormId,
      supersededAt: new Date(),
      rejectionReason: reason || 'Superseded by newer version',
    });
  }

  /**
   * Update storage URL after rendering
   * BUSINESS RULE: Can only update if not filed
   */
  public updateStorageUrl(
    url: string,
    sizeBytes: number,
    checksum: string,
    expiresAt?: Date,
  ): void {
    this.ensureNotDeleted();

    if (this.props.status === FormStatus.FILED) {
      throw new Error('Cannot update storage URL of filed form');
    }

    this.updateState({
      storageUrl: url,
      sizeBytes,
      checksum,
      expiresAt,
    });
  }

  /**
   * Regenerate URL (refresh expiration)
   */
  public regenerateUrl(newUrl: string, newExpiresAt: Date): void {
    this.ensureNotDeleted();

    this.updateState({
      storageUrl: newUrl,
      expiresAt: newExpiresAt,
    });
  }

  /**
   * Update form data (if in DRAFT or REJECTED status)
   * BUSINESS RULE: Only editable forms can be updated
   */
  public updateFormData(newData: Record<string, any>): void {
    this.ensureNotDeleted();

    if (!this.isEditable()) {
      throw new Error(`Cannot update form data in status ${this.props.status}`);
    }

    this.updateState({
      formData: newData,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new draft form
   */
  public static createDraft(
    formType: KenyanFormType,
    formData: Record<string, any>,
    generatedBy: string,
    templateVersion: string,
    format: FormFormat = FormFormat.PDF,
  ): GeneratedForm {
    const id = UniqueEntityID.newID();

    return new GeneratedForm(id, {
      formType,
      status: FormStatus.DRAFT,
      formData,
      version: 1,
      format,
      generatedAt: new Date(),
      generatedBy,
      templateVersion,
    });
  }

  /**
   * Create from existing form (for regeneration)
   */
  public static regenerate(
    originalForm: GeneratedForm,
    newFormData: Record<string, any>,
    generatedBy: string,
  ): GeneratedForm {
    const id = UniqueEntityID.newID();

    return new GeneratedForm(id, {
      formType: originalForm.formType,
      status: FormStatus.DRAFT,
      formData: newFormData,
      version: originalForm.version + 1,
      format: originalForm.format,
      generatedAt: new Date(),
      generatedBy,
      templateVersion: originalForm.templateVersion,
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: GeneratedFormProps,
    createdAt: Date,
    updatedAt: Date,
  ): GeneratedForm {
    const entity = new GeneratedForm(new UniqueEntityID(id), props, createdAt);
    (entity as any)._updatedAt = updatedAt;
    return entity;
  }

  // ==================== VALIDATION ====================

  /**
   * Validate form data completeness
   */
  public validateCompleteness(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields based on form type
    const requiredFields = this.getRequiredFields();

    for (const field of requiredFields) {
      if (!this.props.formData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get required fields for this form type
   */
  private getRequiredFields(): string[] {
    // This would be defined based on form type
    // For now, return common fields
    return ['petitioner', 'deceased', 'court'];
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      formType: this.props.formType.toJSON(),
      formCode: this.props.formType.getFormCode(),
      formName: this.getFormName(),
      status: this.props.status,
      formData: this.props.formData,
      version: this.props.version,
      storageUrl: this.props.storageUrl,
      format: this.props.format,
      sizeBytes: this.props.sizeBytes,
      checksum: this.props.checksum,
      generatedAt: this.props.generatedAt.toISOString(),
      generatedBy: this.props.generatedBy,
      templateVersion: this.props.templateVersion,
      reviewedAt: this.props.reviewedAt?.toISOString(),
      approvedAt: this.props.approvedAt?.toISOString(),
      filedAt: this.props.filedAt?.toISOString(),
      courtCaseNumber: this.props.courtCaseNumber,
      courtReceiptNumber: this.props.courtReceiptNumber,
      rejectionReason: this.props.rejectionReason,
      rejectionDate: this.props.rejectionDate?.toISOString(),
      supersededBy: this.props.supersededBy,
      supersededAt: this.props.supersededAt?.toISOString(),
      expiresAt: this.props.expiresAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Derived
      isReadyToFile: this.isReadyToFile(),
      isFiled: this.isFiled(),
      isEditable: this.isEditable(),
      isExpired: this.isExpired(),
      suggestedFilename: this.getSuggestedFilename(),
    };
  }
}
