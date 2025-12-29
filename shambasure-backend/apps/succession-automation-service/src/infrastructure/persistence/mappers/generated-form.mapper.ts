// src/succession-automation/src/infrastructure/persistence/mappers/generated-form.mapper.ts
import {
  FileFormat,
  FormSignature,
  FormStatus,
  FormVersion,
  GeneratedForm,
  StorageProvider,
} from '../../../domain/entities/generated-form.entity';

/**
 * GeneratedForm Mapper
 *
 * PURPOSE: Translates between Domain Entity and Prisma Model for Generated Forms
 *
 * FIXES NEEDED:
 * 1. Prisma model doesn't have: lastAccessedBy, internalNotes
 * 2. Prisma model has createdAt/updatedAt but they might not be in the type
 * 3. checksum is required in domain but optional in Prisma
 */

export class GeneratedFormMapper {
  /**
   * Map Domain Entity to Prisma Model for CREATE operations
   * applicationId is REQUIRED
   */
  public static toPersistenceCreate(domainEntity: GeneratedForm, applicationId: string): any {
    if (!applicationId) {
      throw new Error('GeneratedForm must have applicationId for persistence');
    }

    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Build the persistence object based on actual Prisma schema
    const persistence: any = {
      // --- Core Identity ---
      formType: this.mapDomainFormTypeToPrisma(props.formType),
      formCode: props.formCode,
      displayName: props.displayName,

      // --- Lifecycle ---
      status: this.mapDomainFormStatusToPrisma(props.status),
      currentVersion: props.currentVersion,

      // --- Storage ---
      storageProvider: this.mapDomainStorageProviderToPrisma(props.storageProvider),
      storageUrl: props.storageUrl,
      fileFormat: this.mapDomainFileFormatToPrisma(props.fileFormat),
      fileSizeBytes: props.fileSizeBytes,
      checksum: props.checksum || '', // Prisma has this as String? but we need a value

      // --- Content Source ---
      templateVersion: props.templateVersion || '',
      dataSource: props.dataSource || '',
      dataHash: props.dataHash || '',

      // --- Signatures (JSON) ---
      signatures: props.signatures ? JSON.stringify(props.signatures) : null,
      requiredSignatories: props.requiredSignatories,
      isFullySigned: props.isFullySigned,

      // --- Filing Information ---
      courtCaseNumber: props.courtCaseNumber || null,
      filingDate: props.filingDate || null,
      filingReference: props.filingReference || null,
      courtStampNumber: props.courtStampNumber || null,

      // --- Rejection/Amendment ---
      rejectionReason: props.rejectionReason || null,
      courtQueries: props.courtQueries || [],
      amendmentsRequired: props.amendmentsRequired || [],
      amendedBy: props.amendedBy || null,
      amendedAt: props.amendedAt || null,

      // --- Generation Details ---
      generatedAt: props.generatedAt,
      generatedBy: props.generatedBy || 'system',
      generationDurationMs: props.generationDurationMs || null,

      // --- Review Process ---
      reviewedBy: props.reviewedBy || null,
      reviewedAt: props.reviewedAt || null,
      reviewNotes: props.reviewNotes || null,

      // --- Version History (JSON) ---
      versions: props.versions ? JSON.stringify(props.versions) : null,

      // --- Metadata ---
      pageCount: props.pageCount || 0,
      isNotarizationRequired: props.isNotarizationRequired || false,
      isCommissionerOathsRequired: props.isCommissionerOathsRequired || false,
      isCourtStampRequired: props.isCourtStampRequired || false,

      // --- Links ---
      relatedFormIds: props.relatedFormIds || [],
      dependsOnFormIds: props.dependsOnFormIds || [],

      // --- Audit ---
      lastAccessedAt: props.lastAccessedAt || null,
      accessCount: props.accessCount || 0,

      // --- Foreign Key ---
      applicationId: applicationId,
    };

    return persistence;
  }

  /**
   * Map Domain Entity to Prisma Model for UPDATE operations
   */
  public static toPersistenceUpdate(domainEntity: GeneratedForm): any {
    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Only include fields that can be updated
    const updateData: any = {
      // --- Status & Version ---
      status: this.mapDomainFormStatusToPrisma(props.status),
      currentVersion: props.currentVersion,

      // --- Storage (can change on amendment) ---
      storageUrl: props.storageUrl || '',
      fileSizeBytes: props.fileSizeBytes || 0,
      checksum: props.checksum || '',

      // --- Signatures ---
      signatures: props.signatures ? JSON.stringify(props.signatures) : null,
      isFullySigned: props.isFullySigned,

      // --- Filing Information ---
      courtCaseNumber: props.courtCaseNumber || null,
      filingDate: props.filingDate || null,
      filingReference: props.filingReference || null,
      courtStampNumber: props.courtStampNumber || null,

      // --- Rejection/Amendment ---
      rejectionReason: props.rejectionReason || null,
      courtQueries: props.courtQueries || [],
      amendmentsRequired: props.amendmentsRequired || [],
      amendedBy: props.amendedBy || null,
      amendedAt: props.amendedAt || null,

      // --- Review Process ---
      reviewedBy: props.reviewedBy || null,
      reviewedAt: props.reviewedAt || null,
      reviewNotes: props.reviewNotes || null,

      // --- Version History ---
      versions: props.versions ? JSON.stringify(props.versions) : null,

      // --- Metadata ---
      pageCount: props.pageCount || 0,
      isNotarizationRequired: props.isNotarizationRequired || false,
      isCommissionerOathsRequired: props.isCommissionerOathsRequired || false,
      isCourtStampRequired: props.isCourtStampRequired || false,

      // --- Links ---
      relatedFormIds: props.relatedFormIds || [],
      dependsOnFormIds: props.dependsOnFormIds || [],

      // --- Audit ---
      lastAccessedAt: props.lastAccessedAt || null,
      accessCount: props.accessCount || 0,
    };

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(prismaModel: any): GeneratedForm {
    if (!prismaModel) {
      throw new Error('Prisma model cannot be null');
    }

    // Validate required fields
    if (!prismaModel.formType) {
      throw new Error('Prisma GeneratedForm must have formType');
    }

    if (!prismaModel.formCode) {
      throw new Error('Prisma GeneratedForm must have formCode');
    }

    if (!prismaModel.displayName) {
      throw new Error('Prisma GeneratedForm must have displayName');
    }

    if (!prismaModel.status) {
      throw new Error('Prisma GeneratedForm must have status');
    }

    // Parse JSON fields
    let signatures: FormSignature[] = [];
    if (prismaModel.signatures && typeof prismaModel.signatures === 'string') {
      try {
        signatures = JSON.parse(prismaModel.signatures);
      } catch (error) {
        console.warn('Failed to parse signatures JSON:', error);
      }
    }

    let versions: FormVersion[] = [];
    if (prismaModel.versions && typeof prismaModel.versions === 'string') {
      try {
        versions = JSON.parse(prismaModel.versions);
      } catch (error) {
        console.warn('Failed to parse versions JSON:', error);
      }
    }

    // Prepare domain properties - ensure required fields have values
    const domainProps = {
      // --- Form Identity ---
      formType: prismaModel.formType, // Keep as string, domain handles VO creation
      formCode: prismaModel.formCode,
      displayName: prismaModel.displayName,

      // --- Status & Lifecycle ---
      status: this.mapPrismaFormStatusToDomain(prismaModel.status),
      currentVersion: prismaModel.currentVersion || 0,

      // --- Storage ---
      storageProvider: this.mapPrismaStorageProviderToDomain(prismaModel.storageProvider),
      storageUrl: prismaModel.storageUrl || '',
      fileFormat: this.mapPrismaFileFormatToDomain(prismaModel.fileFormat),
      fileSizeBytes: prismaModel.fileSizeBytes || 0,
      checksum: prismaModel.checksum || '', // Required in domain, provide default

      // --- Content ---
      templateVersion: prismaModel.templateVersion || '',
      dataSource: prismaModel.dataSource || '',
      dataHash: prismaModel.dataHash || '',

      // --- Signatures ---
      signatures: signatures,
      requiredSignatories: prismaModel.requiredSignatories || 0,
      isFullySigned: prismaModel.isFullySigned || false,

      // --- Filing Information ---
      courtCaseNumber: prismaModel.courtCaseNumber || undefined,
      filingDate: prismaModel.filingDate || undefined,
      filingReference: prismaModel.filingReference || undefined,
      courtStampNumber: prismaModel.courtStampNumber || undefined,

      // --- Rejection/Amendment ---
      rejectionReason: prismaModel.rejectionReason || undefined,
      courtQueries: Array.isArray(prismaModel.courtQueries) ? prismaModel.courtQueries : [],
      amendmentsRequired: Array.isArray(prismaModel.amendmentsRequired)
        ? prismaModel.amendmentsRequired
        : [],
      amendedBy: prismaModel.amendedBy || undefined,
      amendedAt: prismaModel.amendedAt || undefined,

      // --- Generation Details ---
      generatedAt: prismaModel.generatedAt || new Date(),
      generatedBy: prismaModel.generatedBy || 'system',
      generationDurationMs: prismaModel.generationDurationMs || undefined,

      // --- Review Process ---
      reviewedBy: prismaModel.reviewedBy || undefined,
      reviewedAt: prismaModel.reviewedAt || undefined,
      reviewNotes: prismaModel.reviewNotes || undefined,

      // --- Version History ---
      versions: versions,

      // --- Metadata ---
      pageCount: prismaModel.pageCount || 0,
      isNotarizationRequired: prismaModel.isNotarizationRequired || false,
      isCommissionerOathsRequired: prismaModel.isCommissionerOathsRequired || false,
      isCourtStampRequired: prismaModel.isCourtStampRequired || false,

      // --- Links ---
      relatedFormIds: Array.isArray(prismaModel.relatedFormIds) ? prismaModel.relatedFormIds : [],
      dependsOnFormIds: Array.isArray(prismaModel.dependsOnFormIds)
        ? prismaModel.dependsOnFormIds
        : [],

      // --- Audit ---
      lastAccessedAt: prismaModel.lastAccessedAt || undefined,
      lastAccessedBy: prismaModel.lastAccessedBy || undefined, // Not in Prisma, will be undefined
      accessCount: prismaModel.accessCount || 0,

      // --- Notes ---
      internalNotes: prismaModel.internalNotes || undefined, // Not in Prisma schema
      userNotes: prismaModel.userNotes || undefined, // Not in Prisma schema
    };

    // Get timestamps from Prisma model (might be named differently)
    const createdAt = prismaModel.createdAt || new Date();
    const updatedAt = prismaModel.updatedAt || new Date();

    // Reconstitute the domain entity
    return GeneratedForm.reconstitute(prismaModel.id, domainProps, createdAt, updatedAt);
  }

  /**
   * Map multiple Prisma models to Domain Entities
   */
  public static toDomainArray(prismaModels: any[]): GeneratedForm[] {
    return prismaModels.map((model) => this.toDomain(model));
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainEntity: GeneratedForm): string | null {
    return domainEntity.id ? domainEntity.id.toString() : null;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain FormType to Prisma string
   */
  private static mapDomainFormTypeToPrisma(formType: any): string {
    // If formType is a value object with toString method
    if (formType && typeof formType.toString === 'function') {
      return formType.toString();
    }
    return String(formType);
  }

  /**
   * Map Domain FormStatus to Prisma string
   */
  private static mapDomainFormStatusToPrisma(status: FormStatus): string {
    const mapping: Record<FormStatus, string> = {
      [FormStatus.PENDING_GENERATION]: 'PENDING_GENERATION',
      [FormStatus.GENERATED]: 'GENERATED',
      [FormStatus.UNDER_REVIEW]: 'UNDER_REVIEW',
      [FormStatus.APPROVED]: 'APPROVED',
      [FormStatus.SIGNATURE_PENDING]: 'SIGNATURE_PENDING',
      [FormStatus.SIGNED]: 'SIGNED',
      [FormStatus.FILED]: 'FILED',
      [FormStatus.COURT_ACCEPTED]: 'COURT_ACCEPTED',
      [FormStatus.COURT_REJECTED]: 'COURT_REJECTED',
      [FormStatus.AMENDED]: 'AMENDED',
      [FormStatus.SUPERSEDED]: 'SUPERSEDED',
      [FormStatus.ARCHIVED]: 'ARCHIVED',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid FormStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma FormStatus string to Domain
   */
  private static mapPrismaFormStatusToDomain(status: string): FormStatus {
    const mapping: Record<string, FormStatus> = {
      PENDING_GENERATION: FormStatus.PENDING_GENERATION,
      GENERATED: FormStatus.GENERATED,
      UNDER_REVIEW: FormStatus.UNDER_REVIEW,
      APPROVED: FormStatus.APPROVED,
      SIGNATURE_PENDING: FormStatus.SIGNATURE_PENDING,
      SIGNED: FormStatus.SIGNED,
      FILED: FormStatus.FILED,
      COURT_ACCEPTED: FormStatus.COURT_ACCEPTED,
      COURT_REJECTED: FormStatus.COURT_REJECTED,
      AMENDED: FormStatus.AMENDED,
      SUPERSEDED: FormStatus.SUPERSEDED,
      ARCHIVED: FormStatus.ARCHIVED,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma FormStatus: ${status}`);
    }
    return domainStatus;
  }

  /**
   * Map Domain StorageProvider to Prisma string
   */
  private static mapDomainStorageProviderToPrisma(provider: StorageProvider): string {
    const mapping: Record<StorageProvider, string> = {
      [StorageProvider.AWS_S3]: 'AWS_S3',
      [StorageProvider.AZURE_BLOB]: 'AZURE_BLOB',
      [StorageProvider.GOOGLE_CLOUD_STORAGE]: 'GOOGLE_CLOUD_STORAGE',
      [StorageProvider.LOCAL_FILE_SYSTEM]: 'LOCAL_FILE_SYSTEM',
      [StorageProvider.COURT_E_FILING]: 'COURT_E_FILING',
    };

    const prismaProvider = mapping[provider];
    if (!prismaProvider) {
      throw new Error(`Invalid StorageProvider: ${provider}`);
    }
    return prismaProvider;
  }

  /**
   * Map Prisma StorageProvider string to Domain
   */
  private static mapPrismaStorageProviderToDomain(provider: string): StorageProvider {
    const mapping: Record<string, StorageProvider> = {
      AWS_S3: StorageProvider.AWS_S3,
      AZURE_BLOB: StorageProvider.AZURE_BLOB,
      GOOGLE_CLOUD_STORAGE: StorageProvider.GOOGLE_CLOUD_STORAGE,
      LOCAL_FILE_SYSTEM: StorageProvider.LOCAL_FILE_SYSTEM,
      COURT_E_FILING: StorageProvider.COURT_E_FILING,
    };

    const domainProvider = mapping[provider];
    if (!domainProvider) {
      throw new Error(`Invalid Prisma StorageProvider: ${provider}`);
    }
    return domainProvider;
  }

  /**
   * Map Domain FileFormat to Prisma string
   */
  private static mapDomainFileFormatToPrisma(format: FileFormat): string {
    const mapping: Record<FileFormat, string> = {
      [FileFormat.PDF]: 'PDF',
      [FileFormat.DOCX]: 'DOCX',
      [FileFormat.XML]: 'XML',
      [FileFormat.HTML]: 'HTML',
      [FileFormat.JSON]: 'JSON',
    };

    const prismaFormat = mapping[format];
    if (!prismaFormat) {
      throw new Error(`Invalid FileFormat: ${format}`);
    }
    return prismaFormat;
  }

  /**
   * Map Prisma FileFormat string to Domain
   */
  private static mapPrismaFileFormatToDomain(format: string): FileFormat {
    const mapping: Record<string, FileFormat> = {
      PDF: FileFormat.PDF,
      DOCX: FileFormat.DOCX,
      XML: FileFormat.XML,
      HTML: FileFormat.HTML,
      JSON: FileFormat.JSON,
    };

    const domainFormat = mapping[format];
    if (!domainFormat) {
      throw new Error(`Invalid Prisma FileFormat: ${format}`);
    }
    return domainFormat;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract domain entity IDs from Prisma models
   */
  public static extractIds(prismaModels: any[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if a form is in a state that allows updates
   */
  public static isUpdatable(prismaModel: any): boolean {
    const status = prismaModel.status;
    const nonUpdatableStatuses = ['COURT_ACCEPTED', 'ARCHIVED', 'SUPERSEDED'];
    return !nonUpdatableStatuses.includes(status);
  }

  /**
   * Check if a form needs signatures
   */
  public static needsSignatures(prismaModel: any): boolean {
    const status = prismaModel.status;
    const requiredSignatories = prismaModel.requiredSignatories || 0;
    const isFullySigned = prismaModel.isFullySigned || false;

    const statusesNeedingSignatures = ['SIGNATURE_PENDING', 'APPROVED'];
    return statusesNeedingSignatures.includes(status) && !isFullySigned && requiredSignatories > 0;
  }

  /**
   * Create update data for form filing
   */
  public static createFilingUpdateData(
    courtCaseNumber: string,
    filingReference: string,
  ): Record<string, any> {
    return {
      status: 'FILED',
      courtCaseNumber,
      filingReference,
      filingDate: new Date(),
    };
  }

  /**
   * Create update data for court acceptance
   */
  public static createCourtAcceptanceData(): Record<string, any> {
    return {
      status: 'COURT_ACCEPTED',
    };
  }

  /**
   * Create update data for court rejection
   */
  public static createCourtRejectionData(
    reason: string,
    queries: string[],
    amendmentsRequired: string[],
  ): Record<string, any> {
    return {
      status: 'COURT_REJECTED',
      rejectionReason: reason,
      courtQueries: queries,
      amendmentsRequired,
    };
  }

  /**
   * Create update data for adding signature
   */
  public static createSignatureUpdateData(
    signature: FormSignature,
    currentSignatures: FormSignature[],
    requiredSignatories: number,
  ): Record<string, any> {
    const newSignatures = [...currentSignatures, signature];
    const isFullySigned = newSignatures.length >= requiredSignatories;

    return {
      signatures: JSON.stringify(newSignatures),
      isFullySigned,
      status: isFullySigned ? 'SIGNED' : 'SIGNATURE_PENDING',
    };
  }

  /**
   * Create update data for form amendment
   */
  public static createAmendmentUpdateData(
    newStorageUrl: string,
    fileSizeBytes: number,
    checksum: string,
    amendedBy: string,
    newVersionNumber: number,
    versions: FormVersion[],
    changesDescription?: string,
  ): Record<string, any> {
    const newVersion: FormVersion = {
      versionNumber: newVersionNumber,
      generatedAt: new Date(),
      generatedBy: amendedBy,
      changesDescription,
      storageUrl: newStorageUrl,
      fileSizeBytes,
      checksum,
      templateVersion: '', // Would need to get from context
    };

    const allVersions = [...versions, newVersion];

    return {
      storageUrl: newStorageUrl,
      fileSizeBytes,
      checksum,
      currentVersion: newVersionNumber,
      versions: JSON.stringify(allVersions),
      amendedBy,
      amendedAt: new Date(),
      signatures: JSON.stringify([]), // Reset signatures
      isFullySigned: false,
      status: 'GENERATED', // Reset to generated, signatures will be collected again if needed
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: any): string[] {
    const errors: string[] = [];

    if (!prismaModel.formType) {
      errors.push('formType is required');
    }

    if (!prismaModel.formCode) {
      errors.push('formCode is required');
    }

    if (!prismaModel.displayName) {
      errors.push('displayName is required');
    }

    if (!prismaModel.status) {
      errors.push('status is required');
    }

    if (!prismaModel.storageUrl && prismaModel.status !== 'PENDING_GENERATION') {
      errors.push('storageUrl is required for generated forms');
    }

    if (prismaModel.fileSizeBytes && prismaModel.fileSizeBytes < 0) {
      errors.push('fileSizeBytes cannot be negative');
    }

    // Validate status transitions
    if (prismaModel.isFullySigned && prismaModel.status === 'SIGNATURE_PENDING') {
      errors.push('Form cannot be SIGNATURE_PENDING if fully signed');
    }

    return errors;
  }

  /**
   * Create a mock Prisma model for testing
   */
  public static createMockPrismaModel(overrides: any = {}): any {
    const base = {
      id: 'mock-form-id',
      formType: 'PA1_PETITION',
      formCode: 'P&A 1',
      displayName: 'Petition for Grant of Probate',
      status: 'GENERATED',
      currentVersion: 1,
      storageProvider: 'AWS_S3',
      storageUrl: 'https://s3.amazonaws.com/bucket/form.pdf',
      fileFormat: 'PDF',
      fileSizeBytes: 1024,
      checksum: 'abc123',
      templateVersion: '1.0',
      dataSource: 'estate-service',
      dataHash: 'hash123',
      signatures: JSON.stringify([]),
      requiredSignatories: 0,
      isFullySigned: false,
      courtCaseNumber: null,
      filingDate: null,
      filingReference: null,
      courtStampNumber: null,
      rejectionReason: null,
      courtQueries: [],
      amendmentsRequired: [],
      amendedBy: null,
      amendedAt: null,
      generatedAt: new Date(),
      generatedBy: 'system',
      generationDurationMs: 1000,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      versions: JSON.stringify([
        {
          versionNumber: 1,
          generatedAt: new Date(),
          generatedBy: 'system',
          storageUrl: 'https://s3.amazonaws.com/bucket/form.pdf',
          fileSizeBytes: 1024,
          checksum: 'abc123',
          templateVersion: '1.0',
        },
      ]),
      pageCount: 5,
      isNotarizationRequired: false,
      isCommissionerOathsRequired: false,
      isCourtStampRequired: false,
      relatedFormIds: [],
      dependsOnFormIds: [],
      lastAccessedAt: null,
      accessCount: 0,
      applicationId: 'mock-app-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { ...base, ...overrides };
  }
}

// ==================== SIMPLIFIED TYPES ====================

/**
 * Types for form operations
 */
export interface GeneratedFormCreateData {
  formType: string;
  formCode: string;
  displayName: string;
  status: string;
  applicationId: string;
  generatedBy: string;
  requiredSignatories: number;
}

export interface GeneratedFormUpdateData {
  status?: string;
  storageUrl?: string;
  signatures?: string;
  isFullySigned?: boolean;
  courtCaseNumber?: string;
  filingDate?: Date;
  rejectionReason?: string;
  courtQueries?: string[];
  amendmentsRequired?: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
}

/**
 * Types for form filtering
 */
export interface GeneratedFormFilter {
  applicationId?: string;
  status?: string[];
  formType?: string[];
  isFullySigned?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}
