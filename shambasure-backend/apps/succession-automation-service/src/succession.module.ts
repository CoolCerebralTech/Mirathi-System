import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// --- SHARED LIBS ---
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

// =============================================================================
// 1. HANDLERS: READINESS ASSESSMENT (Commands)
// =============================================================================
import {
  AcknowledgeWarningHandler,
  CompleteAssessmentHandler,
  DisputeRiskHandler,
  ForceRecalculationHandler,
  InitializeAssessmentHandler,
  OverrideStrategyHandler,
  ResolveRiskManuallyHandler,
  UpdateContextHandler,
  UpdateRiskMitigationHandler,
} from './application/readiness/commands/handlers';
import {
  I_DOCUMENT_SERVICE,
  I_ESTATE_SERVICE,
  I_FAMILY_SERVICE,
} from './application/readiness/interfaces/adapters.interface';
// =============================================================================
// 2. HANDLERS: READINESS ASSESSMENT (Queries)
// =============================================================================
import {
  FilterRisksHandler,
  GetAssessmentDashboardHandler,
  GetDocumentChecklistHandler,
  GetStrategyRoadmapHandler,
  SimulateScoreHandler,
} from './application/readiness/queries/handlers';
// =============================================================================
// 3. DOMAIN SERVICES
// =============================================================================
import { ComplianceRuleEngineService } from './application/readiness/services/compliance-rule-engine.service';
import { ContextAnalyzerService } from './application/readiness/services/context-analyzer.service';
import { GapAnalysisService } from './application/readiness/services/gap-analysis.service';
import { StrategyGeneratorService } from './application/readiness/services/strategy-generator.service';
// =============================================================================
// CONSTANTS & TOKENS
// =============================================================================
import { READINESS_ASSESSMENT_REPOSITORY } from './domain/repositories/i-readiness.repository';
import { DocumentServiceAdapter } from './infrastructure/adapters/document-service.adapter';
import { EstateServiceAdapter } from './infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from './infrastructure/adapters/family-service.adapter';
// =============================================================================
// MAPPERS
// =============================================================================
import { ExecutorRoadmapMapper } from './infrastructure/persistence/mappers/executor-roadmap.mapper';
import { FamilyConsentMapper } from './infrastructure/persistence/mappers/family-consent.mapper';
import { GeneratedFormMapper } from './infrastructure/persistence/mappers/generated-form.mapper';
import { ProbateApplicationMapper } from './infrastructure/persistence/mappers/probate-application.mapper';
import { ReadinessAssessmentMapper } from './infrastructure/persistence/mappers/readiness-assessment.mapper';
import { RiskFlagMapper } from './infrastructure/persistence/mappers/risk-flag.mapper';
import { RoadmapTaskMapper } from './infrastructure/persistence/mappers/roadmap-task.mapper';
// =============================================================================
// INFRASTRUCTURE (Repositories & Adapters)
// =============================================================================
import { PrismaReadinessRepository } from './infrastructure/persistence/repositories/prisma-readiness-assessment.repository';
import { HealthController } from './presentantion/health/health.controller';
// =============================================================================
// CONTROLLERS
// =============================================================================
import { ReadinessCommandController } from './presentantion/readiness/controllers/readiness.command.controller';
import { ReadinessQueryController } from './presentantion/readiness/controllers/readiness.query.controller';

// --- HANDLER ARRAYS ---

const ReadinessCommandHandlers = [
  InitializeAssessmentHandler,
  CompleteAssessmentHandler,
  ForceRecalculationHandler,
  UpdateContextHandler,
  DisputeRiskHandler,
  AcknowledgeWarningHandler,
  OverrideStrategyHandler,
  ResolveRiskManuallyHandler,
  UpdateRiskMitigationHandler,
];

const ReadinessQueryHandlers = [
  FilterRisksHandler,
  GetAssessmentDashboardHandler,
  GetDocumentChecklistHandler,
  GetStrategyRoadmapHandler,
  SimulateScoreHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    SharedAuthModule,
    MessagingModule.register({}),
    ObservabilityModule.register({ serviceName: 'succession-service', version: '1.0.0' }),
    NotificationModule,
  ],
  controllers: [HealthController, ReadinessCommandController, ReadinessQueryController],
  providers: [
    // --- 1. MAPPERS ---
    ReadinessAssessmentMapper,
    RiskFlagMapper,
    ExecutorRoadmapMapper,
    FamilyConsentMapper,
    GeneratedFormMapper,
    ProbateApplicationMapper,
    RoadmapTaskMapper,

    // --- 2. DOMAIN SERVICES ---
    ComplianceRuleEngineService,
    ContextAnalyzerService,
    GapAnalysisService,
    StrategyGeneratorService,

    // --- 3. REPOSITORIES ---
    PrismaReadinessRepository,
    {
      provide: READINESS_ASSESSMENT_REPOSITORY,
      useExisting: PrismaReadinessRepository,
    },

    // --- 4. EXTERNAL ADAPTERS ---
    DocumentServiceAdapter,
    EstateServiceAdapter,
    FamilyServiceAdapter,
    {
      provide: I_DOCUMENT_SERVICE,
      useExisting: DocumentServiceAdapter,
    },
    {
      provide: I_ESTATE_SERVICE,
      useExisting: EstateServiceAdapter,
    },
    {
      provide: I_FAMILY_SERVICE,
      useExisting: FamilyServiceAdapter,
    },

    // --- 5. CQRS HANDLERS ---
    ...ReadinessCommandHandlers,
    ...ReadinessQueryHandlers,
  ],
  exports: [READINESS_ASSESSMENT_REPOSITORY],
})
export class SuccessionModule {}
