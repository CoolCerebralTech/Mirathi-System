// apps/succession-automation-service/src/succession-automation.module.ts
import { Module } from '@nestjs/common';

// Shared Libraries
import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { ProbateFormService } from './application/services/probate-form.service';
import { RoadmapOrchestrationService } from './application/services/roadmap-orchestration.service';
// Application Services
import { SuccessionAssessmentService } from './application/services/succession-assessment.service';
import { LEGAL_GUIDE_REPO } from './domain/repositories/legal-guide.repository';
// Domain Repositories (Injection Tokens)
import { PROBATE_PREVIEW_REPO } from './domain/repositories/probate-preview.repository';
import { READINESS_ASSESSMENT_REPO } from './domain/repositories/readiness.repository';
import { EXECUTOR_ROADMAP_REPO } from './domain/repositories/roadmap.repository';
import { ProbateFormFactoryService } from './domain/services/probate-form-factory.service';
// Domain Services
import { ReadinessCalculatorService } from './domain/services/readiness-calculator.service';
import { RoadmapFactoryService } from './domain/services/roadmap-factory.service';
import { SuccessionContextFactoryService } from './domain/services/succession-context-factory.service';
import { SuccessionDistributionService } from './domain/services/succession-distribution.service';
// Infrastructure Adapters
import { DocumentServiceAdapter } from './infrastructure/adapters/document-service.adapter';
import { EstateServiceAdapter } from './infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from './infrastructure/adapters/family-service.adapter';
// Infrastructure Repositories (Prisma Implementations)
import { PrismaExecutorRoadmapRepository } from './infrastructure/repositories/prisma-executor-roadmap.repository';
import { PrismaLegalGuideRepository } from './infrastructure/repositories/prisma-legal-guide.repository';
import { PrismaProbatePreviewRepository } from './infrastructure/repositories/prisma-probate-preview.repository';
import { PrismaReadinessAssessmentRepository } from './infrastructure/repositories/prisma-readiness-assessment.repository';
import { ProbateTemplateService } from './infrastructure/templates/probate-template.service';
import { LegalGuidesController } from './presentation/controllers/legal-guides.controller';
import { ProbateFormsController } from './presentation/controllers/probate-forms.controller';
import { RoadmapController } from './presentation/controllers/roadmap.controller';
// Presentation Controllers
import { SuccessionAssessmentController } from './presentation/controllers/succession-assessment.controller';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DatabaseModule,
    // External Services
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'succession-automation-service',
      version: '1.0.0',
    }),
  ],
  controllers: [
    SuccessionAssessmentController,
    RoadmapController,
    ProbateFormsController,
    LegalGuidesController,
    HealthController,
  ],
  providers: [
    // ========================
    // APPLICATION SERVICES
    // ========================
    SuccessionAssessmentService,
    RoadmapOrchestrationService,
    ProbateFormService,

    // ========================
    // DOMAIN SERVICES (Pure Business Logic)
    // ========================
    ReadinessCalculatorService,
    RoadmapFactoryService,
    ProbateFormFactoryService,
    SuccessionDistributionService,
    SuccessionContextFactoryService,

    // ========================
    // INFRASTRUCTURE SERVICES
    // ========================
    ProbateTemplateService,

    // ========================
    // ADAPTERS (Anti-Corruption Layer)
    // ========================
    DocumentServiceAdapter,
    EstateServiceAdapter,
    FamilyServiceAdapter,

    // ========================
    // REPOSITORIES (Binding Interfaces to Prisma Implementations)
    // ========================
    {
      provide: READINESS_ASSESSMENT_REPO,
      useClass: PrismaReadinessAssessmentRepository,
    },
    {
      provide: EXECUTOR_ROADMAP_REPO,
      useClass: PrismaExecutorRoadmapRepository,
    },
    {
      provide: PROBATE_PREVIEW_REPO,
      useClass: PrismaProbatePreviewRepository,
    },
    {
      provide: LEGAL_GUIDE_REPO,
      useClass: PrismaLegalGuideRepository,
    },
  ],
  exports: [SuccessionAssessmentService, RoadmapOrchestrationService, ProbateFormService],
})
export class SuccessionAutomationModule {}
