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
// 5. DOMAIN & APPLICATION SERVICES
// =============================================================================
// Readiness
import { ComplianceRuleEngineService } from './application/readiness/services/compliance-rule-engine.service';
import { ContextAnalyzerService } from './application/readiness/services/context-analyzer.service';
import { GapAnalysisService } from './application/readiness/services/gap-analysis.service';
import { StrategyGeneratorService } from './application/readiness/services/strategy-generator.service';
// =============================================================================
// 3. HANDLERS: EXECUTOR ROADMAP (Commands)
// =============================================================================
import { GenerateRoadmapHandler } from './application/roadmap/commands/handlers/generate-roadmap.handler';
import { OptimizeRoadmapHandler } from './application/roadmap/commands/handlers/optimization.handlers';
import { TransitionPhaseHandler } from './application/roadmap/commands/handlers/phase.handlers';
import { LinkRiskToTaskHandler } from './application/roadmap/commands/handlers/risk.handlers';
import {
  SkipTaskHandler,
  StartTaskHandler,
  SubmitTaskProofHandler,
} from './application/roadmap/commands/handlers/task-execution.handlers';
// =============================================================================
// 4. HANDLERS: EXECUTOR ROADMAP (Queries)
// =============================================================================
import {
  GetCriticalPathHandler,
  GetRoadmapAnalyticsHandler,
  GetRoadmapDashboardHandler,
} from './application/roadmap/queries/handlers/dashboard.handlers';
import {
  GetTaskDetailsHandler,
  GetTaskHistoryHandler,
  GetTaskListHandler,
} from './application/roadmap/queries/handlers/task.handlers';
// Roadmap (Smart Navigation & Automation)
import { CriticalPathEngineService } from './application/roadmap/services/smart-navigation/critical-path-engine.service';
import { EfficiencyScorerService } from './application/roadmap/services/smart-navigation/efficiency-scorer.service';
import { PredictiveAnalysisService } from './application/roadmap/services/smart-navigation/predictive-analysis.service';
import { AutoGeneratorService } from './application/roadmap/services/task-automation/auto-generator.service';
import { DependencyResolverService } from './application/roadmap/services/task-automation/dependency-resolver.service';
import { ProofValidatorService } from './application/roadmap/services/task-automation/proof-validator.service';
// =============================================================================
// CONSTANTS & TOKENS
// =============================================================================
import { READINESS_ASSESSMENT_REPOSITORY } from './domain/repositories/i-readiness.repository';
import { EXECUTOR_ROADMAP_REPOSITORY } from './domain/repositories/i-roadmap.repository';
// =============================================================================
// INFRASTRUCTURE (Adapters)
// =============================================================================
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
// INFRASTRUCTURE (Repositories)
// =============================================================================
import { PrismaExecutorRoadmapRepository } from './infrastructure/persistence/repositories/prisma-executor-roadmap.repository';
import { PrismaReadinessRepository } from './infrastructure/persistence/repositories/prisma-readiness-assessment.repository';
// =============================================================================
// CONTROLLERS
// =============================================================================
import { HealthController } from './presentation/health/health.controller';
// Readiness Controllers (using existing path)
import { ReadinessCommandController } from './presentation/readiness/controllers/readiness.command.controller';
import { ReadinessQueryController } from './presentation/readiness/controllers/readiness.query.controller';
// Roadmap Controllers (using new path)
import { RoadmapCommandController } from './presentation/roadmap/controllers/roadmap.command.controller';
import { RoadmapQueryController } from './presentation/roadmap/controllers/roadmap.query.controller';

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

const RoadmapCommandHandlers = [
  GenerateRoadmapHandler,
  OptimizeRoadmapHandler,
  StartTaskHandler,
  SubmitTaskProofHandler,
  SkipTaskHandler,
  TransitionPhaseHandler,
  LinkRiskToTaskHandler,
];

const RoadmapQueryHandlers = [
  GetRoadmapDashboardHandler,
  GetRoadmapAnalyticsHandler,
  GetCriticalPathHandler,
  GetTaskListHandler,
  GetTaskDetailsHandler,
  GetTaskHistoryHandler,
];

const RoadmapServices = [
  CriticalPathEngineService,
  PredictiveAnalysisService,
  EfficiencyScorerService,
  AutoGeneratorService,
  DependencyResolverService,
  ProofValidatorService,
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
  controllers: [
    HealthController,
    ReadinessCommandController,
    ReadinessQueryController,
    RoadmapCommandController,
    RoadmapQueryController,
  ],
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
    ...RoadmapServices,

    // --- 3. REPOSITORIES ---
    PrismaReadinessRepository,
    PrismaExecutorRoadmapRepository,
    {
      provide: READINESS_ASSESSMENT_REPOSITORY,
      useExisting: PrismaReadinessRepository,
    },
    {
      provide: EXECUTOR_ROADMAP_REPOSITORY,
      useExisting: PrismaExecutorRoadmapRepository,
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
    ...RoadmapCommandHandlers,
    ...RoadmapQueryHandlers,
  ],
  exports: [READINESS_ASSESSMENT_REPOSITORY, EXECUTOR_ROADMAP_REPOSITORY],
})
export class SuccessionModule {}
