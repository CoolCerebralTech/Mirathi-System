import { Module } from '@nestjs/common';

// Shared Libraries
import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AssessmentService } from './application/services/assessment.service';
import { ProbateService } from './application/services/probate.service';
import { RoadmapService } from './application/services/roadmap.service';
import { PROBATE_PREVIEW_REPO } from './domian/repositories/probate-preview.repository';
import { READINESS_ASSESSMENT_REPO } from './domian/repositories/readiness.repository';
import { EXECUTOR_ROADMAP_REPO } from './domian/repositories/roadmap.repository';
import { ProbateFormFactoryService } from './domian/services/probate-form-factory.service';
import { ReadinessCalculatorService } from './domian/services/readiness-calculator.service';
import { RoadmapFactoryService } from './domian/services/roadmap-factory.service';
import { DocumentServiceAdapter } from './infrastructure/adapters/document-service.adapter';
import { EstateServiceAdapter } from './infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from './infrastructure/adapters/family-service.adapter';
import { PrismaExecutorRoadmapRepository } from './infrastructure/repositories/prisma-executor-roadmap.repository';
import { PrismaReadinessAssessmentRepository } from './infrastructure/repositories/prisma-readiness-assessment.repository';
import { ProbateTemplateService } from './infrastructure/templates/probate-template.service';
// --- PRESENTATION (Controllers) ---
import { AssessmentController } from './presentation/controllers/assessment.controller';
import { ProbateController } from './presentation/controllers/probate.controller';
import { RoadmapController } from './presentation/controllers/roadmap.controller';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DatabaseModule,
    // External Services
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'succession-service',
      version: '2.0.0',
    }),
  ],
  controllers: [AssessmentController, RoadmapController, ProbateController, HealthController],
  providers: [
    // 1. Application Services
    AssessmentService,
    RoadmapService,
    ProbateService,

    // 2. Domain Logic Services (Pure)
    ReadinessCalculatorService,
    RoadmapFactoryService,
    ProbateFormFactoryService,

    // 3. Infrastructure Services
    ProbateTemplateService,

    // 4. Adapters (Anti-Corruption Layer)
    EstateServiceAdapter,
    FamilyServiceAdapter,
    DocumentServiceAdapter,

    // 5. Repositories (Binding Interfaces to Prisma Implementations)
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
  ],
  exports: [AssessmentService, RoadmapService, ProbateService],
})
export class SuccessionModule {}
