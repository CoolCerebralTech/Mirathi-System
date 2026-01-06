import { Module } from '@nestjs/common';

import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// Domain Services
import {
  ContextDetectorService,
  FormSelectorService,
  ReadinessScorerService,
  RiskAnalyzerService,
  RoadmapGeneratorService,
} from './domain/services';
// Infrastructure
import {
  DocumentServiceAdapter,
  EstateServiceAdapter,
  FamilyServiceAdapter,
  ProbatePreviewRepository,
  ReadinessRepository,
  RiskFlagRepository,
  RoadmapRepository,
  RoadmapTaskRepository,
} from './infrastructure';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DatabaseModule,
    // Registers the module so MessagingService is available
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'documents-service',
      version: '1.0.0',
    }),
  ],
  controllers: [ReadinessController, RoadmapController, ProbateController],
  providers: [
    // Domain Services
    ContextDetectorService,
    ReadinessScorerService,
    RiskAnalyzerService,
    RoadmapGeneratorService,
    FormSelectorService,

    // Application Services
    ReadinessService,
    RoadmapService,
    ProbateService,

    // Infrastructure
    ReadinessRepository,
    RiskFlagRepository,
    RoadmapRepository,
    RoadmapTaskRepository,
    ProbatePreviewRepository,

    // Adapters
    EstateServiceAdapter,
    FamilyServiceAdapter,
    DocumentServiceAdapter,
  ],
  exports: [ReadinessService, RoadmapService, ProbateService],
})
export class SuccessionModule {}
