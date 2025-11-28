import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from '@shamba/auth';
import { ConfigModule, ConfigService } from '@shamba/config';
// Shared Libraries
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

import { BulkOperationsMapper } from './application/mappers/bulk-operations.mapper';
import { DocumentVerificationAttemptMapper } from './application/mappers/document-verification-attempt.mapper';
import { DocumentVersionMapper } from './application/mappers/document-version.mapper';
// Application Layer - Mappers
import { DocumentMapper } from './application/mappers/document.mapper';
import { StatisticsMapper } from './application/mappers/statistics.mapper';
import { DocumentVerificationCommandService } from './application/services/document-verification.command.service';
import { DocumentVerificationQueryService } from './application/services/document-verification.query.service';
import { DocumentVersionCommandService } from './application/services/document-version.command.service';
import { DocumentVersionQueryService } from './application/services/document-version.query.service';
// Application Layer - Command Services (Write Operations)
import { DocumentCommandService } from './application/services/document.command.service';
// Application Layer - Query Services (Read Operations)
import { DocumentQueryService } from './application/services/document.query.service';
import { StatisticsService } from './application/services/statistics.service';
// Infrastructure Layer - Query Repositories (Read Side)
import { PrismaDocumentQueryRepository } from './infrastructure/repositories/prisma-document-query.repository';
import { PrismaDocumentVerificationQueryRepository } from './infrastructure/repositories/prisma-document-verification.query.repository';
import { PrismaDocumentVersionQueryRepository } from './infrastructure/repositories/prisma-document-version.query.repository';
// Infrastructure Layer - Repositories (Command Side)
import { PrismaDocumentRepository } from './infrastructure/repositories/prisma-document.repository';
// Infrastructure Layer - Storage Module
import { StorageModule } from './infrastructure/storage/storage.module';
import {
  DOCUMENT_QUERY_REPOSITORY,
  DOCUMENT_REPOSITORY,
  DOCUMENT_VERIFICATION_QUERY_REPOSITORY,
  DOCUMENT_VERSION_QUERY_REPOSITORY,
} from './injection.tokens';
import { DocumentVerificationController } from './presentation/controllers/document-verification.controller';
import { DocumentVersionController } from './presentation/controllers/document-version.controller';
import { DocumentController } from './presentation/controllers/document.controller';
import { StatisticsController } from './presentation/controllers/statistics.controller';
// Presentation Layer - Controllers
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    // NestJS Modules
    CqrsModule,
    EventEmitterModule.forRoot(),

    // Shared Library Modules
    ConfigModule,
    AuthModule,
    DatabaseModule, // Provides PrismaService and database connectivity
    MessagingModule.register({}), // Event publishing, email, SMS, notifications
    ObservabilityModule.register({ serviceName: 'documents-service', version: '1.0.0' }), // Logging, metrics, tracing, monitoring
    NotificationModule,

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
      provide: DOCUMENT_REPOSITORY, // Provide the TOKEN
      useClass: PrismaDocumentRepository, // Use the CONCRETE CLASS
    },

    // ============================================================================
    // INFRASTRUCTURE QUERY REPOSITORIES (Read Side)
    // ============================================================================
    {
      provide: DOCUMENT_QUERY_REPOSITORY,
      useClass: PrismaDocumentQueryRepository,
    },
    {
      provide: DOCUMENT_VERSION_QUERY_REPOSITORY,
      useClass: PrismaDocumentVersionQueryRepository,
    },
    {
      provide: DOCUMENT_VERIFICATION_QUERY_REPOSITORY,
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
