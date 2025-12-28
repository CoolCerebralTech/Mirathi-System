// src/succession-automation/src/domain/entities/generated-form.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanFormTypeEnum } from '../value-objects/kenyan-form-type.vo';

/**
 * Generated Form Entity
 *
 * PURPOSE: Represents a form that has been generated for the probate application.
 * Owned by: ProbateApplication Aggregate
 *
 * LEGAL CONTEXT:
 * Each form in the probate bundle has a lifecycle:
 * 1. GENERATED: Created by system (PDF/DOCX template filled)
 * 2. REVIEWED: User reviews and approves content
 * 3. SIGNED: Required signatures obtained (digital/wet)
 * 4. FILED: Submitted to court registry
 * 5. ACCEPTED: Court accepts the form (no objections)
 * 6. REJECTED: Court requires corrections
 *
 * STORAGE:
 * - Primary: AWS S3 (encrypted, versioned)
 * - Backup: Court-approved digital registry
 * - Metadata: Database with audit trail
 */

export enum FormStatus {
  PENDING_GENERATION = 'PENDING_GENERATION', // Queued for generation
  GENERATED = 'GENERATED', // Form created, ready for review
  UNDER_REVIEW = 'UNDER_REVIEW', // User is reviewing
  APPROVED = 'APPROVED', // User approved the form
  SIGNATURE_PENDING = 'SIGNATURE_PENDING', // Waiting for signatures
  SIGNED = 'SIGNED', // All signatures obtained
  FILED = 'FILED', // Submitted to court
  COURT_ACCEPTED = 'COURT_ACCEPTED', // Court accepted without queries
  COURT_REJECTED = 'COURT_REJECTED', // Court rejected/requires correction
  AMENDED = 'AMENDED', // Form was amended after rejection
  SUPERSEDED = 'SUPERSEDED', // Replaced by newer version
  ARCHIVED = 'ARCHIVED', // After grant issued
}

export enum StorageProvider {
  AWS_S3 = 'AWS_S3',
  AZURE_BLOB = 'AZURE_BLOB',
  GOOGLE_CLOUD_STORAGE = 'GOOGLE_CLOUD_STORAGE',
  LOCAL_FILE_SYSTEM = 'LOCAL_FILE_SYSTEM',
  COURT_E_FILING = 'COURT_E_FILING', // Integrated with court e-filing system
}

export enum FileFormat {
  PDF = 'PDF',
  DOCX = 'DOCX',
  XML = 'XML', // For court e-filing systems
  HTML = 'HTML', // For preview
  JSON = 'JSON', // For data export
}

export enum SignatureType {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE', // PKI-based
  ELECTRONIC_SIGNATURE = 'ELECTRONIC_SIGNATURE', // Click-to-sign
  WET_SIGNATURE = 'WET_SIGNATURE', // Physical signature scanned
  BIOMETRIC = 'BIOMETRIC', // Fingerprint/facial
  WITNESSED = 'WITNESSED', // Witness present
  NOTARIZED = 'NOTARIZED', // Notary public stamp
}

interface FormSignature {
  signatoryId: string; // Reference to person (FamilyMember or Executor)
  signatoryName: string;
  signatureType: SignatureType;
  signedAt: Date;
  signatureId?: string; // Reference to stored signature
  ipAddress?: string;
  deviceInfo?: string;
  isWitnessPresent?: boolean;
  witnessName?: string;
  notaryName?: string;
  notaryStampNumber?: string;
}

interface FormVersion {
  versionNumber: number;
  generatedAt: Date;
  generatedBy: string; // 'system' or user ID
  changesDescription?: string;
  storageUrl: string;
  fileSizeBytes: number;
  checksum: string; // For integrity verification
  templateVersion: string;
}

interface GeneratedFormProps {
  // Form Identity
  formType: KenyanFormTypeEnum;
  formCode: string; // e.g., "P&A 1"
  displayName: string;

  // Status & Lifecycle
  status: FormStatus;
  currentVersion: number;

  // Storage
  storageProvider: StorageProvider;
  storageUrl: string; // Current version URL
  fileFormat: FileFormat;
  fileSizeBytes: number;
  checksum: string;

  // Content
  templateVersion: string;
  dataSource: string; // Which service provided data (e.g., 'estate-service')
  dataHash: string; // Hash of data used to generate form

  // Signatures
  signatures: FormSignature[];
  requiredSignatories: number; // How many signatures needed
  isFullySigned: boolean;

  // Filing Information
  courtCaseNumber?: string;
  filingDate?: Date;
  filingReference?: string;
  courtStampNumber?: string;

  // Rejection/Amendment
  rejectionReason?: string;
  courtQueries?: string[];
  amendmentsRequired?: string[];
  amendedBy?: string;
  amendedAt?: Date;

  // Generation Details
  generatedAt: Date;
  generatedBy: string; // 'system' or user ID
  generationDurationMs?: number;

  // Review Process
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Version History
  versions: FormVersion[];

  // Metadata
  pageCount: number;
  isNotarizationRequired: boolean;
  isCommissionerOathsRequired: boolean;
  isCourtStampRequired: boolean;

  // Links
  relatedFormIds: string[]; // Other forms in the bundle
  dependsOnFormIds: string[]; // Forms that must be filed before this

  // Audit
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  accessCount: number;

  // Notes
  internalNotes?: string;
  userNotes?: string;
}

export class GeneratedForm extends Entity<GeneratedFormProps> {
  private constructor(id: UniqueEntityID, props: GeneratedFormProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get formType(): KenyanFormTypeEnum {
    return this.props.formType;
  }

  get formCode(): string {
    return this.props.formCode;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get status(): FormStatus {
    return this.props.status;
  }

  get currentVersion(): number {
    return this.props.currentVersion;
  }

  get storageUrl(): string {
    return this.props.storageUrl;
  }

  get fileFormat(): FileFormat {
    return this.props.fileFormat;
  }

  get signatures(): FormSignature[] {
    return [...this.props.signatures];
  }

  get requiredSignatories(): number {
    return this.props.requiredSignatories;
  }

  get isFullySigned(): boolean {
    return this.props.isFullySigned;
  }

  get courtCaseNumber(): string | undefined {
    return this.props.courtCaseNumber;
  }

  get filingDate(): Date | undefined {
    return this.props.filingDate;
  }

  get generatedAt(): Date {
    return this.props.generatedAt;
  }

  get generatedBy(): string {
    return this.props.generatedBy;
  }

  get versions(): FormVersion[] {
    return [...this.props.versions];
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Can this form be filed?
   */
  public canBeFiled(): boolean {
    return this.props.status === FormStatus.SIGNED || this.props.status === FormStatus.APPROVED;
  }

  /**
   * Does this form need signatures?
   */
  public needsSignatures(): boolean {
    return (
      (this.props.status === FormStatus.APPROVED ||
        this.props.status === FormStatus.SIGNATURE_PENDING) &&
      !this.props.isFullySigned
    );
  }

  /**
   * Number of signatures obtained
   */
  public getSignaturesCount(): number {
    return this.props.signatures.length;
  }

  /**
   * Number of signatures remaining
   */
  public getSignaturesRemaining(): number {
    return Math.max(0, this.props.requiredSignatories - this.getSignaturesCount());
  }

  /**
   * Has this form been rejected by court?
   */
  public isRejected(): boolean {
    return this.props.status === FormStatus.COURT_REJECTED;
  }

  /**
   * Does this form require amendments?
   */
  public requiresAmendments(): boolean {
    return !!this.props.amendmentsRequired && this.props.amendmentsRequired.length > 0;
  }

  /**
   * Get the latest version
   */
  public getLatestVersion(): FormVersion {
    return [...this.props.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }

  /**
   * Get form download URL (with temporary access token)
   */
  public getDownloadUrl(expiresInMinutes: number = 60): string {
    // In production, this would generate a pre-signed URL
    return `${this.props.storageUrl}?token=temporary&expires=${expiresInMinutes}`;
  }

  /**
   * Get form preview URL (HTML version)
   */
  public getPreviewUrl(): string | undefined {
    if (this.props.fileFormat === FileFormat.HTML) {
      return this.props.storageUrl;
    }

    // Convert to preview URL if not HTML
    return `${this.props.storageUrl.replace(/\.(pdf|docx)$/, '')}.html`;
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Mark form as generated
   */
  public markAsGenerated(
    storageUrl: string,
    fileSizeBytes: number,
    checksum: string,
    generationDurationMs?: number,
  ): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.PENDING_GENERATION) {
      throw new Error(`Cannot mark as generated - status is ${this.props.status}`);
    }

    const version: FormVersion = {
      versionNumber: 1,
      generatedAt: new Date(),
      generatedBy: this.props.generatedBy,
      storageUrl,
      fileSizeBytes,
      checksum,
      templateVersion: this.props.templateVersion,
    };

    this.updateState({
      status: FormStatus.GENERATED,
      storageUrl,
      fileSizeBytes,
      checksum,
      generationDurationMs,
      versions: [version],
      currentVersion: 1,
    });
  }

  /**
   * Mark form as under review
   */
  public markAsUnderReview(userId: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.GENERATED) {
      throw new Error(`Cannot mark as under review - status is ${this.props.status}`);
    }

    this.updateState({
      status: FormStatus.UNDER_REVIEW,
      reviewedBy: userId,
    });
  }

  /**
   * Approve form
   */
  public approve(userId: string, notes?: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.UNDER_REVIEW) {
      throw new Error(`Cannot approve - status is ${this.props.status}`);
    }

    this.updateState({
      status:
        this.props.requiredSignatories > 0 ? FormStatus.SIGNATURE_PENDING : FormStatus.APPROVED,
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
  }

  /**
   * Add signature
   */
  public addSignature(signature: FormSignature): void {
    this.ensureNotDeleted();

    if (!this.needsSignatures()) {
      throw new Error('Cannot add signature - form does not need signatures');
    }

    // Check if signatory already signed
    const alreadySigned = this.props.signatures.some(
      (s) => s.signatoryId === signature.signatoryId && s.signatureType === signature.signatureType,
    );

    if (alreadySigned) {
      throw new Error('Signatory has already signed this form');
    }

    const newSignatures = [...this.props.signatures, signature];
    const isFullySigned = newSignatures.length >= this.props.requiredSignatories;

    this.updateState({
      signatures: newSignatures,
      isFullySigned,
      status: isFullySigned ? FormStatus.SIGNED : FormStatus.SIGNATURE_PENDING,
    });
  }

  /**
   * Mark form as filed
   */
  public markAsFiled(
    courtCaseNumber: string,
    filingReference: string,
    filingDate: Date = new Date(),
  ): void {
    this.ensureNotDeleted();

    if (!this.canBeFiled()) {
      throw new Error(`Cannot file - form is not ready. Status: ${this.props.status}`);
    }

    if (!this.props.isFullySigned && this.props.requiredSignatories > 0) {
      throw new Error('Cannot file - form is not fully signed');
    }

    this.updateState({
      status: FormStatus.FILED,
      courtCaseNumber,
      filingReference,
      filingDate,
    });
  }

  /**
   * Court accepts form
   */
  public courtAccepts(_acceptedAt: Date = new Date()): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.FILED) {
      throw new Error(`Cannot accept - form is not filed. Status: ${this.props.status}`);
    }

    this.updateState({
      status: FormStatus.COURT_ACCEPTED,
    });
  }

  /**
   * Court rejects form
   */
  public courtRejects(reason: string, queries: string[], amendmentsRequired?: string[]): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.FILED) {
      throw new Error(`Cannot reject - form is not filed. Status: ${this.props.status}`);
    }

    this.updateState({
      status: FormStatus.COURT_REJECTED,
      rejectionReason: reason,
      courtQueries: queries,
      amendmentsRequired,
    });
  }

  /**
   * Amend form after rejection
   */
  public amend(
    newStorageUrl: string,
    fileSizeBytes: number,
    checksum: string,
    amendedBy: string,
    changesDescription?: string,
  ): void {
    this.ensureNotDeleted();

    if (this.props.status !== FormStatus.COURT_REJECTED) {
      throw new Error(`Cannot amend - form is not rejected. Status: ${this.props.status}`);
    }

    const newVersionNumber = this.props.currentVersion + 1;
    const version: FormVersion = {
      versionNumber: newVersionNumber,
      generatedAt: new Date(),
      generatedBy: amendedBy,
      changesDescription,
      storageUrl: newStorageUrl,
      fileSizeBytes,
      checksum,
      templateVersion: this.props.templateVersion,
    };

    const versions = [...this.props.versions, version];

    this.updateState({
      storageUrl: newStorageUrl,
      fileSizeBytes,
      checksum,
      currentVersion: newVersionNumber,
      versions,
      amendedBy,
      amendedAt: new Date(),
      // Reset signatures if amendments affect content
      signatures: [],
      isFullySigned: false,
      status:
        this.props.requiredSignatories > 0 ? FormStatus.SIGNATURE_PENDING : FormStatus.GENERATED,
    });
  }

  /**
   * Update related forms
   */
  public updateRelatedForms(relatedFormIds: string[]): void {
    this.ensureNotDeleted();

    this.updateState({
      relatedFormIds,
    });
  }

  /**
   * Add internal notes
   */
  public addInternalNotes(notes: string): void {
    this.ensureNotDeleted();

    this.updateState({
      internalNotes: this.props.internalNotes
        ? `${this.props.internalNotes}\n---\n${notes}`
        : notes,
    });
  }

  /**
   * Add user notes
   */
  public addUserNotes(notes: string): void {
    this.ensureNotDeleted();

    this.updateState({
      userNotes: this.props.userNotes ? `${this.props.userNotes}\n---\n${notes}` : notes,
    });
  }

  /**
   * Record access
   */
  public recordAccess(userId: string): void {
    this.ensureNotDeleted();

    this.updateState({
      lastAccessedAt: new Date(),
      lastAccessedBy: userId,
      accessCount: this.props.accessCount + 1,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new form pending generation
   */
  public static createPending(
    formType: KenyanFormTypeEnum,
    formCode: string,
    displayName: string,
    requiredSignatories: number,
    generatedBy: string,
    templateVersion: string,
    dataSource: string,
    dataHash: string,
  ): GeneratedForm {
    const id = UniqueEntityID.newID();

    return new GeneratedForm(id, {
      formType,
      formCode,
      displayName,
      status: FormStatus.PENDING_GENERATION,
      currentVersion: 0,
      storageProvider: StorageProvider.AWS_S3, // Default
      storageUrl: '',
      fileFormat: FileFormat.PDF,
      fileSizeBytes: 0,
      checksum: '',
      templateVersion,
      dataSource,
      dataHash,
      signatures: [],
      requiredSignatories,
      isFullySigned: false,
      generatedAt: new Date(),
      generatedBy,
      versions: [],
      pageCount: 0,
      isNotarizationRequired: false,
      isCommissionerOathsRequired: false,
      isCourtStampRequired: false,
      relatedFormIds: [],
      dependsOnFormIds: [],
      accessCount: 0,
    });
  }

  /**
   * Create from KenyanFormType VO
   */
  public static fromFormType(
    formTypeVO: any, // Would be KenyanFormType VO in real implementation
    generatedBy: string,
    dataSource: string,
    dataHash: string,
  ): GeneratedForm {
    return GeneratedForm.createPending(
      formTypeVO.formType,
      formTypeVO.formCode,
      formTypeVO.displayName,
      0, // Default no signatures
      generatedBy,
      formTypeVO.version,
      dataSource,
      dataHash,
    );
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

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      formType: this.props.formType,
      formCode: this.props.formCode,
      displayName: this.props.displayName,
      status: this.props.status,
      currentVersion: this.props.currentVersion,
      storageProvider: this.props.storageProvider,
      storageUrl: this.props.storageUrl,
      fileFormat: this.props.fileFormat,
      fileSizeBytes: this.props.fileSizeBytes,
      checksum: this.props.checksum,
      templateVersion: this.props.templateVersion,
      dataSource: this.props.dataSource,
      dataHash: this.props.dataHash,
      signatures: this.props.signatures,
      requiredSignatories: this.props.requiredSignatories,
      isFullySigned: this.props.isFullySigned,
      courtCaseNumber: this.props.courtCaseNumber,
      filingDate: this.props.filingDate?.toISOString(),
      filingReference: this.props.filingReference,
      courtStampNumber: this.props.courtStampNumber,
      rejectionReason: this.props.rejectionReason,
      courtQueries: this.props.courtQueries,
      amendmentsRequired: this.props.amendmentsRequired,
      amendedBy: this.props.amendedBy,
      amendedAt: this.props.amendedAt?.toISOString(),
      generatedAt: this.props.generatedAt.toISOString(),
      generatedBy: this.props.generatedBy,
      generationDurationMs: this.props.generationDurationMs,
      reviewedBy: this.props.reviewedBy,
      reviewedAt: this.props.reviewedAt?.toISOString(),
      reviewNotes: this.props.reviewNotes,
      versions: this.props.versions.map((v) => ({
        ...v,
        generatedAt: v.generatedAt.toISOString(),
      })),
      pageCount: this.props.pageCount,
      isNotarizationRequired: this.props.isNotarizationRequired,
      isCommissionerOathsRequired: this.props.isCommissionerOathsRequired,
      isCourtStampRequired: this.props.isCourtStampRequired,
      relatedFormIds: this.props.relatedFormIds,
      dependsOnFormIds: this.props.dependsOnFormIds,
      lastAccessedAt: this.props.lastAccessedAt?.toISOString(),
      lastAccessedBy: this.props.lastAccessedBy,
      accessCount: this.props.accessCount,
      internalNotes: this.props.internalNotes,
      userNotes: this.props.userNotes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Derived
      canBeFiled: this.canBeFiled(),
      needsSignatures: this.needsSignatures(),
      signaturesCount: this.getSignaturesCount(),
      signaturesRemaining: this.getSignaturesRemaining(),
      isRejected: this.isRejected(),
      requiresAmendments: this.requiresAmendments(),
      latestVersion: this.getLatestVersion(),
      downloadUrl: this.getDownloadUrl(),
      previewUrl: this.getPreviewUrl(),
    };
  }
}
