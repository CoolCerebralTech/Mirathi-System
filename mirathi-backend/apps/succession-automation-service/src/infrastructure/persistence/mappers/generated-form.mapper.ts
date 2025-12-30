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
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model GeneratedForm
 */
export interface PrismaGeneratedFormModel {
  id: string;
  applicationId: string;

  // Identity
  formType: string; // Enum
  formCode: string;
  displayName: string;

  // Lifecycle
  status: string; // Enum
  currentVersion: number;

  // Storage
  storageProvider: string; // Enum
  storageUrl: string;
  fileFormat: string; // Enum
  fileSizeBytes: number;
  checksum: string | null;

  // Content Source
  templateVersion: string | null;
  dataSource: string | null;
  dataHash: string | null;

  // Signatures (JSON)
  signatures: any; // Json (FormSignature[])
  requiredSignatories: number;
  isFullySigned: boolean;

  // Filing Info
  courtCaseNumber: string | null;
  filingDate: Date | null;
  filingReference: string | null;
  courtStampNumber: string | null;

  // Rejection/Amendment
  rejectionReason: string | null;
  courtQueries: string[]; // String[]
  amendmentsRequired: string[]; // String[]

  // Version History (JSON)
  versions: any; // Json (FormVersion[])

  // Review
  generatedBy: string | null;
  generatedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;

  // Metadata
  pageCount: number;
  isNotarizationRequired: boolean;
  isCommissionerOathsRequired: boolean;
  isCourtStampRequired: boolean;
  relatedFormIds: string[];
  dependsOnFormIds: string[];
  lastAccessedAt: Date | null;
  accessCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * GeneratedForm Mapper
 *
 * PURPOSE: Translates between Domain Entity and Prisma Model for Generated Forms
 */
export class GeneratedFormMapper {
  /**
   * Map Domain Entity to Prisma Model for CREATE operations
   */
  public static toPersistence(domainEntity: GeneratedForm, applicationId?: string): any {
    // 1. Validate FK requirement
    if (!applicationId && !domainEntity.id) {
      // update logic usually doesn't need applicationId passed again
    }

    const props = (domainEntity as any).props;

    // 2. Construct Persistence Object
    return {
      id: domainEntity.id.toString(),
      ...(applicationId ? { applicationId } : {}),

      // --- Core Identity ---
      formType: this.mapDomainFormTypeToPrisma(props.formType),
      formCode: props.formCode,
      displayName: props.displayName,

      // --- Lifecycle ---
      status: props.status, // Enum
      currentVersion: props.currentVersion,

      // --- Storage ---
      storageProvider: props.storageProvider, // Enum
      storageUrl: props.storageUrl,
      fileFormat: props.fileFormat, // Enum
      fileSizeBytes: props.fileSizeBytes,
      checksum: props.checksum || null,

      // --- Content Source ---
      templateVersion: props.templateVersion || null,
      dataSource: props.dataSource || null,
      dataHash: props.dataHash || null,

      // --- Signatures ---
      signatures: props.signatures || [],
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

      // --- Generation Details ---
      generatedAt: props.generatedAt,
      generatedBy: props.generatedBy || null,

      // --- Review Process ---
      reviewedBy: props.reviewedBy || null,
      reviewedAt: props.reviewedAt || null,
      reviewNotes: props.reviewNotes || null,

      // --- Version History ---
      versions: props.versions || [],

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

      updatedAt: new Date(),
    };
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(raw: PrismaGeneratedFormModel): GeneratedForm {
    if (!raw) {
      throw new Error('GeneratedFormMapper: Cannot map null persistence model to domain.');
    }

    // 1. Deserialization
    const signaturesJson = this.parseJsonField(raw.signatures);
    const versionsJson = this.parseJsonField(raw.versions);

    // 2. Hydrate Complex Objects
    const signatures: FormSignature[] = Array.isArray(signaturesJson)
      ? signaturesJson.map((s: any) => ({
          ...s,
          signedAt: new Date(s.signedAt),
        }))
      : [];

    const versions: FormVersion[] = Array.isArray(versionsJson)
      ? versionsJson.map((v: any) => ({
          ...v,
          generatedAt: new Date(v.generatedAt),
        }))
      : [];

    // 3. Prepare Domain Props
    const props = {
      // Identity
      formType: raw.formType as any, // Cast to Enum/VO type in domain
      formCode: raw.formCode,
      displayName: raw.displayName,

      // Status
      status: raw.status as FormStatus,
      currentVersion: raw.currentVersion,

      // Storage
      storageProvider: raw.storageProvider as StorageProvider,
      storageUrl: raw.storageUrl,
      fileFormat: raw.fileFormat as FileFormat,
      fileSizeBytes: raw.fileSizeBytes,
      checksum: raw.checksum || '',

      // Content
      templateVersion: raw.templateVersion || '',
      dataSource: raw.dataSource || '',
      dataHash: raw.dataHash || '',

      // Signatures
      signatures,
      requiredSignatories: raw.requiredSignatories,
      isFullySigned: raw.isFullySigned,

      // Filing
      courtCaseNumber: raw.courtCaseNumber || undefined,
      filingDate: raw.filingDate || undefined,
      filingReference: raw.filingReference || undefined,
      courtStampNumber: raw.courtStampNumber || undefined,

      // Rejection
      rejectionReason: raw.rejectionReason || undefined,
      courtQueries: raw.courtQueries,
      amendmentsRequired: raw.amendmentsRequired,

      // Generation
      generatedAt: raw.generatedAt,
      generatedBy: raw.generatedBy || 'system',

      // Review
      reviewedBy: raw.reviewedBy || undefined,
      reviewedAt: raw.reviewedAt || undefined,
      reviewNotes: raw.reviewNotes || undefined,

      // History
      versions,

      // Metadata
      pageCount: raw.pageCount,
      isNotarizationRequired: raw.isNotarizationRequired,
      isCommissionerOathsRequired: raw.isCommissionerOathsRequired,
      isCourtStampRequired: raw.isCourtStampRequired,

      // Links
      relatedFormIds: raw.relatedFormIds,
      dependsOnFormIds: raw.dependsOnFormIds,

      // Audit
      lastAccessedAt: raw.lastAccessedAt || undefined,
      accessCount: raw.accessCount,

      internalNotes: undefined,
      userNotes: undefined,
    };

    // 4. Reconstitute
    return GeneratedForm.reconstitute(raw.id, props, raw.createdAt, raw.updatedAt);
  }

  /**
   * Helper: Map array of Prisma models to Domain Entities
   */
  public static toDomainArray(models: PrismaGeneratedFormModel[]): GeneratedForm[] {
    return models.map((model) => this.toDomain(model));
  }

  // ==================== HELPERS ====================

  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('GeneratedFormMapper: Failed to parse JSON string', e);
        return null;
      }
    }
    return null;
  }

  private static mapDomainFormTypeToPrisma(formType: any): string {
    if (formType && typeof formType.toString === 'function') {
      return formType.toString();
    }
    return String(formType);
  }
}
