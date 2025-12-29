// src/succession-automation/src/infrastructure/persistence/mappers/probate-application.mapper.ts
import { ProbateApplication as PrismaProbateApplication } from '@prisma/client';

import {
  ApplicationStatus,
  FilingPriority,
  ProbateApplication,
  ProbateApplicationType,
} from '../../../domain/aggregates/probate-application.aggregate';
import { FamilyConsent } from '../../../domain/entities/family-consent.entity';
import { GeneratedForm } from '../../../domain/entities/generated-form.entity';
import { FamilyConsentMapper } from './family-consent.mapper';
import { GeneratedFormMapper } from './generated-form.mapper';

/**
 * ProbateApplication Mapper
 *
 * PURPOSE: Translates between ProbateApplication Aggregate Root and Prisma Models
 *
 * COMPLEXITIES HANDLED:
 * 1. Aggregate Root with two collections (forms and consents)
 * 2. Value Objects (SuccessionContext, ReadinessScore) stored as JSON
 * 3. Complex enum mapping
 * 4. Multiple date fields with null handling
 * 5. Array fields (amendmentsRequired, courtQueries)
 * 6. Batch operations for forms and consents
 */

export class ProbateApplicationMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE operations
   * Returns application data and separate arrays for forms and consents
   */
  public static toPersistenceCreate(domainAggregate: ProbateApplication): {
    application: any;
    forms: any[];
    consents: any[];
  } {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Parse JSON-serializable values
    const successionContext = props.successionContext ? props.successionContext.toJSON() : null;
    const readinessScore = props.readinessScore ? props.readinessScore.toJSON() : null;

    // Build application persistence object
    const applicationPersistence: any = {
      // --- Core Identity ---
      estateId: props.estateId,
      readinessAssessmentId: props.readinessAssessmentId,

      // --- Context (JSON) ---
      successionContext: successionContext ? JSON.stringify(successionContext) : null,
      readinessScore: readinessScore ? JSON.stringify(readinessScore) : null,
      applicationType: this.mapDomainApplicationTypeToPrisma(props.applicationType),

      // --- Applicant & Executor ---
      applicantUserId: props.applicantUserId,
      applicantFullName: props.applicantFullName,
      applicantRelationship: props.applicantRelationship,
      applicantContact: props.applicantContact ? JSON.stringify(props.applicantContact) : null,

      // --- Court Information ---
      targetCourtJurisdiction: props.targetCourtJurisdiction,
      targetCourtName: props.targetCourtName,
      courtStation: props.courtStation,
      courtRegistry: props.courtRegistry || null,
      estimatedProcessingDays: props.estimatedProcessingDays || null,

      // --- Status & Timeline ---
      status: this.mapDomainApplicationStatusToPrisma(props.status),
      priority: this.mapDomainFilingPriorityToPrisma(props.priority),

      // Dates
      estimatedFilingDate: props.estimatedFilingDate || null,
      estimatedGrantDate: props.estimatedGrantDate || null,

      // --- Filing Information ---
      filedAt: props.filedAt || null,
      filingMethod: props.filingMethod || null,
      courtCaseNumber: props.courtCaseNumber || null,
      courtFileNumber: props.courtFileNumber || null,
      courtReceiptNumber: props.courtReceiptNumber || null,
      filingFeeAmount: props.filingFeeAmount || null,
      filingFeePaid: props.filingFeePaid || false,
      filingFeePaidAt: props.filingFeePaidAt || null,

      // --- Court Response & Gazette ---
      courtReviewDate: props.courtReviewDate || null,
      gazettePublishedDate: props.gazettePublishedDate || null,
      gazetteNoticeId: props.gazetteNoticeId || null,
      objectionDeadline: props.objectionDeadline || null,

      // --- Grant Information ---
      grantedDate: props.grantedDate || null,
      grantNumber: props.grantNumber || null,
      grantType: props.grantType || null,
      grantIssuedBy: props.grantIssuedBy || null,

      // --- Rejection/Amendment ---
      rejectionReason: props.rejectionReason || null,
      rejectionDate: props.rejectionDate || null,
      amendmentsRequired: props.amendmentsRequired || [],
      amendmentDeadline: props.amendmentDeadline || null,

      // --- Withdrawal ---
      withdrawnAt: props.withdrawnAt || null,
      withdrawalReason: props.withdrawalReason || null,

      // --- Statistics & Analytics ---
      totalFormsGenerated: props.totalFormsGenerated || 0,
      totalConsentsRequired: props.totalConsentsRequired || 0,
      daysInCurrentStatus: props.daysInCurrentStatus || 0,
      lastStatusChangeAt: props.lastStatusChangeAt,

      // --- Metadata ---
      lastReviewedAt: props.lastReviewedAt || null,
      lastReviewedBy: props.lastReviewedBy || null,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
      version: props.version || 1,
    };

    // Map forms using GeneratedFormMapper
    const formsPersistence: any[] = [];
    if (props.forms && Array.isArray(props.forms)) {
      props.forms.forEach((form: GeneratedForm) => {
        try {
          const formData = GeneratedFormMapper.toPersistenceCreate(
            form,
            domainAggregate.id.toString(),
          );
          formsPersistence.push(formData);
        } catch (error) {
          console.warn(`Failed to map form ${form.id.toString()}:`, error);
        }
      });
    }

    // Map consents using FamilyConsentMapper
    const consentsPersistence: any[] = [];
    if (props.consents && Array.isArray(props.consents)) {
      props.consents.forEach((consent: FamilyConsent) => {
        try {
          const consentData = FamilyConsentMapper.toPersistenceCreate(
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
   * Map Domain Aggregate to Prisma Model for UPDATE operations
   * Only includes fields that can be updated (excludes forms and consents)
   */
  public static toPersistenceUpdate(domainAggregate: ProbateApplication): any {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Parse JSON-serializable values if they changed
    let successionContext = null;
    let readinessScore = null;

    if (props.successionContext) {
      // Check if succession context changed (you might need to track changes)
      // For now, always serialize if it exists
      successionContext = JSON.stringify(props.successionContext.toJSON());
    }

    if (props.readinessScore) {
      readinessScore = JSON.stringify(props.readinessScore.toJSON());
    }

    // Only include fields that can be updated
    const updateData: any = {
      // --- Context (if changed) ---
      successionContext: successionContext,
      readinessScore: readinessScore,
      applicationType: props.applicationType
        ? this.mapDomainApplicationTypeToPrisma(props.applicationType)
        : undefined,

      // --- Status & Timeline ---
      status: this.mapDomainApplicationStatusToPrisma(props.status),
      priority: this.mapDomainFilingPriorityToPrisma(props.priority),

      // Dates (if changed)
      estimatedFilingDate: props.estimatedFilingDate || null,
      estimatedGrantDate: props.estimatedGrantDate || null,

      // --- Filing Information ---
      filedAt: props.filedAt || null,
      filingMethod: props.filingMethod || null,
      courtCaseNumber: props.courtCaseNumber || null,
      courtFileNumber: props.courtFileNumber || null,
      courtReceiptNumber: props.courtReceiptNumber || null,
      filingFeeAmount: props.filingFeeAmount || null,
      filingFeePaid: props.filingFeePaid || false,
      filingFeePaidAt: props.filingFeePaidAt || null,

      // --- Court Response & Gazette ---
      courtReviewDate: props.courtReviewDate || null,
      gazettePublishedDate: props.gazettePublishedDate || null,
      gazetteNoticeId: props.gazetteNoticeId || null,
      objectionDeadline: props.objectionDeadline || null,

      // --- Grant Information ---
      grantedDate: props.grantedDate || null,
      grantNumber: props.grantNumber || null,
      grantType: props.grantType || null,
      grantIssuedBy: props.grantIssuedBy || null,

      // --- Rejection/Amendment ---
      rejectionReason: props.rejectionReason || null,
      rejectionDate: props.rejectionDate || null,
      amendmentsRequired: props.amendmentsRequired || [],
      amendmentDeadline: props.amendmentDeadline || null,

      // --- Withdrawal ---
      withdrawnAt: props.withdrawnAt || null,
      withdrawalReason: props.withdrawalReason || null,

      // --- Statistics & Analytics ---
      totalFormsGenerated: props.totalFormsGenerated || 0,
      totalConsentsRequired: props.totalConsentsRequired || 0,
      daysInCurrentStatus: props.daysInCurrentStatus || 0,
      lastStatusChangeAt: props.lastStatusChangeAt,

      // --- Metadata ---
      lastReviewedAt: props.lastReviewedAt || null,
      lastReviewedBy: props.lastReviewedBy || null,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
      version: props.version || 1,
    };

    // Remove undefined values (but keep null values that should be set to null)
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Aggregate for READ operations
   * Reconstructs the entire aggregate with forms and consents
   */
  public static toDomain(
    prismaApplication: PrismaProbateApplication,
    prismaForms: any[],
    prismaConsents: any[],
  ): ProbateApplication {
    if (!prismaApplication) {
      throw new Error('Prisma application cannot be null');
    }

    // Validate required fields
    if (!prismaApplication.estateId) {
      throw new Error('Prisma ProbateApplication must have estateId');
    }

    if (!prismaApplication.readinessAssessmentId) {
      throw new Error('Prisma ProbateApplication must have readinessAssessmentId');
    }

    if (!prismaApplication.applicantUserId) {
      throw new Error('Prisma ProbateApplication must have applicantUserId');
    }

    if (!prismaApplication.applicantFullName) {
      throw new Error('Prisma ProbateApplication must have applicantFullName');
    }

    if (!prismaApplication.applicantRelationship) {
      throw new Error('Prisma ProbateApplication must have applicantRelationship');
    }

    if (!prismaApplication.targetCourtJurisdiction) {
      throw new Error('Prisma ProbateApplication must have targetCourtJurisdiction');
    }

    if (!prismaApplication.targetCourtName) {
      throw new Error('Prisma ProbateApplication must have targetCourtName');
    }

    if (!prismaApplication.courtStation) {
      throw new Error('Prisma ProbateApplication must have courtStation');
    }

    if (!prismaApplication.status) {
      throw new Error('Prisma ProbateApplication must have status');
    }

    if (!prismaApplication.priority) {
      throw new Error('Prisma ProbateApplication must have priority');
    }

    // Parse JSON fields
    let successionContext: any = null;
    if (
      prismaApplication.successionContext &&
      typeof prismaApplication.successionContext === 'string'
    ) {
      try {
        successionContext = JSON.parse(prismaApplication.successionContext);
      } catch (error) {
        console.warn('Failed to parse successionContext JSON:', error);
      }
    }

    let readinessScore: any = null;
    if (prismaApplication.readinessScore && typeof prismaApplication.readinessScore === 'string') {
      try {
        readinessScore = JSON.parse(prismaApplication.readinessScore);
      } catch (error) {
        console.warn('Failed to parse readinessScore JSON:', error);
      }
    }

    let applicantContact: any = null;
    if (
      prismaApplication.applicantContact &&
      typeof prismaApplication.applicantContact === 'string'
    ) {
      try {
        applicantContact = JSON.parse(prismaApplication.applicantContact);
      } catch (error) {
        console.warn('Failed to parse applicantContact JSON:', error);
      }
    }

    // Convert forms
    const forms: GeneratedForm[] = prismaForms.map((form) => {
      try {
        return GeneratedFormMapper.toDomain(form);
      } catch (error) {
        console.warn(`Failed to convert form ${form.id}:`, error);
        throw error;
      }
    });

    // Convert consents
    const consents: FamilyConsent[] = prismaConsents.map((consent) => {
      try {
        return FamilyConsentMapper.toDomain(consent);
      } catch (error) {
        console.warn(`Failed to convert consent ${consent.id}:`, error);
        throw error;
      }
    });

    // Prepare domain properties
    const domainProps = {
      // --- Identity & Context ---
      estateId: prismaApplication.estateId,
      readinessAssessmentId: prismaApplication.readinessAssessmentId,
      readinessScore: readinessScore, // Will be converted to VO in domain
      successionContext: successionContext, // Will be converted to VO in domain
      applicationType: this.mapPrismaApplicationTypeToDomain(prismaApplication.applicationType),

      // --- Applicant & Executor ---
      applicantUserId: prismaApplication.applicantUserId,
      applicantFullName: prismaApplication.applicantFullName,
      applicantRelationship: prismaApplication.applicantRelationship,
      applicantContact: applicantContact || {},

      // --- Court Information ---
      targetCourtJurisdiction: prismaApplication.targetCourtJurisdiction,
      targetCourtName: prismaApplication.targetCourtName,
      courtStation: prismaApplication.courtStation,
      courtRegistry: prismaApplication.courtRegistry || undefined,
      estimatedProcessingDays: prismaApplication.estimatedProcessingDays || undefined,

      // --- Status & Timeline ---
      status: this.mapPrismaApplicationStatusToDomain(prismaApplication.status),
      priority: this.mapPrismaFilingPriorityToDomain(prismaApplication.priority),
      createdAt: prismaApplication.createdAt,
      estimatedFilingDate: prismaApplication.estimatedFilingDate || undefined,
      estimatedGrantDate: prismaApplication.estimatedGrantDate || undefined,

      // --- Generated Forms (Collection) ---
      forms: forms,

      // --- Family Consents (Collection) ---
      consents: consents,

      // --- Filing Information ---
      filedAt: prismaApplication.filedAt || undefined,
      filingMethod: (prismaApplication.filingMethod as any) || undefined,
      courtCaseNumber: prismaApplication.courtCaseNumber || undefined,
      courtFileNumber: prismaApplication.courtFileNumber || undefined,
      courtReceiptNumber: prismaApplication.courtReceiptNumber || undefined,
      filingFeeAmount: prismaApplication.filingFeeAmount || undefined,
      filingFeePaid: prismaApplication.filingFeePaid,
      filingFeePaidAt: prismaApplication.filingFeePaidAt || undefined,

      // --- Court Response & Gazette ---
      courtReviewDate: prismaApplication.courtReviewDate || undefined,
      gazettePublishedDate: prismaApplication.gazettePublishedDate || undefined,
      gazetteNoticeId: prismaApplication.gazetteNoticeId || undefined,
      objectionDeadline: prismaApplication.objectionDeadline || undefined,

      // --- Grant Information ---
      grantedDate: prismaApplication.grantedDate || undefined,
      grantNumber: prismaApplication.grantNumber || undefined,
      grantType: prismaApplication.grantType || undefined,
      grantIssuedBy: prismaApplication.grantIssuedBy || undefined,

      // --- Rejection/Amendment ---
      rejectionReason: prismaApplication.rejectionReason || undefined,
      rejectionDate: prismaApplication.rejectionDate || undefined,
      amendmentsRequired: prismaApplication.amendmentsRequired || [],
      amendmentDeadline: prismaApplication.amendmentDeadline || undefined,

      // --- Withdrawal ---
      withdrawnAt: prismaApplication.withdrawnAt || undefined,
      withdrawalReason: prismaApplication.withdrawalReason || undefined,

      // --- Statistics & Analytics ---
      totalFormsGenerated: prismaApplication.totalFormsGenerated,
      totalConsentsRequired: prismaApplication.totalConsentsRequired,
      daysInCurrentStatus: prismaApplication.daysInCurrentStatus,
      lastStatusChangeAt: prismaApplication.lastStatusChangeAt,

      // --- Metadata ---
      lastReviewedAt: prismaApplication.lastReviewedAt || undefined,
      lastReviewedBy: prismaApplication.lastReviewedBy || undefined,
      notes: prismaApplication.notes || undefined,
      internalNotes: prismaApplication.internalNotes || undefined,
      version: prismaApplication.version,
    };

    // Reconstitute the domain aggregate
    return ProbateApplication.reconstitute(
      prismaApplication.id,
      domainProps,
      prismaApplication.createdAt,
      prismaApplication.updatedAt,
      prismaApplication.version,
    );
  }

  /**
   * Map multiple Prisma models to Domain Aggregates (batch operation)
   */
  public static async toDomainArray(
    prismaApplications: PrismaProbateApplication[],
    getFormsForApplication: (applicationId: string) => Promise<any[]>,
    getConsentsForApplication: (applicationId: string) => Promise<any[]>,
  ): Promise<ProbateApplication[]> {
    const aggregates: ProbateApplication[] = [];

    for (const application of prismaApplications) {
      try {
        // Get all forms and consents for this application
        const forms = await getFormsForApplication(application.id);
        const consents = await getConsentsForApplication(application.id);

        // Convert to domain
        const aggregate = this.toDomain(application, forms, consents);
        aggregates.push(aggregate);
      } catch (error) {
        console.error(`Failed to convert application ${application.id}:`, error);
        // Continue with other applications
      }
    }

    return aggregates;
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainAggregate: ProbateApplication): string | null {
    return domainAggregate.id ? domainAggregate.id.toString() : null;
  }

  /**
   * Get version for optimistic concurrency
   */
  public static getVersion(domainAggregate: ProbateApplication): number {
    return domainAggregate.version;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain ProbateApplicationType to Prisma string
   */
  private static mapDomainApplicationTypeToPrisma(type: ProbateApplicationType): string {
    const mapping: Record<ProbateApplicationType, string> = {
      [ProbateApplicationType.GRANT_OF_PROBATE]: 'GRANT_OF_PROBATE',
      [ProbateApplicationType.LETTERS_OF_ADMINISTRATION]: 'LETTERS_OF_ADMINISTRATION',
      [ProbateApplicationType.LETTERS_OF_ADMIN_WILL_ANNEXED]: 'LETTERS_OF_ADMIN_WILL_ANNEXED',
      [ProbateApplicationType.SUMMARY_ADMINISTRATION]: 'SUMMARY_ADMINISTRATION',
      [ProbateApplicationType.LIMITED_GRANT_AD_LITEM]: 'LIMITED_GRANT_AD_LITEM',
      [ProbateApplicationType.LIMITED_GRANT_COLLECTION]: 'LIMITED_GRANT_COLLECTION',
      [ProbateApplicationType.ISLAMIC_GRANT]: 'ISLAMIC_GRANT',
      [ProbateApplicationType.CUSTOMARY_GRANT]: 'CUSTOMARY_GRANT',
    };

    const prismaType = mapping[type];
    if (!prismaType) {
      throw new Error(`Invalid ProbateApplicationType: ${type}`);
    }
    return prismaType;
  }

  /**
   * Map Prisma ProbateApplicationType string to Domain
   */
  private static mapPrismaApplicationTypeToDomain(type: string): ProbateApplicationType {
    const mapping: Record<string, ProbateApplicationType> = {
      GRANT_OF_PROBATE: ProbateApplicationType.GRANT_OF_PROBATE,
      LETTERS_OF_ADMINISTRATION: ProbateApplicationType.LETTERS_OF_ADMINISTRATION,
      LETTERS_OF_ADMIN_WILL_ANNEXED: ProbateApplicationType.LETTERS_OF_ADMIN_WILL_ANNEXED,
      SUMMARY_ADMINISTRATION: ProbateApplicationType.SUMMARY_ADMINISTRATION,
      LIMITED_GRANT_AD_LITEM: ProbateApplicationType.LIMITED_GRANT_AD_LITEM,
      LIMITED_GRANT_COLLECTION: ProbateApplicationType.LIMITED_GRANT_COLLECTION,
      ISLAMIC_GRANT: ProbateApplicationType.ISLAMIC_GRANT,
      CUSTOMARY_GRANT: ProbateApplicationType.CUSTOMARY_GRANT,
    };

    const domainType = mapping[type];
    if (!domainType) {
      throw new Error(`Invalid Prisma ProbateApplicationType: ${type}`);
    }
    return domainType;
  }

  /**
   * Map Domain ApplicationStatus to Prisma string
   */
  private static mapDomainApplicationStatusToPrisma(status: ApplicationStatus): string {
    const mapping: Record<ApplicationStatus, string> = {
      [ApplicationStatus.DRAFT]: 'DRAFT',
      [ApplicationStatus.PENDING_FORMS]: 'PENDING_FORMS',
      [ApplicationStatus.UNDER_REVIEW]: 'UNDER_REVIEW',
      [ApplicationStatus.PENDING_SIGNATURES]: 'PENDING_SIGNATURES',
      [ApplicationStatus.PENDING_CONSENTS]: 'PENDING_CONSENTS',
      [ApplicationStatus.PENDING_FEE]: 'PENDING_FEE',
      [ApplicationStatus.READY_TO_FILE]: 'READY_TO_FILE',
      [ApplicationStatus.FILED]: 'FILED',
      [ApplicationStatus.COURT_REVIEW]: 'COURT_REVIEW',
      [ApplicationStatus.GAZETTE_PUBLISHED]: 'GAZETTE_PUBLISHED',
      [ApplicationStatus.GRANTED]: 'GRANTED',
      [ApplicationStatus.REJECTED]: 'REJECTED',
      [ApplicationStatus.AMENDMENT_REQUIRED]: 'AMENDMENT_REQUIRED',
      [ApplicationStatus.WITHDRAWN]: 'WITHDRAWN',
      [ApplicationStatus.ABANDONED]: 'ABANDONED',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid ApplicationStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma ApplicationStatus string to Domain
   */
  private static mapPrismaApplicationStatusToDomain(status: string): ApplicationStatus {
    const mapping: Record<string, ApplicationStatus> = {
      DRAFT: ApplicationStatus.DRAFT,
      PENDING_FORMS: ApplicationStatus.PENDING_FORMS,
      UNDER_REVIEW: ApplicationStatus.UNDER_REVIEW,
      PENDING_SIGNATURES: ApplicationStatus.PENDING_SIGNATURES,
      PENDING_CONSENTS: ApplicationStatus.PENDING_CONSENTS,
      PENDING_FEE: ApplicationStatus.PENDING_FEE,
      READY_TO_FILE: ApplicationStatus.READY_TO_FILE,
      FILED: ApplicationStatus.FILED,
      COURT_REVIEW: ApplicationStatus.COURT_REVIEW,
      GAZETTE_PUBLISHED: ApplicationStatus.GAZETTE_PUBLISHED,
      GRANTED: ApplicationStatus.GRANTED,
      REJECTED: ApplicationStatus.REJECTED,
      AMENDMENT_REQUIRED: ApplicationStatus.AMENDMENT_REQUIRED,
      WITHDRAWN: ApplicationStatus.WITHDRAWN,
      ABANDONED: ApplicationStatus.ABANDONED,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma ApplicationStatus: ${status}`);
    }
    return domainStatus;
  }

  /**
   * Map Domain FilingPriority to Prisma string
   */
  private static mapDomainFilingPriorityToPrisma(priority: FilingPriority): string {
    const mapping: Record<FilingPriority, string> = {
      [FilingPriority.URGENT]: 'URGENT',
      [FilingPriority.HIGH]: 'HIGH',
      [FilingPriority.NORMAL]: 'NORMAL',
      [FilingPriority.LOW]: 'LOW',
    };

    const prismaPriority = mapping[priority];
    if (!prismaPriority) {
      throw new Error(`Invalid FilingPriority: ${priority}`);
    }
    return prismaPriority;
  }

  /**
   * Map Prisma FilingPriority string to Domain
   */
  private static mapPrismaFilingPriorityToDomain(priority: string): FilingPriority {
    const mapping: Record<string, FilingPriority> = {
      URGENT: FilingPriority.URGENT,
      HIGH: FilingPriority.HIGH,
      NORMAL: FilingPriority.NORMAL,
      LOW: FilingPriority.LOW,
    };

    const domainPriority = mapping[priority];
    if (!domainPriority) {
      throw new Error(`Invalid Prisma FilingPriority: ${priority}`);
    }
    return domainPriority;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract application IDs from Prisma models
   */
  public static extractIds(prismaModels: PrismaProbateApplication[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if application is in a state that allows updates
   */
  public static isUpdatable(prismaModel: PrismaProbateApplication): boolean {
    const nonUpdatableStatuses = ['GRANTED', 'WITHDRAWN', 'ABANDONED'];
    return !nonUpdatableStatuses.includes(prismaModel.status);
  }

  /**
   * Check if application can be filed
   */
  public static canFile(prismaModel: PrismaProbateApplication): boolean {
    return prismaModel.status === 'READY_TO_FILE' && prismaModel.filingFeePaid;
  }

  /**
   * Check if application is filed
   */
  public static isFiled(prismaModel: PrismaProbateApplication): boolean {
    const filedStatuses = [
      'FILED',
      'COURT_REVIEW',
      'GAZETTE_PUBLISHED',
      'GRANTED',
      'AMENDMENT_REQUIRED',
      'REJECTED',
    ];
    return filedStatuses.includes(prismaModel.status);
  }

  /**
   * Check if application needs more forms
   */
  public static needsMoreForms(prismaModel: PrismaProbateApplication, totalForms: number): boolean {
    const formsNeeded = this.calculateFormsNeeded(prismaModel);
    return totalForms < formsNeeded;
  }

  /**
   * Calculate forms needed based on application type
   */
  private static calculateFormsNeeded(prismaModel: PrismaProbateApplication): number {
    // Minimum forms needed based on application type
    const minForms: Record<string, number> = {
      GRANT_OF_PROBATE: 3, // PA1 + supporting affidavits
      LETTERS_OF_ADMINISTRATION: 4, // PA80 + supporting affidavits
      SUMMARY_ADMINISTRATION: 2, // PA5 + death certificate
      ISLAMIC_GRANT: 3, // Islamic petition + affidavits
    };

    return minForms[prismaModel.applicationType] || 3;
  }

  /**
   * Create update data for filing fee payment
   */
  public static createFilingFeeUpdateData(
    amount: number,
    receiptNumber?: string,
  ): Record<string, any> {
    const now = new Date();

    return {
      filingFeePaid: true,
      filingFeeAmount: amount,
      filingFeePaidAt: now,
      courtReceiptNumber: receiptNumber || null,
      lastStatusChangeAt: now,
    };
  }

  /**
   * Create update data for court filing
   */
  public static createCourtFilingUpdateData(
    courtCaseNumber: string,
    filingMethod: string,
    filingReference?: string,
  ): Record<string, any> {
    const now = new Date();

    return {
      status: 'FILED',
      filedAt: now,
      courtCaseNumber,
      filingMethod,
      courtFileNumber: filingReference || null,
      lastStatusChangeAt: now,
    };
  }

  /**
   * Create update data for court rejection
   */
  public static createCourtRejectionUpdateData(
    reason: string,
    amendmentsRequired: string[] = [],
  ): Record<string, any> {
    const now = new Date();
    const amendmentDeadline = new Date();
    amendmentDeadline.setDate(amendmentDeadline.getDate() + 30); // 30 days

    return {
      status: 'REJECTED',
      rejectionReason: reason,
      rejectionDate: now,
      amendmentsRequired,
      amendmentDeadline,
      lastStatusChangeAt: now,
    };
  }

  /**
   * Create update data for grant issuance
   */
  public static createGrantIssuanceUpdateData(
    grantNumber: string,
    grantType: string,
    issuedBy: string,
  ): Record<string, any> {
    const now = new Date();

    return {
      status: 'GRANTED',
      grantedDate: now,
      grantNumber,
      grantType,
      grantIssuedBy: issuedBy,
      lastStatusChangeAt: now,
    };
  }

  /**
   * Create update data for gazette publication
   */
  public static createGazettePublicationUpdateData(gazetteNoticeId: string): Record<string, any> {
    const now = new Date();
    const objectionDeadline = new Date();
    objectionDeadline.setDate(objectionDeadline.getDate() + 30); // 30-day objection period

    return {
      status: 'GAZETTE_PUBLISHED',
      gazettePublishedDate: now,
      gazetteNoticeId,
      objectionDeadline,
      lastStatusChangeAt: now,
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: PrismaProbateApplication): string[] {
    const errors: string[] = [];

    if (!prismaModel.estateId) {
      errors.push('estateId is required');
    }

    if (!prismaModel.readinessAssessmentId) {
      errors.push('readinessAssessmentId is required');
    }

    if (!prismaModel.applicantUserId) {
      errors.push('applicantUserId is required');
    }

    if (!prismaModel.applicantFullName) {
      errors.push('applicantFullName is required');
    }

    if (!prismaModel.applicantRelationship) {
      errors.push('applicantRelationship is required');
    }

    if (!prismaModel.targetCourtJurisdiction) {
      errors.push('targetCourtJurisdiction is required');
    }

    if (!prismaModel.targetCourtName) {
      errors.push('targetCourtName is required');
    }

    if (!prismaModel.courtStation) {
      errors.push('courtStation is required');
    }

    if (!prismaModel.status) {
      errors.push('status is required');
    }

    if (!prismaModel.priority) {
      errors.push('priority is required');
    }

    // Validate status transitions (basic)
    if (
      prismaModel.filedAt &&
      ![
        'FILED',
        'COURT_REVIEW',
        'GAZETTE_PUBLISHED',
        'GRANTED',
        'REJECTED',
        'AMENDMENT_REQUIRED',
      ].includes(prismaModel.status)
    ) {
      errors.push('Cannot have filedAt without being in a filed status');
    }

    if (prismaModel.grantedDate && prismaModel.status !== 'GRANTED') {
      errors.push('Cannot have grantedDate without GRANTED status');
    }

    if (prismaModel.withdrawnAt && prismaModel.status !== 'WITHDRAWN') {
      errors.push('Cannot have withdrawnAt without WITHDRAWN status');
    }

    return errors;
  }

  /**
   * Create a mock Prisma ProbateApplication for testing
   */
  public static createMockPrismaApplication(
    overrides: Partial<PrismaProbateApplication> = {},
  ): PrismaProbateApplication {
    const now = new Date();

    const base: PrismaProbateApplication = {
      id: 'app-123',
      estateId: 'estate-123',
      readinessAssessmentId: 'readiness-123',
      successionContext: JSON.stringify({
        regime: 'INTESTATE',
        marriageType: 'MONOGAMOUS',
        religion: 'STATUTORY',
      }),
      readinessScore: JSON.stringify({ score: 75, filingConfidence: 'MEDIUM' }),
      applicationType: 'LETTERS_OF_ADMINISTRATION',
      applicantUserId: 'user-123',
      applicantFullName: 'John Doe',
      applicantRelationship: 'Son',
      applicantContact: JSON.stringify({ phone: '+254712345678', email: 'john@example.com' }),
      targetCourtJurisdiction: 'HIGH_COURT',
      targetCourtName: 'High Court of Kenya at Nairobi',
      courtStation: 'Nairobi',
      courtRegistry: null,
      estimatedProcessingDays: 180,
      status: 'DRAFT',
      priority: 'NORMAL',
      createdAt: now,
      estimatedFilingDate: null,
      estimatedGrantDate: null,
      filedAt: null,
      filingMethod: null,
      courtCaseNumber: null,
      courtFileNumber: null,
      courtReceiptNumber: null,
      filingFeeAmount: null,
      filingFeePaid: false,
      filingFeePaidAt: null,
      courtReviewDate: null,
      gazettePublishedDate: null,
      gazetteNoticeId: null,
      objectionDeadline: null,
      grantedDate: null,
      grantNumber: null,
      grantType: null,
      grantIssuedBy: null,
      rejectionReason: null,
      rejectionDate: null,
      amendmentsRequired: [],
      amendmentDeadline: null,
      withdrawnAt: null,
      withdrawalReason: null,
      totalFormsGenerated: 0,
      totalConsentsRequired: 0,
      daysInCurrentStatus: 0,
      lastStatusChangeAt: now,
      lastReviewedAt: null,
      lastReviewedBy: null,
      notes: null,
      internalNotes: null,
      version: 1,
      updatedAt: now,
    };

    return { ...base, ...overrides };
  }

  /**
   * Extract form IDs from application
   */
  public static extractFormIds(forms: any[]): string[] {
    return forms.map((form) => form.id);
  }

  /**
   * Extract consent IDs from application
   */
  public static extractConsentIds(consents: any[]): string[] {
    return consents.map((consent) => consent.id);
  }
}

// ==================== TYPE UTILITIES ====================

/**
 * Types for application operations
 */
export interface ProbateApplicationCreateData {
  estateId: string;
  readinessAssessmentId: string;
  applicantUserId: string;
  applicantFullName: string;
  applicantRelationship: string;
  targetCourtJurisdiction: string;
  targetCourtName: string;
  courtStation: string;
  applicationType: string;
  status: string;
  priority: string;
}

export interface ProbateApplicationUpdateData {
  status?: string;
  priority?: string;
  filedAt?: Date;
  courtCaseNumber?: string;
  filingFeePaid?: boolean;
  filingFeePaidAt?: Date;
  grantedDate?: Date;
  grantNumber?: string;
  rejectionReason?: string;
  amendmentsRequired?: string[];
  lastStatusChangeAt?: Date;
  version?: number;
}

/**
 * Types for application filtering
 */
export interface ProbateApplicationFilter {
  estateId?: string;
  applicantUserId?: string;
  status?: string[];
  applicationType?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  courtStation?: string;
  hasForms?: boolean;
  hasConsents?: boolean;
}

/**
 * Types for batch application operations
 */
export interface ProbateApplicationBatchOperation {
  create?: ProbateApplicationCreateData[];
  update?: {
    where: { id: string };
    data: ProbateApplicationUpdateData;
  }[];
  delete?: string[];
}

/**
 * Types for application statistics
 */
export interface ProbateApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  avgProcessingDays: number;
  successRate: number;
}
