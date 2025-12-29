// src/succession-automation/src/infrastructure/persistence/repositories/prisma-probate-application.repository.ts
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { ProbateApplication } from '../../../domain/aggregates/probate-application.aggregate';
import { FamilyConsent } from '../../../domain/entities/family-consent.entity';
import { GeneratedForm } from '../../../domain/entities/generated-form.entity';
import { FamilyConsentMapper } from '../mappers/family-consent.mapper';
import { GeneratedFormMapper } from '../mappers/generated-form.mapper';
import { ProbateApplicationMapper } from '../mappers/probate-application.mapper';

// Repository Interface
export const PROBATE_APPLICATION_REPOSITORY = 'PROBATE_APPLICATION_REPOSITORY';

export interface IProbateApplicationRepository {
  // Core CRUD
  save(application: ProbateApplication): Promise<void>;
  findById(id: string): Promise<ProbateApplication | null>;
  findByEstateId(estateId: string): Promise<ProbateApplication | null>;
  findByReadinessAssessmentId(readinessAssessmentId: string): Promise<ProbateApplication | null>;
  delete(id: string): Promise<void>;

  // Status Queries
  findByStatus(status: string): Promise<ProbateApplication[]>;
  findReadyToFile(): Promise<ProbateApplication[]>;
  findFiled(): Promise<ProbateApplication[]>;
  findWithPendingConsents(): Promise<ProbateApplication[]>;

  // Court Queries
  findByCourtCaseNumber(courtCaseNumber: string): Promise<ProbateApplication | null>;
  findByCourtJurisdiction(jurisdiction: string): Promise<ProbateApplication[]>;

  // Applicant Queries
  findByApplicantUserId(userId: string): Promise<ProbateApplication[]>;
  findByApplicantName(name: string): Promise<ProbateApplication[]>;

  // Statistics
  count(): Promise<number>;
  countByStatus(status: string): Promise<number>;
  getAverageProcessingDays(): Promise<number>;

  // Batch Operations
  saveAll(applications: ProbateApplication[]): Promise<void>;
  findByEstateIds(estateIds: string[]): Promise<ProbateApplication[]>;

  // Form Queries
  findFormById(formId: string): Promise<GeneratedForm | null>;
  findFormsByApplicationId(applicationId: string): Promise<GeneratedForm[]>;

  // Consent Queries
  findConsentById(consentId: string): Promise<FamilyConsent | null>;
  findConsentsByApplicationId(applicationId: string): Promise<FamilyConsent[]>;
  findConsentsByFamilyMemberId(familyMemberId: string): Promise<FamilyConsent[]>;

  // Timeline Queries
  findApplicationsDueForReview(): Promise<ProbateApplication[]>;
  findApplicationsNeedingGazettePublication(): Promise<ProbateApplication[]>;
  findApplicationsWithExpiredObjectionDeadlines(): Promise<ProbateApplication[]>;

  // Audit Queries
  findApplicationsModifiedBy(userId: string): Promise<ProbateApplication[]>;
  getApplicationHistory(applicationId: string): Promise<any[]>;
}

@Injectable()
export class PrismaProbateApplicationRepository implements IProbateApplicationRepository {
  private readonly logger = new Logger(PrismaProbateApplicationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(application: ProbateApplication): Promise<void> {
    try {
      const persistenceData = ProbateApplicationMapper.toPersistenceCreate(application);
      const applicationId = ProbateApplicationMapper.getPersistenceId(application);
      const version = ProbateApplicationMapper.getVersion(application);

      await this.prisma.$transaction(async (tx) => {
        if (applicationId) {
          // Update existing application
          await tx.probateApplication.update({
            where: {
              id: applicationId,
              version: version - 1, // Optimistic concurrency check
            },
            data: ProbateApplicationMapper.toPersistenceUpdate(application),
          });

          // Delete existing forms and consents
          await Promise.all([
            tx.generatedForm.deleteMany({
              where: { applicationId },
            }),
            tx.familyConsent.deleteMany({
              where: { applicationId },
            }),
          ]);
        } else {
          // Create new application
          await tx.probateApplication.create({
            data: persistenceData.application,
          });
        }

        // Create all forms
        if (persistenceData.forms.length > 0) {
          await tx.generatedForm.createMany({
            data: persistenceData.forms,
            skipDuplicates: true,
          });
        }

        // Create all consents
        if (persistenceData.consents.length > 0) {
          await tx.familyConsent.createMany({
            data: persistenceData.consents,
            skipDuplicates: true,
          });
        }
      });

      this.logger.debug(`Application saved: ${applicationId || 'new'}`);
    } catch (error) {
      this.logger.error(`Failed to save probate application: ${error.message}`, error.stack);
      throw new Error(`Failed to save probate application: ${error.message}`);
    }
  }

  async findById(id: string): Promise<ProbateApplication | null> {
    try {
      const application = await this.prisma.probateApplication.findUnique({
        where: { id },
      });

      if (!application) {
        return null;
      }

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({
          where: { applicationId: id },
        }),
        this.prisma.familyConsent.findMany({
          where: { applicationId: id },
        }),
      ]);

      return ProbateApplicationMapper.toDomain(application, forms, consents);
    } catch (error) {
      this.logger.error(`Failed to find application by id ${id}: ${error.message}`);
      throw new Error(`Failed to find probate application: ${error.message}`);
    }
  }

  async findByEstateId(estateId: string): Promise<ProbateApplication | null> {
    try {
      const application = await this.prisma.probateApplication.findFirst({
        where: { estateId },
      });

      if (!application) {
        return null;
      }

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({
          where: { applicationId: application.id },
        }),
        this.prisma.familyConsent.findMany({
          where: { applicationId: application.id },
        }),
      ]);

      return ProbateApplicationMapper.toDomain(application, forms, consents);
    } catch (error) {
      this.logger.error(`Failed to find application by estate ${estateId}: ${error.message}`);
      throw new Error(`Failed to find probate application by estate: ${error.message}`);
    }
  }

  async findByReadinessAssessmentId(
    readinessAssessmentId: string,
  ): Promise<ProbateApplication | null> {
    try {
      const application = await this.prisma.probateApplication.findFirst({
        where: { readinessAssessmentId },
      });

      if (!application) {
        return null;
      }

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({
          where: { applicationId: application.id },
        }),
        this.prisma.familyConsent.findMany({
          where: { applicationId: application.id },
        }),
      ]);

      return ProbateApplicationMapper.toDomain(application, forms, consents);
    } catch (error) {
      this.logger.error(
        `Failed to find application by readiness assessment ${readinessAssessmentId}: ${error.message}`,
      );
      throw new Error(
        `Failed to find probate application by readiness assessment: ${error.message}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.generatedForm.deleteMany({
          where: { applicationId: id },
        });

        await tx.familyConsent.deleteMany({
          where: { applicationId: id },
        });

        await tx.probateApplication.delete({
          where: { id },
        });
      });

      this.logger.debug(`Application deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete application ${id}: ${error.message}`);
      throw new Error(`Failed to delete probate application: ${error.message}`);
    }
  }

  // ==================== STATUS QUERIES ====================

  async findByStatus(status: string): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: { status },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications by status ${status}: ${error.message}`);
      throw new Error(`Failed to find applications by status: ${error.message}`);
    }
  }

  async findReadyToFile(): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: { status: 'READY_TO_FILE' },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find ready to file applications: ${error.message}`);
      throw new Error(`Failed to find ready to file applications: ${error.message}`);
    }
  }

  async findFiled(): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          status: {
            in: [
              'FILED',
              'COURT_REVIEW',
              'GAZETTE_PUBLISHED',
              'GRANTED',
              'REJECTED',
              'AMENDMENT_REQUIRED',
            ],
          },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find filed applications: ${error.message}`);
      throw new Error(`Failed to find filed applications: ${error.message}`);
    }
  }

  async findWithPendingConsents(): Promise<ProbateApplication[]> {
    try {
      // Find applications with pending consents
      const applicationIds = await this.prisma.$queryRaw<{ applicationId: string }[]>`
        SELECT DISTINCT fc."applicationId"
        FROM "FamilyConsent" fc
        WHERE fc.status = 'PENDING'
      `;

      if (applicationIds.length === 0) {
        return [];
      }

      const ids = applicationIds.map((r) => r.applicationId);
      const applications = await this.prisma.probateApplication.findMany({
        where: { id: { in: ids } },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications with pending consents: ${error.message}`);
      throw new Error(`Failed to find applications with pending consents: ${error.message}`);
    }
  }

  // ==================== COURT QUERIES ====================

  async findByCourtCaseNumber(courtCaseNumber: string): Promise<ProbateApplication | null> {
    try {
      const application = await this.prisma.probateApplication.findFirst({
        where: { courtCaseNumber },
      });

      if (!application) {
        return null;
      }

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({
          where: { applicationId: application.id },
        }),
        this.prisma.familyConsent.findMany({
          where: { applicationId: application.id },
        }),
      ]);

      return ProbateApplicationMapper.toDomain(application, forms, consents);
    } catch (error) {
      this.logger.error(
        `Failed to find application by court case number ${courtCaseNumber}: ${error.message}`,
      );
      throw new Error(`Failed to find application by court case number: ${error.message}`);
    }
  }

  async findByCourtJurisdiction(jurisdiction: string): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: { targetCourtJurisdiction: jurisdiction },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(
        `Failed to find applications by jurisdiction ${jurisdiction}: ${error.message}`,
      );
      throw new Error(`Failed to find applications by jurisdiction: ${error.message}`);
    }
  }

  // ==================== APPLICANT QUERIES ====================

  async findByApplicantUserId(userId: string): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: { applicantUserId: userId },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(
        `Failed to find applications by applicant user ${userId}: ${error.message}`,
      );
      throw new Error(`Failed to find applications by applicant: ${error.message}`);
    }
  }

  async findByApplicantName(name: string): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          applicantFullName: {
            contains: name,
            mode: 'insensitive',
          },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications by applicant name ${name}: ${error.message}`);
      throw new Error(`Failed to find applications by applicant name: ${error.message}`);
    }
  }

  // ==================== STATISTICS ====================

  async count(): Promise<number> {
    try {
      return await this.prisma.probateApplication.count();
    } catch (error) {
      this.logger.error(`Failed to count applications: ${error.message}`);
      throw new Error(`Failed to count applications: ${error.message}`);
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      return await this.prisma.probateApplication.count({
        where: { status },
      });
    } catch (error) {
      this.logger.error(`Failed to count applications by status ${status}: ${error.message}`);
      throw new Error(`Failed to count applications by status: ${error.message}`);
    }
  }

  async getAverageProcessingDays(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<{ avg_days: number }[]>`
        SELECT AVG(
          CASE 
            WHEN "grantedDate" IS NOT NULL 
            THEN EXTRACT(DAY FROM ("grantedDate" - "filedAt"))
            ELSE EXTRACT(DAY FROM (NOW() - "filedAt"))
          END
        ) as avg_days
        FROM "ProbateApplication"
        WHERE "filedAt" IS NOT NULL
      `;

      return result[0]?.avg_days || 0;
    } catch (error) {
      this.logger.error(`Failed to get average processing days: ${error.message}`);
      throw new Error(`Failed to get average processing days: ${error.message}`);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(applications: ProbateApplication[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const application of applications) {
          const persistenceData = ProbateApplicationMapper.toPersistenceCreate(application);
          const applicationId = ProbateApplicationMapper.getPersistenceId(application);
          const version = ProbateApplicationMapper.getVersion(application);

          if (applicationId) {
            // Update existing
            await tx.probateApplication.update({
              where: {
                id: applicationId,
                version: version - 1,
              },
              data: ProbateApplicationMapper.toPersistenceUpdate(application),
            });

            // Delete existing forms and consents
            await Promise.all([
              tx.generatedForm.deleteMany({
                where: { applicationId },
              }),
              tx.familyConsent.deleteMany({
                where: { applicationId },
              }),
            ]);
          } else {
            // Create new
            await tx.probateApplication.create({
              data: persistenceData.application,
            });
          }

          // Create forms
          if (persistenceData.forms.length > 0) {
            await tx.generatedForm.createMany({
              data: persistenceData.forms,
              skipDuplicates: true,
            });
          }

          // Create consents
          if (persistenceData.consents.length > 0) {
            await tx.familyConsent.createMany({
              data: persistenceData.consents,
              skipDuplicates: true,
            });
          }
        }
      });

      this.logger.debug(`Batch saved ${applications.length} applications`);
    } catch (error) {
      this.logger.error(`Failed to save batch of applications: ${error.message}`);
      throw new Error(`Failed to save applications batch: ${error.message}`);
    }
  }

  async findByEstateIds(estateIds: string[]): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          estateId: { in: estateIds },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications by estate IDs: ${error.message}`);
      throw new Error(`Failed to find applications by estate IDs: ${error.message}`);
    }
  }

  // ==================== FORM QUERIES ====================

  async findFormById(formId: string): Promise<GeneratedForm | null> {
    try {
      const form = await this.prisma.generatedForm.findUnique({
        where: { id: formId },
      });

      if (!form) {
        return null;
      }

      return GeneratedFormMapper.toDomain(form);
    } catch (error) {
      this.logger.error(`Failed to find form by id ${formId}: ${error.message}`);
      throw new Error(`Failed to find form: ${error.message}`);
    }
  }

  async findFormsByApplicationId(applicationId: string): Promise<GeneratedForm[]> {
    try {
      const forms = await this.prisma.generatedForm.findMany({
        where: { applicationId },
      });

      return GeneratedFormMapper.toDomainArray(forms);
    } catch (error) {
      this.logger.error(`Failed to find forms by application ${applicationId}: ${error.message}`);
      throw new Error(`Failed to find forms: ${error.message}`);
    }
  }

  // ==================== CONSENT QUERIES ====================

  async findConsentById(consentId: string): Promise<FamilyConsent | null> {
    try {
      const consent = await this.prisma.familyConsent.findUnique({
        where: { id: consentId },
      });

      if (!consent) {
        return null;
      }

      return FamilyConsentMapper.toDomain(consent);
    } catch (error) {
      this.logger.error(`Failed to find consent by id ${consentId}: ${error.message}`);
      throw new Error(`Failed to find consent: ${error.message}`);
    }
  }

  async findConsentsByApplicationId(applicationId: string): Promise<FamilyConsent[]> {
    try {
      const consents = await this.prisma.familyConsent.findMany({
        where: { applicationId },
      });

      return FamilyConsentMapper.toDomainArray(consents);
    } catch (error) {
      this.logger.error(
        `Failed to find consents by application ${applicationId}: ${error.message}`,
      );
      throw new Error(`Failed to find consents: ${error.message}`);
    }
  }

  async findConsentsByFamilyMemberId(familyMemberId: string): Promise<FamilyConsent[]> {
    try {
      const consents = await this.prisma.familyConsent.findMany({
        where: { familyMemberId },
      });

      return FamilyConsentMapper.toDomainArray(consents);
    } catch (error) {
      this.logger.error(
        `Failed to find consents by family member ${familyMemberId}: ${error.message}`,
      );
      throw new Error(`Failed to find consents by family member: ${error.message}`);
    }
  }

  // ==================== TIMELINE QUERIES ====================

  async findApplicationsDueForReview(): Promise<ProbateApplication[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const applications = await this.prisma.probateApplication.findMany({
        where: {
          status: {
            in: ['UNDER_REVIEW', 'PENDING_SIGNATURES', 'PENDING_CONSENTS', 'PENDING_FEE'],
          },
          lastReviewedAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications due for review: ${error.message}`);
      throw new Error(`Failed to find applications due for review: ${error.message}`);
    }
  }

  async findApplicationsNeedingGazettePublication(): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          status: 'COURT_REVIEW',
          courtReviewDate: {
            lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Older than 14 days
          },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(
        `Failed to find applications needing gazette publication: ${error.message}`,
      );
      throw new Error(`Failed to find applications needing gazette publication: ${error.message}`);
    }
  }

  async findApplicationsWithExpiredObjectionDeadlines(): Promise<ProbateApplication[]> {
    try {
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          status: 'GAZETTE_PUBLISHED',
          objectionDeadline: {
            lt: new Date(),
          },
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(
        `Failed to find applications with expired objection deadlines: ${error.message}`,
      );
      throw new Error(
        `Failed to find applications with expired objection deadlines: ${error.message}`,
      );
    }
  }

  // ==================== AUDIT QUERIES ====================

  async findApplicationsModifiedBy(userId: string): Promise<ProbateApplication[]> {
    try {
      // Assuming we track lastModifiedBy field
      const applications = await this.prisma.probateApplication.findMany({
        where: {
          lastReviewedBy: userId,
        },
      });

      return await this.loadApplicationsWithChildren(applications);
    } catch (error) {
      this.logger.error(`Failed to find applications modified by user ${userId}: ${error.message}`);
      throw new Error(`Failed to find applications modified by user: ${error.message}`);
    }
  }

  async getApplicationHistory(applicationId: string): Promise<any[]> {
    try {
      // This would typically query an event store
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error(`Failed to get application history: ${error.message}`);
      throw new Error(`Failed to get application history: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async loadApplicationsWithChildren(applications: any[]): Promise<ProbateApplication[]> {
    if (!applications || applications.length === 0) {
      return [];
    }

    const applicationIds = applications.map((a) => a.id);

    const [allForms, allConsents] = await Promise.all([
      this.prisma.generatedForm.findMany({
        where: {
          applicationId: { in: applicationIds },
        },
      }),
      this.prisma.familyConsent.findMany({
        where: {
          applicationId: { in: applicationIds },
        },
      }),
    ]);

    // Group forms and consents by application ID
    const formsByApplicationId = allForms.reduce(
      (acc, form) => {
        if (!acc[form.applicationId]) {
          acc[form.applicationId] = [];
        }
        acc[form.applicationId].push(form);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    const consentsByApplicationId = allConsents.reduce(
      (acc, consent) => {
        if (!acc[consent.applicationId]) {
          acc[consent.applicationId] = [];
        }
        acc[consent.applicationId].push(consent);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Map to domain aggregates
    const domainApplications: ProbateApplication[] = [];

    for (const application of applications) {
      try {
        const forms = formsByApplicationId[application.id] || [];
        const consents = consentsByApplicationId[application.id] || [];
        const domainApplication = ProbateApplicationMapper.toDomain(application, forms, consents);
        domainApplications.push(domainApplication);
      } catch (error) {
        this.logger.warn(`Failed to convert application ${application.id}: ${error.message}`);
        // Skip invalid applications
      }
    }

    return domainApplications;
  }

  // ==================== TRANSACTION SUPPORT ====================

  /**
   * Execute operation within transaction
   */
  async withTransaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Get raw Prisma client for complex operations
   */
  getPrismaClient() {
    return this.prisma;
  }
}

// ==================== FACTORY FOR DEPENDENCY INJECTION ====================

export const PrismaProbateApplicationRepositoryProvider = {
  provide: PROBATE_APPLICATION_REPOSITORY,
  useClass: PrismaProbateApplicationRepository,
};

// ==================== HEALTH CHECK ====================

export interface ProbateRepositoryHealth {
  isConnected: boolean;
  applicationCount: number;
  formCount: number;
  consentCount: number;
  lastOperation: Date;
}

export async function checkProbateRepositoryHealth(
  prisma: PrismaService,
): Promise<ProbateRepositoryHealth> {
  try {
    const [applicationCount, formCount, consentCount] = await Promise.all([
      prisma.probateApplication.count(),
      prisma.generatedForm.count(),
      prisma.familyConsent.count(),
    ]);

    return {
      isConnected: true,
      applicationCount,
      formCount,
      consentCount,
      lastOperation: new Date(),
    };
  } catch (error) {
    return {
      isConnected: false,
      applicationCount: 0,
      formCount: 0,
      consentCount: 0,
      lastOperation: new Date(),
    };
  }
}
