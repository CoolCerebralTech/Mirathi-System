import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Shared Libraries
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { ConfigModule, ConfigService } from '@shamba/config';

// Infrastructure Layer - Storage Module
import { StorageModule } from './4_infrastructure/storage/storage.module';

// Presentation Layer - Controllers
import { HealthController } from './1_presentation/health/health.controller';
import { DocumentController } from './1_presentation/controllers/document.controller';
import { DocumentVersionController } from './1_presentation/controllers/document-version.controller';
import { DocumentVerificationController } from './1_presentation/controllers/document-verification.controller';
import { StatisticsController } from './1_presentation/controllers/statistics.controller';

// Application Layer - Command Services (Write Operations)
import { DocumentCommandService } from './2_application/services/document.command.service';
import { DocumentVersionCommandService } from './2_application/services/document-version.command.service';
import { DocumentVerificationCommandService } from './2_application/services/document-verification.command.service';

// Application Layer - Query Services (Read Operations)
import { DocumentQueryService } from './2_application/services/document.query.service';
import { DocumentVersionQueryService } from './2_application/services/document-version.query.service';
import { DocumentVerificationQueryService } from './2_application/services/document-verification.query.service';
import { StatisticsService } from './2_application/services/statistics.service';

// Application Layer - Mappers
import { DocumentMapper } from './2_application/mappers/document.mapper';
import { DocumentVersionMapper } from './2_application/mappers/document-version.mapper';
import { DocumentVerificationAttemptMapper } from './2_application/mappers/document-verification-attempt.mapper';
import { StatisticsMapper } from './2_application/mappers/statistics.mapper';
import { BulkOperationsMapper } from './2_application/mappers/bulk-operations.mapper';

// Infrastructure Layer - Repositories (Command Side)
import { PrismaDocumentRepository } from './4_infrastructure/repositories/prisma-document.repository';

// Infrastructure Layer - Query Repositories (Read Side)
import { PrismaDocumentQueryRepository } from './4_infrastructure/repositories/prisma-document-query.repository';
import { PrismaDocumentVersionQueryRepository } from './4_infrastructure/repositories/prisma-document-version.query.repository';
import { PrismaDocumentVerificationQueryRepository } from './4_infrastructure/repositories/prisma-document-verification.query.repsository';

@Module({
  imports: [
    // NestJS Modules
    EventEmitterModule.forRoot(),

    // Shared Library Modules
    DatabaseModule,
    AuthModule,
    MessagingModule,
    ObservabilityModule, // This provides the Logger
    ConfigModule,

    // Infrastructure Modules
    StorageModule, // Added StorageModule - provides StorageService and FileValidatorService
  ],
  controllers: [
    HealthController,
    DocumentController,
    DocumentVersionController,
    DocumentVerificationController,
    StatisticsController,
  ],
  providers: [
    // ============================================================================
    // APPLICATION COMMAND SERVICES (Write Operations)
    // ============================================================================
    DocumentCommandService,
    DocumentVersionCommandService,
    DocumentVerificationCommandService,

    // ============================================================================
    // APPLICATION QUERY SERVICES (Read Operations)
    // ============================================================================
    DocumentQueryService,
    DocumentVersionQueryService,
    DocumentVerificationQueryService,
    StatisticsService,

    // ============================================================================
    // APPLICATION MAPPERS
    // ============================================================================
    DocumentMapper,
    DocumentVersionMapper,
    DocumentVerificationAttemptMapper,
    StatisticsMapper,
    BulkOperationsMapper,

    // ============================================================================
    // INFRASTRUCTURE REPOSITORIES (Command Side - Write)
    // ============================================================================
    {
      provide: PrismaDocumentRepository,
      useClass: PrismaDocumentRepository,
    },

    // ============================================================================
    // INFRASTRUCTURE QUERY REPOSITORIES (Read Side)
    // ============================================================================
    {
      provide: PrismaDocumentQueryRepository,
      useClass: PrismaDocumentQueryRepository,
    },
    {
      provide: PrismaDocumentVersionQueryRepository,
      useClass: PrismaDocumentVersionQueryRepository,
    },
    {
      provide: PrismaDocumentVerificationQueryRepository,
      useClass: PrismaDocumentVerificationQueryRepository,
    },

    // ============================================================================
    // PROVIDE ANALYTICS CONFIGURATION
    // ============================================================================
    {
      provide: 'ANALYTICS_CONFIG',
      useFactory: (configService: ConfigService) => ({
        // Analytics and reporting configuration
        retentionDays: configService.get('ANALYTICS_RETENTION_DAYS') || 90,
        enableDetailedMetrics: configService.get('ANALYTICS_DETAILED_METRICS') || false,
        // Performance tuning
        cacheTtl: configService.get('ANALYTICS_CACHE_TTL') || 300, // 5 minutes
        batchSize: configService.get('ANALYTICS_BATCH_SIZE') || 1000,
      }),
      inject: [ConfigService],
    },
  ],
  exports: [
    // Export services that might be used by other modules
    DocumentCommandService,
    DocumentQueryService,
    DocumentVersionCommandService,
    DocumentVersionQueryService,
    DocumentVerificationCommandService,
    DocumentVerificationQueryService,
    StatisticsService,

    // Export mappers for potential reuse
    DocumentMapper,
    DocumentVersionMapper,
    DocumentVerificationAttemptMapper,
    StatisticsMapper,
  ],
})
export class DocumentModule {}
