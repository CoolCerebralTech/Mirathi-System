// src/succession-automation/src/infrastructure/persistence/mappers/probate-application.mapper.ts
import {
  ApplicationStatus,
  FilingPriority,
  ProbateApplication,
  ProbateApplicationType,
} from '../../../domain/aggregates/probate-application.aggregate';
import { FamilyConsent } from '../../../domain/entities/family-consent.entity';
import { GeneratedForm } from '../../../domain/entities/generated-form.entity';
import { ReadinessScore } from '../../../domain/value-objects/readiness-score.vo';
import { SuccessionContext } from '../../../domain/value-objects/succession-context.vo';
import { FamilyConsentMapper, PrismaFamilyConsentModel } from './family-consent.mapper';
import { GeneratedFormMapper, PrismaGeneratedFormModel } from './generated-form.mapper';

/**
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model ProbateApplication
 */
export interface PrismaProbateApplicationModel {
  id: string;
  estateId: string;
  readinessAssessmentId: string;

  // JSON Value Objects
  successionContext: any; // Json
  readinessScore: any; // Json

  // Enums/Strings
  applicationType: string;
  status: string;
  priority: string;

  // Applicant
  applicantUserId: string;
  applicantFullName: string;
  applicantRelationship: string;
  applicantContact: any; // Json

  // Court Info
  targetCourtJurisdiction: string;
  targetCourtName: string;
  courtStation: string;
  courtRegistry: string | null;
  estimatedProcessingDays: number | null;

  // Timestamps & Dates
  createdAt: Date;
  updatedAt: Date;
  estimatedFilingDate: Date | null;
  estimatedGrantDate: Date | null;
  filedAt: Date | null;
  courtReviewDate: Date | null;
  gazettePublishedDate: Date | null;
  objectionDeadline: Date | null;
  grantedDate: Date | null;
  rejectionDate: Date | null;
  amendmentDeadline: Date | null;
  withdrawnAt: Date | null;
  lastStatusChangeAt: Date;
  filingFeePaidAt: Date | null;
  lastReviewedAt: Date | null;

  // Filing Details
  filingMethod: string | null;
  courtCaseNumber: string | null;
  courtFileNumber: string | null;
  courtReceiptNumber: string | null;
  filingFeeAmount: any; // Decimal -> number/string
  filingFeePaid: boolean;

  // Grant Details
  grantNumber: string | null;
  grantType: string | null;
  grantIssuedBy: string | null;
  gazetteNoticeId: string | null;

  // Issues
  rejectionReason: string | null;
  amendmentsRequired: string[]; // String[]
  withdrawalReason: string | null;

  // Metadata
  totalFormsGenerated: number;
  totalConsentsRequired: number;
  daysInCurrentStatus: number;
  lastReviewedBy: string | null;
  notes: string | null;
  internalNotes: string | null;
  version: number;
}

/**
 * ProbateApplication Mapper
 *
 * PURPOSE: Translates between ProbateApplication Aggregate Root and Prisma Models.
 * HANDLES: Aggregate reconstruction, Value Object hydration, Child Entity mapping.
 */
export class ProbateApplicationMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE/UPDATE operations
   * Returns tuple containing application data and arrays for child entities.
   */
  public static toPersistence(domainAggregate: ProbateApplication): {
    application: any;
    forms: any[];
    consents: any[];
  } {
    const props = (domainAggregate as any).props;

    // 1. Prepare Application Persistence Object
    // NOTE: Do NOT use JSON.stringify. Pass objects, let Prisma serialize.
    const applicationPersistence = {
      id: domainAggregate.id.toString(),
      estateId: props.estateId,
      readinessAssessmentId: props.readinessAssessmentId,

      // Value Objects -> JSON
      successionContext: props.successionContext ? props.successionContext.toJSON() : null,
      readinessScore: props.readinessScore ? props.readinessScore.toJSON() : null,

      // Enums
      applicationType: props.applicationType, // Maps to Enum string
      status: props.status, // Maps to Enum string
      priority: props.priority, // Maps to Enum string

      // Applicant
      applicantUserId: props.applicantUserId,
      applicantFullName: props.applicantFullName,
      applicantRelationship: props.applicantRelationship,
      applicantContact: props.applicantContact || {}, // Simple object

      // Court Info
      targetCourtJurisdiction: props.targetCourtJurisdiction,
      targetCourtName: props.targetCourtName,
      courtStation: props.courtStation,
      courtRegistry: props.courtRegistry || null,
      estimatedProcessingDays: props.estimatedProcessingDays || null,

      // Dates
      estimatedFilingDate: props.estimatedFilingDate || null,
      estimatedGrantDate: props.estimatedGrantDate || null,
      filedAt: props.filedAt || null,
      filingFeePaidAt: props.filingFeePaidAt || null,
      courtReviewDate: props.courtReviewDate || null,
      gazettePublishedDate: props.gazettePublishedDate || null,
      objectionDeadline: props.objectionDeadline || null,
      grantedDate: props.grantedDate || null,
      rejectionDate: props.rejectionDate || null,
      amendmentDeadline: props.amendmentDeadline || null,
      withdrawnAt: props.withdrawnAt || null,
      lastStatusChangeAt: props.lastStatusChangeAt,
      lastReviewedAt: props.lastReviewedAt || null,

      // Filing Details
      filingMethod: props.filingMethod || null,
      courtCaseNumber: props.courtCaseNumber || null,
      courtFileNumber: props.courtFileNumber || null,
      courtReceiptNumber: props.courtReceiptNumber || null,
      filingFeeAmount: props.filingFeeAmount || 0,
      filingFeePaid: props.filingFeePaid || false,

      // Grant Details
      grantNumber: props.grantNumber || null,
      grantType: props.grantType || null,
      grantIssuedBy: props.grantIssuedBy || null,
      gazetteNoticeId: props.gazetteNoticeId || null,

      // Issues
      rejectionReason: props.rejectionReason || null,
      amendmentsRequired: props.amendmentsRequired || [],
      withdrawalReason: props.withdrawalReason || null,

      // Metadata
      totalFormsGenerated: props.totalFormsGenerated || 0,
      totalConsentsRequired: props.totalConsentsRequired || 0,
      daysInCurrentStatus: props.daysInCurrentStatus || 0,
      lastReviewedBy: props.lastReviewedBy || null,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
      version: props.version || 1,

      updatedAt: new Date(),
    };

    // 2. Map Forms (Child Entities)
    const formsPersistence: any[] = [];
    if (props.forms && Array.isArray(props.forms)) {
      props.forms.forEach((form: GeneratedForm) => {
        try {
          const formData = GeneratedFormMapper.toPersistence(form, domainAggregate.id.toString());
          formsPersistence.push(formData);
        } catch (error) {
          console.warn(`Failed to map form ${form.id.toString()}:`, error);
        }
      });
    }

    // 3. Map Consents (Child Entities)
    const consentsPersistence: any[] = [];
    if (props.consents && Array.isArray(props.consents)) {
      props.consents.forEach((consent: FamilyConsent) => {
        try {
          const consentData = FamilyConsentMapper.toPersistence(
            consent,
            domainAggregate.id.toString(),
          );
          consentsPersistence.push(consentData);
        } catch (error) {
          console.warn(`Failed to map consent ${consent.id.toString()}:`, error);
        }
      });
    }

    return {
      application: applicationPersistence,
      forms: formsPersistence,
      consents: consentsPersistence,
    };
  }

  /**
   * Map Prisma Model to Domain Aggregate for READ operations
   * Reconstructs the entire aggregate tree.
   */
  public static toDomain(
    raw: PrismaProbateApplicationModel,
    prismaForms: PrismaGeneratedFormModel[] = [],
    prismaConsents: PrismaFamilyConsentModel[] = [],
  ): ProbateApplication {
    if (!raw) {
      throw new Error('ProbateApplicationMapper: Prisma application cannot be null');
    }

    // 1. Hydrate JSON Fields
    const contextJson = this.parseJsonField(raw.successionContext);
    const scoreJson = this.parseJsonField(raw.readinessScore);
    const contactJson = this.parseJsonField(raw.applicantContact);

    // 2. Reconstruct Value Objects
    let successionContext: SuccessionContext;
    if (contextJson) {
      successionContext = SuccessionContext.fromJSON(contextJson);
    } else {
      throw new Error('ProbateApplicationMapper: Missing successionContext in persistence');
    }

    let readinessScore: ReadinessScore | undefined;
    if (scoreJson) {
      readinessScore = ReadinessScore.fromJSON(scoreJson);
    }

    // 3. Convert Child Entities
    const forms: GeneratedForm[] = prismaForms.map((f) => GeneratedFormMapper.toDomain(f));
    const consents: FamilyConsent[] = prismaConsents.map((c) => FamilyConsentMapper.toDomain(c));

    // 4. Prepare Domain Props
    // Cast string Enums back to Domain Enums where necessary
    const props = {
      estateId: raw.estateId,
      readinessAssessmentId: raw.readinessAssessmentId,
      successionContext,
      readinessScore,

      applicationType: raw.applicationType as ProbateApplicationType,

      applicantUserId: raw.applicantUserId,
      applicantFullName: raw.applicantFullName,
      applicantRelationship: raw.applicantRelationship,
      applicantContact: contactJson || {},

      targetCourtJurisdiction: raw.targetCourtJurisdiction,
      targetCourtName: raw.targetCourtName,
      courtStation: raw.courtStation,
      courtRegistry: raw.courtRegistry || undefined,
      estimatedProcessingDays: raw.estimatedProcessingDays || undefined,

      status: raw.status as ApplicationStatus,
      priority: raw.priority as FilingPriority,

      createdAt: raw.createdAt,
      estimatedFilingDate: raw.estimatedFilingDate || undefined,
      estimatedGrantDate: raw.estimatedGrantDate || undefined,

      forms,
      consents,

      filedAt: raw.filedAt || undefined,
      filingMethod: (raw.filingMethod as any) || undefined, // Cast to Union
      courtCaseNumber: raw.courtCaseNumber || undefined,
      courtFileNumber: raw.courtFileNumber || undefined,
      courtReceiptNumber: raw.courtReceiptNumber || undefined,
      filingFeeAmount: raw.filingFeeAmount ? Number(raw.filingFeeAmount) : undefined,
      filingFeePaid: raw.filingFeePaid,
      filingFeePaidAt: raw.filingFeePaidAt || undefined,

      courtReviewDate: raw.courtReviewDate || undefined,
      gazettePublishedDate: raw.gazettePublishedDate || undefined,
      gazetteNoticeId: raw.gazetteNoticeId || undefined,
      objectionDeadline: raw.objectionDeadline || undefined,

      grantedDate: raw.grantedDate || undefined,
      grantNumber: raw.grantNumber || undefined,
      grantType: raw.grantType || undefined,
      grantIssuedBy: raw.grantIssuedBy || undefined,

      rejectionReason: raw.rejectionReason || undefined,
      rejectionDate: raw.rejectionDate || undefined,
      amendmentsRequired: raw.amendmentsRequired || [],
      amendmentDeadline: raw.amendmentDeadline || undefined,

      withdrawnAt: raw.withdrawnAt || undefined,
      withdrawalReason: raw.withdrawalReason || undefined,

      totalFormsGenerated: raw.totalFormsGenerated,
      totalConsentsRequired: raw.totalConsentsRequired,
      daysInCurrentStatus: raw.daysInCurrentStatus,
      lastStatusChangeAt: raw.lastStatusChangeAt,

      lastReviewedAt: raw.lastReviewedAt || undefined,
      lastReviewedBy: raw.lastReviewedBy || undefined,
      notes: raw.notes || undefined,
      internalNotes: raw.internalNotes || undefined,
      version: raw.version,
    };

    // 5. Reconstitute Aggregate
    return ProbateApplication.reconstitute(
      raw.id,
      props,
      raw.createdAt,
      raw.updatedAt,
      raw.version,
    );
  }

  // ==================== HELPERS ====================

  /**
   * Safe JSON parser that handles both Objects and Strings
   */
  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('ProbateApplicationMapper: Failed to parse JSON string', e);
        return null;
      }
    }
    return null;
  }
}
