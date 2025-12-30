// src/succession-automation/src/infrastructure/persistence/repositories/prisma-probate-application.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ApplicationStatus as PrismaApplicationStatus,
  ProbateApplicationType as PrismaApplicationType,
  ConsentStatus as PrismaConsentStatus,
  FamilyConsent as PrismaFamilyConsentModelType,
  FilingPriority as PrismaFilingPriority,
  FormStatus as PrismaFormStatus,
  GeneratedForm as PrismaGeneratedFormModelType,
  ProbateApplication as PrismaProbateApplicationModelType,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

import {
  ApplicationStatus,
  FilingPriority,
  ProbateApplication,
  ProbateApplicationType,
} from '../../../domain/aggregates/probate-application.aggregate';
import { FamilyConsent } from '../../../domain/entities/family-consent.entity';
import { GeneratedForm } from '../../../domain/entities/generated-form.entity';
import {
  IProbateApplicationRepository,
  PaginatedResult,
  RepositoryQueryOptions,
} from '../../../domain/repositories/i-probate-application.repository';
import { FamilyConsentMapper, PrismaFamilyConsentModel } from '../mappers/family-consent.mapper';
import { GeneratedFormMapper, PrismaGeneratedFormModel } from '../mappers/generated-form.mapper';
import {
  PrismaProbateApplicationModel,
  ProbateApplicationMapper,
} from '../mappers/probate-application.mapper';

@Injectable()
export class PrismaProbateApplicationRepository implements IProbateApplicationRepository {
  private readonly logger = new Logger(PrismaProbateApplicationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CORE CRUD OPERATIONS ====================

  async save(application: ProbateApplication): Promise<void> {
    try {
      const {
        application: appData,
        forms: formsData,
        consents: consentsData,
      } = ProbateApplicationMapper.toPersistence(application);

      const appId = application.id.toString();
      const version = application.version;

      await this.prisma.$transaction(async (tx) => {
        // 1. Check Existence & Concurrency
        const existing = await tx.probateApplication.findUnique({
          where: { id: appId },
          select: { version: true },
        });

        if (existing) {
          if (existing.version !== version - 1 && version > 1) {
            throw new Error(
              `Concurrency conflict: Application ${appId} modified. Expected v${version - 1}, found v${existing.version}`,
            );
          }

          // Update Root
          await tx.probateApplication.update({
            where: { id: appId },
            data: appData as Prisma.ProbateApplicationUpdateInput,
          });

          // --- Handle Forms (Child Collection) ---
          const currentFormIds = formsData.map((f) => f.id);
          // Delete orphans
          await tx.generatedForm.deleteMany({
            where: {
              applicationId: appId,
              id: { notIn: currentFormIds },
            },
          });
          // Upsert current
          for (const form of formsData) {
            await tx.generatedForm.upsert({
              where: { id: form.id },
              update: form as Prisma.GeneratedFormUpdateInput,
              create: form as Prisma.GeneratedFormCreateInput,
            });
          }

          // --- Handle Consents (Child Collection) ---
          const currentConsentIds = consentsData.map((c) => c.id);
          // Delete orphans
          await tx.familyConsent.deleteMany({
            where: {
              applicationId: appId,
              id: { notIn: currentConsentIds },
            },
          });
          // Upsert current
          for (const consent of consentsData) {
            await tx.familyConsent.upsert({
              where: { id: consent.id },
              update: consent as Prisma.FamilyConsentUpdateInput,
              create: consent as Prisma.FamilyConsentCreateInput,
            });
          }
        } else {
          // Create New Aggregate
          await tx.probateApplication.create({
            data: {
              ...(appData as Prisma.ProbateApplicationCreateInput),
              generatedForms: {
                create: formsData as Prisma.GeneratedFormCreateManyInput[],
              },
              familyConsents: {
                create: consentsData as Prisma.FamilyConsentCreateManyInput[],
              },
            },
          });
        }
      });

      this.logger.debug(`[ProbateRepo] Saved application ${appId} v${version}`);
    } catch (error) {
      this.logger.error(`Failed to save probate application: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<ProbateApplication | null> {
    try {
      const appModel = await this.prisma.probateApplication.findUnique({
        where: { id },
      });

      if (!appModel) return null;

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({ where: { applicationId: id } }),
        this.prisma.familyConsent.findMany({ where: { applicationId: id } }),
      ]);

      return ProbateApplicationMapper.toDomain(
        appModel as unknown as PrismaProbateApplicationModel,
        forms as unknown as PrismaGeneratedFormModel[],
        consents as unknown as PrismaFamilyConsentModel[],
      );
    } catch (error) {
      this.logger.error(`Error finding application ${id}: ${error.message}`);
      throw error;
    }
  }

  async findByEstateId(estateId: string): Promise<ProbateApplication | null> {
    try {
      const appModel = await this.prisma.probateApplication.findFirst({
        where: { estateId },
      });

      if (!appModel) return null;

      const [forms, consents] = await Promise.all([
        this.prisma.generatedForm.findMany({ where: { applicationId: appModel.id } }),
        this.prisma.familyConsent.findMany({ where: { applicationId: appModel.id } }),
      ]);

      return ProbateApplicationMapper.toDomain(
        appModel as unknown as PrismaProbateApplicationModel,
        forms as unknown as PrismaGeneratedFormModel[],
        consents as unknown as PrismaFamilyConsentModel[],
      );
    } catch (error) {
      this.logger.error(`Error finding application for estate ${estateId}: ${error.message}`);
      throw error;
    }
  }

  async findByReadinessAssessmentId(
    readinessAssessmentId: string,
  ): Promise<ProbateApplication | null> {
    const appModel = await this.prisma.probateApplication.findFirst({
      where: { readinessAssessmentId },
    });

    if (!appModel) return null;
    return this.findById(appModel.id);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Cascading delete is mostly handled by DB foreign keys,
      // but explicit delete ensures application logic is followed.
      await tx.generatedForm.deleteMany({ where: { applicationId: id } });
      await tx.familyConsent.deleteMany({ where: { applicationId: id } });
      await tx.probateApplication.delete({ where: { id } });
    });
  }

  // ==================== STATUS QUERIES ====================

  async findByStatus(status: ApplicationStatus): Promise<ProbateApplication[]> {
    const prismaStatus = status as unknown as PrismaApplicationStatus;
    const apps = await this.prisma.probateApplication.findMany({
      where: { status: prismaStatus },
    });
    return this.loadAggregates(apps);
  }

  async findByType(applicationType: ProbateApplicationType): Promise<ProbateApplication[]> {
    const prismaType = applicationType as unknown as PrismaApplicationType;
    const apps = await this.prisma.probateApplication.findMany({
      where: { applicationType: prismaType },
    });
    return this.loadAggregates(apps);
  }

  async findByPriority(priority: FilingPriority): Promise<ProbateApplication[]> {
    const prismaPriority = priority as unknown as PrismaFilingPriority;
    const apps = await this.prisma.probateApplication.findMany({
      where: { priority: prismaPriority },
    });
    return this.loadAggregates(apps);
  }

  async findReadyToFile(): Promise<ProbateApplication[]> {
    return this.findByStatus(ApplicationStatus.READY_TO_FILE);
  }

  async findFiled(): Promise<ProbateApplication[]> {
    return this.findByStatus(ApplicationStatus.FILED);
  }

  async findGranted(): Promise<ProbateApplication[]> {
    return this.findByStatus(ApplicationStatus.GRANTED);
  }

  async findWithPendingConsents(): Promise<ProbateApplication[]> {
    return this.findByStatus(ApplicationStatus.PENDING_CONSENTS);
  }

  async findWithPendingForms(): Promise<ProbateApplication[]> {
    return this.findByStatus(ApplicationStatus.PENDING_FORMS);
  }

  // ==================== COURT QUERIES ====================

  async findByCourtCaseNumber(courtCaseNumber: string): Promise<ProbateApplication | null> {
    const appModel = await this.prisma.probateApplication.findFirst({
      where: { courtCaseNumber },
    });
    return appModel ? this.findById(appModel.id) : null;
  }

  async findByCourtJurisdiction(jurisdiction: string): Promise<ProbateApplication[]> {
    // jurisdiction is stored as enum string in schema
    const apps = await this.prisma.probateApplication.findMany({
      where: { targetCourtJurisdiction: jurisdiction as any }, // Cast to enum if needed
    });
    return this.loadAggregates(apps);
  }

  async findByCourtStation(station: string): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: { courtStation: station },
    });
    return this.loadAggregates(apps);
  }

  // ==================== APPLICANT QUERIES ====================

  async findByApplicantUserId(userId: string): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: { applicantUserId: userId },
    });
    return this.loadAggregates(apps);
  }

  async findByApplicantName(name: string): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        applicantFullName: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
    return this.loadAggregates(apps);
  }

  // ==================== TIMELINE QUERIES ====================

  async findApplicationsDueForReview(): Promise<ProbateApplication[]> {
    const cutoff = new Date();
    // Assuming review due if no status change in 14 days for certain statuses
    cutoff.setDate(cutoff.getDate() - 14);

    const apps = await this.prisma.probateApplication.findMany({
      where: {
        lastStatusChangeAt: { lt: cutoff },
        status: {
          in: [PrismaApplicationStatus.PENDING_FORMS, PrismaApplicationStatus.PENDING_CONSENTS],
        },
      },
    });
    return this.loadAggregates(apps);
  }

  async findApplicationsNeedingGazettePublication(): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: { status: PrismaApplicationStatus.COURT_REVIEW },
    });
    return this.loadAggregates(apps);
  }

  async findApplicationsWithExpiredObjectionDeadlines(): Promise<ProbateApplication[]> {
    const now = new Date();
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        status: PrismaApplicationStatus.GAZETTE_PUBLISHED,
        objectionDeadline: { lt: now },
      },
    });
    return this.loadAggregates(apps);
  }

  async findStaleApplications(staleDays: number): Promise<ProbateApplication[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - staleDays);

    const apps = await this.prisma.probateApplication.findMany({
      where: {
        updatedAt: { lt: cutoff },
        status: {
          notIn: [
            PrismaApplicationStatus.GRANTED,
            PrismaApplicationStatus.ABANDONED,
            PrismaApplicationStatus.WITHDRAWN,
          ],
        },
      },
    });
    return this.loadAggregates(apps);
  }

  // ==================== STATISTICS ====================

  async count(): Promise<number> {
    return await this.prisma.probateApplication.count();
  }

  async countByStatus(status: ApplicationStatus): Promise<number> {
    const prismaStatus = status as unknown as PrismaApplicationStatus;
    return await this.prisma.probateApplication.count({
      where: { status: prismaStatus },
    });
  }

  async countByType(applicationType: ProbateApplicationType): Promise<number> {
    const prismaType = applicationType as unknown as PrismaApplicationType;
    return await this.prisma.probateApplication.count({
      where: { applicationType: prismaType },
    });
  }

  async getAverageProcessingDays(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ avg_days: number }[]>`
      SELECT AVG(EXTRACT(DAY FROM ("grantedDate" - "filedAt"))) as avg_days
      FROM "probate_applications"
      WHERE status = 'GRANTED'
      AND "grantedDate" IS NOT NULL
      AND "filedAt" IS NOT NULL
    `;
    return Math.round(Number(result[0]?.avg_days || 0));
  }

  async getGrantSuccessRate(): Promise<number> {
    const [granted, total] = await Promise.all([
      this.prisma.probateApplication.count({ where: { status: PrismaApplicationStatus.GRANTED } }),
      this.prisma.probateApplication.count({
        where: {
          status: {
            notIn: [PrismaApplicationStatus.DRAFT, PrismaApplicationStatus.ABANDONED],
          },
        },
      }),
    ]);

    if (total === 0) return 0;
    return (granted / total) * 100;
  }

  // ==================== BATCH OPERATIONS ====================

  async saveAll(applications: ProbateApplication[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const app of applications) {
        // Reuse internal save logic within the loop (simplified here)
        // In a real optimized scenario, we would use createMany for roots, but aggregates have deep structures.
        // Sequential saving inside a transaction is safer for Aggregates.
        const { application, forms, consents } = ProbateApplicationMapper.toPersistence(app);

        await tx.probateApplication.upsert({
          where: { id: app.id.toString() },
          update: application as Prisma.ProbateApplicationUpdateInput,
          create: application as Prisma.ProbateApplicationCreateInput,
        });

        // Sync children (simplified for batch)
        if (forms.length > 0) {
          await tx.generatedForm.deleteMany({ where: { applicationId: app.id.toString() } });
          await tx.generatedForm.createMany({ data: forms });
        }
        if (consents.length > 0) {
          await tx.familyConsent.deleteMany({ where: { applicationId: app.id.toString() } });
          await tx.familyConsent.createMany({ data: consents });
        }
      }
    });
  }

  async findByEstateIds(estateIds: string[]): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: { estateId: { in: estateIds } },
    });
    return this.loadAggregates(apps);
  }

  // ==================== FORM QUERIES ====================

  async findFormById(formId: string): Promise<GeneratedForm | null> {
    const model = await this.prisma.generatedForm.findUnique({
      where: { id: formId },
    });
    return model
      ? GeneratedFormMapper.toDomain(model as unknown as PrismaGeneratedFormModel)
      : null;
  }

  async findFormsByApplicationId(applicationId: string): Promise<GeneratedForm[]> {
    const models = await this.prisma.generatedForm.findMany({
      where: { applicationId },
    });
    return GeneratedFormMapper.toDomainArray(models as unknown as PrismaGeneratedFormModel[]);
  }

  async findFormsByType(formType: string): Promise<GeneratedForm[]> {
    // Requires mapping string to Enum if needed
    const models = await this.prisma.generatedForm.findMany({
      where: { formType: formType as any },
    });
    return GeneratedFormMapper.toDomainArray(models as unknown as PrismaGeneratedFormModel[]);
  }

  async findFormsRequiringSignatures(): Promise<GeneratedForm[]> {
    const models = await this.prisma.generatedForm.findMany({
      where: {
        status: { in: [PrismaFormStatus.APPROVED, PrismaFormStatus.SIGNATURE_PENDING] },
        isFullySigned: false,
      },
    });
    return GeneratedFormMapper.toDomainArray(models as unknown as PrismaGeneratedFormModel[]);
  }

  // ==================== CONSENT QUERIES ====================

  async findConsentById(consentId: string): Promise<FamilyConsent | null> {
    const model = await this.prisma.familyConsent.findUnique({
      where: { id: consentId },
    });
    return model
      ? FamilyConsentMapper.toDomain(model as unknown as PrismaFamilyConsentModel)
      : null;
  }

  async findConsentsByApplicationId(applicationId: string): Promise<FamilyConsent[]> {
    const models = await this.prisma.familyConsent.findMany({
      where: { applicationId },
    });
    return FamilyConsentMapper.toDomainArray(models as unknown as PrismaFamilyConsentModel[]);
  }

  async findConsentsByFamilyMemberId(familyMemberId: string): Promise<FamilyConsent[]> {
    const models = await this.prisma.familyConsent.findMany({
      where: { familyMemberId },
    });
    return FamilyConsentMapper.toDomainArray(models as unknown as PrismaFamilyConsentModel[]);
  }

  async findConsentsByStatus(status: string): Promise<FamilyConsent[]> {
    const models = await this.prisma.familyConsent.findMany({
      where: { status: status as PrismaConsentStatus },
    });
    return FamilyConsentMapper.toDomainArray(models as unknown as PrismaFamilyConsentModel[]);
  }

  // ==================== PAGINATION SUPPORT ====================

  async findAllPaginated(
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ProbateApplication>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.ProbateApplicationOrderByWithRelationInput = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.probateApplication.count(),
      this.prisma.probateApplication.findMany({ skip, take: limit, orderBy }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return { items: domainItems, total, page, pages: Math.ceil(total / limit), limit };
  }

  async findByStatusPaginated(
    status: ApplicationStatus,
    options: RepositoryQueryOptions,
  ): Promise<PaginatedResult<ProbateApplication>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const prismaStatus = status as unknown as PrismaApplicationStatus;

    const where: Prisma.ProbateApplicationWhereInput = { status: prismaStatus };
    const orderBy: Prisma.ProbateApplicationOrderByWithRelationInput = options.sortBy
      ? { [options.sortBy]: options.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      this.prisma.probateApplication.count({ where }),
      this.prisma.probateApplication.findMany({ where, skip, take: limit, orderBy }),
    ]);

    const domainItems = await this.loadAggregates(items);

    return { items: domainItems, total, page, pages: Math.ceil(total / limit), limit };
  }

  // ==================== ADVANCED / AUDIT ====================

  async findApplicationsByRegime(regime: string): Promise<ProbateApplication[]> {
    // Querying the Json column 'successionContext'
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        successionContext: {
          path: ['regime'],
          equals: regime,
        },
      },
    });
    return this.loadAggregates(apps);
  }

  async findApplicationsModifiedBy(_userId: string): Promise<ProbateApplication[]> {
    // Placeholder - schema would need explicit tracking or audit table query
    await Promise.resolve();
    return [];
  }

  async getApplicationHistory(_applicationId: string): Promise<any[]> {
    // Placeholder
    await Promise.resolve();
    return [];
  }

  async findApplicationsWithMinorInvolved(): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        successionContext: {
          path: ['isMinorInvolved'],
          equals: true,
        },
      },
    });
    return this.loadAggregates(apps);
  }

  async findApplicationsWithBusinessAssets(): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        successionContext: {
          path: ['isBusinessAssetsInvolved'],
          equals: true,
        },
      },
    });
    return this.loadAggregates(apps);
  }

  async findApplicationsWithForeignAssets(): Promise<ProbateApplication[]> {
    const apps = await this.prisma.probateApplication.findMany({
      where: {
        successionContext: {
          path: ['isForeignAssetsInvolved'],
          equals: true,
        },
      },
    });
    return this.loadAggregates(apps);
  }

  // ==================== HELPER METHODS ====================

  private async loadAggregates(
    appModels: PrismaProbateApplicationModelType[],
  ): Promise<ProbateApplication[]> {
    if (appModels.length === 0) return [];

    const appIds = appModels.map((a) => a.id);

    // Fetch related data in batch
    const [forms, consents] = await Promise.all([
      this.prisma.generatedForm.findMany({ where: { applicationId: { in: appIds } } }),
      this.prisma.familyConsent.findMany({ where: { applicationId: { in: appIds } } }),
    ]);

    // Group by Application ID
    const formsMap = new Map<string, PrismaGeneratedFormModelType[]>();
    forms.forEach((f) => {
      const existing = formsMap.get(f.applicationId) || [];
      existing.push(f);
      formsMap.set(f.applicationId, existing);
    });

    const consentsMap = new Map<string, PrismaFamilyConsentModelType[]>();
    consents.forEach((c) => {
      const existing = consentsMap.get(c.applicationId) || [];
      existing.push(c);
      consentsMap.set(c.applicationId, existing);
    });

    // Reconstitute
    return appModels.map((model) => {
      const relatedForms = formsMap.get(model.id) || [];
      const relatedConsents = consentsMap.get(model.id) || [];

      return ProbateApplicationMapper.toDomain(
        model as unknown as PrismaProbateApplicationModel,
        relatedForms as unknown as PrismaGeneratedFormModel[],
        relatedConsents as unknown as PrismaFamilyConsentModel[],
      );
    });
  }
}
